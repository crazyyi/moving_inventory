import { z } from 'zod';

/**
 * Zod schemas and TypeScript types for frontend state management
 * These schemas provide runtime validation for API responses
 */

// ─── Enums ────────────────────────────────────────────────────────────────

export const InventoryStatusEnum = z.enum([
  'draft',
  'in_progress',
  'submitted',
  'locked',
]);

export const RoomTypeEnum = z.enum([
  'living_room',
  'master_bedroom',
  'bedroom',
  'kitchen',
  'dining_room',
  'bathroom',
  'garage',
  'office',
  'basement',
  'attic',
  'storage',
  'outdoor',
  'other',
]);

// ─── Room Item Schema ─────────────────────────────────────────────────────

export const RoomItemSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string().uuid(),
  inventoryId: z.string().uuid(),
  itemLibraryId: z.string().nullable().optional(),
  name: z.string(),
  category: z.string(),
  quantity: z.number().int().positive(),
  cuFtPerItem: z.string().or(z.number()).optional(),
  weightPerItem: z.string().or(z.number()).optional(),
  totalCuFt: z.string().or(z.number()).optional(),
  totalWeight: z.string().or(z.number()).optional(),
  isSpecialtyItem: z.boolean().optional(),
  requiresDisassembly: z.boolean().optional(),
  isFragile: z.boolean().optional(),
  isHighValue: z.boolean().optional(),
  images: z.array(z.string()).optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});

export type RoomItem = z.infer<typeof RoomItemSchema>;

// ─── Room Schema ──────────────────────────────────────────────────────────

export const RoomSchema = z.object({
  id: z.string().uuid(),
  inventoryId: z.string().uuid(),
  type: RoomTypeEnum,
  customName: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isComplete: z.boolean().optional(),
  items: z.array(RoomItemSchema).optional(),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});

export type Room = z.infer<typeof RoomSchema>;

// ─── Inventory Schema ─────────────────────────────────────────────────────

export const InventorySchema = z.object({
  id: z.string().uuid(),
  token: z.string(),
  customerName: z.string().nullable().optional(),
  customerEmail: z.string().email().nullable().optional(),
  customerPhone: z.string().nullable().optional(),
  moveDate: z.string().datetime().or(z.date()).nullable().optional(),
  fromAddress: z.string().nullable().optional(),
  toAddress: z.string().nullable().optional(),
  status: InventoryStatusEnum,
  isLocked: z.boolean().optional(),
  lockedAt: z.string().datetime().or(z.date()).nullable().optional(),
  totalItems: z.number().int().nonnegative(),
  totalCuFt: z.string().or(z.number()).optional(),
  totalWeight: z.string().or(z.number()).optional(),
  ghlContactId: z.string().nullable().optional(),
  ghlSubmittedAt: z.string().datetime().or(z.date()).nullable().optional(),
  ghlWebhookPayload: z.unknown().nullable().optional(),
  notes: z.string().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
  submittedAt: z.string().datetime().or(z.date()).nullable().optional(),
  expiresAt: z.string().datetime().or(z.date()).nullable().optional(),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
  rooms: z.array(RoomSchema).optional(),
});

export type Inventory = z.infer<typeof InventorySchema>;

// ─── Room Summary Schema (for API getSummary) ─────────────────────────────

export const RoomSummarySchema = z.object({
  id: z.string().uuid(),
  type: RoomTypeEnum,
  name: z.string(),
  itemCount: z.number().int().nonnegative(),
  cuFt: z.number().nonnegative(),
  weight: z.number().nonnegative(),
  items: z.array(RoomItemSchema),
});

export type RoomSummary = z.infer<typeof RoomSummarySchema>;

// ─── Inventory Summary Response ───────────────────────────────────────────

export const InventorySummaryResponseSchema = z.object({
  inventory: InventorySchema,
  roomSummaries: z.array(RoomSummarySchema),
  specialtyItems: z.array(RoomItemSchema),
  totals: z.object({
    items: z.number().int().nonnegative(),
    cuFt: z.number().nonnegative(),
    weight: z.number().nonnegative(),
  }),
});

export type InventorySummaryResponse = z.infer<
  typeof InventorySummaryResponseSchema
>;

// ─── Item Library Entry Schema ────────────────────────────────────────────

export const ItemLibraryEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  roomTypes: z.array(z.string()).optional(),
  cuFt: z.string().or(z.number()).optional(),
  weight: z.string().or(z.number()).optional(),
  isSpecialtyItem: z.boolean().optional(),
  requiresDisassembly: z.boolean().optional(),
  isFragile: z.boolean().optional(),
  searchKeywords: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.string().datetime().or(z.date()),
});

export type ItemLibraryEntry = z.infer<typeof ItemLibraryEntrySchema>;

// ─── Admin Dashboard Stats ───────────────────────────────────────────────

export const AdminStatsSchema = z.object({
  totalInventories: z.number().int().nonnegative(),
  draftCount: z.number().int().nonnegative(),
  submittedCount: z.number().int().nonnegative(),
  lockedCount: z.number().int().nonnegative(),
  totalCuFt: z.number().nonnegative(),
  totalWeight: z.number().nonnegative(),
});

export type AdminStats = z.infer<typeof AdminStatsSchema>;

// ─── Validation Helpers ──────────────────────────────────────────────────

/**
 * Validate inventory summary response from API
 */
export function validateInventorySummary(
  data: unknown,
): InventorySummaryResponse {
  return InventorySummaryResponseSchema.parse(data);
}

/**
 * Validate inventory data
 */
export function validateInventory(data: unknown): Inventory {
  return InventorySchema.parse(data);
}

/**
 * Validate room data
 */
export function validateRoom(data: unknown): Room {
  return RoomSchema.parse(data);
}

/**
 * Validate item library entries
 */
export function validateItemLibraryEntries(
  data: unknown,
): ItemLibraryEntry[] {
  return z.array(ItemLibraryEntrySchema).parse(data);
}

/**
 * Validate admin stats
 */
export function validateAdminStats(data: unknown): AdminStats {
  return AdminStatsSchema.parse(data);
}
