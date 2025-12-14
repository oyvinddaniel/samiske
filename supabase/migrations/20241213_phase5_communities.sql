-- Phase 5: Communities/Samfunn
-- Organisasjoner og bedriftssider med følgersystem

-- ============================================
-- COMMUNITIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  website_url TEXT,
  email TEXT,
  phone TEXT,

  -- Location (optional)
  municipality_id UUID REFERENCES municipalities(id) ON DELETE SET NULL,
  place_id UUID REFERENCES places(id) ON DELETE SET NULL,
  address TEXT,

  -- Category
  category TEXT DEFAULT 'organization' CHECK (category IN (
    'organization',  -- Organisasjon
    'business',      -- Bedrift
    'institution',   -- Institusjon
    'association',   -- Forening
    'cultural',      -- Kulturinstitusjon
    'educational',   -- Utdanning
    'government',    -- Offentlig
    'other'          -- Annet
  )),

  -- Metadata
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Counters (updated by triggers)
  follower_count INT DEFAULT 0,
  post_count INT DEFAULT 0,

  -- Settings
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_communities_slug ON communities(slug);
CREATE INDEX IF NOT EXISTS idx_communities_category ON communities(category);
CREATE INDEX IF NOT EXISTS idx_communities_municipality ON communities(municipality_id);
CREATE INDEX IF NOT EXISTS idx_communities_created_by ON communities(created_by);

-- Enable RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for communities
DROP POLICY IF EXISTS "Anyone can view active communities" ON communities;
CREATE POLICY "Anyone can view active communities" ON communities
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Authenticated users can create communities" ON communities;
CREATE POLICY "Authenticated users can create communities" ON communities
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

DROP POLICY IF EXISTS "Community admins can update" ON communities;
CREATE POLICY "Community admins can update" ON communities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM community_admins
      WHERE community_admins.community_id = communities.id
      AND community_admins.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Only super admins can delete communities" ON communities;
CREATE POLICY "Only super admins can delete communities" ON communities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM community_admins
      WHERE community_admins.community_id = communities.id
      AND community_admins.user_id = auth.uid()
      AND community_admins.role = 'owner'
    )
  );

-- ============================================
-- COMMUNITY ADMINS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS community_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin', 'editor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(community_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_community_admins_community ON community_admins(community_id);
CREATE INDEX IF NOT EXISTS idx_community_admins_user ON community_admins(user_id);

-- Enable RLS
ALTER TABLE community_admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_admins
DROP POLICY IF EXISTS "Anyone can see community admins" ON community_admins;
CREATE POLICY "Anyone can see community admins" ON community_admins
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Community owners can manage admins" ON community_admins;
CREATE POLICY "Community owners can manage admins" ON community_admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM community_admins AS ca
      WHERE ca.community_id = community_admins.community_id
      AND ca.user_id = auth.uid()
      AND ca.role = 'owner'
    )
  );

-- ============================================
-- COMMUNITY FOLLOWERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS community_followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Notification preferences
  notify_posts BOOLEAN DEFAULT TRUE,
  notify_events BOOLEAN DEFAULT TRUE,

  UNIQUE(community_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_community_followers_community ON community_followers(community_id);
CREATE INDEX IF NOT EXISTS idx_community_followers_user ON community_followers(user_id);

-- Enable RLS
ALTER TABLE community_followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_followers
DROP POLICY IF EXISTS "Anyone can see follower counts" ON community_followers;
CREATE POLICY "Anyone can see follower counts" ON community_followers
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Authenticated users can follow" ON community_followers;
CREATE POLICY "Authenticated users can follow" ON community_followers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unfollow" ON community_followers;
CREATE POLICY "Users can unfollow" ON community_followers
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their follow preferences" ON community_followers;
CREATE POLICY "Users can update their follow preferences" ON community_followers
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- COMMUNITY POSTS JUNCTION TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(community_id, post_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_community ON community_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_post ON community_posts(post_id);

-- Enable RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_posts
DROP POLICY IF EXISTS "Anyone can see community posts" ON community_posts;
CREATE POLICY "Anyone can see community posts" ON community_posts
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Community admins can add posts" ON community_posts;
CREATE POLICY "Community admins can add posts" ON community_posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_admins
      WHERE community_admins.community_id = community_posts.community_id
      AND community_admins.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Community admins can remove posts" ON community_posts;
CREATE POLICY "Community admins can remove posts" ON community_posts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM community_admins
      WHERE community_admins.community_id = community_posts.community_id
      AND community_admins.user_id = auth.uid()
    )
  );

