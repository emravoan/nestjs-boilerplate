import * as path from 'node:path';

import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class FileExtensionValidationPipe implements PipeTransform {
  private readonly allowedExtensions: string[];

  constructor(allowedExtensions?: string[]) {
    this.allowedExtensions = allowedExtensions ?? [
      '.gif',
      '.jpg',
      '.jpeg',
      '.png',
      '.svg',
      '.webp',
      '.mov',
      '.mp4',
      '.webm',
    ];
  }

  /**
   * Validates uploaded file extension against allowed list.
   */
  transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!this.allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        `Invalid file type. Please upload the ${this.allowedExtensions.map((item) => item.replace('.', '')).join(', ')} file.`,
      );
    }

    return file;
  }
}
