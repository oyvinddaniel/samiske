-- Geography Details: Description and Images
-- Add description fields and image support for geography entities

-- Add description to language_areas
ALTER TABLE language_areas ADD COLUMN IF NOT EXISTS description TEXT;

-- Add description to municipalities
ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS description TEXT;

-- Add description to places
ALTER TABLE places ADD COLUMN IF NOT EXISTS description TEXT;

-- Geography images table
CREATE TABLE IF NOT EXISTS geography_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Which entity this image belongs to (only one should be set)
  language_area_id UUID REFERENCES language_areas(id) ON DELETE CASCADE,
  municipality_id UUID REFERENCES municipalities(id) ON DELETE CASCADE,
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,

  -- Image details
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,

  -- Who uploaded
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure only one entity reference is set
  CONSTRAINT geography_images_single_entity CHECK (
    (language_area_id IS NOT NULL)::int +
    (municipality_id IS NOT NULL)::int +
    (place_id IS NOT NULL)::int = 1
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_geography_images_language_area ON geography_images(language_area_id) WHERE language_area_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_geography_images_municipality ON geography_images(municipality_id) WHERE municipality_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_geography_images_place ON geography_images(place_id) WHERE place_id IS NOT NULL;

-- RLS for geography_images
ALTER TABLE geography_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view geography images"
  ON geography_images FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can upload geography images"
  ON geography_images FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Uploaders and admins can update geography images"
  ON geography_images FOR UPDATE
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Uploaders and admins can delete geography images"
  ON geography_images FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Description suggestions are handled by geography_suggestions table
-- suggestion_type can be 'edit_description' in addition to existing types

-- Update the check constraint on geography_suggestions to include description edits
ALTER TABLE geography_suggestions DROP CONSTRAINT IF EXISTS geography_suggestions_suggestion_type_check;
ALTER TABLE geography_suggestions ADD CONSTRAINT geography_suggestions_suggestion_type_check
  CHECK (suggestion_type IN ('new_item', 'edit_name', 'edit_relationship', 'edit_description'));
