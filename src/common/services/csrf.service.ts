import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

import { createCsrf } from '../utils/csrf/csrf-factory';

type CsrfBundle = ReturnType<typeof createCsrf>;

@Injectable()
export class CsrfService {
  private readonly csrf: CsrfBundle;

  constructor(private readonly configService: ConfigService) {
    /**
     * Initializes a single CSRF utility instance for middleware, token generation, and error checks.
     */
    this.csrf = createCsrf(this.configService);
  }

  /**
   * Returns middleware that validates CSRF token for unsafe requests.
   */
  get doubleCsrfProtection() {
    return this.csrf.doubleCsrfProtection;
  }

  /**
   * Exposes library invalid-token marker for consistent exception handling.
   */
  get invalidCsrfTokenError(): unknown {
    return this.csrf.invalidCsrfTokenError;
  }

  /**
   * Generates a CSRF token and updates the CSRF cookie when requested.
   */
  generateCsrfToken(req: Request, res: Response, overwrite = false): string {
    return this.csrf.generateCsrfToken(req, res, { overwrite });
  }
}
