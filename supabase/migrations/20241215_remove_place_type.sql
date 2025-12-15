-- Remove place_type column from places table
-- This migration removes the place_type column as it's no longer needed

-- Drop the index on place_type
DROP INDEX IF EXISTS idx_places_type;

-- Remove the column
ALTER TABLE places DROP COLUMN IF EXISTS place_type;
