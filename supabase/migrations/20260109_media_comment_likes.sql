-- Migration: Media Comment Likes
-- Date: 2026-01-09
-- Purpose: Enable liking individual comments on media/images

-- =====================================================
-- 1. Create media_comment_likes table
-- =====================================================

CREATE TABLE IF NOT EXISTS media_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to comment
  comment_id UUID NOT NULL REFERENCES media_comments(id) ON DELETE CASCADE,

  -- User who liked
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: One like per user per comment
  CONSTRAINT media_comment_likes_unique UNIQUE (comment_id, user_id)
);

-- =====================================================
-- 2. Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_media_comment_likes_comment_id
ON media_comment_likes(comment_id);

CREATE INDEX IF NOT EXISTS idx_media_comment_likes_user_id
ON media_comment_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_media_comment_likes_created_at
ON media_comment_likes(created_at DESC);

-- =====================================================
-- 3. Add like_count to media_comments (denormalized)
-- =====================================================

ALTER TABLE media_comments
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- =====================================================
-- 4. Trigger: Update like_count when likes are added/removed
-- =====================================================

CREATE OR REPLACE FUNCTION update_media_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE media_comments
    SET like_count = like_count + 1
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE media_comments
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER media_comment_likes_count_trigger
AFTER INSERT OR DELETE ON media_comment_likes
FOR EACH ROW
EXECUTE FUNCTION update_media_comment_like_count();

-- =====================================================
-- 5. RLS Policies
-- =====================================================

ALTER TABLE media_comment_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can read comment likes
CREATE POLICY "Anyone can read media comment likes"
  ON media_comment_likes FOR SELECT
  USING (true);

-- Authenticated users can like comments
CREATE POLICY "Authenticated users can like media comments"
  ON media_comment_likes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM media_comments
      WHERE id = comment_id AND deleted_at IS NULL
    )
  );

-- Users can unlike their own likes
CREATE POLICY "Users can delete own media comment likes"
  ON media_comment_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 6. Helper Functions
-- =====================================================

-- Get like count for a comment
CREATE OR REPLACE FUNCTION get_media_comment_like_count(p_comment_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM media_comment_likes
  WHERE comment_id = p_comment_id;
$$;

-- Check if user has liked a comment
CREATE OR REPLACE FUNCTION has_user_liked_media_comment(
  p_comment_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM media_comment_likes
    WHERE comment_id = p_comment_id AND user_id = p_user_id
  );
$$;

-- Toggle like on comment (add or remove)
CREATE OR REPLACE FUNCTION toggle_media_comment_like(p_comment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_exists BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be logged in to like comments';
  END IF;

  -- Check if already liked
  SELECT EXISTS (
    SELECT 1 FROM media_comment_likes
    WHERE comment_id = p_comment_id AND user_id = v_user_id
  ) INTO v_exists;

  IF v_exists THEN
    -- Unlike
    DELETE FROM media_comment_likes
    WHERE comment_id = p_comment_id AND user_id = v_user_id;
    RETURN false;
  ELSE
    -- Like
    INSERT INTO media_comment_likes (comment_id, user_id)
    VALUES (p_comment_id, v_user_id);
    RETURN true;
  END IF;
END;
$$;

-- =====================================================
-- 7. Comments
-- =====================================================

COMMENT ON TABLE media_comment_likes IS 'Likes on individual media comments';
COMMENT ON COLUMN media_comments.like_count IS 'Denormalized count of likes on this comment';
COMMENT ON FUNCTION toggle_media_comment_like(UUID) IS 'Toggle like on a comment (add if not exists, remove if exists). Returns true if liked, false if unliked.';
