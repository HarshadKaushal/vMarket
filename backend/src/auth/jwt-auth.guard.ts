import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { accessTokenCookie } from './access-token-cookie.js';
import { AccessTokenPayload } from './auth.service.js';

export type RequestWithShopkeeper = {
  cookies?: Record<string, unknown>;
  shopkeeperId?: string;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithShopkeeper>();
    const token = request.cookies?.[accessTokenCookie];

    if (typeof token !== 'string' || token.length === 0) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token);
      if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
        throw new UnauthorizedException();  
      }
      
      request.shopkeeperId = payload.sub;
      return true;
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException();
    }
  }
}
