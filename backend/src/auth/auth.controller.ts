import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  accessTokenCookie,
  accessTokenCookieOptions,
} from './access-token-cookie.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import type { RequestWithShopkeeper } from './jwt-auth.guard.js';
import { AuthService } from './auth.service.js';
import type { RegisterResult, ShopkeeperProfile } from './auth.service.js';
import { LoginDto } from './login.dto.js';
import { RegisterDto } from './register.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto): Promise<RegisterResult> {
    return this.authService.register(body);
  }

  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ authenticated: true }> {
    const { accessToken } = await this.authService.login(body);
    response.cookie(accessTokenCookie, accessToken, accessTokenCookieOptions);
    return { authenticated: true };
  }

  @Post('logout')
  logout(
    @Res({ passthrough: true }) response: Response,
  ): { authenticated: false } {
    response.clearCookie(accessTokenCookie, accessTokenCookieOptions);
    return { authenticated: false };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: RequestWithShopkeeper): Promise<ShopkeeperProfile> {
    if (request.shopkeeperId === undefined) {
      throw new UnauthorizedException();
    }

    return this.authService.getProfile(request.shopkeeperId);
  }
}
