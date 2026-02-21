import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Headers,
  Body,
  Inject,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApiHeader, ApiParam, ApiTags } from '@nestjs/swagger';
@ApiTags('Admin') // Optional: Groups routes in UI
@ApiHeader({
  name: 'x-admin-key',
  description: 'Admin access key for authentication',
  required: true,
})
@Controller('admin/inventories')
export class AdminController {
  @Inject(AdminService)
  private readonly adminService: AdminService;

  // REMOVE EVERYTHING FROM THE CONSTRUCTOR
  constructor() { }

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
    const inventoryList = await this.adminService.getInventories(
      status,
      parseInt(limit),
      parseInt(offset),
    );
    return { success: true, data: inventoryList };
  }

  @Get(':inventoryId/summary')
  @ApiParam({ name: 'inventoryId', type: 'string', description: 'The inventory ID' })
  async getSummary(
    @Headers('x-admin-key') apiKey: string,
    @Param('inventoryId') inventoryId: string,
  ) {
    this.adminService.validateAdminKey(apiKey);
    const summary = await this.adminService.getInventorySummary(inventoryId);
    return { success: true, data: summary };
  }

  @Post(':inventoryId/lock')
  @ApiParam({ name: 'inventoryId', type: 'string', description: 'The inventory ID' })
  async lockInventory(
    @Headers('x-admin-key') apiKey: string,
    @Param('inventoryId') inventoryId: string,
  ) {
    this.adminService.validateAdminKey(apiKey);
    const locked = await this.adminService.lockInventory(inventoryId);
    return { success: true, data: locked };
  }

  @Post(':inventoryId/push-ghl')
  @ApiParam({ name: 'inventoryId', type: 'string', description: 'The inventory ID' })
  async pushToGhl(
    @Headers('x-admin-key') apiKey: string,
    @Param('inventoryId') inventoryId: string,
  ) {
    this.adminService.validateAdminKey(apiKey);
    const result = await this.adminService.pushInventoryToGHL(inventoryId);
    return { success: true, data: result };
  }

  @Patch(':inventoryId/notes')
  @ApiParam({ name: 'inventoryId', type: 'string', description: 'The inventory ID' })
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
