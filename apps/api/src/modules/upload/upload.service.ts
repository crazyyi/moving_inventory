import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import * as crypto from 'crypto';
import { NodePgDatabase } from 'node_modules/drizzle-orm/node-postgres/index.cjs';
import * as schema from '@moving/schema';
import { DRIZZLE } from '@moving/constants';
import axios from 'axios';

@Injectable()
export class UploadService {
  private readonly cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  private readonly apiKey = process.env.CLOUDINARY_API_KEY;
  private readonly apiSecret = process.env.CLOUDINARY_API_SECRET;

  constructor(
    @Inject(DRIZZLE as string) private db: NodePgDatabase<typeof schema>,
  ) { }

  async uploadBase64Image(
    base64Data: string,
    folder = 'moving-inventory',
    inventoryToken?: string,
  ): Promise<string> {
    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new BadRequestException('Image upload not configured');
    }

    const timestamp = Math.round(Date.now() / 1000);
    const publicId = `${folder}/${inventoryToken || 'misc'}/${Date.now()}`;

    const signString = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${this.apiSecret}`;
    const signature = crypto
      .createHash('sha1')
      .update(signString)
      .digest('hex');

    const formData = new URLSearchParams({
      file: base64Data.startsWith('data:')
        ? base64Data
        : `data:image/jpeg;base64,${base64Data}`,
      upload_preset: 'moving_inventory',
      public_id: publicId,
      folder,
      timestamp: String(timestamp),
      api_key: this.apiKey,
      signature,
    });

    const response = await axios.post<any>(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
      Object.fromEntries(formData),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    return response.data.secure_url;
  }

  getSignedUploadParams(folder = 'moving-inventory') {
    const timestamp = Math.round(Date.now() / 1000);
    const signString = `folder=${folder}&timestamp=${timestamp}${this.apiSecret}`;
    const signature = crypto
      .createHash('sha1')
      .update(signString)
      .digest('hex');

    return {
      timestamp,
      signature,
      apiKey: this.apiKey,
      cloudName: this.cloudName,
      folder,
    };
  }
}
