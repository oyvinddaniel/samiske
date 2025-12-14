-- =====================================================
-- KALENDER MED GEOGRAFISK STRUKTUR
-- Fase 1: Database-utvidelser
-- =====================================================

-- 1. UTVID POSTS-TABELLEN FOR ARRANGEMENTER
-- =====================================================

-- Maks antall deltakere
ALTER TABLE posts ADD COLUMN IF NOT EXISTS max_participants INT;

-- Digitale arrangementer
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_digital BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS meeting_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS meeting_platform TEXT
  CHECK (meeting_platform IS NULL OR meeting_platform IN ('zoom', 'teams', 'meet', 'whereby', 'other'));

-- Språkområde-tilknytning (i tillegg til eksisterende municipality_id/place_id)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS language_area_id UUID REFERENCES language_areas(id) ON DELETE SET NULL;

-- Indeks for språkområde
CREATE INDEX IF NOT EXISTS idx_posts_language_area ON posts(language_area_id);

-- 2. EVENT_SHARES - Deling av arrangementer til andre områder
-- =====================================================

CREATE TABLE IF NOT EXISTS event_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,

  -- Delt til (kun én av disse settes per rad)
  municipality_id UUID REFERENCES municipalities(id) ON DELETE CASCADE,
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  language_area_id UUID REFERENCES language_areas(id) ON DELETE CASCADE,
  country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
  share_to_sapmi BOOLEAN DEFAULT FALSE,

  -- Metadata
  shared_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shared_at TIMESTAMPTZ DEFAULT NOW(),

  -- Sikre at kun én geografisk enhet er satt per rad
  CONSTRAINT event_shares_single_target CHECK (
    (CASE WHEN municipality_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN place_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN language_area_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN country_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN share_to_sapmi THEN 1 ELSE 0 END) = 1
  ),

  -- Unngå duplikater
  UNIQUE(post_id, municipality_id),
  UNIQUE(post_id, place_id),
  UNIQUE(post_id, language_area_id),
  UNIQUE(post_id, country_id)
);

-- Indekser for effektive oppslag
CREATE INDEX IF NOT EXISTS idx_event_shares_post ON event_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_event_shares_municipality ON event_shares(municipality_id) WHERE municipality_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_shares_place ON event_shares(place_id) WHERE place_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_shares_language_area ON event_shares(language_area_id) WHERE language_area_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_shares_country ON event_shares(country_id) WHERE country_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_shares_sapmi ON event_shares(share_to_sapmi) WHERE share_to_sapmi = TRUE;

-- 3. GROUP_EVENT_PERMISSIONS - Hvem kan opprette arrangementer for grupper
-- =====================================================

CREATE TABLE IF NOT EXISTS group_event_permissions (
  group_id UUID PRIMARY KEY REFERENCES groups(id) ON DELETE CASCADE,
  can_create_events TEXT DEFAULT 'admin'
    CHECK (can_create_events IN ('admin', 'members')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- 4. COMMUNITY_EVENT_PERMISSIONS - Hvem kan opprette arrangementer for samfunn
-- =====================================================

CREATE TABLE IF NOT EXISTS community_event_permissions (
  community_id UUID PRIMARY KEY REFERENCES communities(id) ON DELETE CASCADE,
  can_create_events TEXT DEFAULT 'admin'
    CHECK (can_create_events IN ('admin', 'members')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- 5. UTVID POSTS MED OPPRETTET-PÅ-VEGNE-AV
-- =====================================================

-- Hvem arrangementet er opprettet på vegne av
ALTER TABLE posts ADD COLUMN IF NOT EXISTS created_for_group_id UUID REFERENCES groups(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS created_for_community_id UUID REFERENCES communities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_posts_created_for_group ON posts(created_for_group_id) WHERE created_for_group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_created_for_community ON posts(created_for_community_id) WHERE created_for_community_id IS NOT NULL;

-- 6. ROW LEVEL SECURITY
-- =====================================================

-- Event shares: Kan sees av alle, kun arrangør/admin kan opprette/slette
ALTER TABLE event_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event shares are viewable by everyone"
  ON event_shares FOR SELECT
  USING (true);

CREATE POLICY "Event owner can share"
  ON event_shares FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_id
      AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Event owner can unshare"
  ON event_shares FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_id
      AND posts.user_id = auth.uid()
    )
    OR shared_by = auth.uid()
  );

-- Group event permissions: Kun gruppeadmin kan endre
ALTER TABLE group_event_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group event permissions viewable by members"
  ON group_event_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_event_permissions.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Only group owner can modify permissions"
  ON group_event_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_event_permissions.group_id
      AND groups.created_by = auth.uid()
    )
  );

-- Community event permissions: Kun samfunnsadmin kan endre
ALTER TABLE community_event_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community event permissions viewable by followers"
  ON community_event_permissions FOR SELECT
  USING (true);

CREATE POLICY "Only community owner can modify permissions"
  ON community_event_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_event_permissions.community_id
      AND communities.created_by = auth.uid()
    )
  );

-- 7. TRIGGER FOR DEFAULT PERMISSIONS
-- =====================================================

-- Opprett default permissions når gruppe opprettes
CREATE OR REPLACE FUNCTION create_default_group_event_permissions()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO group_event_permissions (group_id, can_create_events)
  VALUES (NEW.id, 'admin')
  ON CONFLICT (group_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_group_event_permissions ON groups;
CREATE TRIGGER trigger_create_group_event_permissions
  AFTER INSERT ON groups
  FOR EACH ROW
  EXECUTE FUNCTION create_default_group_event_permissions();

-- Opprett default permissions når samfunn opprettes
CREATE OR REPLACE FUNCTION create_default_community_event_permissions()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO community_event_permissions (community_id, can_create_events)
  VALUES (NEW.id, 'admin')
  ON CONFLICT (community_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_community_event_permissions ON communities;
CREATE TRIGGER trigger_create_community_event_permissions
  AFTER INSERT ON communities
  FOR EACH ROW
  EXECUTE FUNCTION create_default_community_event_permissions();

-- 8. BACKFILL PERMISSIONS FOR EKSISTERENDE GRUPPER/SAMFUNN
-- =====================================================

INSERT INTO group_event_permissions (group_id, can_create_events)
SELECT id, 'admin' FROM groups
ON CONFLICT (group_id) DO NOTHING;

INSERT INTO community_event_permissions (community_id, can_create_events)
SELECT id, 'admin' FROM communities
ON CONFLICT (community_id) DO NOTHING;

-- 9. GRANTS
-- =====================================================

GRANT SELECT ON event_shares TO anon;
GRANT SELECT, INSERT, DELETE ON event_shares TO authenticated;

GRANT SELECT ON group_event_permissions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON group_event_permissions TO authenticated;

GRANT SELECT ON community_event_permissions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON community_event_permissions TO authenticated;
