-- Migration: Archive Posts Feature
-- Allows users to archive their posts (hide from public feeds but keep accessible)

-- Add is_archived column to posts
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Add archived_at timestamp
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_posts_is_archived ON public.posts(is_archived);

-- Function to archive/unarchive a post
CREATE OR REPLACE FUNCTION toggle_archive_post(p_post_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_is_archived BOOLEAN;
  v_archived_at TIMESTAMPTZ;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.posts
    WHERE id = p_post_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Not authorized to archive this post';
  END IF;

  -- Toggle archive status
  UPDATE public.posts
  SET
    is_archived = NOT is_archived,
    archived_at = CASE
      WHEN is_archived = FALSE THEN NOW()
      ELSE NULL
    END
  WHERE id = p_post_id
  RETURNING is_archived, archived_at INTO v_is_archived, v_archived_at;

  RETURN json_build_object(
    'is_archived', v_is_archived,
    'archived_at', v_archived_at
  );
END;
$$;

-- Function to get user's archived posts
CREATE OR REPLACE FUNCTION get_archived_posts(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  image_url TEXT,
  type TEXT,
  created_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  like_count INT,
  comment_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.content,
    p.image_url,
    p.type,
    p.created_at,
    p.archived_at,
    p.like_count,
    p.comment_count
  FROM public.posts p
  WHERE p.user_id = v_user_id
    AND p.is_archived = TRUE
  ORDER BY p.archived_at DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Update the main feed queries to exclude archived posts
-- Note: This is handled in the application code by adding is_archived = false filter
-- But we can create a view for convenience

CREATE OR REPLACE VIEW public.visible_posts AS
SELECT *
FROM public.posts
WHERE is_archived = FALSE
  AND scheduled_for IS NULL
  OR scheduled_for <= NOW();
