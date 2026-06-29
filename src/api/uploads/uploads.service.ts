import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { UploadMessages } from '../../common/constants/messages';
import { StorageService } from '../../common/services/storage.service';
import { UploadChunkBufferDto } from './dto/upload-chunk-buffer.dto';

@Injectable()
export class UploadsService implements OnModuleInit, OnModuleDestroy {
  private readonly uploadChunks = new Map<string, Buffer[]>();
  private readonly uploadLastActivity = new Map<string, number>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

  constructor(private readonly storageService: StorageService) {}

  onModuleInit() {
    this.cleanupInterval = setInterval(
      () => {
        const now = Date.now();
        for (const [uploadId, lastActivity] of this.uploadLastActivity.entries()) {
          if (now - lastActivity > this.SESSION_TIMEOUT_MS) {
            this.uploadChunks.delete(uploadId);
            this.uploadLastActivity.delete(uploadId);
          }
        }
      },
      10 * 60 * 1000,
    ); // Check every 10 minutes
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Uploads a file buffer by MIME root type (file/image/video).
   */
  async uploadFileBuffer(file: Express.Multer.File): Promise<string> {
    try {
      /**
       * Uses MIME root type to preserve previous upload routing behavior.
       */
      const type = file.mimetype.split('/')[0];
      return await this.storageService.uploadBufferByType(file.buffer, type);
    } catch {
      throw new InternalServerErrorException(UploadMessages.UPLOAD_FAILED);
    }
  }

  /**
   * Stores chunked buffers and finalizes upload when all chunks are present.
   */
  async uploadChunkBuffer(data: UploadChunkBufferDto): Promise<{ done: boolean; filename?: string }> {
    const { uploadId, chunkIndex, totalChunks, chunkBuffer } = data;

    /**
     * Prevents invalid index boundaries from corrupting chunk assembly.
     */
    if (chunkIndex < 0 || chunkIndex >= totalChunks) {
      throw new BadRequestException(UploadMessages.INVALID_CHUNK);
    }

    /**
     * Initializes in-memory chunk list for a new upload session.
     */
    if (!this.uploadChunks.has(uploadId)) {
      this.uploadChunks.set(uploadId, []);
    }

    const chunks = this.uploadChunks.get(uploadId) as Buffer[];
    chunks[chunkIndex] = chunkBuffer;
    this.uploadLastActivity.set(uploadId, Date.now());

    /**
     * Finalizes and uploads once every expected chunk index is filled.
     */
    if (chunks.filter(Boolean).length === totalChunks) {
      const fullBuffer = Buffer.concat(chunks);

      try {
        const key = await this.storageService.uploadBufferByType(fullBuffer);
        this.uploadChunks.delete(uploadId);
        this.uploadLastActivity.delete(uploadId);
        return { done: true, filename: key };
      } catch {
        throw new InternalServerErrorException(UploadMessages.UPLOAD_FAILED);
      }
    }

    return { done: false };
  }
}
