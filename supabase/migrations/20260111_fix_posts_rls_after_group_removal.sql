-- =====================================================
-- FIX: Posts RLS Policies etter gruppe-fjerning
-- Dato: 2026-01-11
-- Problem: RLS policies refererer til slettet created_for_group_id
-- =====================================================

BEGIN;

-- =====================================================
-- DROPP GAMLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Posts viewable based on placement and visibility" ON posts;
DROP POLICY IF EXISTS "Authenticated users can create posts with validation" ON posts;
DROP POLICY IF EXISTS "Users can update own posts or admins can update" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts or admins can delete" ON posts;

-- =====================================================
-- SELECT POLICY: Visibility-basert
-- =====================================================

CREATE POLICY "Posts viewable based on placement and visibility" ON posts
  FOR SELECT
  USING (
    -- PUBLIC: Alle kan se
    visibility = 'public'

    -- FRIENDS_ONLY: Kun venner
    OR (visibility = 'friends' AND (
      auth.uid() = user_id -- Eier
      OR EXISTS (
        SELECT 1 FROM friendships
        WHERE (
          (requester_id = auth.uid() AND addressee_id = posts.user_id)
          OR (addressee_id = auth.uid() AND requester_id = posts.user_id)
        )
        AND status = 'accepted'
      )
    ))

    -- CIRCLES: Kun valgte vennekretser
    OR (visibility = 'circles' AND auth.uid() = user_id) -- Kun eier kan se circles posts

    -- COMMUNITY POSTS: Kun community-medlemmer/følgere
    OR (created_for_community_id IS NOT NULL AND (
      auth.uid() = user_id -- Eier
      OR EXISTS (
        SELECT 1 FROM community_followers cf
        WHERE cf.community_id = posts.created_for_community_id
        AND cf.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM community_admins ca
        WHERE ca.community_id = posts.created_for_community_id
        AND ca.user_id = auth.uid()
      )
    ))

    -- Site-admins/moderatorer kan se alt
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

COMMENT ON POLICY "Posts viewable based on placement and visibility" ON posts IS
  'Visibility-basert tilgang: public, friends, circles, community posts';

-- =====================================================
-- INSERT POLICY: Autentiserte brukere
-- =====================================================

CREATE POLICY "Authenticated users can create posts with validation" ON posts
  FOR INSERT
  WITH CHECK (
    -- Må være innlogget og eier av innlegget
    auth.uid() = user_id
    AND (
      -- VANLIG INNLEGG (ingen community)
      created_for_community_id IS NULL

      -- SAMFUNNSINNLEGG (må være admin)
      OR (created_for_community_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM community_admins
        WHERE community_admins.community_id = posts.created_for_community_id
        AND community_admins.user_id = auth.uid()
      ))
    )
  );

COMMENT ON POLICY "Authenticated users can create posts with validation" ON posts IS
  'Tillater opprettelse av vanlige innlegg eller community-innlegg (hvis admin)';

-- =====================================================
-- UPDATE POLICY: Eier eller moderatorer
-- =====================================================

CREATE POLICY "Users can update own posts or admins can update" ON posts
  FOR UPDATE
  USING (
    -- Eier av innlegget
    auth.uid() = user_id

    -- Samfunns-admins kan redigere samfunnsinnlegg
    OR (created_for_community_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM community_admins
      WHERE community_admins.community_id = posts.created_for_community_id
      AND community_admins.user_id = auth.uid()
    ))

    -- Site-admins/moderatorer kan redigere alle innlegg
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

COMMENT ON POLICY "Users can update own posts or admins can update" ON posts IS
  'Tillater redigering av egne innlegg, samfunns-admins, eller site-admins';

-- =====================================================
-- DELETE POLICY: Eier eller moderatorer
-- =====================================================

CREATE POLICY "Users can delete own posts or admins can delete" ON posts
  FOR DELETE
  USING (
    -- Eier av innlegget
    auth.uid() = user_id

    -- Samfunns-admins kan slette samfunnsinnlegg
    OR (created_for_community_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM community_admins
      WHERE community_admins.community_id = posts.created_for_community_id
      AND community_admins.user_id = auth.uid()
    ))

    -- Site-admins/moderatorer kan slette alle innlegg
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

COMMENT ON POLICY "Users can delete own posts or admins can delete" ON posts IS
  'Tillater sletting av egne innlegg, samfunns-admins, eller site-admins';

-- =====================================================
-- VERIFISER AT POLICIES ER KORREKTE
-- =====================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'posts'
  AND schemaname = 'public';

  IF policy_count != 4 THEN
    RAISE EXCEPTION 'FEIL: Forventet 4 policies på posts, fant %', policy_count;
  END IF;

  RAISE NOTICE 'SUCCESS: % RLS policies opprettet på posts-tabellen', policy_count;
END $$;

COMMIT;
