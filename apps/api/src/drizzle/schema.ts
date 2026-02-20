import {
  pgTable,
  pgEnum,
  text,
  index,
  uuid,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
  decimal,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const roomTypeEnum = pgEnum('room_type', [
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

export const inventoryStatusEnum = pgEnum("inventory_status", [
  "draft",
  "in_progress",
  "submitted",
  "locked",
]);

// ─── Inventories ──────────────────────────────────────────────────────────────

export const inventories = pgTable(
  'inventories',
  {
    // Switch back to the object style BUT check your Drizzle version imports
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    token: varchar('token', { length: 64 }).notNull().unique(),

    customerName: varchar('customer_name', { length: 255 }),
    customerEmail: varchar('customer_email', { length: 255 }),
    customerPhone: varchar('customer_phone', { length: 50 }),
    moveDate: timestamp('move_date'),
    fromAddress: text('from_address'),
    toAddress: text('to_address'),

    status: inventoryStatusEnum('status').notNull().default('draft'),
    isLocked: boolean('is_locked').notNull().default(false),
    lockedAt: timestamp('locked_at'),

    totalItems: integer('total_items').notNull().default(0),
    totalCuFt: decimal('total_cu_ft', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    totalWeight: decimal('total_weight', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),

    ghlContactId: varchar('ghl_contact_id', { length: 255 }),
    ghlSubmittedAt: timestamp('ghl_submitted_at'),
    ghlWebhookPayload: jsonb('ghl_webhook_payload'),

    notes: text('notes'),
    internalNotes: text('internal_notes'),
    submittedAt: timestamp('submitted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at'),
  },
  (table) => [
    // <--- USE AN ARRAY [] INSTEAD OF AN OBJECT {}
    index('inventories_token_idx').on(table.token),
    index('inventories_status_idx').on(table.status),
    index('inventories_created_at_idx').on(table.createdAt),
  ],
);

// ─── Rooms ────────────────────────────────────────────────────────────────────

export const rooms = pgTable(
  'rooms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    inventoryId: uuid('inventory_id')
      .notNull()
      .references(() => inventories.id, { onDelete: 'cascade' }),
    type: roomTypeEnum('type').notNull(),
    customName: varchar('custom_name', { length: 255 }),
    sortOrder: integer('sort_order').notNull().default(0),
    isComplete: boolean('is_complete').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    // ✅ Switching to Array syntax removes the deprecation warning
    index('rooms_inventory_id_idx').on(table.inventoryId),
  ],
);

// ─── Room Items ───────────────────────────────────────────────────────────────

export const roomItems = pgTable(
  'room_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roomId: uuid('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    inventoryId: uuid('inventory_id')
      .notNull()
      .references(() => inventories.id, { onDelete: 'cascade' }),

    // Item reference
    itemLibraryId: varchar('item_library_id', { length: 100 }),
    name: varchar('name', { length: 255 }).notNull(),
    category: varchar('category', { length: 100 }),

    // Quantity & measurements
    quantity: integer('quantity').notNull().default(1),
    cuFtPerItem: decimal('cu_ft_per_item', { precision: 8, scale: 2 }).default(
      '0',
    ),
    weightPerItem: decimal('weight_per_item', {
      precision: 8,
      scale: 2,
    }).default('0'),
    totalCuFt: decimal('total_cu_ft', { precision: 10, scale: 2 }).default('0'),
    totalWeight: decimal('total_weight', { precision: 10, scale: 2 }).default(
      '0',
    ),

    // Flags
    isSpecialtyItem: boolean('is_specialty_item').notNull().default(false),
    requiresDisassembly: boolean('requires_disassembly')
      .notNull()
      .default(false),
    isFragile: boolean('is_fragile').notNull().default(false),
    isHighValue: boolean('is_high_value').notNull().default(false),

    // Images
    images: jsonb('images').$type<string[]>().default([]),

    // Notes
    notes: text('notes'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    // ✅ Use the array [] return to avoid deprecation warnings
    index('room_items_room_id_idx').on(table.roomId),
    index('room_items_inventory_id_idx').on(table.inventoryId),
  ],
);

// ─── Item Library (seeded, not user-created) ──────────────────────────────────

export const itemLibrary = pgTable(
  'item_library',
  {
    id: varchar('id', { length: 100 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    roomTypes: jsonb('room_types').$type<string[]>().default([]),
    cuFt: decimal('cu_ft', { precision: 8, scale: 2 }).notNull().default('0'),
    weight: decimal('weight', { precision: 8, scale: 2 })
      .notNull()
      .default('0'),
    isSpecialtyItem: boolean('is_specialty_item').notNull().default(false),
    requiresDisassembly: boolean('requires_disassembly')
      .notNull()
      .default(false),
    isFragile: boolean('is_fragile').notNull().default(false),
    searchKeywords: text('search_keywords'),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('item_library_category_idx').on(table.category),
    index('item_library_name_idx').on(table.name),
  ],
);

// ─── Audit Log ────────────────────────────────────────────────────────────────

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    inventoryId: uuid('inventory_id').references(() => inventories.id, {
      onDelete: 'set null',
    }),
    action: varchar('action', { length: 100 }).notNull(),
    actor: varchar('actor', { length: 100 }).default('customer'),
    payload: jsonb('payload'),
    ipAddress: varchar('ip_address', { length: 50 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('audit_log_inventory_id_idx').on(table.inventoryId),
    index('audit_log_created_at_idx').on(table.createdAt),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const inventoriesRelations = relations(inventories, ({ many }) => ({
  rooms: many(rooms),
  roomItems: many(roomItems),
  auditLogs: many(auditLog),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  inventory: one(inventories, {
    fields: [rooms.inventoryId],
    references: [inventories.id],
  }),
  items: many(roomItems),
}));

export const roomItemsRelations = relations(roomItems, ({ one }) => ({
  room: one(rooms, {
    fields: [roomItems.roomId],
    references: [rooms.id],
  }),
  inventory: one(inventories, {
    fields: [roomItems.inventoryId],
    references: [inventories.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  inventory: one(inventories, {
    fields: [auditLog.inventoryId],
    references: [inventories.id],
  }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type Inventory = typeof inventories.$inferSelect;
export type NewInventory = typeof inventories.$inferInsert;
export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type RoomItem = typeof roomItems.$inferSelect;
export type NewRoomItem = typeof roomItems.$inferInsert;
export type ItemLibraryEntry = typeof itemLibrary.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;
