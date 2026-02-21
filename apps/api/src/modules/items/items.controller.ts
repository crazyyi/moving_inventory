import {
  Controller,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiParam,
  ApiOperation,
} from '@nestjs/swagger'; // Added Swagger imports
import { ItemsService, UpsertRoomItemDto } from './items.service';
import { InventoryService } from '../inventory/inventory.service';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  Min,
} from 'class-validator';

// 1. Add ApiProperty if you want the DTO fields to show examples in Swagger
class UpsertItemDto implements UpsertRoomItemDto {
  @IsOptional() @IsString() itemLibraryId?: string;
  @IsString() name: string;
  @IsOptional() @IsString() category?: string;
  @IsNumber() @Min(1) quantity: number;
  @IsOptional() @IsNumber() cuFtPerItem?: number;
  @IsOptional() @IsNumber() weightPerItem?: number;
  @IsOptional() @IsBoolean() isSpecialtyItem?: boolean;
  @IsOptional() @IsBoolean() requiresDisassembly?: boolean;
  @IsOptional() @IsBoolean() isFragile?: boolean;
  @IsOptional() @IsBoolean() isHighValue?: boolean;
  @IsOptional() @IsArray() images?: string[];
  @IsOptional() @IsString() notes?: string;
}

class UpdateQuantityDto {
  @IsNumber() @Min(0) quantity: number;
}

class UpdateImagesDto {
  @IsArray() images: string[];
}

@ApiTags('Inventory Items') // Groups these routes in Swagger UI
@Controller('inventories/:token/rooms/:roomId/items')
// Define parameters shared by all routes in this controller
@ApiParam({ name: 'token', description: 'Inventory access token' })
@ApiParam({ name: 'roomId', description: 'UUID of the room' })
export class ItemsController {
  @Inject(ItemsService)
  private readonly itemsService: ItemsService;

  @Inject(InventoryService)
  private readonly inventoryService: InventoryService;

  constructor(
  ) { }

  @Post()
  @ApiOperation({ summary: 'Add or update an item in a room' })
  @HttpCode(HttpStatus.CREATED)
  async upsert(
    @Param('token') token: string,
    @Param('roomId') roomId: string,
    @Body() dto: UpsertItemDto,
  ) {
    const inventory = await this.inventoryService.findByToken(token);
    const item = await this.itemsService.upsertItem(inventory.id, roomId, dto);
    return { success: true, data: item };
  }

  @Patch(':itemId/quantity')
  @ApiOperation({ summary: 'Update item quantity' })
  @ApiParam({ name: 'itemId', description: 'UUID of the item' })
  async updateQuantity(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateQuantityDto,
  ) {
    const result = await this.itemsService.updateItemQuantity(
      itemId,
      dto.quantity,
    );
    return { success: true, data: result };
  }

  @Patch(':itemId/images')
  @ApiOperation({ summary: 'Update item images' })
  @ApiParam({ name: 'itemId', description: 'UUID of the item' })
  async updateImages(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateImagesDto,
  ) {
    const result = await this.itemsService.updateItemImages(itemId, dto.images);
    return { success: true, data: result };
  }

  @Delete(':itemId')
  @ApiOperation({ summary: 'Remove an item' })
  @ApiParam({ name: 'itemId', description: 'UUID of the item' })
  async remove(@Param('itemId') itemId: string) {
    const result = await this.itemsService.deleteItem(itemId);
    return { success: true, data: result };
  }
}