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

@Injectable()
export class TransfersService {
  constructor(private readonly prisma: PrismaService) {}

  async publish(
    shopkeeperId: string,
    input: PublishTransferInput,
  ): Promise<TransferOffer> {
    const shopId = await this.shopIdFor(shopkeeperId);

    try {
      const rows = await this.prisma.$queryRaw<TransferRequestRow[]>(
        Prisma.sql`
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
        `,
      );
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

  async accept(shopkeeperId: string, requestId: string): Promise<TransferOffer> {
    const shopId = await this.shopIdFor(shopkeeperId);

    try {
      const rows = await this.prisma.$queryRaw<TransferRequestRow[]>(
        Prisma.sql`
          -- Two shops accept the same offer, or one accepts while the source cancels.
          -- accept_transfer_request locks the product, then the offer.
          -- The first commit sets status to accepted and cuts the shelf quantity.
          -- The loser finds the offer is no longer pending and rolls back (409).
          -- A second product row is not inserted, and the quantity is not cut twice.
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
          -- Cancel racing an accept of the same offer.
          -- cancel_transfer_request locks the product first, the same first lock as accept,
          -- then updates the offer only while status is still pending.
          -- If accept already committed, this changes zero rows and rolls back
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
