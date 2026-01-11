-- Migration: Hashtags - Støtte for #hashtags på innlegg
-- Dato: 2025-12-18
-- Beskrivelse: Oppretter hashtags og post_hashtags tabeller
-- Maks 30 hashtags per innlegg, egne sider, trending, alias-støtte

-- ============================================
-- 1. Opprett hashtags tabell
-- ============================================

CREATE TABLE IF NOT EXISTS hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT UNIQUE NOT NULL,           -- Selve taggen uten #, lowercase
  display_tag TEXT NOT NULL,          -- Original visning med casing
  alias_of UUID REFERENCES hashtags(id) ON DELETE SET NULL,  -- For å merge lignende tags
  post_count INT DEFAULT 0,           -- Antall innlegg med denne taggen
  is_blocked BOOLEAN DEFAULT FALSE,   -- Blokker upassende hashtags
  is_featured BOOLEAN DEFAULT FALSE,  -- Fremhevede/trending hashtags
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indekser for ytelse
CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON hashtags(tag);
CREATE INDEX IF NOT EXISTS idx_hashtags_post_count ON hashtags(post_count DESC);
CREATE INDEX IF NOT EXISTS idx_hashtags_last_used ON hashtags(last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_hashtags_featured ON hashtags(is_featured) WHERE is_featured = TRUE;

-- ============================================
-- 2. Opprett post_hashtags kobling
-- ============================================

CREATE TABLE IF NOT EXISTS post_hashtags (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, hashtag_id)
);

-- Indekser for ytelse
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post ON post_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag ON post_hashtags(hashtag_id);

-- ============================================
-- 3. RLS Policies
-- ============================================

ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;

-- Hashtags: Alle kan lese (for søk og visning)
CREATE POLICY "hashtags_select" ON hashtags
FOR SELECT USING (NOT is_blocked OR EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

-- Hashtags: Kun system/triggers kan sette inn (via funksjoner)
CREATE POLICY "hashtags_insert" ON hashtags
FOR INSERT WITH CHECK (TRUE);  -- Kontrollert via funksjoner

-- Hashtags: Kun admin kan oppdatere (for blokkering, aliaser)
CREATE POLICY "hashtags_update" ON hashtags
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Post_hashtags: Alle kan lese
CREATE POLICY "post_hashtags_select" ON post_hashtags
FOR SELECT USING (TRUE);

-- Post_hashtags: Innleggseier kan sette inn
CREATE POLICY "post_hashtags_insert" ON post_hashtags
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_hashtags.post_id
    AND posts.user_id = auth.uid()
  )
);

-- Post_hashtags: Innleggseier kan slette
CREATE POLICY "post_hashtags_delete" ON post_hashtags
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_hashtags.post_id
    AND posts.user_id = auth.uid()
  )
);

-- ============================================
-- 4. Funksjon: Finn eller opprett hashtag
-- ============================================

