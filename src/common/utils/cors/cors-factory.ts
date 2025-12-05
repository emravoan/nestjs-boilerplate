import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';

/**
 * Resolves CORS runtime options from environment-backed config.
 */
export function CorsFactory(configService: ConfigService): CorsOptions {
  let origin: CorsOptions['origin'] = true;

  if (configService.get<string>('app.env') === 'production') {
    origin = configService
      .get<string>('cors.origins')
      ?.split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return {
    origin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  };
}
