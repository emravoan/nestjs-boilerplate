import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { comparePassword } from '../../common/utils/password/password.util';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Validates username/password and returns a password-safe user object.
   */
  async validateUser(username: string, password: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findOneByUsernameWithPassword(username);
    if (!user) {
      return null;
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return null;
    }

    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Creates a user account and returns fresh access/refresh tokens.
   */
  async register(payload: CreateUserDto) {
    const user = await this.usersService.create(payload);
    return {
      user,
      ...this.signTokens(user.id, user.username),
    };
  }

  /**
   * Issues tokens for an authenticated principal.
   */
  login(user: { id: number; username: string }) {
    return this.signTokens(user.id, user.username);
  }

  /**
   * Loads current user profile by ID.
   */
  async me(userId: number) {
    return this.usersService.findOneById(userId);
  }

  /**
   * Verifies refresh token and rotates a new token pair.
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: number; username: string }>(refreshToken, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      return this.signTokens(payload.sub, payload.username);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Generates access and refresh tokens from a compact JWT payload.
   */
  private signTokens(userId: number, username: string) {
    const payload = { sub: userId, username };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn', '7d'),
      }),
    };
  }
}
