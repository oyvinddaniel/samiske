-- Geography Suggestions System
-- Allows users to suggest changes/additions to geography data
-- Admin must approve before changes take effect

-- Junction table: Municipalities can belong to multiple language areas
CREATE TABLE IF NOT EXISTS municipality_language_areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  municipality_id UUID NOT NULL REFERENCES municipalities(id) ON DELETE CASCADE,
  language_area_id UUID NOT NULL REFERENCES language_areas(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(municipality_id, language_area_id)
);

-- Junction table: Places can belong to multiple language areas
CREATE TABLE IF NOT EXISTS place_language_areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  language_area_id UUID NOT NULL REFERENCES language_areas(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(place_id, language_area_id)
);

-- Geography suggestions table
CREATE TABLE IF NOT EXISTS geography_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- What type of suggestion
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('new_item', 'edit_name', 'edit_relationship')),

  -- What entity type this affects
  entity_type TEXT NOT NULL CHECK (entity_type IN ('language_area', 'municipality', 'place')),

  -- If editing existing item, which one (null for new items)
  entity_id UUID,

  -- The suggested data as JSON
  -- For new_item: { name, name_sami, slug, parent_id, language_area_ids, ... }
  -- For edit_name: { name, name_sami }
  -- For edit_relationship: { parent_id, language_area_ids }
  suggested_data JSONB NOT NULL,

  -- Current data for reference (null for new items)
  current_data JSONB,

  -- Reason/description from user
  reason TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Admin review
  admin_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES profiles(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_municipality_language_areas_municipality
  ON municipality_language_areas(municipality_id);
CREATE INDEX IF NOT EXISTS idx_municipality_language_areas_language_area
  ON municipality_language_areas(language_area_id);
CREATE INDEX IF NOT EXISTS idx_place_language_areas_place
  ON place_language_areas(place_id);
CREATE INDEX IF NOT EXISTS idx_place_language_areas_language_area
  ON place_language_areas(language_area_id);
CREATE INDEX IF NOT EXISTS idx_geography_suggestions_status
  ON geography_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_geography_suggestions_user
  ON geography_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_geography_suggestions_entity
  ON geography_suggestions(entity_type, entity_id);

-- RLS Policies

-- municipality_language_areas: Everyone can read, only admins can modify
ALTER TABLE municipality_language_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view municipality language areas"
  ON municipality_language_areas FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage municipality language areas"
  ON municipality_language_areas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- place_language_areas: Everyone can read, only admins can modify
ALTER TABLE place_language_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view place language areas"
  ON place_language_areas FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage place language areas"
  ON place_language_areas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- geography_suggestions: Users can create and view own, admins can do all
ALTER TABLE geography_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create suggestions"
  ON geography_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own suggestions"
  ON geography_suggestions FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update suggestions"
  ON geography_suggestions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete suggestions"
  ON geography_suggestions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Migrate existing language_area_id data to junction tables
-- For municipalities
INSERT INTO municipality_language_areas (municipality_id, language_area_id, is_primary)
SELECT id, language_area_id, true
FROM municipalities
WHERE language_area_id IS NOT NULL
ON CONFLICT (municipality_id, language_area_id) DO NOTHING;

-- Note: places don't have language_area_id directly, they inherit from municipality
-- But we can add direct links if needed
