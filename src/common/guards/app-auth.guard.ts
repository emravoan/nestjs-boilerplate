import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { IS_PUBLIC_KEY } from '../constants/auth.constants';

@Injectable()
export class AppAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  /**
   * Normalizes request path by trimming querystring and leading/trailing slashes.
   */
  private normalizePath(pathname: string): string {
    return pathname.split('?')[0].replace(/^\/+|\/+$/g, '');
  }

  /**
   * Checks whether the path matches guest routes (API key required, JWT skipped).
   */
  private isGuestPath(pathname: string): boolean {
    const prefix = this.configService.get<string>('api.prefix', 'api').replace(/^\/+|\/+$/g, '');
    const guestSuffixes = ['csrf-token', 'auth/login', 'auth/register', 'auth/refresh-token'];

    return guestSuffixes.some((suffix) => {
      const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedSuffix = suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`^${escapedPrefix}\\/v\\d+\\/${escapedSuffix}$`);
      return regex.test(pathname);
    });
  }

  /**
   * Legacy option: public file-read endpoint bypass.
   * Keep this as commented reference if you want GET /files/** to be public again later.
   */
  // private isPublicFileReadPath(pathname: string, method?: string): boolean {
  //   if ((method || 'GET').toUpperCase() !== 'GET') {
  //     return false;
  //   }
  //
  //   const prefix = this.configService.get<string>('api.prefix', 'api').replace(/^\/+|\/+$/g, '');
  //   const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  //   const regex = new RegExp(`^${escapedPrefix}\\/v\\d+\\/files\\/.+`);
  //   return regex.test(pathname);
  // }

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
    const pathname = this.normalizePath(request.path || request.url || '');

    /**
     * Legacy option: enable this block to allow public GET file streaming routes.
     */
    // if (this.isPublicFileReadPath(pathname, request.method)) {
    //   return true;
    // }

    const incomingApiKey = request.headers['x-api-key'];
    const normalizedApiKey = Array.isArray(incomingApiKey) ? incomingApiKey[0] : incomingApiKey;

    if (!normalizedApiKey || normalizedApiKey !== apiKey) {
      throw new UnauthorizedException('API key missing or invalid');
    }

    /**
     * Allows guest routes to skip JWT while still requiring API key.
     */
    if (this.isGuestPath(pathname)) {
      return true;
    }

    /**
     * Requires JWT on every other protected route.
     */
    return super.canActivate(context);
  }
}
