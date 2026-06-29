import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { IS_GUEST_KEY, IS_PUBLIC_KEY } from '../constants/auth.constants';

@Injectable()
export class AppAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  /**
   * Enforces public-route bypass, API key validation, then guest/JWT policy.
   */
  canActivate(context: ExecutionContext) {
    /**
     * Allows explicit public routes to bypass all auth checks.
     */
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    /**
     * Validates that runtime API key configuration exists.
     */
    const apiKey = this.configService.get<string>('api.key');
    if (!apiKey) {
      throw new UnauthorizedException('API key configuration is missing');
    }

    /**
     * Reads request object once and validates incoming API key header.
     */
    const request = context.switchToHttp().getRequest();

    const incomingApiKey = request.headers['x-api-key'];
    const normalizedApiKey = Array.isArray(incomingApiKey) ? incomingApiKey[0] : incomingApiKey;

    if (!normalizedApiKey || normalizedApiKey !== apiKey) {
      throw new UnauthorizedException('API key missing or invalid');
    }

    /**
     * Allows guest routes to skip JWT while still requiring API key.
     */
    const isGuest = this.reflector.getAllAndOverride<boolean>(IS_GUEST_KEY, [context.getHandler(), context.getClass()]);

    if (isGuest) {
      return true;
    }

    /**
     * Requires JWT on every other protected route.
     */
    return super.canActivate(context);
  }
}
