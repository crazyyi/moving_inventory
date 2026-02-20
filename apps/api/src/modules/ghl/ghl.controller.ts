import {
  Controller,
  Post,
  Param,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { GhlService } from './ghl.service';
import { InventoryService } from '../inventory/inventory.service';

@Controller('admin/ghl')
export class GhlController {
  constructor(
    private readonly ghlService: GhlService,
    private readonly inventoryService: InventoryService,
  ) {}

  private validateAdminKey(apiKey: string) {
    if (apiKey !== process.env.ADMIN_API_KEY) {
      throw new UnauthorizedException('Invalid admin API key');
    }
  }

  @Post('push/:inventoryId')
  async pushInventory(
    @Param('inventoryId') inventoryId: string,
    @Headers('x-admin-key') apiKey: string,
  ) {
    this.validateAdminKey(apiKey);

    const summary = await this.inventoryService.getSummary(inventoryId);
    const payload = this.ghlService.buildPayload(summary);
    const result = await this.ghlService.pushToGHL(inventoryId, payload);

    return { success: true, data: result };
  }
}
