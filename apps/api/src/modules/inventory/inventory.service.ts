import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as schema from '@moving/schema';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { customAlphabet } from 'nanoid';
import { DRIZZLE } from '@moving/constants';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

const generateToken = customAlphabet(
  'abcdefghijklmnopqrstuvwxyz0123456789',
  24,
);

const { inventories, auditLog } = schema;

@Injectable()
export class InventoryService {
  constructor(
    // Inject the DB instance using the token you defined
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
  ) { }
  // ─── Create ──────────────────────────────────────────────────────────────

  async create(dto: CreateInventoryDto) {
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const [inventory] = await this.db
      .insert(inventories)
      .values({
        token,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        moveDate: dto.moveDate ? new Date(dto.moveDate) : undefined,
        fromAddress: dto.fromAddress,
        toAddress: dto.toAddress,
        notes: dto.notes,
        status: 'draft',
        expiresAt,
      })
      .returning();

    await this.logAction(inventory.id, 'inventory_created', 'customer');

    return inventory;
  }

  // ─── Get by token ────────────────────────────────────────────────────────

  async findByToken(token: string) {
    const inventory = await this.db.query.inventories.findFirst({
      where: eq(inventories.token, token),
      with: {
        rooms: {
          with: {
            items: true,
          },
          orderBy: (rooms, { asc }) => [asc(rooms.sortOrder)],
        },
      },
    }).execute();

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    return inventory;
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  async update(token: string, dto: UpdateInventoryDto) {
    const inventory = await this.findByToken(token);

    if (inventory.isLocked) {
      throw new ForbiddenException(
        'This inventory has been locked and cannot be modified',
      );
    }

    // Track what changed
    const changes: Record<string, { old: unknown; new: unknown }> = {};

    if (dto.customerName !== undefined && dto.customerName !== inventory.customerName) {
      changes.customerName = { old: inventory.customerName, new: dto.customerName };
    }
    if (dto.customerEmail !== undefined && dto.customerEmail !== inventory.customerEmail) {
      changes.customerEmail = { old: inventory.customerEmail, new: dto.customerEmail };
    }
    if (dto.customerPhone !== undefined && dto.customerPhone !== inventory.customerPhone) {
      changes.customerPhone = { old: inventory.customerPhone, new: dto.customerPhone };
    }
    if (dto.moveDate !== undefined) {
      const newMoveDate = dto.moveDate ? new Date(dto.moveDate) : null;
      if (String(newMoveDate) !== String(inventory.moveDate)) {
        changes.moveDate = {
          old: inventory.moveDate ? new Date(inventory.moveDate).toLocaleDateString() : null,
          new: newMoveDate ? newMoveDate.toLocaleDateString() : null,
        };
      }
    }
    if (dto.fromAddress !== undefined && dto.fromAddress !== inventory.fromAddress) {
      changes.fromAddress = { old: inventory.fromAddress, new: dto.fromAddress };
    }
    if (dto.toAddress !== undefined && dto.toAddress !== inventory.toAddress) {
      changes.toAddress = { old: inventory.toAddress, new: dto.toAddress };
    }
    if (dto.notes !== undefined && dto.notes !== inventory.notes) {
      changes.notes = { old: inventory.notes, new: dto.notes };
    }

    const [updated] = await this.db
      .update(inventories)
      .set({
        customerName: dto.customerName ?? inventory.customerName,
        customerEmail: dto.customerEmail ?? inventory.customerEmail,
        customerPhone: dto.customerPhone ?? inventory.customerPhone,
        moveDate: dto.moveDate ? new Date(dto.moveDate) : inventory.moveDate,
        fromAddress: dto.fromAddress ?? inventory.fromAddress,
        toAddress: dto.toAddress ?? inventory.toAddress,
        notes: dto.notes ?? inventory.notes,
        status: 'in_progress',
        updatedAt: new Date(),
      })
      .where(eq(inventories.token, token))
      .returning();

    // Log the update with change details
    if (Object.keys(changes).length > 0) {
      await this.logAction(inventory.id, 'inventory_updated', 'customer', {
        changes,
      });
    }

    return updated;
  }

  // ─── Submit ──────────────────────────────────────────────────────────────

  async submit(token: string) {
    const inventory = await this.findByToken(token);

    if (inventory.isLocked) {
      throw new ConflictException('Inventory already submitted');
    }

    // Recalculate totals before submitting
    await this.recalculateTotals(inventory.id);

    const [submitted] = await this.db
      .update(inventories)
      .set({
        status: 'submitted',
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(inventories.token, token))
      .returning();

    if (inventory?.id) {
      // Capture submission details for audit log
      const submissionDetails = {
        customerName: inventory.customerName,
        moveDate: inventory.moveDate,
        fromAddress: inventory.fromAddress,
        toAddress: inventory.toAddress,
        totalItems: inventory.totalItems || 0,
        totalCuFt: Number(inventory.totalCuFt || 0).toFixed(1),
        totalWeight: Number(inventory.totalWeight || 0).toFixed(0),
      };
      await this.logAction(inventory.id, 'inventory_submitted', 'customer', submissionDetails);
    }

    return submitted;
  }

  // ─── Lock ────────────────────────────────────────────────────────────────

  async lock(inventoryId: string) {
    const [locked] = await this.db
      .update(inventories)
      .set({
        isLocked: true,
        lockedAt: new Date(),
        status: 'locked',
        updatedAt: new Date(),
      })
      .where(eq(inventories.id, inventoryId))
      .returning();

    await this.logAction(inventoryId, 'inventory_locked', 'admin');

    return locked;
  }

  // ─── Recalculate Totals ──────────────────────────────────────────────────

  async recalculateTotals(inventoryId: string) {
    // 1. Fetch items using the Relational API
    const items = await this.db.query.roomItems.findMany({
      where: (fields, { eq }) => eq(fields.inventoryId, inventoryId),
    }).execute();

    // 2. Single-pass calculation (Performance optimization)
    const totals = items.reduce(
      (acc, item) => {
        acc.totalItems += item.quantity || 0;
        acc.totalCuFt += parseFloat(String(item.totalCuFt || 0));
        acc.totalWeight += parseFloat(String(item.totalWeight || 0));
        return acc;
      },
      { totalItems: 0, totalCuFt: 0, totalWeight: 0 },
    );

    // 3. Update using the injected this.db
    await this.db
      .update(inventories)
      .set({
        totalItems: totals.totalItems,
        totalCuFt: totals.totalCuFt.toFixed(2),
        totalWeight: totals.totalWeight.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(inventories.id, inventoryId))
      .execute(); // Use .execute() to satisfy the "Unexpected await" lint rule

    return totals;
  }

  // ─── Audit Log ───────────────────────────────────────────────────────────

  async logAction(
    inventoryId: string,
    action: string,
    actor: string,
    payload?: Record<string, unknown>,
  ) {
    await this.db.insert(auditLog).values({
      inventoryId,
      action,
      actor,
      payload,
    });
  }

  // ─── Admin: Get all ──────────────────────────────────────────────────────

  async findAll(status?: string, limit = 50, offset = 0) {
    const query = await this.db.query.inventories.findMany({
      where: status
        ? eq(
          inventories.status,
          status as 'draft' | 'in_progress' | 'submitted' | 'locked',
        )
        : undefined,
      orderBy: (inventories, { desc }) => [desc(inventories.createdAt)],
      limit,
      offset,
    });

    return query;
  }

  // ─── Admin: Summary ──────────────────────────────────────────────────────

  async getSummary(inventoryId: string) {
    const inventory = await this.db.query.inventories.findFirst({
      where: eq(inventories.id, inventoryId),
      with: {
        rooms: {
          with: {
            items: true,
          },
        },
      },
    }).execute();

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    const specialtyItems = inventory.rooms
      .flatMap((r) => r.items)
      .filter((i) => i.isSpecialtyItem);

    const roomSummaries = inventory.rooms.map((room) => ({
      id: room.id,
      type: room.type,
      name: room.customName || room.type,
      itemCount: room.items.reduce((s, i) => s + i.quantity, 0),
      cuFt: room.items.reduce(
        (s, i) => s + parseFloat(String(i.totalCuFt || 0)),
        0,
      ),
      weight: room.items.reduce(
        (s, i) => s + parseFloat(String(i.totalWeight || 0)),
        0,
      ),
      items: room.items,
    }));

    return {
      inventory,
      roomSummaries,
      specialtyItems,
      totals: {
        items: inventory.totalItems,
        cuFt: parseFloat(String(inventory.totalCuFt)),
        weight: parseFloat(String(inventory.totalWeight)),
      },
    };
  }
}
