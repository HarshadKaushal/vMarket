import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { TransfersController } from './transfers.controller.js';
import { TransfersService } from './transfers.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TransfersController],
  providers: [TransfersService],
})
export class TransfersModule {}
