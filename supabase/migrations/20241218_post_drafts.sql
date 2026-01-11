-- Migration: Post Drafts - Auto-lagring av utkast
-- Dato: 2025-12-18
-- Beskrivelse: Lagrer utkast til innlegg med auto-save

-- ============================================
-- 1. Opprett post_drafts tabell
-- ============================================

CREATE TABLE IF NOT EXISTS post_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Innhold
  title TEXT,
  content TEXT,

  -- Type og synlighet
  post_type TEXT DEFAULT 'standard' CHECK (post_type IN ('standard', 'event')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'members', 'circles')),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

  -- Event-spesifikk data
  event_date DATE,
  event_time TIME,
  event_end_time TIME,
  event_location TEXT,

  -- Geografi
  language_area_id UUID REFERENCES language_areas(id) ON DELETE SET NULL,
  municipality_id UUID REFERENCES municipalities(id) ON DELETE SET NULL,
  place_id UUID REFERENCES places(id) ON DELETE SET NULL,

  -- Kontekst
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,

  -- Media (lagret som JSON for fleksibilitet)
  media JSONB DEFAULT '[]'::jsonb,

  -- Circles for visibility
  selected_circles UUID[] DEFAULT '{}',

  -- Metadata
  last_saved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Indekser
CREATE INDEX IF NOT EXISTS idx_post_drafts_user ON post_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_post_drafts_last_saved ON post_drafts(last_saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_drafts_expires ON post_drafts(expires_at);

-- ============================================
-- 2. RLS Policies
-- ============================================

ALTER TABLE post_drafts ENABLE ROW LEVEL SECURITY;

-- Brukere kan kun se sine egne utkast
CREATE POLICY "post_drafts_select" ON post_drafts
FOR SELECT USING (auth.uid() = user_id);

-- Brukere kan opprette egne utkast
CREATE POLICY "post_drafts_insert" ON post_drafts
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Brukere kan oppdatere egne utkast
CREATE POLICY "post_drafts_update" ON post_drafts
FOR UPDATE USING (auth.uid() = user_id);

-- Brukere kan slette egne utkast
CREATE POLICY "post_drafts_delete" ON post_drafts
FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 3. Funksjon: Lagre eller oppdater utkast
-- ============================================

CREATE OR REPLACE FUNCTION save_post_draft(
  p_draft_id UUID DEFAULT NULL,
  p_title TEXT DEFAULT NULL,
  p_content TEXT DEFAULT NULL,
  p_post_type TEXT DEFAULT 'standard',
  p_visibility TEXT DEFAULT 'public',
  p_category_id UUID DEFAULT NULL,
  p_event_date DATE DEFAULT NULL,
  p_event_time TIME DEFAULT NULL,
  p_event_end_time TIME DEFAULT NULL,
  p_event_location TEXT DEFAULT NULL,
  p_language_area_id UUID DEFAULT NULL,
  p_municipality_id UUID DEFAULT NULL,
  p_place_id UUID DEFAULT NULL,
  p_group_id UUID DEFAULT NULL,
  p_community_id UUID DEFAULT NULL,
  p_media JSONB DEFAULT '[]'::jsonb,
  p_selected_circles UUID[] DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_draft_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Ikke autentisert';
  END IF;

  IF p_draft_id IS NOT NULL THEN
    -- Oppdater eksisterende utkast
    UPDATE post_drafts SET
      title = COALESCE(p_title, title),
      content = COALESCE(p_content, content),
      post_type = p_post_type,
      visibility = p_visibility,
      category_id = p_category_id,
      event_date = p_event_date,
      event_time = p_event_time,
      event_end_time = p_event_end_time,
      event_location = p_event_location,
      language_area_id = p_language_area_id,
      municipality_id = p_municipality_id,
      place_id = p_place_id,
      group_id = p_group_id,
      community_id = p_community_id,
      media = p_media,
      selected_circles = p_selected_circles,
      last_saved_at = NOW(),
      expires_at = NOW() + INTERVAL '30 days'
    WHERE id = p_draft_id AND user_id = v_user_id
    RETURNING id INTO v_draft_id;

    IF v_draft_id IS NULL THEN
      RAISE EXCEPTION 'Utkast ikke funnet eller ingen tilgang';
    END IF;
  ELSE
    -- Opprett nytt utkast
    INSERT INTO post_drafts (
      user_id,
      title,
      content,
      post_type,
      visibility,
      category_id,
      event_date,
      event_time,
      event_end_time,
      event_location,
      language_area_id,
      municipality_id,
      place_id,
      group_id,
      community_id,
      media,
      selected_circles
    ) VALUES (
      v_user_id,
      p_title,
      p_content,
      p_post_type,
      p_visibility,
      p_category_id,
      p_event_date,
      p_event_time,
      p_event_end_time,
      p_event_location,
      p_language_area_id,
      p_municipality_id,
      p_place_id,
      p_group_id,
      p_community_id,
      p_media,
      p_selected_circles
    )
    RETURNING id INTO v_draft_id;
  END IF;

  RETURN v_draft_id;
END;
$$;

-- ============================================
-- 4. Funksjon: Hent brukerens utkast
-- ============================================

CREATE OR REPLACE FUNCTION get_user_drafts(
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  post_type TEXT,
  visibility TEXT,
  category_id UUID,
  event_date DATE,
  event_time TIME,
  event_end_time TIME,
  event_location TEXT,
  language_area_id UUID,
  municipality_id UUID,
  place_id UUID,
  group_id UUID,
  community_id UUID,
  media JSONB,
  selected_circles UUID[],
  last_saved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    d.id,
    d.title,
    d.content,
    d.post_type,
    d.visibility,
    d.category_id,
    d.event_date,
    d.event_time,
    d.event_end_time,
    d.event_location,
    d.language_area_id,
    d.municipality_id,
    d.place_id,
    d.group_id,
    d.community_id,
    d.media,
    d.selected_circles,
    d.last_saved_at,
    d.created_at
  FROM post_drafts d
  WHERE d.user_id = auth.uid()
    AND d.expires_at > NOW()
  ORDER BY d.last_saved_at DESC
  LIMIT p_limit;
$$;

-- ============================================
-- 5. Funksjon: Slett utgåtte utkast (kjøres periodisk)
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_expired_drafts()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM post_drafts
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ============================================
-- 6. App settings for drafts
-- ============================================

INSERT INTO app_settings (key, value)
VALUES (
  'draft_settings',
  '{"auto_save_interval_ms": 3000, "max_drafts_per_user": 10, "expiry_days": 30}'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = '{"auto_save_interval_ms": 3000, "max_drafts_per_user": 10, "expiry_days": 30}'::jsonb;

-- ============================================
-- NOTATER:
-- - Utkast utløper etter 30 dager
-- - Auto-save hvert 3. sekund (konfigurerbart)
-- - Maks 10 utkast per bruker
-- - Media lagres som JSON for fleksibilitet
-- - cleanup_expired_drafts() bør kjøres daglig via cron
-- ============================================
