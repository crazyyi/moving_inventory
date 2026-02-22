import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../../drizzle/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '@moving/constants';
import { InventoryService } from '../inventory/inventory.service';
import { GhlService } from '../ghl/ghl.service';

const { inventories, auditLog } = schema;

/**
 * AdminService handles all admin-specific business logic.
 *
 * Note: inventory locking and GHL pushing are intentionally delegated
 * to InventoryService and GhlService respectively — AdminService owns
 * only what is exclusive to the admin context (auth, internal notes, stats).
 */
@Injectable()
export class AdminService {
  // 1. Database remains a token-based injection
  @Inject(DRIZZLE)
  private readonly db: NodePgDatabase<typeof schema>;

  // 2. Use @Inject for sibling services to bypass constructor timing issues
  @Inject(InventoryService)
  private readonly inventoryService: InventoryService;

  @Inject(GhlService)
  private readonly ghlService: GhlService;

  constructor() { } // Keep constructor empty
  // ─── Auth ─────────────────────────────────────────────────────────────────

  /**
   * Validates the admin API key from request headers.
   * Centralised here so controllers don't repeat the guard logic.
   */
  validateAdminKey(apiKey: string | undefined): void {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected) {
      throw new Error('ADMIN_API_KEY environment variable is not set');
    }
    if (!apiKey || apiKey !== expected) {
      throw new UnauthorizedException('Invalid or missing admin API key');
    }
  }

  // ─── Internal Notes ───────────────────────────────────────────────────────

  async addInternalNote(inventoryId: string, note: string): Promise<void> {
    const inventory = await this.db.query.inventories.findFirst({
      where: eq(inventories.id, inventoryId),
      columns: { internalNotes: true },
    }).execute();

    const existingNotes = inventory?.internalNotes || '';
    const timestamp = new Date().toISOString();
    const newEntry = `[${timestamp}] ${note}`;
    const updated = existingNotes ? `${existingNotes}\n${newEntry}` : newEntry;

    await this.db
      .update(inventories)
      .set({ internalNotes: updated, updatedAt: new Date() })
      .where(eq(inventories.id, inventoryId));
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  async getDashboardStats() {
    const all = await this.db.query.inventories.findMany({
      columns: {
        status: true,
        isLocked: true,
        totalCuFt: true,
        totalWeight: true,
      },
    }).execute();

    return {
      totalInventories: all.length,
      draftCount: all.filter((i) => i.status === 'draft').length,
      submittedCount: all.filter((i) => i.status === 'submitted').length,
      lockedCount: all.filter((i) => i.status === 'locked').length,
      totalCuFt: all.reduce((sum, i) => sum + (parseFloat(i.totalCuFt || '0')), 0),
      totalWeight: all.reduce((sum, i) => sum + (parseFloat(i.totalWeight || '0')), 0),
    };
  }

  async getInventories(status?: string, limit?: number, offset?: number) {
    return this.inventoryService.findAll(status, limit, offset);
  }

  async getInventorySummary(inventoryId: string) {
    // You can add admin-specific logging or extra checks here later
    return await this.inventoryService.getSummary(inventoryId);
  }

  async lockInventory(inventoryId: string) {
    // This maintains the link to your existing inventory logic
    return await this.inventoryService.lock(inventoryId);
  }

  async pushInventoryToGHL(inventoryId: string) {
    // 1. Get the summary (using the logic we just moved)
    const summary = await this.inventoryService.getSummary(inventoryId);

    // 2. Build the payload
    const payload = this.ghlService.buildPayload(summary);

    // 3. Push to GHL
    const result = await this.ghlService.pushToGHL(inventoryId, payload);

    return result;
  }

  // ─── Audit Logs ───────────────────────────────────────────────────────────

  async getAuditLogs(inventoryId: string, limit: number = 20) {
    const logs = await this.db
      .select()
      .from(auditLog)
      .where(eq(auditLog.inventoryId, inventoryId))
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .execute();

    return logs;
  }
}
