CREATE TYPE "public"."inventory_status" AS ENUM('draft', 'in_progress', 'submitted', 'locked');--> statement-breakpoint
CREATE TYPE "public"."room_type" AS ENUM('living_room', 'master_bedroom', 'bedroom', 'kitchen', 'dining_room', 'bathroom', 'garage', 'office', 'basement', 'attic', 'storage', 'outdoor', 'other');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventory_id" uuid,
	"action" varchar(100) NOT NULL,
	"actor" varchar(100) DEFAULT 'customer',
	"payload" jsonb,
	"ip_address" varchar(50),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar(64) NOT NULL,
	"customer_name" varchar(255),
	"customer_email" varchar(255),
	"customer_phone" varchar(50),
	"move_date" timestamp,
	"from_address" text,
	"to_address" text,
	"status" "inventory_status" DEFAULT 'draft' NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"locked_at" timestamp,
	"total_items" integer DEFAULT 0 NOT NULL,
	"total_cu_ft" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_weight" numeric(10, 2) DEFAULT '0' NOT NULL,
	"ghl_contact_id" varchar(255),
	"ghl_submitted_at" timestamp,
	"ghl_webhook_payload" jsonb,
	"notes" text,
	"internal_notes" text,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	CONSTRAINT "inventories_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "item_library" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"room_types" jsonb DEFAULT '[]'::jsonb,
	"cu_ft" numeric(8, 2) DEFAULT '0' NOT NULL,
	"weight" numeric(8, 2) DEFAULT '0' NOT NULL,
	"is_specialty_item" boolean DEFAULT false NOT NULL,
	"requires_disassembly" boolean DEFAULT false NOT NULL,
	"is_fragile" boolean DEFAULT false NOT NULL,
	"search_keywords" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"inventory_id" uuid NOT NULL,
	"item_library_id" varchar(100),
	"name" varchar(255) NOT NULL,
	"category" varchar(100),
	"quantity" integer DEFAULT 1 NOT NULL,
	"cu_ft_per_item" numeric(8, 2) DEFAULT '0',
	"weight_per_item" numeric(8, 2) DEFAULT '0',
	"total_cu_ft" numeric(10, 2) DEFAULT '0',
	"total_weight" numeric(10, 2) DEFAULT '0',
	"is_specialty_item" boolean DEFAULT false NOT NULL,
	"requires_disassembly" boolean DEFAULT false NOT NULL,
	"is_fragile" boolean DEFAULT false NOT NULL,
	"is_high_value" boolean DEFAULT false NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventory_id" uuid NOT NULL,
	"type" "room_type" NOT NULL,
	"custom_name" varchar(255),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_complete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_inventory_id_inventories_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_items" ADD CONSTRAINT "room_items_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_items" ADD CONSTRAINT "room_items_inventory_id_inventories_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_inventory_id_inventories_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_inventory_id_idx" ON "audit_log" USING btree ("inventory_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "inventories_token_idx" ON "inventories" USING btree ("token");--> statement-breakpoint
CREATE INDEX "inventories_status_idx" ON "inventories" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inventories_created_at_idx" ON "inventories" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "item_library_category_idx" ON "item_library" USING btree ("category");--> statement-breakpoint
CREATE INDEX "item_library_name_idx" ON "item_library" USING btree ("name");--> statement-breakpoint
CREATE INDEX "room_items_room_id_idx" ON "room_items" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "room_items_inventory_id_idx" ON "room_items" USING btree ("inventory_id");--> statement-breakpoint
CREATE INDEX "rooms_inventory_id_idx" ON "rooms" USING btree ("inventory_id");