import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { HealthController } from './health/health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProductsModule } from './products/products.module.js';
import { ShopsModule } from './shops/shops.module.js';
import { TransfersModule } from './transfers/transfers.module.js';

@Module({
  imports: [PrismaModule, AuthModule, ShopsModule, ProductsModule, TransfersModule],
  controllers: [HealthController],
})
export class AppModule {}
