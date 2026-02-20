import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { InventoryService } from '../inventory/inventory.service';
import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

class CreateRoomDto {
  @IsString() type: string;
  @IsOptional() @IsString() customName?: string;
}

class UpdateRoomDto {
  @IsOptional() @IsString() customName?: string;
  @IsOptional() @IsBoolean() isComplete?: boolean;
  @IsOptional() @IsNumber() sortOrder?: number;
}

@Controller('inventories/:token/rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly inventoryService: InventoryService,
  ) {}

  @Get()
  async findAll(@Param('token') token: string) {
    const inventory = await this.inventoryService.findByToken(token);
    const roomList = await this.roomsService.getRoomsForInventory(inventory.id);
    return { success: true, data: roomList };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Param('token') token: string, @Body() dto: CreateRoomDto) {
    const inventory = await this.inventoryService.findByToken(token);
    const room = await this.roomsService.createRoom(
      inventory.id,
      dto.type,
      dto.customName,
    );
    return { success: true, data: room };
  }

  @Patch(':roomId')
  async update(
    @Param('token') token: string,
    @Param('roomId') roomId: string,
    @Body() dto: UpdateRoomDto,
  ) {
    const room = await this.roomsService.updateRoom(roomId, dto);
    return { success: true, data: room };
  }

  @Delete(':roomId')
  async remove(@Param('token') token: string, @Param('roomId') roomId: string) {
    const result = await this.roomsService.deleteRoom(roomId);
    return { success: true, data: result };
  }
}
