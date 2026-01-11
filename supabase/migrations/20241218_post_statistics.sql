-- Migration: Post Statistics/Analytics
-- Tracks views and engagement metrics for post owners

-- Add view_count column to posts
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;

-- Create post_views table for tracking unique views
CREATE TABLE IF NOT EXISTS public.post_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Can be null for anonymous views
  session_id TEXT, -- For anonymous view tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Unique constraint to prevent duplicate views from same user/session
  UNIQUE(post_id, user_id),
  UNIQUE(post_id, session_id)
);

-- Enable RLS
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Post views insertable by anyone" ON public.post_views;
CREATE POLICY "Post views insertable by anyone"
ON public.post_views FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Post views viewable by post owner" ON public.post_views;
CREATE POLICY "Post views viewable by post owner"
ON public.post_views FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = post_id AND p.user_id = auth.uid()
  )
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON public.post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_created_at ON public.post_views(created_at);

-- Function to record a view
CREATE OR REPLACE FUNCTION record_post_view(
  p_post_id UUID,
  p_session_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_inserted BOOLEAN := FALSE;
BEGIN
  v_user_id := auth.uid();

  -- Try to insert a new view record
  BEGIN
    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.post_views (post_id, user_id)
      VALUES (p_post_id, v_user_id)
      ON CONFLICT (post_id, user_id) DO NOTHING;
    ELSIF p_session_id IS NOT NULL THEN
      INSERT INTO public.post_views (post_id, session_id)
      VALUES (p_post_id, p_session_id)
      ON CONFLICT (post_id, session_id) DO NOTHING;
    ELSE
      RETURN FALSE;
    END IF;

    -- Check if insert happened
    IF FOUND THEN
      v_inserted := TRUE;
      -- Increment view count
      UPDATE public.posts
      SET view_count = view_count + 1
      WHERE id = p_post_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore duplicate key errors
    NULL;
  END;

  RETURN v_inserted;
END;
$$;

-- Function to get post statistics (for post owner)
CREATE OR REPLACE FUNCTION get_post_statistics(p_post_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_post_owner_id UUID;
  v_stats JSON;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify ownership
  SELECT user_id INTO v_post_owner_id
  FROM public.posts
  WHERE id = p_post_id;

  IF v_post_owner_id != v_user_id THEN
    RAISE EXCEPTION 'Not authorized to view statistics for this post';
  END IF;

  SELECT json_build_object(
    'view_count', p.view_count,
    'like_count', p.like_count,
    'comment_count', p.comment_count,
    'bookmark_count', (SELECT COUNT(*) FROM public.bookmarks b WHERE b.post_id = p_post_id),
    'share_count', COALESCE(p.share_count, 0),
    'unique_viewers', (SELECT COUNT(DISTINCT COALESCE(user_id::text, session_id)) FROM public.post_views pv WHERE pv.post_id = p_post_id),
    'views_last_7_days', (
      SELECT COUNT(*)
      FROM public.post_views pv
      WHERE pv.post_id = p_post_id
        AND pv.created_at >= NOW() - INTERVAL '7 days'
    ),
    'views_last_30_days', (
      SELECT COUNT(*)
      FROM public.post_views pv
      WHERE pv.post_id = p_post_id
        AND pv.created_at >= NOW() - INTERVAL '30 days'
    ),
    'reaction_breakdown', (
      SELECT json_object_agg(reaction_type, cnt)
      FROM (
        SELECT reaction_type, COUNT(*) as cnt
        FROM public.likes
        WHERE post_id = p_post_id
        GROUP BY reaction_type
      ) r
    ),
    'views_by_day', (
      SELECT json_agg(
        json_build_object(
          'date', day,
          'views', view_count
        )
        ORDER BY day DESC
      )
      FROM (
        SELECT DATE(created_at) as day, COUNT(*) as view_count
        FROM public.post_views
        WHERE post_id = p_post_id
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
      ) d
    )
  ) INTO v_stats
  FROM public.posts p
  WHERE p.id = p_post_id;

  RETURN v_stats;
END;
$$;

-- Add share_count column if not exists
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS share_count INT DEFAULT 0;

-- Function to record a share
CREATE OR REPLACE FUNCTION record_post_share(p_post_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_count INT;
BEGIN
  UPDATE public.posts
  SET share_count = share_count + 1
  WHERE id = p_post_id
  RETURNING share_count INTO v_new_count;

  RETURN v_new_count;
END;
$$;
