import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export type PublishTransferInput = {
  productId: string;
  quantity: number;
  unitPrice: string;
  recipientShopId?: string;
};

export type TransferOffer = {
  id: string;
  sourceShopId: string;
  sourceProductId: string;
  destinationShopId: string | null;
  destinationProductId: string | null;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  status: string;
};

export type OpenTransfer = {
  id: string;
  sourceShopId: string;
  sourceShopName: string;
  sourceProductId: string;
  productName: string;
  productDescription: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
};

export type DirectTransfer = OpenTransfer & {
  recipientShopId: string;
  recipientShopName: string;
};

export type DirectTransferLists = {
  incoming: DirectTransfer[];
  outgoing: DirectTransfer[];
};

@Injectable()
export class TransfersService {
  constructor(private readonly prisma: PrismaService) {}

  async publish(
    shopkeeperId: string,
    input: PublishTransferInput,
  ): Promise<TransferOffer> {
    const shopId = await this.shopIdFor(shopkeeperId);
    const statement =
      input.recipientShopId === undefined
        ? Prisma.sql`
          -- Two publishes of one product whose quantities together exceed the shelf.
          -- create_transfer_request locks that product (FOR UPDATE), then the
          -- reservation trigger sums pending offers. Shelf 10 and two offers of 8:
          -- the first insert commits, the waiting one rolls back with
          -- "pending transfers would exceed stock" (409).
          SELECT *
          FROM create_transfer_request(
            ${shopId}::bigint,
            ${BigInt(input.productId)}::bigint,
            ${input.quantity}::int,
            ${input.unitPrice}::numeric
          )
        `
        : Prisma.sql`
          -- A direct offer reserves the same shelf as a public one.
          -- create_direct_transfer_request locks the product, then the reservation
          -- trigger sums every pending row, public and direct.
          -- Two offers that together exceed the shelf: the first commits, the
          -- second rolls back with "pending transfers would exceed stock" (409).
          SELECT *
          FROM create_direct_transfer_request(
            ${shopId}::bigint,
            ${BigInt(input.productId)}::bigint,
            ${BigInt(input.recipientShopId)}::bigint,
            ${input.quantity}::int,
            ${input.unitPrice}::numeric
          )
        `;

    try {
      const rows = await this.prisma.$queryRaw<TransferRequestRow[]>(statement);
      const created = rows[0];
      if (created === undefined) {
        throw new InternalServerErrorException('Transfer request was not created');
      }

      return toTransferOffer(created);
    } catch (error: unknown) {
      throw mapTransferError(error);
    }
  }

  async listOpen(): Promise<OpenTransfer[]> {
    const rows = await this.prisma.$queryRaw<OpenTransferRow[]>(
        Prisma.sql`
        -- No lock. Readers do not wait on each other.
        -- An accept that has not committed yet is still pending here.
        -- After that accept commits, status is no longer pending, so the offer drops off.
        -- Direct offers have a recipient and are excluded by this view.
        SELECT
          id,
          source_shop_id,
          source_shop_name,
          source_product_id,
          product_name,
          product_description,
          quantity,
          unit_price,
          total_price
        FROM open_transfer_board
        ORDER BY id
      `,
    );

    return rows.map((row) => ({
      id: idString(row.id),
      sourceShopId: idString(row.source_shop_id),
      sourceShopName: row.source_shop_name,
      sourceProductId: idString(row.source_product_id),
      productName: row.product_name,
      productDescription: row.product_description,
      quantity: row.quantity,
      unitPrice: money(row.unit_price),
      totalPrice: money(row.total_price),
    }));
  }

  async listDirect(shopkeeperId: string): Promise<DirectTransferLists> {
    const shopId = await this.shopIdFor(shopkeeperId);
    const [incoming, outgoing] = await Promise.all([
      this.listDirectSide(shopId, 'incoming'),
      this.listDirectSide(shopId, 'outgoing'),
    ]);

    return { incoming, outgoing };
  }

