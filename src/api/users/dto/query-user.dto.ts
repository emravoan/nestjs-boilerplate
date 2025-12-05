import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

import { QueryDto } from '../../../common/dto/query.dto';

export class QueryUserDto extends QueryDto {
  @ApiPropertyOptional({ example: 'user' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  username?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  email?: string;
}
