import { Inject, Injectable, Logger } from '@nestjs/common';
import * as schema from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '@moving/constants';
import axios from 'axios';

const { inventories } = schema;

export interface GhlInventoryPayload {
  inventoryId: string;
  token: string;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  fromAddress?: string | null;
  toAddress?: string | null;
  moveDate?: Date | null;
  totalItems: number;
  totalCuFt: string;
  totalWeight: string;
  rooms: Array<{
    name: string;
    type: string;
    itemCount: number;
    items: Array<{
      name: string;
      quantity: number;
      cuFt: number;
      weight: number;
      isSpecialty: boolean;
    }>;
  }>;
  specialtyItems: string[];
  submittedAt: string;
  inventoryUrl: string;
}

@Injectable()
export class GhlService {
  private readonly logger = new Logger(GhlService.name);

  constructor(
    // Inject the DB instance using the token you defined
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
  ) {
    console.log('🚀 SUCCESS: GhlService fully initialized with DB and HTTP!');
  }

  async pushToGHL(inventoryId: string, payload: GhlInventoryPayload) {
    const webhookUrl = process.env.GHL_WEBHOOK_URL;

    if (!webhookUrl) {
      this.logger.warn('GHL_WEBHOOK_URL not configured, skipping webhook');
      return null;
    }

    try {
      const response = await axios.post<any>(
        webhookUrl,
        {
          ...payload,
          source: 'moving-inventory-app',
          version: '1.0',
        },
        {
          headers: {
            'X-API-Key': process.env.GHL_API_KEY || '',
          },
          timeout: 10000,
        }
      );

      // Store the webhook payload and mark as sent
      await this.db
        .update(inventories)
        .set({
          ghlSubmittedAt: new Date(),
          ghlWebhookPayload: payload as any,
        })
        .where(eq(inventories.id, inventoryId));

      this.logger.log(`GHL webhook sent for inventory ${inventoryId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`GHL webhook failed for ${inventoryId}:`, error);
      throw error;
    }
  }

  buildPayload(summary: any): GhlInventoryPayload {
    const { inventory, roomSummaries, specialtyItems } = summary;
    const webUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';

    return {
      inventoryId: inventory.id,
      token: inventory.token,
      customerName: inventory.customerName,
      customerEmail: inventory.customerEmail,
      customerPhone: inventory.customerPhone,
      fromAddress: inventory.fromAddress,
      toAddress: inventory.toAddress,
      moveDate: inventory.moveDate,
      totalItems: inventory.totalItems,
      totalCuFt: inventory.totalCuFt,
      totalWeight: inventory.totalWeight,
      rooms: roomSummaries.map((room: any) => ({
        name: room.name || room.type,
        type: room.type,
        itemCount: room.itemCount,
        items: room.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          cuFt: parseFloat(item.totalCuFt || '0'),
          weight: parseFloat(item.totalWeight || '0'),
          isSpecialty: item.isSpecialtyItem,
        })),
      })),
      specialtyItems: specialtyItems.map(
        (i: any) => `${i.quantity}x ${i.name}`,
      ),
      submittedAt:
        inventory.submittedAt?.toISOString() || new Date().toISOString(),
      inventoryUrl: `${webUrl}/inventory/${inventory.token}`,
    };
  }
}
