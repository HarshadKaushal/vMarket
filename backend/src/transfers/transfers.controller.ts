import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { RequestWithShopkeeper } from '../auth/jwt-auth.guard.js';
import { TransfersService } from './transfers.service.js';
import type {
  DirectTransferLists,
  OpenTransfer,
  TransferOffer,
} from './transfers.service.js';
import { PublishTransferDto } from './publish-transfer.dto.js';

@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Get()
  listOpen(): Promise<OpenTransfer[]> {
    return this.transfersService.listOpen();
  }

  @Get('direct')
  @UseGuards(JwtAuthGuard)
  listDirect(@Req() request: RequestWithShopkeeper): Promise<DirectTransferLists> {
    if (request.shopkeeperId === undefined) {
      throw new UnauthorizedException();
    }

    return this.transfersService.listDirect(request.shopkeeperId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  publish(
    @Req() request: RequestWithShopkeeper,
    @Body() body: PublishTransferDto,
  ): Promise<TransferOffer> {
    if (request.shopkeeperId === undefined) {
      throw new UnauthorizedException();
    }

    return this.transfersService.publish(request.shopkeeperId, body);
  }

  @Post(':id/accept')
  @UseGuards(JwtAuthGuard)
  accept(
    @Req() request: RequestWithShopkeeper,
    @Param('id') requestId: string,
  ): Promise<TransferOffer> {
    if (request.shopkeeperId === undefined) {
      throw new UnauthorizedException();
    }

    if (!/^\d+$/.test(requestId)) {
      throw new BadRequestException('id must be a whole number');
    }

    return this.transfersService.accept(request.shopkeeperId, requestId);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(
    @Req() request: RequestWithShopkeeper,
    @Param('id') requestId: string,
  ): Promise<TransferOffer> {
    if (request.shopkeeperId === undefined) {
      throw new UnauthorizedException();
    }

    if (!/^\d+$/.test(requestId)) {
      throw new BadRequestException('id must be a whole number');
    }

    return this.transfersService.cancel(request.shopkeeperId, requestId);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard)
  reject(
    @Req() request: RequestWithShopkeeper,
    @Param('id') requestId: string,
  ): Promise<TransferOffer> {
    if (request.shopkeeperId === undefined) {
      throw new UnauthorizedException();
    }

    if (!/^\d+$/.test(requestId)) {
      throw new BadRequestException('id must be a whole number');
    }

    return this.transfersService.reject(request.shopkeeperId, requestId);
  }
}
