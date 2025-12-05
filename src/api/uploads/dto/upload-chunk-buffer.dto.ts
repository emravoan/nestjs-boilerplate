export interface UploadChunkBufferDto {
  uploadId: string;
  chunkIndex: number;
  totalChunks: number;
  chunkBuffer: Buffer;
}
