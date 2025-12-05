import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Configures Swagger UI and OpenAPI document in non-production environments.
 */
export function SwaggerFactory(app: INestApplication, configService: ConfigService): void {
  const isProduction = configService.get<string>('app.env', 'development') === 'production';
  if (isProduction) {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('Rest API')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-secret')
    .addApiKey({ type: 'apiKey', name: 'x-csrf-token', in: 'header' }, 'csrf-token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
