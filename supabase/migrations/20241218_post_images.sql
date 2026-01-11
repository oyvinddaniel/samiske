-- Migration: Post Images - Støtte for flere bilder per innlegg
-- Dato: 2025-12-18
-- Beskrivelse: Oppretter post_images tabell for å støtte opptil 50 bilder per innlegg

-- ============================================
-- 1. Opprett post_images tabell
-- ============================================

CREATE TABLE IF NOT EXISTS post_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  width INT,
  height INT,
  file_size INT, -- bytes
  mime_type TEXT DEFAULT 'image/jpeg',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indekser for ytelse
CREATE INDEX IF NOT EXISTS idx_post_images_post_id ON post_images(post_id);
CREATE INDEX IF NOT EXISTS idx_post_images_sort_order ON post_images(post_id, sort_order);

-- ============================================
-- 2. RLS Policies
-- ============================================

ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;

-- Les: Alle kan lese bilder for innlegg de kan se
CREATE POLICY "post_images_select" ON post_images
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_images.post_id
  )
);

-- Sett inn: Kun innleggseier kan legge til bilder
CREATE POLICY "post_images_insert" ON post_images
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_images.post_id
    AND posts.user_id = auth.uid()
  )
);

-- Oppdater: Kun innleggseier kan oppdatere
CREATE POLICY "post_images_update" ON post_images
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_images.post_id
    AND posts.user_id = auth.uid()
  )
);

-- Slett: Kun innleggseier kan slette
CREATE POLICY "post_images_delete" ON post_images
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_images.post_id
    AND posts.user_id = auth.uid()
  )
);

-- ============================================
-- 3. Hjelpefunksjon for å hente bilder
-- ============================================

CREATE OR REPLACE FUNCTION get_post_images(p_post_id UUID)
RETURNS TABLE (
  id UUID,
  url TEXT,
  thumbnail_url TEXT,
  width INT,
  height INT,
  sort_order INT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    id,
    url,
    thumbnail_url,
    width,
    height,
    sort_order
  FROM post_images
  WHERE post_id = p_post_id
  ORDER BY sort_order ASC;
$$;

-- ============================================
-- 4. Migrer eksisterende bilder
-- ============================================

-- Kopier eksisterende image_url til post_images tabellen
INSERT INTO post_images (post_id, url, sort_order)
SELECT id, image_url, 0
FROM posts
WHERE image_url IS NOT NULL
  AND image_url != ''
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. App settings for max bilder
-- ============================================

-- Legg til innstilling for maks bilder per innlegg (value er JSONB)
INSERT INTO app_settings (key, value)
VALUES (
  'max_images_per_post',
  '{"value": 50, "description": "Maksimalt antall bilder per innlegg"}'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = '{"value": 50, "description": "Maksimalt antall bilder per innlegg"}'::jsonb;

-- ============================================
-- 6. Trigger for å begrense antall bilder
-- ============================================

CREATE OR REPLACE FUNCTION check_post_images_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_count INT;
  max_images INT;
BEGIN
  -- Hent maks fra innstillinger (value er JSONB)
  SELECT COALESCE((value->>'value')::INT, 50) INTO max_images
  FROM app_settings
  WHERE key = 'max_images_per_post';

  -- Tell eksisterende bilder
  SELECT COUNT(*) INTO current_count
  FROM post_images
  WHERE post_id = NEW.post_id;

  IF current_count >= max_images THEN
    RAISE EXCEPTION 'Maks % bilder per innlegg', max_images;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_check_post_images_limit
BEFORE INSERT ON post_images
FOR EACH ROW
EXECUTE FUNCTION check_post_images_limit();

-- ============================================
-- 7. Realtime for post_images
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE post_images;

-- ============================================
-- NOTATER:
-- - Eksisterende image_url på posts beholdes for bakoverkompatibilitet
-- - Nye innlegg skal bruke post_images tabellen
-- - Frontend skal sjekke post_images først, fallback til image_url
-- ============================================
