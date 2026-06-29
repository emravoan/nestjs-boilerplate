import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsOptional()
  APP_NAME: string = 'NestJS Boilerplate';

  @IsString()
  API_KEY: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '1h';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  @IsString()
  CSRF_SECRET: string;

  @IsString()
  @IsOptional()
  DB_HOST: string = '127.0.0.1';

  @IsNumber()
  @IsOptional()
  DB_PORT: number = 3306;

  @IsString()
  @IsOptional()
  DB_NAME: string = 'nestjs_boilerplate';

  @IsString()
  @IsOptional()
  DB_USERNAME: string = 'root';

  @IsString()
  @IsOptional()
  DB_PASSWORD: string = '';
}

export function validateConfig(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Configuration validation failed. Errors:\n${errors
        .map((err) => {
          const constraints = err.constraints ? Object.values(err.constraints).join(', ') : 'unknown validation error';
          return `- ${err.property}: ${constraints}`;
        })
        .join('\n')}`,
    );
  }

  return validatedConfig;
}
