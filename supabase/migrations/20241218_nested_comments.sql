-- Migration: Nested Comments Support
-- Adds parent_id for threaded/nested comments with infinite hierarchy

-- Add parent_id column to comments
ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);

-- Add index for post_id + parent_id combo
CREATE INDEX IF NOT EXISTS idx_comments_post_parent ON public.comments(post_id, parent_id);

-- Add reply_count column for quick counts
ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS reply_count INT DEFAULT 0;

-- Add like_count column for comment likes
ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS like_count INT DEFAULT 0;

-- Add is_pinned column for pinned comments
ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Create comment_likes table if not exists
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS on comment_likes
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for comment_likes
DROP POLICY IF EXISTS "Comment likes viewable by all" ON public.comment_likes;
CREATE POLICY "Comment likes viewable by all"
ON public.comment_likes FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can like comments" ON public.comment_likes;
CREATE POLICY "Users can like comments"
ON public.comment_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike their likes" ON public.comment_likes;
CREATE POLICY "Users can unlike their likes"
ON public.comment_likes FOR DELETE
USING (auth.uid() = user_id);

-- Function to get hierarchical comments for a post
CREATE OR REPLACE FUNCTION get_nested_comments(
  p_post_id UUID,
  p_current_user_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH RECURSIVE comment_tree AS (
    -- Base case: root comments (no parent)
    SELECT
      c.id,
      c.content,
      c.parent_id,
      c.created_at,
      c.updated_at,
      c.like_count,
      c.reply_count,
      c.is_pinned,
      c.user_id,
      p.full_name as user_name,
      p.avatar_url as user_avatar,
      0 as depth,
      ARRAY[c.created_at, c.id] as sort_path
    FROM public.comments c
    JOIN public.profiles p ON c.user_id = p.id
    WHERE c.post_id = p_post_id AND c.parent_id IS NULL

    UNION ALL

    -- Recursive case: replies
    SELECT
      c.id,
      c.content,
      c.parent_id,
      c.created_at,
      c.updated_at,
      c.like_count,
      c.reply_count,
      c.is_pinned,
      c.user_id,
      p.full_name as user_name,
      p.avatar_url as user_avatar,
      ct.depth + 1,
      ct.sort_path || ARRAY[c.created_at, c.id]
    FROM public.comments c
    JOIN public.profiles p ON c.user_id = p.id
    JOIN comment_tree ct ON c.parent_id = ct.id
    WHERE c.post_id = p_post_id
  )
  SELECT json_agg(
    json_build_object(
      'id', ct.id,
      'content', ct.content,
      'parent_id', ct.parent_id,
      'created_at', ct.created_at,
      'updated_at', ct.updated_at,
      'like_count', ct.like_count,
      'reply_count', ct.reply_count,
      'is_pinned', ct.is_pinned,
      'depth', ct.depth,
      'user', json_build_object(
        'id', ct.user_id,
        'full_name', ct.user_name,
        'avatar_url', ct.user_avatar
      ),
      'user_has_liked', EXISTS (
        SELECT 1 FROM public.comment_likes cl
        WHERE cl.comment_id = ct.id
        AND cl.user_id = p_current_user_id
      )
    )
    ORDER BY ct.is_pinned DESC, ct.sort_path ASC
  ) INTO result
  FROM comment_tree ct;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Function to add a comment (with optional parent)
CREATE OR REPLACE FUNCTION add_comment(
  p_post_id UUID,
  p_content TEXT,
  p_parent_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_comment_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Insert the comment
  INSERT INTO public.comments (post_id, user_id, content, parent_id)
  VALUES (p_post_id, v_user_id, p_content, p_parent_id)
  RETURNING id INTO v_comment_id;

  -- Update reply count on parent if this is a reply
  IF p_parent_id IS NOT NULL THEN
    UPDATE public.comments
    SET reply_count = reply_count + 1
    WHERE id = p_parent_id;
  END IF;

  -- Update comment count on post
  UPDATE public.posts
  SET comment_count = comment_count + 1
  WHERE id = p_post_id;

  RETURN v_comment_id;
END;
$$;

-- Function to toggle comment like
CREATE OR REPLACE FUNCTION toggle_comment_like(p_comment_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_exists BOOLEAN;
  v_new_count INT;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if like exists
  SELECT EXISTS (
    SELECT 1 FROM public.comment_likes
    WHERE comment_id = p_comment_id AND user_id = v_user_id
  ) INTO v_exists;

  IF v_exists THEN
    -- Remove like
    DELETE FROM public.comment_likes
    WHERE comment_id = p_comment_id AND user_id = v_user_id;

    UPDATE public.comments
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = p_comment_id
    RETURNING like_count INTO v_new_count;

    RETURN json_build_object('liked', false, 'like_count', v_new_count);
  ELSE
    -- Add like
    INSERT INTO public.comment_likes (comment_id, user_id)
    VALUES (p_comment_id, v_user_id);

    UPDATE public.comments
    SET like_count = like_count + 1
    WHERE id = p_comment_id
    RETURNING like_count INTO v_new_count;

    RETURN json_build_object('liked', true, 'like_count', v_new_count);
  END IF;
END;
$$;

-- Function to delete comment (with cascading reply count update)
CREATE OR REPLACE FUNCTION delete_comment(p_comment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_comment RECORD;
  v_descendant_count INT;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get comment details
  SELECT * INTO v_comment
  FROM public.comments
  WHERE id = p_comment_id;

  IF v_comment IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check ownership
  IF v_comment.user_id != v_user_id THEN
    RAISE EXCEPTION 'Not authorized to delete this comment';
  END IF;

  -- Count all descendants
  WITH RECURSIVE descendants AS (
    SELECT id FROM public.comments WHERE id = p_comment_id
    UNION ALL
    SELECT c.id FROM public.comments c
    JOIN descendants d ON c.parent_id = d.id
  )
  SELECT COUNT(*) INTO v_descendant_count FROM descendants;

  -- Update parent reply count if this is a reply
  IF v_comment.parent_id IS NOT NULL THEN
    UPDATE public.comments
    SET reply_count = GREATEST(reply_count - 1, 0)
    WHERE id = v_comment.parent_id;
  END IF;

  -- Update post comment count
  UPDATE public.posts
  SET comment_count = GREATEST(comment_count - v_descendant_count, 0)
  WHERE id = v_comment.post_id;

  -- Delete the comment (cascades to replies due to FK)
  DELETE FROM public.comments WHERE id = p_comment_id;

  RETURN TRUE;
END;
$$;

-- Function to pin/unpin a comment (for post owner)
CREATE OR REPLACE FUNCTION toggle_pin_comment(p_comment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_post_owner_id UUID;
  v_is_pinned BOOLEAN;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get post owner
  SELECT p.user_id INTO v_post_owner_id
  FROM public.comments c
  JOIN public.posts p ON c.post_id = p.id
  WHERE c.id = p_comment_id;

  -- Only post owner can pin
  IF v_post_owner_id != v_user_id THEN
    RAISE EXCEPTION 'Only post owner can pin comments';
  END IF;

  -- Toggle pin
  UPDATE public.comments
  SET is_pinned = NOT is_pinned
  WHERE id = p_comment_id
  RETURNING is_pinned INTO v_is_pinned;

  RETURN v_is_pinned;
END;
$$;
