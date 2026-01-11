-- Migration: Post Image Engagement
-- Dato: 2026-01-06
-- Beskrivelse: Utvid media_comments og media_likes til å støtte både media og post_images tabeller
-- Dette gir polymorfisk engagement - en rad kan referere til ENTEN media ELLER post_images

-- =====================================================
-- MEDIA_COMMENTS: Legg til post_image_id støtte
-- =====================================================

-- 1. Legg til post_image_id kolonne
ALTER TABLE media_comments
ADD COLUMN IF NOT EXISTS post_image_id UUID REFERENCES post_images(id) ON DELETE CASCADE;

-- 2. Gjør media_id nullable (må ha ENTEN media_id ELLER post_image_id)
ALTER TABLE media_comments
ALTER COLUMN media_id DROP NOT NULL;

-- 3. Constraint: Må ha ENTEN media_id ELLER post_image_id, ikke begge
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'media_comments_reference_check'
  ) THEN
    ALTER TABLE media_comments
    ADD CONSTRAINT media_comments_reference_check
    CHECK (
      (media_id IS NOT NULL AND post_image_id IS NULL) OR
      (media_id IS NULL AND post_image_id IS NOT NULL)
    );
  END IF;
END$$;

-- 4. Index for rask søk på post_image_id
CREATE INDEX IF NOT EXISTS idx_media_comments_post_image_id
ON media_comments(post_image_id)
WHERE deleted_at IS NULL;

-- =====================================================
-- MEDIA_LIKES: Legg til post_image_id støtte
-- =====================================================

-- 1. Legg til post_image_id kolonne
ALTER TABLE media_likes
ADD COLUMN IF NOT EXISTS post_image_id UUID REFERENCES post_images(id) ON DELETE CASCADE;

-- 2. Gjør media_id nullable
ALTER TABLE media_likes
ALTER COLUMN media_id DROP NOT NULL;

-- 3. Constraint: Må ha ENTEN media_id ELLER post_image_id, ikke begge
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'media_likes_reference_check'
  ) THEN
    ALTER TABLE media_likes
    ADD CONSTRAINT media_likes_reference_check
    CHECK (
      (media_id IS NOT NULL AND post_image_id IS NULL) OR
      (media_id IS NULL AND post_image_id IS NOT NULL)
    );
  END IF;
END$$;

-- 4. Oppdater unique constraints
-- Drop den gamle (media_id, user_id) constraint hvis den finnes
ALTER TABLE media_likes DROP CONSTRAINT IF EXISTS media_likes_unique;

-- Legg til nye unique constraints for begge typer
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'media_likes_unique_media'
  ) THEN
    ALTER TABLE media_likes
    ADD CONSTRAINT media_likes_unique_media
    UNIQUE (media_id, user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'media_likes_unique_post_image'
  ) THEN
    ALTER TABLE media_likes
    ADD CONSTRAINT media_likes_unique_post_image
    UNIQUE (post_image_id, user_id);
  END IF;
END$$;

-- 5. Index for rask søk på post_image_id
CREATE INDEX IF NOT EXISTS idx_media_likes_post_image_id
ON media_likes(post_image_id);

-- =====================================================
-- RLS POLICIES OPPDATERINGER - MEDIA_COMMENTS
-- =====================================================

-- Drop eksisterende policies slik at vi kan gjenskape dem med oppdatert logikk
DROP POLICY IF EXISTS "Anyone can read media comments" ON media_comments;
DROP POLICY IF EXISTS "Authenticated users can create media comments" ON media_comments;
DROP POLICY IF EXISTS "Users can update own media comments" ON media_comments;
DROP POLICY IF EXISTS "Users can delete own media comments" ON media_comments;
DROP POLICY IF EXISTS "Admins can delete any media comment" ON media_comments;

-- Les: Alle kan lese ikke-slettede kommentarer
CREATE POLICY "Anyone can read media comments"
  ON media_comments FOR SELECT
  USING (deleted_at IS NULL);

