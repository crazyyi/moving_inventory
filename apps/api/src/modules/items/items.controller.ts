import {
  Controller,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
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

@Controller('inventories/:token/rooms/:roomId/items')
export class ItemsController {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly inventoryService: InventoryService,
  ) { }

  @Post()
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
  async updateImages(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateImagesDto,
  ) {
    const result = await this.itemsService.updateItemImages(itemId, dto.images);
    return { success: true, data: result };
  }

  @Delete(':itemId')
  async remove(@Param('itemId') itemId: string) {
    const result = await this.itemsService.deleteItem(itemId);
    return { success: true, data: result };
  }
}