  async accept(shopkeeperId: string, requestId: string): Promise<TransferOffer> {
    const shopId = await this.shopIdFor(shopkeeperId);

    try {
      const rows = await this.prisma.$queryRaw<TransferRequestRow[]>(
        Prisma.sql`
          -- Two shops accept the same public offer, or one accepts while the source cancels.
          -- On a direct offer the same lock handles accept against reject or cancel.
          -- accept_transfer_request locks the product, then the offer.
          -- The first commit sets status to accepted and cuts the shelf quantity.
          -- The loser finds the offer is no longer pending and rolls back (409).
          -- A shop that was not invited gets "not found" (404), not a confirmation the row exists.
          SELECT *
          FROM accept_transfer_request(
            ${BigInt(requestId)}::bigint,
            ${shopId}::bigint
          )
        `,
      );
      const accepted = rows[0];
      if (accepted === undefined) {
        throw new InternalServerErrorException('Transfer request was not accepted');
      }

      return toTransferOffer(accepted);
    } catch (error: unknown) {
      throw mapTransferError(error);
    }
  }

  async cancel(shopkeeperId: string, requestId: string): Promise<TransferOffer> {
    const shopId = await this.shopIdFor(shopkeeperId);

    try {
      const rows = await this.prisma.$queryRaw<TransferRequestRow[]>(
        Prisma.sql`
          -- Cancel racing an accept, or a direct reject, of the same offer.
          -- cancel_transfer_request locks the product first, the same first lock as accept
          -- and reject, then updates the offer only while status is still pending.
          -- If the other action already committed, this changes zero rows and rolls back
          -- with "transfer request is no longer pending" (409). Shelf quantity stays put.
          SELECT *
          FROM cancel_transfer_request(
            ${BigInt(requestId)}::bigint,
            ${shopId}::bigint
          )
        `,
      );
      const cancelled = rows[0];
      if (cancelled === undefined) {
        throw new InternalServerErrorException('Transfer request was not cancelled');
      }

      return toTransferOffer(cancelled);
    } catch (error: unknown) {
      throw mapTransferError(error);
    }
  }

  async reject(shopkeeperId: string, requestId: string): Promise<TransferOffer> {
    const shopId = await this.shopIdFor(shopkeeperId);

    try {
      const rows = await this.prisma.$queryRaw<TransferRequestRow[]>(
        Prisma.sql`
          -- Reject racing accept or cancel on the same direct offer.
          -- reject_transfer_request locks the product first, then sets rejected
          -- only while the row is still pending and the caller is the invited shop.
          -- The first commit wins. The loser rolls back with
          -- "transfer request is no longer pending" (409). Stock does not move.
          -- A public offer, or a shop that was not invited, is "not found" (404).
          SELECT *
          FROM reject_transfer_request(
            ${BigInt(requestId)}::bigint,
            ${shopId}::bigint
          )
        `,
      );
      const rejected = rows[0];
      if (rejected === undefined) {
        throw new InternalServerErrorException('Transfer request was not rejected');
      }

      return toTransferOffer(rejected);
    } catch (error: unknown) {
      throw mapTransferError(error);
    }
  }

  private async listDirectSide(
    shopId: bigint,
    side: 'incoming' | 'outgoing',
  ): Promise<DirectTransfer[]> {
    const where =
      side === 'incoming'
        ? Prisma.sql`transfer_requests.recipient_shop_id = ${shopId}::bigint`
        : Prisma.sql`transfer_requests.source_shop_id = ${shopId}::bigint
            AND transfer_requests.recipient_shop_id IS NOT NULL`;

    const rows = await this.prisma.$queryRaw<DirectTransferRow[]>(
      Prisma.sql`
        -- No lock. Pending direct rows only, and only for the caller's shop.
        -- An accept, reject, or cancel that has not committed is still listed.
        -- After it commits, status is no longer pending, so the row drops off.
        SELECT
          transfer_requests.id,
          transfer_requests.source_shop_id,
          source_shop.name AS source_shop_name,
          transfer_requests.recipient_shop_id,
          recipient_shop.name AS recipient_shop_name,
          transfer_requests.source_product_id,
          products.name AS product_name,
          products.description AS product_description,
          transfer_requests.quantity,
          transfer_requests.unit_price,
          transfer_requests.total_price
        FROM transfer_requests
        JOIN shops AS source_shop ON source_shop.id = transfer_requests.source_shop_id
        JOIN shops AS recipient_shop ON recipient_shop.id = transfer_requests.recipient_shop_id
        JOIN products ON products.id = transfer_requests.source_product_id
        WHERE transfer_requests.status = 'pending'
          AND ${where}
        ORDER BY transfer_requests.id
      `,
    );

    return rows.map((row) => ({
      id: idString(row.id),
      sourceShopId: idString(row.source_shop_id),
      sourceShopName: row.source_shop_name,
      recipientShopId: idString(row.recipient_shop_id),
      recipientShopName: row.recipient_shop_name,
      sourceProductId: idString(row.source_product_id),
      productName: row.product_name,
      productDescription: row.product_description,
      quantity: row.quantity,
      unitPrice: money(row.unit_price),
      totalPrice: money(row.total_price),
    }));
  }

