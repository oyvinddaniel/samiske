-- COMPLETE FIX FOR COMMUNITY CREATION ISSUES
-- This migration fixes three related problems:
-- 1. Industries RLS policies missing WITH CHECK for INSERT
-- 2. Community_industries RLS policies missing WITH CHECK for INSERT
-- 3. create_community RPC using removed municipality_id/place_id columns

-- ============================================
-- 1. FIX INDUSTRIES RLS POLICIES
-- ============================================

-- Drop all possible policy names
DROP POLICY IF EXISTS "Industries are viewable by everyone" ON industries;
DROP POLICY IF EXISTS "Anyone can view industries" ON industries;
DROP POLICY IF EXISTS "Authenticated users can suggest industries" ON industries;
DROP POLICY IF EXISTS "Authenticated users can create industries" ON industries;
DROP POLICY IF EXISTS "Platform admins can manage industries" ON industries;
DROP POLICY IF EXISTS "Only platform admins can update industries" ON industries;
DROP POLICY IF EXISTS "Platform admins can delete industries" ON industries;
DROP POLICY IF EXISTS "Only platform admins can delete industries" ON industries;

-- Enable RLS
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;

-- SELECT: Everyone can see approved industries, users can see their own suggestions
CREATE POLICY "Anyone can view industries"
  ON industries FOR SELECT
  USING (
    is_approved = true
    OR created_by = auth.uid()
  );

-- INSERT: Any authenticated user can suggest industries (WITH CHECK is critical!)
CREATE POLICY "Authenticated users can create industries"
  ON industries FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Only platform admins can update
CREATE POLICY "Only platform admins can update industries"
  ON industries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM platform_admins
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- DELETE: Only platform admins can delete
CREATE POLICY "Only platform admins can delete industries"
  ON industries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM platform_admins
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ============================================
-- 2. FIX COMMUNITY_INDUSTRIES RLS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Community admins can manage industries" ON community_industries;
DROP POLICY IF EXISTS "Community industries viewable by everyone" ON community_industries;

-- SELECT: Everyone can view
CREATE POLICY "Community industries viewable by everyone" ON community_industries
  FOR SELECT USING (TRUE);

-- INSERT/UPDATE/DELETE: Community admins (WITH CHECK is critical for INSERT!)
CREATE POLICY "Community admins can manage industries" ON community_industries
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM community_admins
      WHERE community_admins.community_id = community_industries.community_id
      AND community_admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_admins
      WHERE community_admins.community_id = community_industries.community_id
      AND community_admins.user_id = auth.uid()
    )
  );

-- ============================================
-- 3. FIX CREATE_COMMUNITY RPC FUNCTION
-- ============================================

-- Drop old version that uses municipality_id and place_id
DROP FUNCTION IF EXISTS create_community(TEXT, TEXT, TEXT, TEXT, UUID, UUID);

-- Create new version without deprecated columns
CREATE OR REPLACE FUNCTION create_community(
  p_name TEXT,
  p_slug TEXT,
  p_description TEXT DEFAULT NULL,
  p_category TEXT DEFAULT 'organization'
)
RETURNS UUID AS $$
DECLARE
  v_community_id UUID;
BEGIN
  -- Insert community (without municipality_id and place_id)
  INSERT INTO communities (name, slug, description, category, created_by)
  VALUES (p_name, p_slug, p_description, p_category, auth.uid())
  RETURNING id INTO v_community_id;

  -- Add creator as owner
  INSERT INTO community_admins (community_id, user_id, role)
  VALUES (v_community_id, auth.uid(), 'owner');

  RETURN v_community_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_community TO authenticated;

-- Add comment
COMMENT ON FUNCTION create_community IS
  'Oppretter ny community/samfunn-side og legger til creator som owner. ' ||
  'Lokasjon håndteres via community_places tabell (mange-til-mange).';

-- ============================================
-- DONE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '=== ALL COMMUNITY FIXES APPLIED ===';
  RAISE NOTICE '✓ Industries RLS policies fixed (WITH CHECK added)';
  RAISE NOTICE '✓ Community_industries RLS policies fixed (WITH CHECK added)';
  RAISE NOTICE '✓ create_community RPC updated (municipality_id/place_id removed)';
  RAISE NOTICE 'Community creation should now work!';
END $$;
