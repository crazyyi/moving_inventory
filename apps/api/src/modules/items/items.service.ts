import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, ilike, or, sql } from 'drizzle-orm';
import * as schema from '@moving/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '@moving/constants';

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

const { inventories, roomItems, itemLibrary } = schema;

@Injectable()
export class ItemsService {
  constructor(
    // Inject the DB instance using the token you defined
    @Inject(DRIZZLE as string) private db: NodePgDatabase<typeof schema>,
  ) { }
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

    if (quantity <= 0) {
      // Delete if quantity is 0
      await this.db.delete(roomItems).where(eq(roomItems.id, itemId));
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

    await this.recalculateInventoryTotals(existing.inventoryId);
    return updated;
  }

  async updateItemImages(itemId: string, images: string[]) {
    const [updated] = await this.db
      .update(roomItems)
      .set({ images, updatedAt: new Date() })
      .where(eq(roomItems.id, itemId))
      .returning();

    if (!updated) throw new NotFoundException('Item not found');
    return updated;
  }

  async deleteItem(itemId: string) {
    const item = await this.db
      .select()
      .from(roomItems)
      .where(eq(roomItems.id, itemId))
      .then((res) => res[0]);

    if (!item) throw new NotFoundException('Item not found');

    await this.db.delete(roomItems).where(eq(roomItems.id, itemId));
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
