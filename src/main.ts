import { ConfigService } from '@nestjs/config';

import { AppFactory } from './common/utils/app/app-factory';

/**
 * Bootstraps application startup through isolated app factory orchestration.
 */
async function bootstrap() {
  const app = await AppFactory();
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3000);
  const isProd = configService.get<string>('app.env') === 'production';

  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  if (!isProd) {
    console.log(`Swagger is running on: http://localhost:${port}/swagger`);
  }
}

bootstrap();
