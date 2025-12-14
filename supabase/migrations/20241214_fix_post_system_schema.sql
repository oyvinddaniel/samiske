-- =====================================================
-- FIKSE INNLEGGSSYSTEM: SCHEMA-ENDRINGER
-- =====================================================
-- Oppretter nye tabeller for å fikse innleggssystemet:
-- 1. group_places: Stedstilknytning for grupper (1-til-1, kun åpne)
-- 2. community_places: Stedstilknytninger for samfunn (many-to-many)
-- 3. community_post_locations: Valgt sted for samfunns-innlegg

BEGIN;

-- =====================================================
-- 1. GRUPPE-STEDER: Many-to-many for åpne grupper
-- =====================================================
-- Åpne grupper kan tilknyttes ETT sted (valgfritt)
-- Lukkede/skjulte grupper kan IKKE tilknyttes steder

CREATE TABLE IF NOT EXISTS group_places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  municipality_id UUID REFERENCES municipalities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Kun én av place_id eller municipality_id kan være satt
  CHECK (
    (place_id IS NOT NULL AND municipality_id IS NULL) OR
    (place_id IS NULL AND municipality_id IS NOT NULL)
  ),

  -- Kun én stedstilknytning per gruppe
  UNIQUE(group_id)
);

CREATE INDEX idx_group_places_group ON group_places(group_id);
CREATE INDEX idx_group_places_place ON group_places(place_id) WHERE place_id IS NOT NULL;
CREATE INDEX idx_group_places_municipality ON group_places(municipality_id) WHERE municipality_id IS NOT NULL;

-- RLS
ALTER TABLE group_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view group place associations" ON group_places
  FOR SELECT USING (TRUE);

CREATE POLICY "Group admins can manage place associations" ON group_places
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_places.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
      AND group_members.status = 'approved'
    )
  );

COMMENT ON TABLE group_places IS
  'Stedstilknytning for grupper. Kun åpne grupper kan tilknyttes steder. Kun ett sted per gruppe.';

-- =====================================================
-- 2. SAMFUNNS-STEDER: Many-to-many
-- =====================================================
-- Samfunn kan ha FLERE steder (eller ingen)

CREATE TABLE IF NOT EXISTS community_places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  municipality_id UUID REFERENCES municipalities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Kun én av place_id eller municipality_id kan være satt
  CHECK (
    (place_id IS NOT NULL AND municipality_id IS NULL) OR
    (place_id IS NULL AND municipality_id IS NOT NULL)
  )
);

-- Unikt par: Samfunn kan ikke ha samme sted to ganger
CREATE UNIQUE INDEX idx_community_places_unique_place
  ON community_places(community_id, place_id)
  WHERE place_id IS NOT NULL;

CREATE UNIQUE INDEX idx_community_places_unique_municipality
  ON community_places(community_id, municipality_id)
  WHERE municipality_id IS NOT NULL;

CREATE INDEX idx_community_places_community ON community_places(community_id);
CREATE INDEX idx_community_places_place ON community_places(place_id) WHERE place_id IS NOT NULL;
CREATE INDEX idx_community_places_municipality ON community_places(municipality_id) WHERE municipality_id IS NOT NULL;

-- RLS
ALTER TABLE community_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view community place associations" ON community_places
  FOR SELECT USING (TRUE);

CREATE POLICY "Community admins can manage place associations" ON community_places
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM community_admins
      WHERE community_admins.community_id = community_places.community_id
      AND community_admins.user_id = auth.uid()
    )
  );

COMMENT ON TABLE community_places IS
  'Stedstilknytninger for samfunn. Et samfunn kan ha flere steder (many-to-many).';

-- =====================================================
-- 3. COMMUNITY_POST_LOCATIONS: Hvilket sted ble innlegget publisert til?
-- =====================================================
-- Når samfunns-admin poster, velger de hvilket sted innlegget skal publiseres til

