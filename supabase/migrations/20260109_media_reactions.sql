-- Migration: Media Reactions (10 types)
-- Date: 2026-01-09
-- Purpose: Add reaction types to media_likes (like posts have)

-- =====================================================
-- 1. Add reaction_type column to media_likes
-- =====================================================

-- Add reaction_type with default 'elsker' for backwards compatibility
ALTER TABLE media_likes
ADD COLUMN IF NOT EXISTS reaction_type TEXT DEFAULT 'elsker';

-- Add constraint for valid reaction types (same as posts)
ALTER TABLE media_likes DROP CONSTRAINT IF EXISTS media_likes_reaction_type_check;
ALTER TABLE media_likes ADD CONSTRAINT media_likes_reaction_type_check
  CHECK (reaction_type IN (
    'elsker',   -- ❤️
    'haha',     -- 😂
    'wow',      -- 😮
    'trist',    -- 😢
    'sint',     -- 😡
    'tommel',   -- 👍
    'ild',      -- 🔥
    'feiring',  -- 🎉
    'hundre',   -- 💯
    'takk'      -- 🙏
  ));

-- Create index for faster aggregation per reaction type
CREATE INDEX IF NOT EXISTS idx_media_likes_reaction_type
ON media_likes(media_id, reaction_type) WHERE media_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_media_likes_post_image_reaction_type
ON media_likes(post_image_id, reaction_type) WHERE post_image_id IS NOT NULL;

-- =====================================================
-- 2. Update unique constraints to include reaction_type
-- =====================================================

-- Drop old unique constraints
ALTER TABLE media_likes DROP CONSTRAINT IF EXISTS media_likes_unique_media;
ALTER TABLE media_likes DROP CONSTRAINT IF EXISTS media_likes_unique_post_image;

-- Note: We keep allowing only ONE reaction per user per image
-- (changing reaction will update, not add new row)
-- So we keep simple unique constraints on (id, user_id)

-- Re-add unique constraints (one reaction per user per media)
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

-- =====================================================
-- 3. Function: React to media/post_image
-- =====================================================

CREATE OR REPLACE FUNCTION react_to_media(
  p_media_id UUID DEFAULT NULL,
  p_post_image_id UUID DEFAULT NULL,
  p_reaction_type TEXT DEFAULT 'elsker'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_existing RECORD;
  v_result JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate: must have exactly one ID
  IF (p_media_id IS NULL AND p_post_image_id IS NULL) OR
     (p_media_id IS NOT NULL AND p_post_image_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Must provide exactly one of media_id or post_image_id';
  END IF;

  -- Validate reaction type
  IF p_reaction_type NOT IN ('elsker', 'haha', 'wow', 'trist', 'sint', 'tommel', 'ild', 'feiring', 'hundre', 'takk') THEN
    RAISE EXCEPTION 'Invalid reaction type';
  END IF;

  -- Check for existing reaction
  IF p_media_id IS NOT NULL THEN
    SELECT * INTO v_existing FROM media_likes
    WHERE media_id = p_media_id AND user_id = v_user_id;
  ELSE
    SELECT * INTO v_existing FROM media_likes
    WHERE post_image_id = p_post_image_id AND user_id = v_user_id;
  END IF;

  IF v_existing.id IS NOT NULL THEN
    IF v_existing.reaction_type = p_reaction_type THEN
      -- Same reaction - remove it
      DELETE FROM media_likes WHERE id = v_existing.id;
      v_result := jsonb_build_object('action', 'removed', 'reaction_type', p_reaction_type);
    ELSE
      -- Different reaction - update it
      UPDATE media_likes
      SET reaction_type = p_reaction_type
      WHERE id = v_existing.id;
      v_result := jsonb_build_object(
        'action', 'changed',
        'reaction_type', p_reaction_type,
        'previous', v_existing.reaction_type
      );
    END IF;
  ELSE
    -- New reaction
    IF p_media_id IS NOT NULL THEN
      INSERT INTO media_likes (media_id, user_id, reaction_type)
      VALUES (p_media_id, v_user_id, p_reaction_type);
    ELSE
      INSERT INTO media_likes (post_image_id, user_id, reaction_type)
      VALUES (p_post_image_id, v_user_id, p_reaction_type);
    END IF;
    v_result := jsonb_build_object('action', 'added', 'reaction_type', p_reaction_type);
  END IF;

  RETURN v_result;
END;
$$;

-- =====================================================
-- 4. Function: Get reactions for media/post_image
-- =====================================================

CREATE OR REPLACE FUNCTION get_media_reactions(
  p_media_id UUID DEFAULT NULL,
  p_post_image_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT jsonb_build_object(
    'total_count', COUNT(*),
    'user_reaction', (
      SELECT reaction_type FROM media_likes
      WHERE (
        (p_media_id IS NOT NULL AND media_id = p_media_id) OR
        (p_post_image_id IS NOT NULL AND post_image_id = p_post_image_id)
      )
      AND user_id = auth.uid()
    ),
    'reactions', (
      SELECT jsonb_object_agg(reaction_type, cnt)
      FROM (
        SELECT reaction_type, COUNT(*) as cnt
        FROM media_likes
        WHERE (
          (p_media_id IS NOT NULL AND media_id = p_media_id) OR
          (p_post_image_id IS NOT NULL AND post_image_id = p_post_image_id)
        )
        GROUP BY reaction_type
      ) sub
    ),
    'recent_users', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'full_name', p.full_name,
          'avatar_url', p.avatar_url,
          'reaction_type', l.reaction_type
        )
      )
      FROM (
        SELECT user_id, reaction_type
        FROM media_likes
        WHERE (
          (p_media_id IS NOT NULL AND media_id = p_media_id) OR
          (p_post_image_id IS NOT NULL AND post_image_id = p_post_image_id)
        )
        ORDER BY created_at DESC
        LIMIT 5
      ) l
      JOIN profiles p ON p.id = l.user_id
    )
  )
  FROM media_likes
  WHERE (
    (p_media_id IS NOT NULL AND media_id = p_media_id) OR
    (p_post_image_id IS NOT NULL AND post_image_id = p_post_image_id)
  );
$$;

-- =====================================================
-- 5. Comments
-- =====================================================

COMMENT ON COLUMN media_likes.reaction_type IS '10 reaction types: elsker, haha, wow, trist, sint, tommel, ild, feiring, hundre, takk';
COMMENT ON FUNCTION react_to_media IS 'Add, change, or remove reaction on media/post_image. Returns action and reaction_type.';
COMMENT ON FUNCTION get_media_reactions IS 'Get aggregated reactions for media/post_image with counts, user reaction, and recent users.';
