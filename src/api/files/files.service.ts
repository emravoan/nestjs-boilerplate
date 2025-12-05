import { Injectable } from '@nestjs/common';

import { FileTypeDto } from '../../common/dto/file-type.dto';
import { StorageService } from '../../common/services/storage.service';

@Injectable()
export class FilesService {
  constructor(private readonly storageService: StorageService) {}

  /**
   * Returns a readable file stream for inline delivery.
   */
  getFileStream(type: FileTypeDto, filename: string) {
    return this.storageService.getFileStream(type, filename);
  }

  /**
   * Deletes a stored file by category and path.
   */
  deleteFile(type: FileTypeDto, filename: string) {
    return this.storageService.deleteFile(type, filename);
  }
}
