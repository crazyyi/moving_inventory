// apps/api/src/modules/rooms/rooms.service.ts
import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as schema from '@moving/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '@moving/constants';
import { InventoryService } from '../inventory/inventory.service';
import { UpdateRoomDto } from './dto/rooms.dto';

const { inventories, rooms, roomItems } = schema;

@Injectable()
export class RoomsService {
  @Inject(DRIZZLE)
  private readonly db: NodePgDatabase<typeof schema>;

  @Inject(InventoryService)
  private readonly inventoryService: InventoryService;

  // ─── Token Helpers ────────────────────────────────────────────────────────
  // This translates the public token to the internal ID safely

  async getRoomsByToken(token: string) {
    const inventory = await this.inventoryService.findByToken(token);
    return this.getRoomsForInventory(inventory.id);
  }

  async createRoomByToken(token: string, type: string, customName?: string) {
    const inventory = await this.inventoryService.findByToken(token);
    return this.createRoom(inventory.id, type, customName);
  }

  // ─── Existing Logic ───────────────────────────────────────────────────────

  async ensureNotLocked(inventoryId: string) {
    const inventory = await this.db.query.inventories.findFirst({
      where: eq(inventories.id, inventoryId),
    });
    if (inventory?.isLocked) {
      throw new ForbiddenException('Inventory is locked');
    }
    return inventory;
  }

  async createRoom(inventoryId: string, type: string, customName?: string) {
    await this.ensureNotLocked(inventoryId);
    const existingRooms = await this.db.query.rooms.findMany({
      where: eq(rooms.inventoryId, inventoryId),
    });

    const [room] = await this.db
      .insert(rooms)
      .values({
        inventoryId,
        type: type as any,
        customName,
        sortOrder: existingRooms.length,
      })
      .returning();

    // Log the room creation
    const roomName = customName || type.replace(/_/g, ' ');
    await this.inventoryService.logAction(inventoryId, 'room_created', 'customer', {
      roomName,
      type,
    });

    return room;
  }

  async updateRoom(roomId: string, data: UpdateRoomDto) {
    const [updated] = await this.db
      .update(rooms)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(rooms.id, roomId))
      .returning();

    if (!updated) throw new NotFoundException('Room not found');
    return updated;
  }

  async deleteRoom(roomId: string) {
    const room = await this.db.query.rooms.findFirst({
      where: eq(rooms.id, roomId),
    });
    if (!room) throw new NotFoundException('Room not found');

    await this.ensureNotLocked(room.inventoryId);

    await this.db.delete(roomItems).where(eq(roomItems.roomId, roomId));
    await this.db.delete(rooms).where(eq(rooms.id, roomId));

    // Log the room deletion
    const roomName = room.customName || room.type.replace(/_/g, ' ');
    await this.inventoryService.logAction(room.inventoryId, 'room_deleted', 'customer', {
      roomName,
      type: room.type,
    });

    return { deleted: true };
  }

  async getRoomsForInventory(inventoryId: string) {
    return await this.db.query.rooms.findMany({
      where: eq(rooms.inventoryId, inventoryId),
      with: { items: true },
      orderBy: (rooms, { asc }) => [asc(rooms.sortOrder)],
    });
  }
}