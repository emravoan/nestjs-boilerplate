import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Passport guard wrapper for username/password login routes.
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
