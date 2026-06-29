import { Controller, Delete, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { lookup } from 'mime-types';

import { FileMessages } from '../../common/constants/messages';
import { FileTypeDto } from '../../common/dto/file-type.dto';
import { FilesService } from './files.service';

@ApiTags('Files')
@ApiBearerAuth()
@ApiSecurity('api-secret')
@ApiSecurity('csrf-token')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /**
   * Streams a stored file by storage type and nested path.
   */
  @Get(':type/*path')
  async getFile(@Param('type') type: FileTypeDto, @Param('path') path: string, @Res() res: Response) {
    try {
      /**
       * Rebuilds nested object path from Express wildcard param format.
       */
      const filename = path.replace(/,/g, '/');
      const ext = filename.split('.').pop()?.toLowerCase();
      const contentType = lookup(ext || '') || 'application/octet-stream';

      /**
       * Caches static files while keeping HLS playlist un-cached.
       */
      res.setHeader('Cache-Control', ext === 'm3u8' ? 'no-cache' : 'public, max-age=2592000, immutable');
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

      const stream = await this.filesService.getFileStream(type, filename);
      stream.pipe(res);
    } catch {
      throw new NotFoundException(FileMessages.NOT_FOUND);
    }
  }

  /**
   * Deletes a stored file by storage type and nested path.
   */
  @Delete(':type/*path')
  async deleteFile(@Param('type') type: FileTypeDto, @Param('path') path: string) {
    const filename = path.replace(/,/g, '/');
    await this.filesService.deleteFile(type, filename);
  }
}
