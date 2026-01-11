-- =====================================================
-- FIX: Profile Stats View - Riktig telling av likes
-- Dato: 2026-01-11
-- Problem: Likes ble multiplisert feil pga. JOINs
-- =====================================================

-- Drop old view
DROP VIEW IF EXISTS profile_stats;

-- Create correct view
CREATE VIEW profile_stats AS
SELECT
  p.id AS user_id,

  -- Post statistics
  COALESCE(post_stats.total_posts, 0)::BIGINT AS total_posts,
  COALESCE(post_stats.posts_last_30_days, 0)::BIGINT AS posts_last_30_days,

  -- Comment statistics (comments MADE by user)
  COALESCE(comment_stats.total_comments, 0)::BIGINT AS total_comments,

  -- Friend statistics
  COALESCE(friend_stats.friend_count, 0)::BIGINT AS friend_count,

  -- Engagement received (on user's posts)
  COALESCE(engagement_stats.total_likes_received, 0)::BIGINT AS total_likes_received,
  COALESCE(engagement_stats.total_comments_received, 0)::BIGINT AS total_comments_received,

  -- Activity metrics
  post_stats.last_post_at,
  comment_stats.last_comment_at,

  -- Join date
  p.created_at AS member_since

FROM profiles p

-- Post statistics subquery
LEFT JOIN (
  SELECT
    user_id,
    COUNT(*) AS total_posts,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS posts_last_30_days,
    MAX(created_at) AS last_post_at
  FROM posts
  GROUP BY user_id
) AS post_stats ON post_stats.user_id = p.id

-- Comment statistics subquery (comments MADE by user)
LEFT JOIN (
  SELECT
    user_id,
    COUNT(*) AS total_comments,
    MAX(created_at) AS last_comment_at
  FROM comments
  GROUP BY user_id
) AS comment_stats ON comment_stats.user_id = p.id

-- Friend statistics subquery
LEFT JOIN (
  SELECT
    user_id,
    COUNT(*) AS friend_count
  FROM (
    SELECT requester_id AS user_id FROM friendships WHERE status = 'accepted'
    UNION ALL
    SELECT addressee_id AS user_id FROM friendships WHERE status = 'accepted'
  ) AS all_friendships
  GROUP BY user_id
) AS friend_stats ON friend_stats.user_id = p.id

-- Engagement received subquery (likes and comments ON user's posts)
LEFT JOIN (
  SELECT
    posts.user_id,
    COUNT(DISTINCT likes.id) AS total_likes_received,
    COUNT(DISTINCT comments.id) AS total_comments_received
  FROM posts
  LEFT JOIN likes ON likes.post_id = posts.id
  LEFT JOIN comments ON comments.post_id = posts.id
  GROUP BY posts.user_id
) AS engagement_stats ON engagement_stats.user_id = p.id;

COMMENT ON VIEW profile_stats IS 'Aggregated user profile statistics - FIXED version without duplicate counting';
