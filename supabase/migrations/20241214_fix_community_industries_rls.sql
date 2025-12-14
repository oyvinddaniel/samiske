-- Fix RLS policies for community_industries table
-- Add WITH CHECK clause for INSERT operations

-- Drop existing policy
DROP POLICY IF EXISTS "Community admins can manage industries" ON community_industries;

-- Recreate with both USING and WITH CHECK
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
