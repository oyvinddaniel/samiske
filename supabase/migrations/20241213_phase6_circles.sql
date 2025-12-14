-- Phase 6: Friend Circles and Visibility
-- Vennesirkler for finkornet synlighetskontroll

-- ============================================
-- FRIEND CIRCLES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS friend_circles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6', -- Default blue
  icon TEXT DEFAULT 'users', -- Lucide icon name
  position INT DEFAULT 0, -- For ordering
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique names per user
  UNIQUE(user_id, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_friend_circles_user ON friend_circles(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_circles_position ON friend_circles(user_id, position);

-- Enable RLS
ALTER TABLE friend_circles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friend_circles
DROP POLICY IF EXISTS "Users can view own circles" ON friend_circles;
CREATE POLICY "Users can view own circles" ON friend_circles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own circles" ON friend_circles;
CREATE POLICY "Users can create own circles" ON friend_circles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own circles" ON friend_circles;
CREATE POLICY "Users can update own circles" ON friend_circles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own circles" ON friend_circles;
CREATE POLICY "Users can delete own circles" ON friend_circles
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FRIEND CIRCLE MEMBERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS friend_circle_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES friend_circles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Each friend can only be in a circle once
  UNIQUE(circle_id, friend_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_circle_members_circle ON friend_circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_friend ON friend_circle_members(friend_id);

-- Enable RLS
ALTER TABLE friend_circle_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friend_circle_members
DROP POLICY IF EXISTS "Users can view members of own circles" ON friend_circle_members;
CREATE POLICY "Users can view members of own circles" ON friend_circle_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friend_circles
      WHERE friend_circles.id = friend_circle_members.circle_id
      AND friend_circles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can add members to own circles" ON friend_circle_members;
CREATE POLICY "Users can add members to own circles" ON friend_circle_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM friend_circles
      WHERE friend_circles.id = friend_circle_members.circle_id
      AND friend_circles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can remove members from own circles" ON friend_circle_members;
CREATE POLICY "Users can remove members from own circles" ON friend_circle_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM friend_circles
      WHERE friend_circles.id = friend_circle_members.circle_id
      AND friend_circles.user_id = auth.uid()
    )
  );

-- ============================================
-- POST VISIBILITY TABLE
-- ============================================
-- For posts with visibility='circles', this table specifies which circles can see it

CREATE TABLE IF NOT EXISTS post_circle_visibility (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  circle_id UUID NOT NULL REFERENCES friend_circles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(post_id, circle_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_post_circle_visibility_post ON post_circle_visibility(post_id);
CREATE INDEX IF NOT EXISTS idx_post_circle_visibility_circle ON post_circle_visibility(circle_id);

-- Enable RLS
ALTER TABLE post_circle_visibility ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_circle_visibility
DROP POLICY IF EXISTS "Post authors can manage visibility" ON post_circle_visibility;
CREATE POLICY "Post authors can manage visibility" ON post_circle_visibility
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_circle_visibility.post_id
      AND posts.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Circle members can see post visibility" ON post_circle_visibility;
CREATE POLICY "Circle members can see post visibility" ON post_circle_visibility
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friend_circle_members
      WHERE friend_circle_members.circle_id = post_circle_visibility.circle_id
      AND friend_circle_members.friend_id = auth.uid()
    )
  );

-- ============================================
-- UPDATE POSTS TABLE
-- ============================================
-- Add new visibility options

-- First check current constraint
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_visibility_check;

  -- Add new constraint with expanded options
  ALTER TABLE posts ADD CONSTRAINT posts_visibility_check
    CHECK (visibility IN ('public', 'members', 'friends', 'circles', 'only_me'));
EXCEPTION
  WHEN others THEN
    -- If constraint doesn't exist, just add it
    ALTER TABLE posts ADD CONSTRAINT posts_visibility_check
      CHECK (visibility IN ('public', 'members', 'friends', 'circles', 'only_me'));
END $$;

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Create a new circle
CREATE OR REPLACE FUNCTION create_friend_circle(
  p_name TEXT,
  p_color TEXT DEFAULT '#3B82F6',
  p_icon TEXT DEFAULT 'users'
)
RETURNS UUID AS $$
DECLARE
  v_circle_id UUID;
  v_max_position INT;
BEGIN
  -- Get max position for ordering
  SELECT COALESCE(MAX(position), -1) + 1 INTO v_max_position
  FROM friend_circles
  WHERE user_id = auth.uid();

  -- Insert circle
  INSERT INTO friend_circles (user_id, name, color, icon, position)
  VALUES (auth.uid(), p_name, p_color, p_icon, v_max_position)
  RETURNING id INTO v_circle_id;

  RETURN v_circle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add friend to circle
CREATE OR REPLACE FUNCTION add_friend_to_circle(
  p_circle_id UUID,
  p_friend_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verify the circle belongs to current user
  IF NOT EXISTS (
    SELECT 1 FROM friend_circles
    WHERE id = p_circle_id AND user_id = auth.uid()
  ) THEN
    RETURN FALSE;
  END IF;

  -- Verify they are actually friends
  IF NOT EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
    AND (
      (requester_id = auth.uid() AND addressee_id = p_friend_id)
      OR (requester_id = p_friend_id AND addressee_id = auth.uid())
    )
  ) THEN
    RETURN FALSE;
  END IF;

  -- Add to circle
  INSERT INTO friend_circle_members (circle_id, friend_id)
  VALUES (p_circle_id, p_friend_id)
  ON CONFLICT (circle_id, friend_id) DO NOTHING;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove friend from circle
CREATE OR REPLACE FUNCTION remove_friend_from_circle(
  p_circle_id UUID,
  p_friend_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM friend_circle_members
  WHERE circle_id = p_circle_id
  AND friend_id = p_friend_id
  AND EXISTS (
    SELECT 1 FROM friend_circles
    WHERE id = p_circle_id AND user_id = auth.uid()
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's circles with member count
CREATE OR REPLACE FUNCTION get_user_circles()
RETURNS TABLE (
  id UUID,
  name TEXT,
  color TEXT,
  icon TEXT,
  position INT,
  member_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fc.id,
    fc.name,
    fc.color,
    fc.icon,
    fc.position,
    COUNT(fcm.id)::BIGINT AS member_count
  FROM friend_circles fc
  LEFT JOIN friend_circle_members fcm ON fc.id = fcm.circle_id
  WHERE fc.user_id = auth.uid()
  GROUP BY fc.id, fc.name, fc.color, fc.icon, fc.position
  ORDER BY fc.position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get members of a specific circle
CREATE OR REPLACE FUNCTION get_circle_members(p_circle_id UUID)
RETURNS TABLE (
  id UUID,
  friend_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  added_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Verify circle belongs to user
  IF NOT EXISTS (
    SELECT 1 FROM friend_circles
    WHERE id = p_circle_id AND user_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    fcm.id,
    fcm.friend_id,
    p.full_name,
    p.avatar_url,
    fcm.added_at
  FROM friend_circle_members fcm
  INNER JOIN profiles p ON fcm.friend_id = p.id
  WHERE fcm.circle_id = p_circle_id
  ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get circles a specific friend is in
CREATE OR REPLACE FUNCTION get_friend_circles(p_friend_id UUID)
RETURNS TABLE (
  circle_id UUID,
  circle_name TEXT,
  circle_color TEXT,
  circle_icon TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fc.id,
    fc.name,
    fc.color,
    fc.icon
  FROM friend_circles fc
  INNER JOIN friend_circle_members fcm ON fc.id = fcm.circle_id
  WHERE fc.user_id = auth.uid()
  AND fcm.friend_id = p_friend_id
  ORDER BY fc.position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can view a post based on visibility
CREATE OR REPLACE FUNCTION can_view_post(p_post_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_post RECORD;
  v_viewer_id UUID;
BEGIN
  v_viewer_id := auth.uid();

  -- Get post info
  SELECT user_id, visibility INTO v_post
  FROM posts WHERE id = p_post_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Author can always see their own posts
  IF v_post.user_id = v_viewer_id THEN
    RETURN TRUE;
  END IF;

  -- Check based on visibility
  CASE v_post.visibility
    WHEN 'public' THEN
      RETURN TRUE;

    WHEN 'friends' THEN
      RETURN EXISTS (
        SELECT 1 FROM friendships
        WHERE status = 'accepted'
        AND (
          (requester_id = v_post.user_id AND addressee_id = v_viewer_id)
          OR (requester_id = v_viewer_id AND addressee_id = v_post.user_id)
        )
      );

    WHEN 'circles' THEN
      -- Check if viewer is in any of the post's circles
      RETURN EXISTS (
        SELECT 1 FROM post_circle_visibility pcv
        INNER JOIN friend_circle_members fcm ON pcv.circle_id = fcm.circle_id
        WHERE pcv.post_id = p_post_id
        AND fcm.friend_id = v_viewer_id
      );

    WHEN 'only_me' THEN
      RETURN FALSE;

    ELSE
      -- 'members' or other - default to public for now
      RETURN TRUE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set post visibility to specific circles
CREATE OR REPLACE FUNCTION set_post_circle_visibility(
  p_post_id UUID,
  p_circle_ids UUID[]
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verify post belongs to user
  IF NOT EXISTS (
    SELECT 1 FROM posts
    WHERE id = p_post_id AND user_id = auth.uid()
  ) THEN
    RETURN FALSE;
  END IF;

  -- Update post visibility
  UPDATE posts SET visibility = 'circles' WHERE id = p_post_id;

  -- Clear existing circle visibility
  DELETE FROM post_circle_visibility WHERE post_id = p_post_id;

  -- Insert new circle visibility
  INSERT INTO post_circle_visibility (post_id, circle_id)
  SELECT p_post_id, unnest(p_circle_ids);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_friend_circle TO authenticated;
GRANT EXECUTE ON FUNCTION add_friend_to_circle TO authenticated;
GRANT EXECUTE ON FUNCTION remove_friend_from_circle TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_circles TO authenticated;
GRANT EXECUTE ON FUNCTION get_circle_members TO authenticated;
GRANT EXECUTE ON FUNCTION get_friend_circles TO authenticated;
GRANT EXECUTE ON FUNCTION can_view_post TO authenticated;
GRANT EXECUTE ON FUNCTION set_post_circle_visibility TO authenticated;

-- ============================================
-- DEFAULT CIRCLES (created via trigger for new users)
-- ============================================

CREATE OR REPLACE FUNCTION create_default_circles()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default circles for new user
  INSERT INTO friend_circles (user_id, name, color, icon, position) VALUES
    (NEW.id, 'Familie', '#EF4444', 'heart', 0),
    (NEW.id, 'Nære venner', '#F59E0B', 'star', 1),
    (NEW.id, 'Kolleger', '#10B981', 'briefcase', 2);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_create_default_circles ON profiles;
CREATE TRIGGER trigger_create_default_circles
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_circles();
