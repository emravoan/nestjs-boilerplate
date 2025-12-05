import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsOptional, Max, Min } from 'class-validator';

export class QueryDto {
  @ApiPropertyOptional({
    type: Number,
    description: 'Page number for pagination',
    example: 1,
  })
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @ApiPropertyOptional({
    type: Number,
    description: 'Number of items per page',
    example: 10,
  })
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 10;

  @ApiPropertyOptional({
    type: String,
    description: 'Include related entities (comma-separated)',
  })
  @IsOptional()
  @Transform(({ value }) => value?.split(',').map((v: string) => v.trim()))
  include?: string[];

  @ApiPropertyOptional({
    type: String,
    description: 'Include related entities as count (comma-separated)',
  })
  @IsOptional()
  @Transform(({ value }) => value?.split(',').map((v: string) => v.trim()))
  includeCount?: string[];
}