CREATE OR REPLACE FUNCTION get_or_create_hashtag(p_tag TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tag TEXT;
  v_hashtag_id UUID;
BEGIN
  -- Normaliser tag: lowercase, fjern # hvis det finnes
  v_tag := LOWER(TRIM(REGEXP_REPLACE(p_tag, '^#', '')));

  -- Sjekk om den eksisterer
  SELECT id INTO v_hashtag_id
  FROM hashtags
  WHERE tag = v_tag;

  IF v_hashtag_id IS NULL THEN
    -- Opprett ny hashtag
    INSERT INTO hashtags (tag, display_tag)
    VALUES (v_tag, TRIM(REGEXP_REPLACE(p_tag, '^#', '')))
    RETURNING id INTO v_hashtag_id;
  END IF;

  RETURN v_hashtag_id;
END;
$$;

-- ============================================
-- 5. Funksjon: Lagre hashtags for innlegg
-- ============================================

CREATE OR REPLACE FUNCTION save_post_hashtags(
  p_post_id UUID,
  p_hashtags TEXT[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tag TEXT;
  v_hashtag_id UUID;
  v_old_hashtag_ids UUID[];
BEGIN
  -- Hent eksisterende hashtags for dette innlegget
  SELECT ARRAY_AGG(hashtag_id) INTO v_old_hashtag_ids
  FROM post_hashtags
  WHERE post_id = p_post_id;

  -- Slett eksisterende koblinger
  DELETE FROM post_hashtags WHERE post_id = p_post_id;

  -- Oppdater post_count for gamle hashtags
  IF v_old_hashtag_ids IS NOT NULL THEN
    UPDATE hashtags
    SET post_count = post_count - 1
    WHERE id = ANY(v_old_hashtag_ids);
  END IF;

  -- Legg til nye hashtags (maks 30)
  FOR i IN 1..LEAST(array_length(p_hashtags, 1), 30) LOOP
    v_tag := p_hashtags[i];

    -- Finn eller opprett hashtag
    v_hashtag_id := get_or_create_hashtag(v_tag);

    -- Sjekk om hashtag er blokkert
    IF EXISTS (SELECT 1 FROM hashtags WHERE id = v_hashtag_id AND is_blocked = TRUE) THEN
      CONTINUE;  -- Hopp over blokkerte hashtags
    END IF;

    -- Følg alias hvis det finnes
    SELECT COALESCE(alias_of, id) INTO v_hashtag_id
    FROM hashtags
    WHERE id = v_hashtag_id;

    -- Sett inn kobling
    INSERT INTO post_hashtags (post_id, hashtag_id)
    VALUES (p_post_id, v_hashtag_id)
    ON CONFLICT DO NOTHING;

    -- Oppdater post_count og last_used_at
    UPDATE hashtags
    SET
      post_count = post_count + 1,
      last_used_at = NOW()
    WHERE id = v_hashtag_id;
  END LOOP;
END;
$$;

-- ============================================
-- 6. Funksjon: Søk etter hashtags (autocomplete)
-- ============================================

CREATE OR REPLACE FUNCTION search_hashtags(
  p_query TEXT,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  tag TEXT,
  display_tag TEXT,
  post_count INT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    h.id,
    h.tag,
    h.display_tag,
    h.post_count
  FROM hashtags h
  WHERE
    h.tag LIKE LOWER(TRIM(REGEXP_REPLACE(p_query, '^#', ''))) || '%'
    AND h.is_blocked = FALSE
    AND h.alias_of IS NULL  -- Ikke vis aliaser
  ORDER BY h.post_count DESC, h.last_used_at DESC
  LIMIT p_limit;
$$;

-- ============================================
-- 7. Funksjon: Hent trending hashtags
-- ============================================

CREATE OR REPLACE FUNCTION get_trending_hashtags(
  p_limit INT DEFAULT 10,
  p_days INT DEFAULT 7
)
RETURNS TABLE (
  id UUID,
  tag TEXT,
  display_tag TEXT,
  post_count INT,
  recent_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    h.id,
    h.tag,
    h.display_tag,
    h.post_count,
    COUNT(ph.post_id) AS recent_count
  FROM hashtags h
  LEFT JOIN post_hashtags ph ON h.id = ph.hashtag_id
    AND ph.created_at > NOW() - (p_days || ' days')::INTERVAL
  WHERE
    h.is_blocked = FALSE
    AND h.alias_of IS NULL
    AND h.post_count >= 3  -- Minimum 3 innlegg for å vises
  GROUP BY h.id, h.tag, h.display_tag, h.post_count
  ORDER BY recent_count DESC, h.post_count DESC
  LIMIT p_limit;
$$;

-- ============================================
-- 8. Funksjon: Hent innlegg for hashtag
-- ============================================

CREATE OR REPLACE FUNCTION get_posts_by_hashtag(
  p_tag TEXT,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  post_id UUID
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT ph.post_id
  FROM post_hashtags ph
  JOIN hashtags h ON ph.hashtag_id = h.id
  WHERE h.tag = LOWER(TRIM(REGEXP_REPLACE(p_tag, '^#', '')))
    OR h.alias_of IN (
      SELECT id FROM hashtags WHERE tag = LOWER(TRIM(REGEXP_REPLACE(p_tag, '^#', '')))
    )
  ORDER BY ph.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- ============================================
-- 9. App settings for hashtags
-- ============================================

INSERT INTO app_settings (key, value)
VALUES (
  'hashtag_settings',
  '{"max_per_post": 30, "min_posts_for_seo": 3, "trending_days": 7}'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = '{"max_per_post": 30, "min_posts_for_seo": 3, "trending_days": 7}'::jsonb;

-- ============================================
-- 10. Trigger for å begrense hashtags per innlegg
-- ============================================

CREATE OR REPLACE FUNCTION check_post_hashtags_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_count INT;
  max_hashtags INT;
BEGIN
  -- Hent maks fra innstillinger
  SELECT COALESCE((value->>'max_per_post')::INT, 30) INTO max_hashtags
  FROM app_settings
  WHERE key = 'hashtag_settings';

  -- Tell eksisterende hashtags
  SELECT COUNT(*) INTO current_count
  FROM post_hashtags
  WHERE post_id = NEW.post_id;

  IF current_count >= max_hashtags THEN
    RAISE EXCEPTION 'Maks % hashtags per innlegg', max_hashtags;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_check_post_hashtags_limit
BEFORE INSERT ON post_hashtags
FOR EACH ROW
EXECUTE FUNCTION check_post_hashtags_limit();

-- ============================================
-- NOTATER:
-- - Hashtags normaliseres til lowercase for matching
-- - display_tag beholder original casing
-- - alias_of brukes for å merge lignende tags (f.eks. #sami -> #samisk)
-- - is_blocked brukes for å skjule upassende hashtags
-- - post_count holdes oppdatert for rask sortering
-- - Minimum 3 innlegg for å vises i trending/SEO
-- ============================================
