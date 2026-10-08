import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ProductsModule } from '../products/products.module.js';
import { ShopsController } from './shops.controller.js';
import { ShopsService } from './shops.service.js';

@Module({
  imports: [PrismaModule, ProductsModule],
  controllers: [ShopsController],
  providers: [ShopsService],
})
export class ShopsModule {}
