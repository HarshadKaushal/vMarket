import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export type CreateProductInput = {
  name: string;
  description: string;
  quantity: number;
};

export type UpdateProductInput = {
  name?: string;
  description?: string;
  quantity?: number;
};

export type ProductItem = {
  id: string;
  shopId: string;
  name: string;
  description: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    shopkeeperId: string,
    input: CreateProductInput,
  ): Promise<ProductItem> {
    const shop = await this.prisma.shop.findUnique({
      where: { shopkeeperId: parseShopkeeperId(shopkeeperId) },
      select: { id: true },
    });

    if (shop === null) {
      throw new UnauthorizedException();
    }

    const product = await this.prisma.product.create({
      data: {
        shopId: shop.id,
        name: input.name,
        description: input.description,
        quantity: input.quantity,
      },
      select: productSelect,
    });

    return toProductItem(product);
  }

  async update(
    shopkeeperId: string,
    productId: string,
    input: UpdateProductInput,
  ): Promise<ProductItem> {
    const shop = await this.shopFor(shopkeeperId);
    const id = await this.ownedProductId(shop.id, productId);

    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
          quantity: input.quantity,
        },
        select: productSelect,
      });

      return toProductItem(product);
    } catch (error: unknown) {
      throw mapProductError(error);
    }
  }

  async remove(shopkeeperId: string, productId: string): Promise<void> {
    const shop = await this.shopFor(shopkeeperId);
    const id = await this.ownedProductId(shop.id, productId);
    const pending = await this.prisma.transferRequest.count({
      where: { sourceProductId: id, status: 'pending' },
    });

    if (pending > 0) {
      throw new ConflictException(
        'Cancel pending transfers before deleting this product',
      );
    }

    try {
      await this.prisma.product.delete({ where: { id } });
    } catch (error: unknown) {
      throw mapProductError(error);
    }
  }

  async listMine(shopkeeperId: string): Promise<ProductItem[]> {
    const shop = await this.prisma.shop.findUnique({
      where: { shopkeeperId: parseShopkeeperId(shopkeeperId) },
      select: { id: true },
    });

    if (shop === null) {
      throw new UnauthorizedException();
    }

    return this.listByShopId(shop.id);
  }

  async listForShop(shopId: string): Promise<ProductItem[]> {
    const id = parseShopId(shopId);
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      select: { id: true },
    });

    if (shop === null) {
      throw new NotFoundException('Shop not found');
    }

    return this.listByShopId(id);
  }

  private async shopFor(shopkeeperId: string): Promise<{ id: bigint }> {
    const shop = await this.prisma.shop.findUnique({
      where: { shopkeeperId: parseShopkeeperId(shopkeeperId) },
      select: { id: true },
    });

    if (shop === null) {
      throw new UnauthorizedException();
    }

    return shop;
  }

  private async ownedProductId(shopId: bigint, productId: string): Promise<bigint> {
    const id = parseProductId(productId);
    const product = await this.prisma.product.findFirst({
      where: { id, shopId },
      select: { id: true },
    });

    if (product === null) {
      throw new NotFoundException('Product not found');
    }

    return product.id;
  }

  private async listByShopId(shopId: bigint): Promise<ProductItem[]> {
    const products = await this.prisma.product.findMany({
      where: { shopId },
      orderBy: { id: 'asc' },
      select: productSelect,
    });

    return products.map(toProductItem);
  }
}

const productSelect = {
  id: true,
  shopId: true,
  name: true,
  description: true,
  quantity: true,
  createdAt: true,
  updatedAt: true,
} as const;

function toProductItem(product: {
  id: bigint;
  shopId: bigint;
  name: string;
  description: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}): ProductItem {
  return {
    id: product.id.toString(),
    shopId: product.shopId.toString(),
    name: product.name,
    description: product.description,
    quantity: product.quantity,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function parseShopkeeperId(shopkeeperId: string): bigint {
  try {
    return BigInt(shopkeeperId);
  } catch {
    throw new UnauthorizedException();
  }
}

function mapProductError(error: unknown): Error {
  if (
    error instanceof BadRequestException ||
    error instanceof UnauthorizedException ||
    error instanceof NotFoundException ||
    error instanceof ConflictException
  ) {
    return error;
  }

  const message = error instanceof Error ? error.message : '';

  if (message.includes('quantity cannot drop below pending transfer reservations')) {
    return new ConflictException(
      'Quantity cannot drop below pending transfer reservations',
    );
  }

  if (
    message.includes('transfer_requests_source_product_fk') ||
    message.includes('transfer_requests_destination_product_fk')
  ) {
    return new ConflictException(
      'This product is part of a transfer and cannot be deleted',
    );
  }

  return error instanceof Error
    ? error
    : new BadRequestException('Product update failed');
}

function parseProductId(productId: string): bigint {
  try {
    return BigInt(productId);
  } catch {
    throw new BadRequestException('id must be a whole number');
  }
}

function parseShopId(shopId: string): bigint {
  try {
    return BigInt(shopId);
  } catch {
    throw new BadRequestException('shopId must be a whole number');
  }
}
