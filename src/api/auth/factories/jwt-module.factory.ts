import { ConfigService } from '@nestjs/config';
import { JwtModuleAsyncOptions } from '@nestjs/jwt';

/**
 * Async factory for JwtModule registration.
 */
export const JwtModuleFactory: JwtModuleAsyncOptions = {
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    secret: configService.get<string>('jwt.secret'),
    signOptions: {
      expiresIn: configService.get<string>('jwt.expiresIn', '1h'),
    },
  }),
};
