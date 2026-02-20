import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { UploadService } from './upload.service';
import { IsString, IsOptional } from 'class-validator';

class UploadImageDto {
  @IsString() base64Data: string;
  @IsOptional() @IsString() inventoryToken?: string;
}

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  async uploadImage(@Body() dto: UploadImageDto) {
    const url = await this.uploadService.uploadBase64Image(
      dto.base64Data,
      'moving-inventory',
      dto.inventoryToken,
    );
    return { success: true, data: { url } };
  }

  @Get('sign')
  async getSignedParams(@Query('folder') folder?: string) {
    const params = await this.uploadService.getSignedUploadParams(
      folder || 'moving-inventory',
    );
    return { success: true, data: params };
  }
}
