import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { DrizzleModule } from '@moving/drizzle.module';

@Module({
  imports: [DrizzleModule], // 👈 This gives this module access to the DB
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule { }
