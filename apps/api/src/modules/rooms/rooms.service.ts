import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as schema from '@moving/schema';
import { NodePgDatabase } from 'node_modules/drizzle-orm/node-postgres/index.cjs';
import { DRIZZLE } from '@moving/constants';

const { inventories, rooms, roomItems } = schema;

@Injectable()
export class RoomsService {
  constructor(
    // Inject the DB instance using the token you defined
    @Inject(DRIZZLE as string) private db: NodePgDatabase<typeof schema>,
  ) { }

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

    return room;
  }

  async updateRoom(
    roomId: string,
    data: { customName?: string; isComplete?: boolean; sortOrder?: number },
  ) {
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

    // Cascade delete items
    await this.db.delete(roomItems).where(eq(roomItems.roomId, roomId));
    await this.db.delete(rooms).where(eq(rooms.id, roomId));

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