-- Opprett: Autentiserte brukere kan opprette kommentarer
-- Validerer at enten media ELLER post_image finnes og er tilgjengelig
CREATE POLICY "Authenticated users can create media comments"
  ON media_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    deleted_at IS NULL AND
    (
      -- Enten media_id må referere til gyldig media
      (media_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM media WHERE id = media_id
      )) OR
      -- Eller post_image_id må referere til gyldig post_image
      (post_image_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM post_images WHERE id = post_image_id
      ))
    )
  );

-- Oppdater: Brukere kan oppdatere egne kommentarer
CREATE POLICY "Users can update own media comments"
  ON media_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Slett: Brukere kan slette egne kommentarer
CREATE POLICY "Users can delete own media comments"
  ON media_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Slett: Admins kan slette alle kommentarer
CREATE POLICY "Admins can delete any media comment"
  ON media_comments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- RLS POLICIES OPPDATERINGER - MEDIA_LIKES
-- =====================================================

-- Drop eksisterende policies
DROP POLICY IF EXISTS "Anyone can read media likes" ON media_likes;
DROP POLICY IF EXISTS "Authenticated users can create media likes" ON media_likes;
DROP POLICY IF EXISTS "Users can delete own media likes" ON media_likes;

-- Les: Alle kan lese likes
CREATE POLICY "Anyone can read media likes"
  ON media_likes FOR SELECT
  USING (true);

-- Opprett: Autentiserte brukere kan like bilder
CREATE POLICY "Authenticated users can create media likes"
  ON media_likes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      -- Enten media_id må referere til gyldig media
      (media_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM media WHERE id = media_id
      )) OR
      -- Eller post_image_id må referere til gyldig post_image
      (post_image_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM post_images WHERE id = post_image_id
      ))
    )
  );

-- Slett: Brukere kan fjerne egne likes
CREATE POLICY "Users can delete own media likes"
  ON media_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- HJELPEFUNKSJONER
-- =====================================================

-- Funksjon: Hent kommentar-count for post_image
CREATE OR REPLACE FUNCTION get_post_image_comment_count(p_post_image_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM media_comments
  WHERE post_image_id = p_post_image_id
    AND deleted_at IS NULL;
$$;

-- Funksjon: Hent like-count for post_image
CREATE OR REPLACE FUNCTION get_post_image_like_count(p_post_image_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM media_likes
  WHERE post_image_id = p_post_image_id;
$$;

-- Funksjon: Sjekk om bruker har liket post_image
CREATE OR REPLACE FUNCTION has_user_liked_post_image(
  p_post_image_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM media_likes
    WHERE post_image_id = p_post_image_id
      AND user_id = p_user_id
  );
$$;

-- Funksjon: Batch-hent engagement for flere post_images
CREATE OR REPLACE FUNCTION get_post_images_engagement(
  p_post_image_ids UUID[],
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  post_image_id UUID,
  comment_count INTEGER,
  like_count INTEGER,
  user_has_liked BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pi.id AS post_image_id,
    COALESCE(c.count, 0)::INTEGER AS comment_count,
    COALESCE(l.count, 0)::INTEGER AS like_count,
    CASE
      WHEN p_user_id IS NULL THEN false
      ELSE EXISTS (
        SELECT 1
        FROM media_likes ml
        WHERE ml.post_image_id = pi.id
          AND ml.user_id = p_user_id
      )
    END AS user_has_liked
  FROM unnest(p_post_image_ids) AS pi(id)
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::INTEGER AS count
    FROM media_comments mc
    WHERE mc.post_image_id = pi.id
      AND mc.deleted_at IS NULL
  ) c ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::INTEGER AS count
    FROM media_likes ml
    WHERE ml.post_image_id = pi.id
  ) l ON true;
END;
$$;

-- =====================================================
-- KOMMENTARER OG DOKUMENTASJON
-- =====================================================

COMMENT ON COLUMN media_comments.post_image_id IS
'Polymorfisk referanse til post_images. Må være NULL hvis media_id er satt.';

COMMENT ON COLUMN media_likes.post_image_id IS
'Polymorfisk referanse til post_images. Må være NULL hvis media_id er satt.';

COMMENT ON FUNCTION get_post_images_engagement IS
'Batch-henter engagement-data (comments, likes, user_has_liked) for flere post_images i én query. Optimalisert for gallerivisning.';
