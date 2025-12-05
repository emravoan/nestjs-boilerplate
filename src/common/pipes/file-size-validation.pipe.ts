import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
  private readonly maxSizeInKb: number;
  private readonly maxSizeInBytes: number;

  constructor(maxSizeInKb?: number) {
    this.maxSizeInKb = maxSizeInKb ?? 1024;
    this.maxSizeInBytes = this.maxSizeInKb * 1024;
  }

  /**
   * Validates upload file size against configured maximum.
   */
  transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (file.size > this.maxSizeInBytes) {
      throw new BadRequestException(`File size should be less than ${this.maxSizeInKb} KB`);
    }

    return file;
  }
}
