-- Migration: Post Videos - Støtte for video via Bunny Stream
-- Dato: 2025-12-18
-- Beskrivelse: Oppretter post_videos tabell for video i innlegg
-- GDPR: Bunny.net er EU-basert og GDPR-kompatibel

-- ============================================
-- 1. Opprett post_videos tabell
-- ============================================

CREATE TABLE IF NOT EXISTS post_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,

  -- Bunny Stream data
  bunny_video_id TEXT NOT NULL,  -- GUID fra Bunny
  bunny_library_id TEXT NOT NULL,

  -- URLs
  thumbnail_url TEXT,
  playback_url TEXT,  -- Embed URL
  hls_url TEXT,       -- HLS streaming URL

  -- Metadata
  title TEXT,
  duration INT,       -- sekunder
  width INT,
  height INT,
  file_size BIGINT,   -- bytes

  -- Status: created, uploaded, processing, transcoding, finished, error
  status TEXT DEFAULT 'created',
  encode_progress INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Indekser for ytelse
CREATE INDEX IF NOT EXISTS idx_post_videos_post_id ON post_videos(post_id);
CREATE INDEX IF NOT EXISTS idx_post_videos_bunny_id ON post_videos(bunny_video_id);
CREATE INDEX IF NOT EXISTS idx_post_videos_status ON post_videos(status);

-- ============================================
-- 2. RLS Policies
-- ============================================

ALTER TABLE post_videos ENABLE ROW LEVEL SECURITY;

-- Les: Alle kan lese videoer for innlegg de kan se
CREATE POLICY "post_videos_select" ON post_videos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_videos.post_id
  )
);

-- Sett inn: Kun innleggseier kan legge til video
CREATE POLICY "post_videos_insert" ON post_videos
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_videos.post_id
    AND posts.user_id = auth.uid()
  )
);

-- Oppdater: Kun innleggseier kan oppdatere
CREATE POLICY "post_videos_update" ON post_videos
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_videos.post_id
    AND posts.user_id = auth.uid()
  )
);

-- Slett: Kun innleggseier kan slette
CREATE POLICY "post_videos_delete" ON post_videos
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_videos.post_id
    AND posts.user_id = auth.uid()
  )
);

-- ============================================
-- 3. App settings for video
-- ============================================

-- Legg til innstillinger for video
INSERT INTO app_settings (key, value)
VALUES (
  'video_settings',
  '{"max_duration_seconds": 600, "max_size_mb": 500, "enabled": true}'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = '{"max_duration_seconds": 600, "max_size_mb": 500, "enabled": true}'::jsonb;

-- ============================================
-- 4. Funksjon for å hente video for innlegg
-- ============================================

CREATE OR REPLACE FUNCTION get_post_video(p_post_id UUID)
RETURNS TABLE (
  id UUID,
  bunny_video_id TEXT,
  thumbnail_url TEXT,
  playback_url TEXT,
  hls_url TEXT,
  duration INT,
  width INT,
  height INT,
  status TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    id,
    bunny_video_id,
    thumbnail_url,
    playback_url,
    hls_url,
    duration,
    width,
    height,
    status
  FROM post_videos
  WHERE post_id = p_post_id
  AND status = 'finished'
  LIMIT 1;
$$;

-- ============================================
-- 5. Trigger for å begrense til 1 video per innlegg
-- ============================================

CREATE OR REPLACE FUNCTION check_post_video_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_count INT;
BEGIN
  -- Tell eksisterende videoer
  SELECT COUNT(*) INTO current_count
  FROM post_videos
  WHERE post_id = NEW.post_id;

  IF current_count >= 1 THEN
    RAISE EXCEPTION 'Kun 1 video per innlegg er tillatt';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_check_post_video_limit
BEFORE INSERT ON post_videos
FOR EACH ROW
EXECUTE FUNCTION check_post_video_limit();

-- ============================================
-- 6. Realtime for post_videos
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE post_videos;

-- ============================================
-- NOTATER:
-- - Bunny Stream er EU-basert og GDPR-kompatibel
-- - Video lagres i Bunny CDN, kun referanser i vår database
-- - Maks 1 video per innlegg (kan utvides senere)
-- - Status oppdateres via webhook eller polling
-- ============================================
