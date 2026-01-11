-- Migration: Scheduled Posts - Planlagte innlegg
-- Dato: 2025-12-18
-- Beskrivelse: Støtte for å planlegge innlegg til fremtidig publisering

-- ============================================
-- 1. Legg til scheduled_for kolonne på posts
-- ============================================

-- Kolonne for planlagt publiseringstidspunkt
ALTER TABLE posts ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;

-- Status for planlagte innlegg
ALTER TABLE posts ADD COLUMN IF NOT EXISTS publish_status TEXT DEFAULT 'published'
  CHECK (publish_status IN ('published', 'scheduled', 'failed'));

-- Indeks for å finne innlegg som skal publiseres
CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON posts(scheduled_for)
  WHERE scheduled_for IS NOT NULL AND publish_status = 'scheduled';

-- ============================================
-- 2. RLS - Oppdater eksisterende policies
-- ============================================

-- Planlagte innlegg skal kun vises til eieren
-- (eksisterende SELECT policy bør allerede håndtere dette via publish_status)

-- ============================================
-- 3. Funksjon: Opprett planlagt innlegg
-- ============================================

CREATE OR REPLACE FUNCTION create_scheduled_post(
  p_user_id UUID,
  p_title TEXT,
  p_content TEXT,
  p_scheduled_for TIMESTAMPTZ,
  p_type TEXT DEFAULT 'standard',
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
  p_image_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_post_id UUID;
  v_max_days INT;
BEGIN
  -- Hent maks dager fra innstillinger (default 60)
  SELECT COALESCE((value->>'max_schedule_days')::INT, 60) INTO v_max_days
  FROM app_settings
  WHERE key = 'post_settings';

  -- Valider at scheduled_for er i fremtiden
  IF p_scheduled_for <= NOW() THEN
    RAISE EXCEPTION 'Planlagt tidspunkt må være i fremtiden';
  END IF;

  -- Valider at scheduled_for ikke er for langt frem
  IF p_scheduled_for > NOW() + (v_max_days || ' days')::INTERVAL THEN
    RAISE EXCEPTION 'Kan ikke planlegge mer enn % dager frem i tid', v_max_days;
  END IF;

  -- Opprett innlegget med scheduled status
  INSERT INTO posts (
    user_id,
    title,
    content,
    type,
    visibility,
    category_id,
    event_date,
    event_time,
    event_end_time,
    event_location,
    language_area_id,
    municipality_id,
    place_id,
    created_for_group_id,
    created_for_community_id,
    image_url,
    scheduled_for,
    publish_status
  ) VALUES (
    p_user_id,
    p_title,
    p_content,
    p_type,
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
    p_image_url,
    p_scheduled_for,
    'scheduled'
  )
  RETURNING id INTO v_post_id;

  RETURN v_post_id;
END;
$$;

-- ============================================
-- 4. Funksjon: Publiser planlagte innlegg
-- ============================================

CREATE OR REPLACE FUNCTION publish_scheduled_posts()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_published_count INT := 0;
BEGIN
  -- Oppdater alle innlegg som skal publiseres nå
  UPDATE posts
  SET
    publish_status = 'published',
    created_at = NOW() -- Oppdater created_at til publiseringstidspunkt
  WHERE
    publish_status = 'scheduled'
    AND scheduled_for <= NOW();

  GET DIAGNOSTICS v_published_count = ROW_COUNT;

  RETURN v_published_count;
END;
$$;

-- ============================================
-- 5. Funksjon: Hent brukerens planlagte innlegg
-- ============================================

CREATE OR REPLACE FUNCTION get_user_scheduled_posts(
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  type TEXT,
  visibility TEXT,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  category_id UUID,
  image_url TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    p.id,
    p.title,
    p.content,
    p.type,
    p.visibility,
    p.scheduled_for,
    p.created_at,
    p.category_id,
    p.image_url
  FROM posts p
  WHERE
    p.user_id = COALESCE(p_user_id, auth.uid())
    AND p.publish_status = 'scheduled'
    AND p.scheduled_for > NOW()
  ORDER BY p.scheduled_for ASC;
$$;

-- ============================================
-- 6. Funksjon: Avbryt planlagt innlegg
-- ============================================

CREATE OR REPLACE FUNCTION cancel_scheduled_post(p_post_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Slett kun hvis brukeren eier innlegget og det er planlagt
  DELETE FROM posts
  WHERE
    id = p_post_id
    AND user_id = auth.uid()
    AND publish_status = 'scheduled';

  RETURN FOUND;
END;
$$;

-- ============================================
-- 7. Funksjon: Oppdater planlagt innlegg
-- ============================================

CREATE OR REPLACE FUNCTION update_scheduled_post(
  p_post_id UUID,
  p_title TEXT DEFAULT NULL,
  p_content TEXT DEFAULT NULL,
  p_scheduled_for TIMESTAMPTZ DEFAULT NULL,
  p_visibility TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_days INT;
BEGIN
  -- Hent maks dager
  SELECT COALESCE((value->>'max_schedule_days')::INT, 60) INTO v_max_days
  FROM app_settings
  WHERE key = 'post_settings';

  -- Valider nytt tidspunkt hvis oppgitt
  IF p_scheduled_for IS NOT NULL THEN
    IF p_scheduled_for <= NOW() THEN
      RAISE EXCEPTION 'Planlagt tidspunkt må være i fremtiden';
    END IF;

    IF p_scheduled_for > NOW() + (v_max_days || ' days')::INTERVAL THEN
      RAISE EXCEPTION 'Kan ikke planlegge mer enn % dager frem i tid', v_max_days;
    END IF;
  END IF;

  -- Oppdater innlegget
  UPDATE posts SET
    title = COALESCE(p_title, title),
    content = COALESCE(p_content, content),
    scheduled_for = COALESCE(p_scheduled_for, scheduled_for),
    visibility = COALESCE(p_visibility, visibility)
  WHERE
    id = p_post_id
    AND user_id = auth.uid()
    AND publish_status = 'scheduled';

  RETURN FOUND;
END;
$$;

-- ============================================
-- 8. Funksjon: Publiser planlagt innlegg umiddelbart
-- ============================================

CREATE OR REPLACE FUNCTION publish_post_now(p_post_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE posts SET
    publish_status = 'published',
    scheduled_for = NULL,
    created_at = NOW()
  WHERE
    id = p_post_id
    AND user_id = auth.uid()
    AND publish_status = 'scheduled';

  RETURN FOUND;
END;
$$;

-- ============================================
-- 9. App settings for scheduling
-- ============================================

INSERT INTO app_settings (key, value)
VALUES (
  'post_settings',
  '{"max_schedule_days": 60, "max_scheduled_posts": 25}'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = app_settings.value || '{"max_schedule_days": 60, "max_scheduled_posts": 25}'::jsonb;

-- ============================================
-- 10. Oppdater views/queries for å ekskludere scheduled posts
-- ============================================

-- Legg til comment for fremtidig referanse
COMMENT ON COLUMN posts.publish_status IS 'Status: published (synlig), scheduled (planlagt), failed (feilet)';
COMMENT ON COLUMN posts.scheduled_for IS 'Tidspunkt for planlagt publisering. NULL betyr umiddelbar publisering.';

-- ============================================
-- NOTATER:
-- - publish_scheduled_posts() bør kjøres hvert minutt via cron
-- - Planlagte innlegg er kun synlige for eieren før publisering
-- - Maks 60 dager frem i tid (konfigurerbart)
-- - Maks 25 planlagte innlegg per bruker
-- - created_at oppdateres til publiseringstidspunkt
-- ============================================
