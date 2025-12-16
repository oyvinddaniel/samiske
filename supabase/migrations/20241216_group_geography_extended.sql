-- Utvid group_places til å støtte språkområder og Sápmi (hele regionen)

-- Fjern eksisterende constraint som krever enten place eller municipality
ALTER TABLE group_places DROP CONSTRAINT IF EXISTS group_places_check;

-- Legg til nye kolonner
ALTER TABLE group_places ADD COLUMN IF NOT EXISTS language_area_id UUID REFERENCES language_areas(id) ON DELETE CASCADE;
ALTER TABLE group_places ADD COLUMN IF NOT EXISTS is_sapmi BOOLEAN DEFAULT FALSE;

-- Legg til ny constraint som tillater en av fire: place, municipality, language_area, eller sapmi
ALTER TABLE group_places ADD CONSTRAINT group_places_geography_check CHECK (
  (place_id IS NOT NULL AND municipality_id IS NULL AND language_area_id IS NULL AND is_sapmi = FALSE) OR
  (place_id IS NULL AND municipality_id IS NOT NULL AND language_area_id IS NULL AND is_sapmi = FALSE) OR
  (place_id IS NULL AND municipality_id IS NULL AND language_area_id IS NOT NULL AND is_sapmi = FALSE) OR
  (place_id IS NULL AND municipality_id IS NULL AND language_area_id IS NULL AND is_sapmi = TRUE)
);

-- Indeks for language_area
CREATE INDEX IF NOT EXISTS idx_group_places_language_area ON group_places(language_area_id) WHERE language_area_id IS NOT NULL;

COMMENT ON COLUMN group_places.language_area_id IS 'Kobling til språkområde (nordsamisk, sørsamisk, etc.)';
COMMENT ON COLUMN group_places.is_sapmi IS 'Om gruppen er koblet til hele Sápmi';
