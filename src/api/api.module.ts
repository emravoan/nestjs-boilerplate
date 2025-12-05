import { Module } from '@nestjs/common';

import { CsrfService } from '../common/services/csrf.service';
import { AuthModule } from './auth/auth.module';
import { CsrfController } from './csrf/csrf.controller';
import { FilesModule } from './files/files.module';
import { LogsModule } from './logs/logs.module';
import { UploadsModule } from './uploads/uploads.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [UsersModule, AuthModule, FilesModule, UploadsModule, LogsModule],
  controllers: [CsrfController],
  providers: [CsrfService],
  exports: [CsrfService],
})
export class ApiModule {}
