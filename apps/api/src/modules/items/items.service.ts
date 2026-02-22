import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, ilike, or, sql } from 'drizzle-orm';
import * as schema from '@moving/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '@moving/constants';
import { InventoryService } from '../inventory/inventory.service';

export interface UpsertRoomItemDto {
  itemLibraryId?: string;
  name: string;
  category?: string;
  quantity: number;
  cuFtPerItem?: number;
  weightPerItem?: number;
  isSpecialtyItem?: boolean;
  requiresDisassembly?: boolean;
  isFragile?: boolean;
  isHighValue?: boolean;
  images?: string[];
  notes?: string;
}

const { inventories, rooms, roomItems, itemLibrary } = schema;

@Injectable()
export class ItemsService {
  constructor(
    // Inject the DB instance using the token you defined
    @Inject(DRIZZLE as string) private db: NodePgDatabase<typeof schema>,
    @Inject(InventoryService) private inventoryService: InventoryService,
  ) { }
  // ─── Room Name Helper ─────────────────────────────────────────────────────

  private async getRoomName(roomId: string): Promise<string> {
    const room = await this.db
      .select({ customName: rooms.customName, type: rooms.type })
      .from(rooms)
      .where(eq(rooms.id, roomId))
      .then((res) => res[0]);
    return room?.customName || room?.type?.replace(/_/g, ' ') || 'Unknown Room';
  }

  // ─── Item Library ─────────────────────────────────────────────────────────

  async searchLibrary(query?: string, category?: string, roomType?: string) {
    const whereClause = and(
      eq(itemLibrary.isActive, true),
      query
        ? or(
          ilike(itemLibrary.name, `%${query}%`),
          ilike(itemLibrary.category, `%${query}%`),
          ilike(itemLibrary.searchKeywords, `%${query}%`),
        )
        : undefined,
    );
    const items = await this.db
      .select()
      .from(itemLibrary)
      .where(whereClause)
      .orderBy(itemLibrary.sortOrder)
      .limit(200);

    // Filter by roomType in memory (jsonb array filtering)
    if (roomType) {
      return items.filter((item) =>
        (item.roomTypes as string[]).includes(roomType),
      );
    }

    return items;
  }

  async getCategories() {
    const result = await this.db
      .selectDistinct({ category: itemLibrary.category })
      .from(itemLibrary)
      .where(
        // Ensure we don't get null categories back
        sql`${itemLibrary.category} IS NOT NULL AND ${itemLibrary.isActive} = true`
      )
      .orderBy(itemLibrary.category);

    return result.map(r => r.category);
  }

  // ─── Room Items ───────────────────────────────────────────────────────────

  async upsertItem(
    inventoryId: string,
    roomId: string,
    dto: UpsertRoomItemDto,
  ) {
    const cuFtPerItem = dto.cuFtPerItem ?? 0;
    const weightPerItem = dto.weightPerItem ?? 0;
    const totalCuFt = cuFtPerItem * dto.quantity;
    const totalWeight = weightPerItem * dto.quantity;
    const roomName = await this.getRoomName(roomId);

    // Check if item from same library already exists in this room
    if (dto.itemLibraryId) {
      const existing = await this.db
        .select()
        .from(roomItems)
        .where(
          and(
            eq(roomItems.roomId, roomId),
            eq(roomItems.itemLibraryId, dto.itemLibraryId),
          ),
        )
        .then((res) => res[0]);

      if (existing) {
        const [updated] = await this.db
          .update(roomItems)
          .set({
            quantity: dto.quantity,
            totalCuFt: totalCuFt.toFixed(2),
            totalWeight: totalWeight.toFixed(2),
            notes: dto.notes ?? existing.notes,
            images: dto.images ?? existing.images,
            updatedAt: new Date(),
          })
          .where(eq(roomItems.id, existing.id))
          .returning();

        // Log the update
        await this.inventoryService.logAction(inventoryId, 'item_updated', 'customer', {
          itemName: dto.name,
          roomName,
          quantity: dto.quantity,
          changes: {
            quantity: {
              old: existing.quantity,
              new: dto.quantity,
            },
          },
        });

        await this.recalculateInventoryTotals(inventoryId);
        return updated;
      }
    }

    const [item] = await this.db
      .insert(roomItems)
      .values({
        roomId,
        inventoryId,
        itemLibraryId: dto.itemLibraryId,
        name: dto.name,
        category: dto.category,
        quantity: dto.quantity,
        cuFtPerItem: cuFtPerItem.toFixed(2),
        weightPerItem: weightPerItem.toFixed(2),
        totalCuFt: totalCuFt.toFixed(2),
        totalWeight: totalWeight.toFixed(2),
        isSpecialtyItem: dto.isSpecialtyItem ?? false,
        requiresDisassembly: dto.requiresDisassembly ?? false,
        isFragile: dto.isFragile ?? false,
        isHighValue: dto.isHighValue ?? false,
        images: dto.images ?? [],
        notes: dto.notes,
      })
      .returning();

    // Log the new item creation
    await this.inventoryService.logAction(inventoryId, 'item_created', 'customer', {
      itemName: dto.name,
      roomName,
      category: dto.category,
      quantity: dto.quantity,
      hasPhotos: (dto.images && dto.images.length > 0),
    });

    await this.recalculateInventoryTotals(inventoryId);
    return item;
  }

