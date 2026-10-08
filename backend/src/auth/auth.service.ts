import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const passwordHashRounds = 10;

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  shopName: string;
  address: string;
  imageUrl: string | null;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResult = {
  accessToken: string;
};

export type AccessTokenPayload = {
  sub: string;
};

export type ShopkeeperProfile = {
  id: string;
  name: string;
  email: string;
  shop: {
    id: string;
    name: string;
    address: string;
    imageUrl: string | null;
  };
};

const accessTokenTtlSeconds = 60 * 60 * 24;

export type RegisterResult = {
  shopkeeper: {
    id: string;
    name: string;
    email: string;
  };
  shop: {
    id: string;
    name: string;
    address: string;
    imageUrl: string | null;
  };
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(input: RegisterInput): Promise<RegisterResult> {
    const passwordHash = await hash(input.password, passwordHashRounds);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const shopkeeper = await tx.shopkeeper.create({
          data: {
            name: input.name,
            email: input.email,
            passwordHash,
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });

        const shop = await tx.shop.create({
          data: {
            shopkeeperId: shopkeeper.id,
            name: input.shopName,
            address: input.address,
            imageUrl: input.imageUrl,
          },
          select: {
            id: true,
            name: true,
            address: true,
            imageUrl: true,
          },
        });

        return {
          shopkeeper: {
            id: shopkeeper.id.toString(),
            name: shopkeeper.name,
            email: shopkeeper.email,
          },
          shop: {
            id: shop.id.toString(),
            name: shop.name,
            address: shop.address,
            imageUrl: shop.imageUrl,
          },
        };
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('An account with this email already exists');
      }

      throw error;
    }
  }

  async login(input: LoginInput): Promise<LoginResult> {
    const shopkeeper = await this.prisma.shopkeeper.findUnique({
      where: { email: input.email },
      select: { id: true, passwordHash: true },
    });

    const passwordMatches =
      shopkeeper !== null &&
      (await compare(input.password, shopkeeper.passwordHash));

    if (!passwordMatches || shopkeeper === null) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwtService.signAsync(
      { sub: shopkeeper.id.toString() } satisfies AccessTokenPayload,
      { expiresIn: accessTokenTtlSeconds },
    );

    return { accessToken };
  }

  async getProfile(shopkeeperId: string): Promise<ShopkeeperProfile> {
    let id: bigint;
    try {
      id = BigInt(shopkeeperId);
    } catch {
      throw new UnauthorizedException();
    }

    const shopkeeper = await this.prisma.shopkeeper.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        shop: {
          select: {
            id: true,
            name: true,
            address: true,
            imageUrl: true,
          },
        },
      },
    });

    if (shopkeeper === null) {
      throw new UnauthorizedException();
    }

    if (shopkeeper.shop === null) {
      throw new InternalServerErrorException('Shopkeeper has no shop');
    }

    return {
      id: shopkeeper.id.toString(),
      name: shopkeeper.name,
      email: shopkeeper.email,
      shop: {
        id: shopkeeper.shop.id.toString(),
        name: shopkeeper.shop.name,
        address: shopkeeper.shop.address,
        imageUrl: shopkeeper.shop.imageUrl,
      },
    };
  }
}
