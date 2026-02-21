// apps/api/src/modules/rooms/rooms.controller.ts
import { Controller, Get, Post, Patch, Delete, Param, Body, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { ApiParam } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { InventoryService } from '../inventory/inventory.service'
import { CreateRoomDto, UpdateRoomDto } from './dto/rooms.dto';

@Controller('inventories/:token/rooms')
export class RoomsController {
  @Inject(RoomsService)
  private readonly roomsService: RoomsService;

  // Use property injection to avoid the "undefined" race condition
  @Inject(InventoryService)
  private readonly inventoryService: InventoryService;

  @Get()
  @ApiParam({ name: 'token', type: 'string' })
  async findAll(@Param('token') token: string) {
    const roomList = await this.roomsService.getRoomsByToken(token);
    return { success: true, data: roomList };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'token', type: 'string' })
  async create(@Param('token') token: string, @Body() dto: CreateRoomDto) {
    const room = await this.roomsService.createRoomByToken(
      token,
      dto.type,
      dto.customName,
    );
    return { success: true, data: room };
  }

  @Patch(':roomId')
  @ApiParam({ name: 'token', type: 'string' })
  async update(
    @Param('roomId') roomId: string,
    @Body() dto: UpdateRoomDto,
  ) {
    const room = await this.roomsService.updateRoom(roomId, dto);
    return { success: true, data: room };
  }

  @Delete(':roomId')
  @ApiParam({ name: 'token', type: 'string' })
  async remove(@Param('roomId') roomId: string) {
    const result = await this.roomsService.deleteRoom(roomId);
    return { success: true, data: result };
  }
}