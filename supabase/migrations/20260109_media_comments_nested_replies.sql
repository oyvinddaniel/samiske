-- Migration: Media Comments - Nested Replies Support
-- Date: 2026-01-09
-- Purpose: Add parent_id to media_comments for threaded/nested comment replies

-- =====================================================
-- 1. Add parent_id column
-- =====================================================

-- Add parent_id for nested comments (self-referential foreign key)
ALTER TABLE media_comments
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES media_comments(id) ON DELETE CASCADE;

-- Create index for fast parent lookup
CREATE INDEX IF NOT EXISTS idx_media_comments_parent_id
ON media_comments(parent_id) WHERE deleted_at IS NULL;

-- Create composite index for fetching top-level comments + parent combinations
CREATE INDEX IF NOT EXISTS idx_media_comments_media_parent
ON media_comments(media_id, parent_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_media_comments_post_image_parent
ON media_comments(post_image_id, parent_id) WHERE deleted_at IS NULL;

-- =====================================================
-- 2. Add reply_count column (denormalized for performance)
-- =====================================================

ALTER TABLE media_comments
ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

-- =====================================================
-- 3. Trigger: Update reply_count when replies are added/deleted
-- =====================================================

CREATE OR REPLACE FUNCTION update_media_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    -- Increment parent's reply count
    UPDATE media_comments
    SET reply_count = reply_count + 1
    WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    -- Decrement parent's reply count
    UPDATE media_comments
    SET reply_count = GREATEST(reply_count - 1, 0)
    WHERE id = OLD.parent_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle parent_id changes (unlikely but supported)
    IF OLD.parent_id IS DISTINCT FROM NEW.parent_id THEN
      IF OLD.parent_id IS NOT NULL THEN
        UPDATE media_comments
        SET reply_count = GREATEST(reply_count - 1, 0)
        WHERE id = OLD.parent_id;
      END IF;
      IF NEW.parent_id IS NOT NULL THEN
        UPDATE media_comments
        SET reply_count = reply_count + 1
        WHERE id = NEW.parent_id;
      END IF;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER media_comments_reply_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON media_comments
FOR EACH ROW
EXECUTE FUNCTION update_media_comment_reply_count();

-- =====================================================
-- 4. Function: Get comment with replies (recursive)
-- =====================================================

CREATE OR REPLACE FUNCTION get_media_comment_thread(p_comment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH RECURSIVE comment_tree AS (
    -- Root comment
    SELECT
      c.id,
      c.media_id,
      c.post_image_id,
      c.user_id,
      c.content,
      c.created_at,
      c.updated_at,
      c.parent_id,
      c.reply_count,
      0 as depth
    FROM media_comments c
    WHERE c.id = p_comment_id AND c.deleted_at IS NULL

    UNION ALL

    -- Replies (recursive)
    SELECT
      c.id,
      c.media_id,
      c.post_image_id,
      c.user_id,
      c.content,
      c.created_at,
      c.updated_at,
      c.parent_id,
      c.reply_count,
      ct.depth + 1
    FROM media_comments c
    JOIN comment_tree ct ON c.parent_id = ct.id
    WHERE c.deleted_at IS NULL
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ct.id,
      'media_id', ct.media_id,
      'post_image_id', ct.post_image_id,
      'user_id', ct.user_id,
      'content', ct.content,
      'created_at', ct.created_at,
      'updated_at', ct.updated_at,
      'parent_id', ct.parent_id,
      'reply_count', ct.reply_count,
      'depth', ct.depth,
      'user', (
        SELECT jsonb_build_object(
          'id', p.id,
          'full_name', p.full_name,
          'avatar_url', p.avatar_url
        )
        FROM profiles p
        WHERE p.id = ct.user_id
      )
    ) ORDER BY ct.created_at ASC
  ) INTO v_result
  FROM comment_tree ct;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- =====================================================
-- 5. Comments
-- =====================================================

COMMENT ON COLUMN media_comments.parent_id IS 'Parent comment ID for nested replies. NULL = top-level comment.';
COMMENT ON COLUMN media_comments.reply_count IS 'Denormalized count of direct replies (not recursive).';
COMMENT ON FUNCTION get_media_comment_thread(UUID) IS 'Recursively fetch a comment and all its nested replies with user info.';
