-- =====================================================
-- FIX: Infinite recursion in community_admins RLS
-- =====================================================
-- Problem: "FOR ALL" policy on community_admins creates
-- infinite recursion when other tables query it.
--
-- Solution: Separate SELECT policy (permissive) from
-- INSERT/UPDATE/DELETE policies (restrictive).
-- =====================================================

BEGIN;

-- Drop the problematic "FOR ALL" policy
DROP POLICY IF EXISTS "Community owners can manage admins" ON community_admins;

-- Keep the permissive SELECT policy (already exists, but recreate to be sure)
DROP POLICY IF EXISTS "Anyone can see community admins" ON community_admins;
CREATE POLICY "Anyone can see community admins" ON community_admins
  FOR SELECT USING (TRUE);

-- Create separate restrictive policies for INSERT/UPDATE/DELETE
-- These won't affect SELECT operations, preventing recursion

CREATE POLICY "Community owners can add admins" ON community_admins
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_admins AS ca
      WHERE ca.community_id = community_admins.community_id
      AND ca.user_id = auth.uid()
      AND ca.role = 'owner'
    )
  );

CREATE POLICY "Community owners can update admins" ON community_admins
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM community_admins AS ca
      WHERE ca.community_id = community_admins.community_id
      AND ca.user_id = auth.uid()
      AND ca.role = 'owner'
    )
  );

CREATE POLICY "Community owners can remove admins" ON community_admins
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM community_admins AS ca
      WHERE ca.community_id = community_admins.community_id
      AND ca.user_id = auth.uid()
      AND ca.role = 'owner'
    )
  );

-- Add comments for documentation
COMMENT ON POLICY "Anyone can see community admins" ON community_admins IS
  'Permissive SELECT policy to prevent infinite recursion when other tables check admin status';

COMMENT ON POLICY "Community owners can add admins" ON community_admins IS
  'Only community owners can add new admins';

COMMENT ON POLICY "Community owners can update admins" ON community_admins IS
  'Only community owners can update admin roles';

COMMENT ON POLICY "Community owners can remove admins" ON community_admins IS
  'Only community owners can remove admins';

-- Verify policies
DO $$
DECLARE
  select_policy_count INT;
  insert_policy_count INT;
  update_policy_count INT;
  delete_policy_count INT;
BEGIN
  SELECT COUNT(*) INTO select_policy_count
  FROM pg_policies
  WHERE tablename = 'community_admins' AND cmd = 'SELECT';

  SELECT COUNT(*) INTO insert_policy_count
  FROM pg_policies
  WHERE tablename = 'community_admins' AND cmd = 'INSERT';

  SELECT COUNT(*) INTO update_policy_count
  FROM pg_policies
  WHERE tablename = 'community_admins' AND cmd = 'UPDATE';

  SELECT COUNT(*) INTO delete_policy_count
  FROM pg_policies
  WHERE tablename = 'community_admins' AND cmd = 'DELETE';

  RAISE NOTICE '=== community_admins RLS POLICY VERIFICATION ===';
  RAISE NOTICE 'SELECT policies: % (expected: 1)', select_policy_count;
  RAISE NOTICE 'INSERT policies: % (expected: 1)', insert_policy_count;
  RAISE NOTICE 'UPDATE policies: % (expected: 1)', update_policy_count;
  RAISE NOTICE 'DELETE policies: % (expected: 1)', delete_policy_count;

  IF select_policy_count != 1 THEN
    RAISE WARNING 'Unexpected SELECT policy count!';
  END IF;
END $$;

COMMIT;
