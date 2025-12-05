import { BadRequestException, Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { UploadMessages } from '../../common/constants/messages';
import { FileExtensionValidationPipe } from '../../common/pipes/file-extension-validation.pipe';
import { FileSizeValidationPipe } from '../../common/pipes/file-size-validation.pipe';
import { FileUploadDto } from './dto/file-upload.dto';
import { UploadChunkDto } from './dto/upload-chunk.dto';
import { UploadsService } from './uploads.service';

@ApiTags('Uploads')
@ApiBearerAuth()
@ApiSecurity('api-secret')
@ApiSecurity('csrf-token')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  /**
   * Uploads a generic file (up to 50 MB).
   */
  @Post('file')
  @ApiBody({ type: FileUploadDto })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile(new FileSizeValidationPipe(50 * 1024)) file: Express.Multer.File) {
    const filename = await this.uploadsService.uploadFileBuffer(file);
    return { filename };
  }

  /**
   * Uploads an image file with extension + size validation.
   */
  @Post('image')
  @ApiBody({ type: FileUploadDto })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(
      new FileSizeValidationPipe(5 * 1024),
      new FileExtensionValidationPipe(['.gif', '.jpg', '.jpeg', '.png', '.svg', '.webp']),
    )
    file: Express.Multer.File,
  ) {
    const filename = await this.uploadsService.uploadFileBuffer(file);
    return { filename };
  }

  /**
   * Uploads a video file with extension + size validation.
   */
  @Post('video')
  @ApiBody({ type: FileUploadDto })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(
    @UploadedFile(new FileSizeValidationPipe(100 * 1024), new FileExtensionValidationPipe(['.mov', '.mp4', '.webm']))
    file: Express.Multer.File,
  ) {
    const filename = await this.uploadsService.uploadFileBuffer(file);
    return { filename };
  }

  /**
   * Accepts one chunk and completes upload when all chunks arrive.
   */
  @Post('chunk')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadChunkDto })
  @UseInterceptors(FileInterceptor('chunkBuffer'))
  async uploadChunk(@Body() body: UploadChunkDto, @UploadedFile() file?: Express.Multer.File) {
    /**
     * Ensures chunk payload includes binary part.
     */
    if (!file) {
      throw new BadRequestException(UploadMessages.INVALID_CHUNK);
    }

    return this.uploadsService.uploadChunkBuffer({
      ...body,
      chunkBuffer: file.buffer,
    });
  }
}
