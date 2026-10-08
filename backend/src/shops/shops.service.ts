import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export type ShopListItem = {
  id: string;
  shopkeeperId: string;
  name: string;
  address: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class ShopsService {
  constructor(private readonly prisma: PrismaService) {}

  async listShops(): Promise<ShopListItem[]> {
    const shops = await this.prisma.shop.findMany({
      orderBy: { id: 'asc' },
    });

    return shops.map((shop) => ({
      id: shop.id.toString(),
      shopkeeperId: shop.shopkeeperId.toString(),
      name: shop.name,
      address: shop.address,
      imageUrl: shop.imageUrl,
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt,
    }));
  }
}
