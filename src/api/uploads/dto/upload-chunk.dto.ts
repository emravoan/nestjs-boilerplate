import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UploadChunkDto {
  /**
   * Client-generated upload session identifier.
   */
  @IsString()
  @IsNotEmpty()
  uploadId: string;

  /**
   * Current chunk index in the upload sequence.
   */
  @IsNumber()
  @Type(() => Number)
  chunkIndex: number;

  /**
   * Total number of chunks expected for this upload.
   */
  @IsNumber()
  @Type(() => Number)
  totalChunks: number;
}
