import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from '../products/products.service.js';
import type { ProductItem } from '../products/products.service.js';
import type { ShopListItem } from './shops.service.js';
import { ShopsService } from './shops.service.js';

@Controller('shops')
export class ShopsController {
  constructor(
    private readonly shopsService: ShopsService,
    private readonly productsService: ProductsService,
  ) {}

  @Get()
  listShops(): Promise<ShopListItem[]> {
    return this.shopsService.listShops();
  }

  @Get(':shopId/products')
  listProducts(@Param('shopId') shopId: string): Promise<ProductItem[]> {
    return this.productsService.listForShop(shopId);
  }
}
