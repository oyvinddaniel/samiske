-- =====================================================
-- OPTIMIZED NOTIFICATION RPC
-- Single query instead of N+1 pattern
-- Date: 2024-12-15
-- =====================================================

CREATE OR REPLACE FUNCTION get_notification_summary(p_user_id UUID)
RETURNS TABLE (
  total_count INTEGER,
  new_posts_count INTEGER,
  comments_on_my_posts_count INTEGER,
  comments_on_followed_count INTEGER,
  likes_count INTEGER,
  recent_notifications JSONB
) AS $$
DECLARE
  v_last_seen_at TIMESTAMPTZ;
  v_history_date TIMESTAMPTZ;
BEGIN
  -- Get user's last_seen_at
  SELECT COALESCE(last_seen_at, '1970-01-01'::TIMESTAMPTZ)
  INTO v_last_seen_at
  FROM profiles
  WHERE id = p_user_id;

  v_history_date := NOW() - INTERVAL '7 days';

  -- Return aggregated counts + recent items in one query
  RETURN QUERY
  WITH my_posts AS (
    SELECT id FROM posts WHERE user_id = p_user_id
  ),
  my_comments AS (
    SELECT DISTINCT post_id FROM comments WHERE user_id = p_user_id
  ),
  new_posts AS (
    SELECT COUNT(*) AS cnt
    FROM posts
    WHERE created_at > v_last_seen_at
      AND user_id != p_user_id
      AND visibility = 'public'
  ),
  new_comments_on_mine AS (
    SELECT COUNT(*) AS cnt
    FROM comments c
    WHERE c.post_id IN (SELECT id FROM my_posts)
      AND c.created_at > v_last_seen_at
      AND c.user_id != p_user_id
  ),
  new_comments_on_followed AS (
    SELECT COUNT(*) AS cnt
    FROM comments c
    WHERE c.post_id IN (SELECT post_id FROM my_comments)
      AND c.post_id NOT IN (SELECT id FROM my_posts)
      AND c.created_at > v_last_seen_at
      AND c.user_id != p_user_id
  ),
  new_likes AS (
    SELECT COUNT(*) AS cnt
    FROM likes l
    WHERE l.post_id IN (SELECT id FROM my_posts)
      AND l.created_at > v_last_seen_at
      AND l.user_id != p_user_id
  ),
  recent_items AS (
    -- Get recent comments on my posts
    SELECT
      'comment_on_my_post' AS type,
      c.id::TEXT AS item_id,
      c.created_at,
      c.created_at > v_last_seen_at AS is_new,
      jsonb_build_object(
        'id', 'comment-' || c.id,
        'type', 'comment_on_my_post',
        'message', 'kommenterte på innlegget ditt',
        'postId', p.id,
        'postTitle', p.title,
        'actorName', pr.full_name,
        'actorAvatar', pr.avatar_url,
        'createdAt', c.created_at,
        'isNew', c.created_at > v_last_seen_at
      ) AS notification_data
    FROM comments c
    JOIN posts p ON p.id = c.post_id
    JOIN profiles pr ON pr.id = c.user_id
    WHERE c.post_id IN (SELECT id FROM my_posts)
      AND c.created_at > v_history_date
      AND c.user_id != p_user_id

    UNION ALL

    -- Get recent likes on my posts
    SELECT
      'like_on_my_post' AS type,
      l.id::TEXT AS item_id,
      l.created_at,
      l.created_at > v_last_seen_at AS is_new,
      jsonb_build_object(
        'id', 'like-' || l.id,
        'type', 'like_on_my_post',
        'message', 'likte innlegget ditt',
        'postId', p.id,
        'postTitle', p.title,
        'actorName', pr.full_name,
        'actorAvatar', pr.avatar_url,
        'createdAt', l.created_at,
        'isNew', l.created_at > v_last_seen_at
      ) AS notification_data
    FROM likes l
    JOIN posts p ON p.id = l.post_id
    JOIN profiles pr ON pr.id = l.user_id
    WHERE l.post_id IN (SELECT id FROM my_posts)
      AND l.created_at > v_history_date
      AND l.user_id != p_user_id

    UNION ALL

    -- Get recent new posts
    SELECT
      'new_post' AS type,
      p.id::TEXT AS item_id,
      p.created_at,
      p.created_at > v_last_seen_at AS is_new,
      jsonb_build_object(
        'id', 'post-' || p.id,
        'type', 'new_post',
        'message', 'opprettet et nytt innlegg',
        'postId', p.id,
        'postTitle', p.title,
        'actorName', pr.full_name,
        'actorAvatar', pr.avatar_url,
        'createdAt', p.created_at,
        'isNew', p.created_at > v_last_seen_at
      ) AS notification_data
    FROM posts p
    JOIN profiles pr ON pr.id = p.user_id
    WHERE p.created_at > v_history_date
      AND p.user_id != p_user_id
      AND p.visibility = 'public'
    ORDER BY created_at DESC
    LIMIT 15
  )
  SELECT
    (SELECT COALESCE(SUM(cnt), 0)::INTEGER FROM (
      SELECT cnt FROM new_posts UNION ALL
      SELECT cnt FROM new_comments_on_mine UNION ALL
      SELECT cnt FROM new_comments_on_followed UNION ALL
      SELECT cnt FROM new_likes
    ) AS counts) AS total_count,
    (SELECT COALESCE(cnt, 0)::INTEGER FROM new_posts) AS new_posts_count,
    (SELECT COALESCE(cnt, 0)::INTEGER FROM new_comments_on_mine) AS comments_on_my_posts_count,
    (SELECT COALESCE(cnt, 0)::INTEGER FROM new_comments_on_followed) AS comments_on_followed_count,
    (SELECT COALESCE(cnt, 0)::INTEGER FROM new_likes) AS likes_count,
    (SELECT jsonb_agg(notification_data ORDER BY created_at DESC) FROM recent_items) AS recent_notifications;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_notification_summary TO authenticated;

COMMENT ON FUNCTION get_notification_summary IS
  'Returns notification summary with counts and recent items in a single optimized query. Replaces N+1 polling pattern with single RPC call.';

-- Add indexes to improve performance
CREATE INDEX IF NOT EXISTS idx_posts_created_visibility
  ON posts(created_at DESC, visibility) WHERE visibility = 'public';

CREATE INDEX IF NOT EXISTS idx_comments_created_user
  ON comments(created_at DESC, user_id);

CREATE INDEX IF NOT EXISTS idx_likes_created_user
  ON likes(created_at DESC, user_id);

-- Enable Realtime for notification-related tables (if not already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS posts;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS comments;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS likes;

-- Verification test
DO $$
DECLARE
  test_result RECORD;
BEGIN
  -- Test with a dummy UUID (will return zeros but shouldn't error)
  SELECT * INTO test_result
  FROM get_notification_summary('00000000-0000-0000-0000-000000000000'::UUID);

  RAISE NOTICE 'Notification RPC test completed successfully';
  RAISE NOTICE 'Total count: %, New posts: %, Comments on my posts: %, Likes: %',
    test_result.total_count,
    test_result.new_posts_count,
    test_result.comments_on_my_posts_count,
    test_result.likes_count;
END $$;
