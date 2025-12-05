import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Passport guard wrapper for JWT strategy routes.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