  private async shopIdFor(shopkeeperId: string): Promise<bigint> {
    const shop = await this.prisma.shop.findUnique({
      where: { shopkeeperId: parseShopkeeperId(shopkeeperId) },
      select: { id: true },
    });

    if (shop === null) {
      throw new UnauthorizedException();
    }

    return shop.id;
  }
}

type TransferRequestRow = {
  id: unknown;
  source_shop_id: unknown;
  source_product_id: unknown;
  destination_shop_id: unknown;
  destination_product_id: unknown;
  quantity: number;
  unit_price: unknown;
  total_price: unknown;
  status: string;
};

type DirectTransferRow = OpenTransferRow & {
  recipient_shop_id: unknown;
  recipient_shop_name: string;
};

type OpenTransferRow = {
  id: unknown;
  source_shop_id: unknown;
  source_shop_name: string;
  source_product_id: unknown;
  product_name: string;
  product_description: string;
  quantity: number;
  unit_price: unknown;
  total_price: unknown;
};

function toTransferOffer(row: TransferRequestRow): TransferOffer {
  return {
    id: idString(row.id),
    sourceShopId: idString(row.source_shop_id),
    sourceProductId: idString(row.source_product_id),
    destinationShopId: optionalId(row.destination_shop_id),
    destinationProductId: optionalId(row.destination_product_id),
    quantity: row.quantity,
    unitPrice: money(row.unit_price),
    totalPrice: money(row.total_price),
    status: row.status,
  };
}

function mapTransferError(error: unknown): Error {
  if (
    error instanceof BadRequestException ||
    error instanceof UnauthorizedException ||
    error instanceof NotFoundException ||
    error instanceof ForbiddenException ||
    error instanceof ConflictException ||
    error instanceof InternalServerErrorException
  ) {
    return error;
  }

  const message = error instanceof Error ? error.message : '';

  if (message.includes('product not found')) {
    return new NotFoundException('Product not found');
  }

  if (message.includes('product does not belong to the source shop')) {
    return new ForbiddenException('Product does not belong to your shop');
  }

  if (message.includes('pending transfers would exceed stock')) {
    return new ConflictException('Pending transfers would exceed stock');
  }

  if (message.includes('transfer request not found')) {
    return new NotFoundException('Transfer request not found');
  }

  if (message.includes('transfer request is no longer pending')) {
    return new ConflictException('Transfer request is no longer pending');
  }

  if (message.includes('source shop cannot accept its own request')) {
    return new ForbiddenException('Source shop cannot accept its own request');
  }

  if (message.includes('cannot send a direct request to your own shop')) {
    return new ForbiddenException('You cannot send a direct request to your own shop');
  }

  if (message.includes('recipient shop not found')) {
    return new NotFoundException('Shop not found');
  }

  if (message.includes('not enough stock')) {
    return new ConflictException('Not enough stock');
  }

  if (
    message.includes('quantity must be greater than zero') ||
    message.includes('unit price must be greater than zero')
  ) {
    return new BadRequestException(message);
  }

  return error instanceof Error
    ? error
    : new InternalServerErrorException('Transfer request failed');
}

function parseShopkeeperId(shopkeeperId: string): bigint {
  try {
    return BigInt(shopkeeperId);
  } catch {
    throw new UnauthorizedException();
  }
}

function optionalId(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return idString(value);
}

function idString(value: unknown): string {
  if (typeof value === 'bigint' || typeof value === 'number') {
    return value.toString();
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return value;
  }

  throw new InternalServerErrorException('Unexpected id from the database');
}

function money(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'object' && value !== null) {
    return String(value);
  }

  throw new InternalServerErrorException('Unexpected price from the database');
}