CREATE TABLE IF NOT EXISTS community_post_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  municipality_id UUID REFERENCES municipalities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Kun én av place_id eller municipality_id kan være satt
  CHECK (
    (place_id IS NOT NULL AND municipality_id IS NULL) OR
    (place_id IS NULL AND municipality_id IS NOT NULL)
  ),

  -- Ett sted per innlegg
  UNIQUE(post_id)
);

CREATE INDEX idx_community_post_locations_post ON community_post_locations(post_id);
CREATE INDEX idx_community_post_locations_community ON community_post_locations(community_id);
CREATE INDEX idx_community_post_locations_place ON community_post_locations(place_id) WHERE place_id IS NOT NULL;
CREATE INDEX idx_community_post_locations_municipality ON community_post_locations(municipality_id) WHERE municipality_id IS NOT NULL;

-- RLS
ALTER TABLE community_post_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view post locations" ON community_post_locations
  FOR SELECT USING (TRUE);

CREATE POLICY "Community admins can set post locations" ON community_post_locations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_admins
      WHERE community_admins.community_id = community_post_locations.community_id
      AND community_admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Community admins can update post locations" ON community_post_locations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM community_admins
      WHERE community_admins.community_id = community_post_locations.community_id
      AND community_admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Community admins can delete post locations" ON community_post_locations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM community_admins
      WHERE community_admins.community_id = community_post_locations.community_id
      AND community_admins.user_id = auth.uid()
    )
  );

COMMENT ON TABLE community_post_locations IS
  'Når samfunns-admin poster, lagres hvilket sted innlegget ble publisert til.';

-- =====================================================
-- 4. MIGRER EKSISTERENDE DATA
-- =====================================================

-- Migrer gruppe-steder fra groups.municipality_id/place_id til group_places
-- KUN for åpne grupper
DO $$
DECLARE
  migrated_count INT := 0;
BEGIN
  -- Sjekk om groups-tabellen har municipality_id/place_id kolonner
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'groups'
    AND column_name IN ('municipality_id', 'place_id')
  ) THEN
    -- Migrer kun for åpne grupper med stedstilknytning
    INSERT INTO group_places (group_id, municipality_id, place_id)
    SELECT
      id,
      municipality_id,
      place_id
    FROM groups
    WHERE group_type = 'open'
    AND (municipality_id IS NOT NULL OR place_id IS NOT NULL)
    ON CONFLICT (group_id) DO NOTHING;

    GET DIAGNOSTICS migrated_count = ROW_COUNT;
    RAISE NOTICE 'Migrerte % gruppe-steder fra groups til group_places', migrated_count;
  ELSE
    RAISE NOTICE 'Kolonner municipality_id/place_id finnes ikke i groups-tabellen, hopper over migrering';
  END IF;
END $$;

-- Migrer samfunns-steder fra communities.municipality_id/place_id til community_places
DO $$
DECLARE
  migrated_count INT := 0;
BEGIN
  -- Sjekk om communities-tabellen har municipality_id/place_id kolonner
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'communities'
    AND column_name IN ('municipality_id', 'place_id')
  ) THEN
    INSERT INTO community_places (community_id, municipality_id, place_id)
    SELECT
      id,
      municipality_id,
      place_id
    FROM communities
    WHERE municipality_id IS NOT NULL OR place_id IS NOT NULL
    ON CONFLICT DO NOTHING;

    GET DIAGNOSTICS migrated_count = ROW_COUNT;
    RAISE NOTICE 'Migrerte % samfunns-steder fra communities til community_places', migrated_count;
  ELSE
    RAISE NOTICE 'Kolonner municipality_id/place_id finnes ikke i communities-tabellen, hopper over migrering';
  END IF;
END $$;

COMMIT;

-- Rapport om migrering
DO $$
DECLARE
  group_places_count INT;
  community_places_count INT;
BEGIN
  SELECT COUNT(*) INTO group_places_count FROM group_places;
  SELECT COUNT(*) INTO community_places_count FROM community_places;

  RAISE NOTICE '=== MIGRERING FULLFØRT ===';
  RAISE NOTICE 'Totalt group_places: %', group_places_count;
  RAISE NOTICE 'Totalt community_places: %', community_places_count;
END $$;
