-- Enkel changelog/logg-tabell
-- Kun admin kan opprette og slette oppføringer

CREATE TABLE IF NOT EXISTS changelog_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index for sortering
CREATE INDEX idx_changelog_entries_created_at ON changelog_entries(created_at DESC);

-- Enable RLS
ALTER TABLE changelog_entries ENABLE ROW LEVEL SECURITY;

-- Alle kan lese
CREATE POLICY "Alle kan lese changelog"
  ON changelog_entries FOR SELECT
  USING (true);

-- Kun admin kan opprette
CREATE POLICY "Kun admin kan opprette changelog"
  ON changelog_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Kun admin kan slette
CREATE POLICY "Kun admin kan slette changelog"
  ON changelog_entries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
