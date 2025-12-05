import { ConfigService } from '@nestjs/config';
import { doubleCsrf } from 'csrf-csrf';

type RequestWithSessionId = {
  JSESSIONID?: string;
  cookies?: Record<string, string | undefined>;
};

/**
 * Creates CSRF utilities (middleware/token generator/error marker) from runtime config.
 */
export function createCsrf(configService: ConfigService) {
  const isProduction = configService.get<string>('app.env', 'development') === 'production';
  const secret = configService.get<string>('csrf.secret');

  /**
   * Uses shared backend secret to sign/verify CSRF token cookie pairs.
   */
  if (!secret) {
    throw new Error('CSRF secret configuration is missing');
  }

  return doubleCsrf({
    getSecret: () => secret,
    /**
     * Keeps compatibility with previous identifier strategy.
     */
    getSessionIdentifier: (req) => {
      const request = req as RequestWithSessionId;
      return request.JSESSIONID || request.cookies?.JSESSIONID || 'anonymous';
    },
    cookieName: isProduction ? '__Host-xsrf-token' : 'x-csrf-token',
    cookieOptions: {
      secure: isProduction,
      httpOnly: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
    },
  });
}