-- ============================================
-- TRIGGERS FOR COUNTER UPDATES
-- ============================================

-- Follower count trigger
CREATE OR REPLACE FUNCTION update_community_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities
    SET follower_count = follower_count + 1
    WHERE id = NEW.community_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities
    SET follower_count = follower_count - 1
    WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_community_follower_count ON community_followers;
CREATE TRIGGER trigger_update_community_follower_count
  AFTER INSERT OR DELETE ON community_followers
  FOR EACH ROW EXECUTE FUNCTION update_community_follower_count();

-- Post count trigger
CREATE OR REPLACE FUNCTION update_community_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities
    SET post_count = post_count + 1
    WHERE id = NEW.community_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities
    SET post_count = post_count - 1
    WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_community_post_count ON community_posts;
CREATE TRIGGER trigger_update_community_post_count
  AFTER INSERT OR DELETE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION update_community_post_count();

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Create community (with owner)
CREATE OR REPLACE FUNCTION create_community(
  p_name TEXT,
  p_slug TEXT,
  p_description TEXT DEFAULT NULL,
  p_category TEXT DEFAULT 'organization',
  p_municipality_id UUID DEFAULT NULL,
  p_place_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_community_id UUID;
BEGIN
  -- Insert community
  INSERT INTO communities (name, slug, description, category, municipality_id, place_id, created_by)
  VALUES (p_name, p_slug, p_description, p_category, p_municipality_id, p_place_id, auth.uid())
  RETURNING id INTO v_community_id;

  -- Add creator as owner
  INSERT INTO community_admins (community_id, user_id, role)
  VALUES (v_community_id, auth.uid(), 'owner');

  RETURN v_community_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Follow community
CREATE OR REPLACE FUNCTION follow_community(p_community_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO community_followers (community_id, user_id)
  VALUES (p_community_id, auth.uid())
  ON CONFLICT (community_id, user_id) DO NOTHING;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unfollow community
CREATE OR REPLACE FUNCTION unfollow_community(p_community_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM community_followers
  WHERE community_id = p_community_id
  AND user_id = auth.uid();

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is following
CREATE OR REPLACE FUNCTION is_following_community(p_community_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM community_followers
    WHERE community_id = p_community_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_community_admin(p_community_id UUID)
RETURNS TABLE (is_admin BOOLEAN, role TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT TRUE, ca.role
  FROM community_admins ca
  WHERE ca.community_id = p_community_id
  AND ca.user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's followed communities
CREATE OR REPLACE FUNCTION get_followed_communities()
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  logo_url TEXT,
  category TEXT,
  follower_count INT,
  post_count INT,
  is_verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.slug,
    c.description,
    c.logo_url,
    c.category,
    c.follower_count,
    c.post_count,
    c.is_verified
  FROM communities c
  INNER JOIN community_followers cf ON c.id = cf.community_id
  WHERE cf.user_id = auth.uid()
  AND c.is_active = TRUE
  ORDER BY c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get communities user administers
CREATE OR REPLACE FUNCTION get_admin_communities()
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  logo_url TEXT,
  category TEXT,
  follower_count INT,
  post_count INT,
  is_verified BOOLEAN,
  admin_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.slug,
    c.description,
    c.logo_url,
    c.category,
    c.follower_count,
    c.post_count,
    c.is_verified,
    ca.role
  FROM communities c
  INNER JOIN community_admins ca ON c.id = ca.community_id
  WHERE ca.user_id = auth.uid()
  AND c.is_active = TRUE
  ORDER BY c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_community TO authenticated;
GRANT EXECUTE ON FUNCTION follow_community TO authenticated;
GRANT EXECUTE ON FUNCTION unfollow_community TO authenticated;
GRANT EXECUTE ON FUNCTION is_following_community TO authenticated;
GRANT EXECUTE ON FUNCTION is_community_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_followed_communities TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_communities TO authenticated;

-- ============================================
-- CATEGORY LABELS (for reference)
-- ============================================
-- organization = Organisasjon
-- business = Bedrift
-- institution = Institusjon
-- association = Forening
-- cultural = Kulturinstitusjon
-- educational = Utdanning
-- government = Offentlig
-- other = Annet
