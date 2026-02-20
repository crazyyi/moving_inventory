import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as schema from '../../drizzle/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '@moving/constants';

const { inventories } = schema;

/**
 * AdminService handles all admin-specific business logic.
 *
 * Note: inventory locking and GHL pushing are intentionally delegated
 * to InventoryService and GhlService respectively — AdminService owns
 * only what is exclusive to the admin context (auth, internal notes, stats).
 */
@Injectable()
export class AdminService {
  constructor(
    // Inject the DB instance using the token you defined
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
  ) { }
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
        totalItems: true,
        ghlSubmittedAt: true,
      },
    }).execute();

    return {
      total: all.length,
      byStatus: {
        draft: all.filter((i) => i.status === 'draft').length,
        in_progress: all.filter((i) => i.status === 'in_progress').length,
        submitted: all.filter((i) => i.status === 'submitted').length,
        locked: all.filter((i) => i.status === 'locked').length,
      },
      ghlPushed: all.filter((i) => i.ghlSubmittedAt !== null).length,
      totalItemsTracked: all.reduce((sum, i) => sum + (i.totalItems ?? 0), 0),
    };
  }
}
