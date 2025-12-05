import { ApiProperty } from '@nestjs/swagger';

export class FileUploadDto {
  /**
   * Multipart file payload field.
   */
  @ApiProperty({
    type: 'string',
    format: 'binary',
  })
  file: unknown;
}
