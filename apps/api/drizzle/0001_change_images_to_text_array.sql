-- Migration: Change images column from JSONB to text[]
-- Convert existing JSONB array of strings to text[] array

-- Step 1: Create new column with text[] type
ALTER TABLE "room_items" ADD COLUMN "images_new" text[] DEFAULT '{}';

-- Step 2: Migrate data from JSONB to text[]
-- For existing JSONB arrays, convert them to text arrays
UPDATE "room_items" 
SET "images_new" = CASE 
  WHEN images IS NULL OR images = 'null'::jsonb THEN '{}'::text[]
  ELSE array(SELECT jsonb_array_elements_text(images))
END;

-- Step 3: Drop the old column
ALTER TABLE "room_items" DROP COLUMN "images";

-- Step 4: Rename the new column to original name
ALTER TABLE "room_items" RENAME COLUMN "images_new" TO "images";
