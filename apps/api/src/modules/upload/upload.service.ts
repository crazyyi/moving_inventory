import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@moving/schema';
import { DRIZZLE } from '@moving/constants';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  private cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  private apiKey = process.env.CLOUDINARY_API_KEY;
  private apiSecret = process.env.CLOUDINARY_API_SECRET;

  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
  ) {
    // Correctly initialize Cloudinary in the constructor body
    if (this.cloudName && this.apiKey && this.apiSecret) {
      cloudinary.config({
        cloud_name: this.cloudName,
        api_key: this.apiKey,
        api_secret: this.apiSecret,
      });
    }
  }

  async uploadBase64Image(
    base64Data: string,
    folder = 'moving-inventory',
    inventoryToken?: string,
  ): Promise<string> {
    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new BadRequestException('Image upload not configured');
    }

    // FORCE the prefix if it's missing
    // This tells Cloudinary: "This is DATA, not a file on my disk"
    const formattedData = base64Data.startsWith('data:')
      ? base64Data
      : `data:image/jpeg;base64,${base64Data}`;

    try {
      const result = await cloudinary.uploader.upload(formattedData, {
        // ADD THE PRESET HERE
        upload_preset: 'moving_inventory_preset',

        // Other options
        folder: `${folder}/${inventoryToken || 'misc'}`,
        resource_type: 'auto',
      });

      return result.secure_url;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Use this if you want the Frontend to upload directly to Cloudinary
   * without passing large base64 strings through your NestJS API
   */
  getSignedUploadParams(folder = 'moving-inventory') {
    if (!this.apiSecret) throw new BadRequestException('API Secret missing');

    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      this.apiSecret
    );

    return {
      timestamp,
      signature,
      apiKey: this.apiKey,
      cloudName: this.cloudName,
      folder,
    };
  }
}