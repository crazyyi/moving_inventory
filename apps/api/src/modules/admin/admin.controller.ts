import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Headers,
  Body,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { InventoryService } from '../inventory/inventory.service';
import { GhlService } from '../ghl/ghl.service';

@Controller('admin/inventories')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly inventoryService: InventoryService,
    private readonly ghlService: GhlService,
  ) {}

  @Get('stats')
  async getStats(@Headers('x-admin-key') apiKey: string) {
    this.adminService.validateAdminKey(apiKey);
    const stats = await this.adminService.getDashboardStats();
    return { success: true, data: stats };
  }

  @Get()
  async findAll(
    @Headers('x-admin-key') apiKey: string,
    @Query('status') status?: string,
    @Query('limit') limit = '50',
    @Query('offset') offset = '0',
  ) {
    this.adminService.validateAdminKey(apiKey);
    const inventoryList = await this.inventoryService.findAll(
      status,
      parseInt(limit),
      parseInt(offset),
    );
    return { success: true, data: inventoryList };
  }

  @Get(':inventoryId/summary')
  async getSummary(
    @Headers('x-admin-key') apiKey: string,
    @Param('inventoryId') inventoryId: string,
  ) {
    this.adminService.validateAdminKey(apiKey);
    const summary = await this.inventoryService.getSummary(inventoryId);
    return { success: true, data: summary };
  }

  @Post(':inventoryId/lock')
  async lockInventory(
    @Headers('x-admin-key') apiKey: string,
    @Param('inventoryId') inventoryId: string,
  ) {
    this.adminService.validateAdminKey(apiKey);
    const locked = await this.inventoryService.lock(inventoryId);
    return { success: true, data: locked };
  }

  @Post(':inventoryId/push-ghl')
  async pushToGhl(
    @Headers('x-admin-key') apiKey: string,
    @Param('inventoryId') inventoryId: string,
  ) {
    this.adminService.validateAdminKey(apiKey);
    const summary = await this.inventoryService.getSummary(inventoryId);
    const payload = this.ghlService.buildPayload(summary);
    const result = await this.ghlService.pushToGHL(inventoryId, payload);
    return { success: true, data: result };
  }

  @Patch(':inventoryId/notes')
  async addInternalNote(
    @Headers('x-admin-key') apiKey: string,
    @Param('inventoryId') inventoryId: string,
    @Body('note') note: string,
  ) {
    this.adminService.validateAdminKey(apiKey);
    await this.adminService.addInternalNote(inventoryId, note);
    return { success: true, message: 'Note added' };
  }
}