  async updateItemQuantity(itemId: string, quantity: number) {
    const existing = await this.db
      .select()
      .from(roomItems)
      .where(eq(roomItems.id, itemId))
      .then((res) => res[0]);

    if (!existing) throw new NotFoundException('Item not found');
    const existingRoomName = await this.getRoomName(existing.roomId);

    if (quantity <= 0) {
      // Delete if quantity is 0
      await this.db.delete(roomItems).where(eq(roomItems.id, itemId));

      // Log the deletion
      await this.inventoryService.logAction(existing.inventoryId, 'item_deleted', 'customer', {
        itemName: existing.name,
        roomName: existingRoomName,
      });

      await this.recalculateInventoryTotals(existing.inventoryId);
      return { deleted: true };
    }

    const cuFtPerItem = parseFloat(String(existing.cuFtPerItem || 0));
    const weightPerItem = parseFloat(String(existing.weightPerItem || 0));

    const [updated] = await this.db
      .update(roomItems)
      .set({
        quantity,
        totalCuFt: (cuFtPerItem * quantity).toFixed(2),
        totalWeight: (weightPerItem * quantity).toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(roomItems.id, itemId))
      .returning();

    // Log the quantity update
    if (quantity !== existing.quantity) {
      await this.inventoryService.logAction(existing.inventoryId, 'item_updated', 'customer', {
        itemName: existing.name,
        roomName: existingRoomName,
        quantity,
        changes: {
          quantity: {
            old: existing.quantity,
            new: quantity,
          },
        },
      });
    }

    await this.recalculateInventoryTotals(existing.inventoryId);
    return updated;
  }

  async updateItemImages(itemId: string, images: string[]) {
    const existing = await this.db
      .select()
      .from(roomItems)
      .where(eq(roomItems.id, itemId))
      .then((res) => res[0]);

    if (!existing) throw new NotFoundException('Item not found');
    const imageRoomName = await this.getRoomName(existing.roomId);

    const [updated] = await this.db
      .update(roomItems)
      .set({ images, updatedAt: new Date() })
      .where(eq(roomItems.id, itemId))
      .returning();

    // Log the image update
    const oldPhotoCount = (existing.images as string[])?.length || 0;
    const newPhotoCount = images.length;
    if (newPhotoCount !== oldPhotoCount) {
      await this.inventoryService.logAction(existing.inventoryId, 'item_updated', 'customer', {
        itemName: existing.name,
        roomName: imageRoomName,
        changes: {
          photos: {
            old: `${oldPhotoCount} photo(s)`,
            new: `${newPhotoCount} photo(s)`,
          },
        },
      });
    }

    return updated;
  }

  async deleteItem(itemId: string) {
    const item = await this.db
      .select()
      .from(roomItems)
      .where(eq(roomItems.id, itemId))
      .then((res) => res[0]);

    if (!item) throw new NotFoundException('Item not found');
    const deleteRoomName = await this.getRoomName(item.roomId);

    await this.db.delete(roomItems).where(eq(roomItems.id, itemId));

    // Log the deletion
    await this.inventoryService.logAction(item.inventoryId, 'item_deleted', 'customer', {
      itemName: item.name,
      roomName: deleteRoomName,
    });

    await this.recalculateInventoryTotals(item.inventoryId);

    return { deleted: true };
  }

  // ─── Totals ───────────────────────────────────────────────────────────────

  private async recalculateInventoryTotals(inventoryId: string) {
    const items = await this.db
      .select()
      .from(roomItems)
      .where(eq(roomItems.inventoryId, inventoryId));

    const totalItems = items.reduce((s, i) => s + i.quantity, 0);
    const totalCuFt = items.reduce(
      (s, i) => s + parseFloat(String(i.totalCuFt || 0)),
      0,
    );
    const totalWeight = items.reduce(
      (s, i) => s + parseFloat(String(i.totalWeight || 0)),
      0,
    );

    await this.db
      .update(inventories)
      .set({
        totalItems,
        totalCuFt: totalCuFt.toFixed(2),
        totalWeight: totalWeight.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(inventories.id, inventoryId));
  }
}
