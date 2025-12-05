import { exec as execCb } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { extension } from 'mime-types';
import { PinoLogger } from 'nestjs-pino';
import sharp from 'sharp';

import { FileMessages } from '../constants/messages';
import { FileTypeDto } from '../dto/file-type.dto';

const exec = promisify(execCb);
type UploadRootType = 'file' | 'image' | 'video';

@Injectable()
export class StorageService {
  private readonly s3: S3Client;

  private readonly bucketMap: Record<FileTypeDto, { bucket: string; prefix: string }>;

  constructor(
    private readonly logger: PinoLogger,
    private readonly configService: ConfigService,
  ) {
    const config = this.configService.getOrThrow<{
      endpoint: string;
      accessKeyId: string;
      secretAccessKey: string;
      fileBucket: string;
      imageBucket: string;
      videoBucket: string;
    }>('storage');

    this.logger.setContext(StorageService.name);

    this.s3 = new S3Client({
      endpoint: config.endpoint,
      region: 'auto',
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
    });

    this.bucketMap = {
      files: { bucket: config.fileBucket, prefix: 'files' },
      images: { bucket: config.imageBucket, prefix: 'images' },
      videos: { bucket: config.videoBucket, prefix: 'videos' },
    };
  }

  /**
   * Normalizes MIME type root into a supported upload category.
   */
  private toUploadRootType(mimetype?: string): UploadRootType {
    const root = mimetype?.split('/')[0];
    if (root === 'image') return 'image';
    if (root === 'video') return 'video';
    return 'file';
  }

  /**
   * Uploads a generic file buffer to object storage.
   */
  async uploadFileBuffer(buffer: Buffer, mimetype?: string): Promise<string> {
    let mime = mimetype;

    try {
      if (!mime) {
        mime = 'application/octet-stream';
      }

      const { bucket, prefix } = this.bucketMap.files;
      const name = randomUUID();
      const ext = extension(mime) || 'bin';
      const key = `${prefix}/${name}.${ext}`;

      await this.s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: mime,
        }),
      );

      return key;
    } catch (error) {
      this.logger.error({ error }, 'Failed to upload file buffer');
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  /**
   * Converts image to WebP then uploads to object storage.
   */
  async uploadImageBuffer(buffer: Buffer): Promise<string> {
    const { bucket, prefix } = this.bucketMap.images;
    const name = randomUUID();
    const key = `${prefix}/${name}.webp`;

    try {
      const fileBuffer = await sharp(buffer).webp({ quality: 95 }).toBuffer();

      await this.s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: 'image/webp',
        }),
      );

      return key;
    } catch (error) {
      this.logger.error({ error }, 'Failed to upload image buffer');
      throw new InternalServerErrorException('Failed to upload image');
    }
  }

  /**
   * Converts a video buffer to HLS and uploads playlist segments.
   */
  async uploadVideoBuffer(buffer: Buffer): Promise<string> {
    const name = randomUUID();
    const tmpInput = join(tmpdir(), `${name}-input`);
    const tmpOutputDir = join(tmpdir(), `${name}-hls`);

    try {
      await fs.mkdir(tmpOutputDir, { recursive: true });
      await fs.writeFile(tmpInput, buffer);

      const ffmpegCmd = `ffmpeg -hide_banner -i "${tmpInput}" -profile:v baseline -level 3.0 -preset fast -start_number 0 -hls_time 10 -hls_list_size 0 -f hls "${join(tmpOutputDir, 'index.m3u8')}"`;
      await exec(ffmpegCmd);

      const files = await fs.readdir(tmpOutputDir);
      const { bucket, prefix } = this.bucketMap.videos;

      for (const file of files) {
        const fileData = await fs.readFile(join(tmpOutputDir, file));
        await this.s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: `${prefix}/${name}/${file}`,
            Body: fileData,
            ContentType: file.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t',
          }),
        );
      }

      return `${prefix}/${name}/index.m3u8`;
    } catch (error) {
      this.logger.error({ error }, 'Failed to upload video buffer');
      throw new InternalServerErrorException('Failed to upload video');
    } finally {
      try {
        await fs.unlink(tmpInput);
      } catch {
        // no-op
      }

      try {
        const files = await fs.readdir(tmpOutputDir);
        for (const file of files) {
          await fs.unlink(join(tmpOutputDir, file));
        }
        await fs.rmdir(tmpOutputDir);
      } catch {
        // no-op
      }
    }
  }

  /**
   * Routes upload to file/image/video handler by mime type.
   */
  async uploadBufferByType(buffer: Buffer, mimetype?: string): Promise<string> {
    const type = this.toUploadRootType(mimetype);
    const uploadMap: Record<UploadRootType, (input: Buffer) => Promise<string>> = {
      file: (input) => this.uploadFileBuffer(input, mimetype),
      image: (input) => this.uploadImageBuffer(input),
      video: (input) => this.uploadVideoBuffer(input),
    };

    return uploadMap[type](buffer);
  }

  /**
   * Returns a readable stream from object storage.
   */
  async getFileStream(type: FileTypeDto, filename: string): Promise<NodeJS.ReadableStream> {
    const key = `${type}/${filename}`;
    const { bucket } = this.bucketMap[type];

    try {
      await this.s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    } catch {
      throw new NotFoundException(FileMessages.NOT_FOUND);
    }

    const result = await this.s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    return result.Body as NodeJS.ReadableStream;
  }

  /**
   * Deletes object from storage after existence check.
   */
  async deleteFile(type: FileTypeDto, filename: string): Promise<void> {
    const key = `${type}/${filename}`;
    const { bucket } = this.bucketMap[type];

    try {
      await this.s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    } catch {
      throw new NotFoundException(FileMessages.NOT_FOUND);
    }

    await this.s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }
}
