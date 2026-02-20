import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiParam } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Controller('inventories')
export class InventoryController {
  constructor(
    @Inject(InventoryService)
    private readonly inventoryService: InventoryService
  ) { }

  // POST /api/inventories — Create new inventory with token
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateInventoryDto) {
    const inventory = await this.inventoryService.create(dto);
    return {
      success: true,
      data: {
        id: inventory.id,
        token: inventory.token,
        accessUrl: `/inventory/${inventory.token}`,
        expiresAt: inventory.expiresAt,
      },
    };
  }

  // GET /api/inventories/:token — Get inventory by token
  @Get(':token')
  @ApiParam({ name: 'token', type: 'string', description: 'The unique inventory token' })
  async findByToken(@Param('token') token: string) {
    const inventory = await this.inventoryService.findByToken(token);
    return { success: true, data: inventory };
  }

  // PATCH /api/inventories/:token — Update customer info
  @Patch(':token')
  async update(@Param('token') token: string, @Body() dto: UpdateInventoryDto) {
    const updated = await this.inventoryService.update(token, dto);
    return { success: true, data: updated };
  }

  // POST /api/inventories/:token/submit — Submit the inventory
  @Post(':token/submit')
  @HttpCode(HttpStatus.OK)
  async submit(@Param('token') token: string) {
    const submitted = await this.inventoryService.submit(token);
    return {
      success: true,
      data: submitted,
      message: 'Inventory submitted successfully',
    };
  }

  // GET /api/inventories/:token/summary — Get full summary
  @Get(':token/summary')
  async summary(@Param('token') token: string) {
    const inventory = await this.inventoryService.findByToken(token);
    const summary = await this.inventoryService.getSummary(inventory.id);
    return { success: true, data: summary };
  }
}
