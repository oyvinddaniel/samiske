-- ================================================
-- MIGRATION: Post Improvements
-- Date: 2026-01-10
-- Description: Soft delete, edit tracking for posts and comments
-- ================================================

-- 1. SOFT DELETE FOR POSTS
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Index for filtering out deleted posts
CREATE INDEX IF NOT EXISTS idx_posts_not_deleted
ON posts(created_at DESC)
WHERE deleted_at IS NULL;

-- 2. EDIT TRACKING FOR POSTS
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS edit_count INT DEFAULT 0;

-- 3. EDIT TRACKING FOR COMMENTS
ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- 4. SOFT DELETE FOR COMMENTS
ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id);

-- Index for comments
CREATE INDEX IF NOT EXISTS idx_comments_not_deleted
ON comments(created_at ASC)
WHERE deleted_at IS NULL;

-- 5. UPDATE TRIGGER FOR EDIT TRACKING (Posts)
CREATE OR REPLACE FUNCTION set_edited_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set edited_at if content actually changed (not on reactions/counts)
  IF (OLD.title IS DISTINCT FROM NEW.title OR OLD.content IS DISTINCT FROM NEW.content) THEN
    NEW.edited_at = NOW();
    NEW.edit_count = COALESCE(OLD.edit_count, 0) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS posts_edited_timestamp ON public.posts;
CREATE TRIGGER posts_edited_timestamp
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION set_edited_timestamp();

-- 6. UPDATE TRIGGER FOR EDIT TRACKING (Comments)
CREATE OR REPLACE FUNCTION set_comment_edited_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    NEW.edited_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comments_edited_timestamp ON public.comments;
CREATE TRIGGER comments_edited_timestamp
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION set_comment_edited_timestamp();

-- 7. SOFT DELETE FUNCTION FOR POSTS
CREATE OR REPLACE FUNCTION soft_delete_post(
  p_post_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM posts
    WHERE id = p_post_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Soft delete
  UPDATE posts
  SET
    deleted_at = NOW(),
    deleted_by = v_user_id,
    deletion_reason = p_reason
  WHERE id = p_post_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RESTORE POST FUNCTION
CREATE OR REPLACE FUNCTION restore_post(p_post_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM posts
    WHERE id = p_post_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Restore
  UPDATE posts
  SET
    deleted_at = NULL,
    deleted_by = NULL,
    deletion_reason = NULL
  WHERE id = p_post_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. UPDATE RLS POLICIES TO EXCLUDE SOFT-DELETED
-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Posts SELECT policy" ON posts;

-- Recreate with deleted_at check
CREATE POLICY "Posts SELECT policy"
ON posts FOR SELECT
USING (
  deleted_at IS NULL AND (
    -- Original conditions
    visibility = 'public'
    OR auth.uid() = user_id
    OR (visibility = 'members' AND auth.uid() IS NOT NULL)
  )
);

-- Owner can see their own deleted posts
CREATE POLICY "Posts SELECT own deleted"
ON posts FOR SELECT
USING (
  deleted_at IS NOT NULL AND auth.uid() = user_id
);

-- 10. UPDATE visible_posts VIEW
DROP VIEW IF EXISTS visible_posts;
CREATE OR REPLACE VIEW visible_posts AS
SELECT *
FROM posts
WHERE
  deleted_at IS NULL
  AND is_archived = FALSE
  AND (scheduled_for IS NULL OR scheduled_for <= NOW());

-- 11. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION soft_delete_post TO authenticated;
GRANT EXECUTE ON FUNCTION restore_post TO authenticated;

-- ================================================
-- END MIGRATION
-- ================================================
