import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { RequestWithShopkeeper } from '../auth/jwt-auth.guard.js';
import { ProductsService } from './products.service.js';
import type { ProductItem } from './products.service.js';
import { CreateProductDto } from './create-product.dto.js';
import { UpdateProductDto } from './update-product.dto.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  listMine(@Req() request: RequestWithShopkeeper): Promise<ProductItem[]> {
    if (request.shopkeeperId === undefined) {
      throw new UnauthorizedException();
    }

    return this.productsService.listMine(request.shopkeeperId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Req() request: RequestWithShopkeeper,
    @Body() body: CreateProductDto,
  ): Promise<ProductItem> {
    if (request.shopkeeperId === undefined) {
      throw new UnauthorizedException();
    }

    return this.productsService.create(request.shopkeeperId, body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Req() request: RequestWithShopkeeper,
    @Param('id') productId: string,
    @Body() body: UpdateProductDto,
  ): Promise<ProductItem> {
    if (request.shopkeeperId === undefined) {
      throw new UnauthorizedException();
    }

    if (!/^\d+$/.test(productId)) {
      throw new BadRequestException('id must be a whole number');
    }

    return this.productsService.update(request.shopkeeperId, productId, {
      name: body.name,
      description: body.description,
      quantity: body.quantity,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  remove(
    @Req() request: RequestWithShopkeeper,
    @Param('id') productId: string,
  ): Promise<void> {
    if (request.shopkeeperId === undefined) {
      throw new UnauthorizedException();
    }

    if (!/^\d+$/.test(productId)) {
      throw new BadRequestException('id must be a whole number');
    }

    return this.productsService.remove(request.shopkeeperId, productId);
  }
}
