-- =====================================================
-- OMFATTENDE RLS POLICIES FOR POSTS
-- =====================================================
-- Beskrivelse: Erstatter eksisterende RLS policies med omfattende
-- policies som respekterer plasseringshierarki og synlighet.
--
-- Sikrer at:
-- - Lukk/skjulte gruppeinnlegg kun vises til godkjente medlemmer
-- - Samfunnsinnlegg er offentlige
-- - Geografiske/personlige innlegg følger visibility-innstillinger
-- - Kun godkjente medlemmer kan poste til grupper
-- - Kun admins kan poste for samfunn
-- =====================================================

BEGIN;

-- =====================================================
-- DROPP EKSISTERENDE POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts or admins can delete any" ON posts;

-- =====================================================
-- SELECT POLICY: Kompleks synlighetskontroll
-- =====================================================
CREATE POLICY "Posts viewable based on placement and visibility" ON posts
  FOR SELECT
  USING (
    -- =============================================
    -- CASE 1: GRUPPE-INNLEGG
    -- =============================================
    (created_for_group_id IS NOT NULL AND (
      -- Åpne grupper: alle kan se
      EXISTS (
        SELECT 1 FROM groups
        WHERE groups.id = posts.created_for_group_id
        AND groups.group_type = 'open'
      )
      -- Lukkede/skjulte grupper: kun godkjente medlemmer
      OR EXISTS (
        SELECT 1 FROM group_members
        WHERE group_members.group_id = posts.created_for_group_id
        AND group_members.user_id = auth.uid()
        AND group_members.status = 'approved'
      )
    ))

    -- =============================================
    -- CASE 2: SAMFUNNS-INNLEGG
    -- =============================================
    OR (created_for_community_id IS NOT NULL AND (
      -- Samfunnsinnlegg er offentlige
      visibility = 'public'
      -- Eller members-only for innloggede brukere
      OR (visibility = 'members' AND auth.uid() IS NOT NULL)
    ))

    -- =============================================
    -- CASE 3: GEOGRAFISK/PERSONLIG INNLEGG
    -- =============================================
    OR (created_for_group_id IS NULL AND created_for_community_id IS NULL AND (
      -- Public: alle kan se
      visibility = 'public'

      -- Members: innloggede brukere
      OR (visibility = 'members' AND auth.uid() IS NOT NULL)

      -- Friends: kun venner (må være innlogget)
      OR (visibility = 'friends' AND (
        -- Egne innlegg
        auth.uid() = user_id
        -- Eller er venn
        OR EXISTS (
          SELECT 1 FROM friendships
          WHERE status = 'accepted'
          AND (
            (requester_id = auth.uid() AND addressee_id = posts.user_id)
            OR (addressee_id = auth.uid() AND requester_id = posts.user_id)
          )
        )
      ))

      -- Circles: kun eier (circles-funksjonalitet kommer senere)
      OR (visibility = 'circles' AND auth.uid() = user_id)

      -- Only me: kun eier
      OR (visibility = 'only_me' AND auth.uid() = user_id)
    ))
  );

COMMENT ON POLICY "Posts viewable based on placement and visibility" ON posts IS
  'Kontrollerer synlighet basert på plasseringshierarki (gruppe > samfunn > geografisk > personlig) og visibility-innstillinger';

-- =====================================================
-- INSERT POLICY: Sjekk medlemskap og tillatelser
-- =====================================================
CREATE POLICY "Authenticated users can create posts with validation" ON posts
  FOR INSERT
  WITH CHECK (
    -- Må være innlogget og eier av innlegget
    auth.uid() = user_id
    AND (
      -- =============================================
      -- CASE 1: VANLIG INNLEGG (ingen gruppe/samfunn)
      -- =============================================
      (created_for_group_id IS NULL AND created_for_community_id IS NULL)

      -- =============================================
      -- CASE 2: GRUPPEINNLEGG
      -- =============================================
      OR (created_for_group_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM group_members
        WHERE group_members.group_id = posts.created_for_group_id
        AND group_members.user_id = auth.uid()
        AND group_members.status = 'approved'
      ))

      -- =============================================
      -- CASE 3: SAMFUNNSINNLEGG
      -- =============================================
      OR (created_for_community_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM community_admins
        WHERE community_admins.community_id = posts.created_for_community_id
        AND community_admins.user_id = auth.uid()
      ))
    )
  );

COMMENT ON POLICY "Authenticated users can create posts with validation" ON posts IS
  'Tillater opprettelse av innlegg med validering av medlemskap (gruppe) eller admin-rolle (samfunn)';

-- =====================================================
-- UPDATE POLICY: Eier eller moderatorer
-- =====================================================
CREATE POLICY "Users can update own posts or admins can update" ON posts
  FOR UPDATE
  USING (
    -- Eier av innlegget
    auth.uid() = user_id

    -- Gruppe-moderatorer/admins kan redigere gruppeinnlegg
    OR (created_for_group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = posts.created_for_group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role IN ('admin', 'moderator')
      AND group_members.status = 'approved'
    ))

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
  )
  WITH CHECK (
    -- Samme regler som USING, men med ekstra sjekk:
    -- Forhindre endring av visibility til 'public' for lukkede/skjulte grupper
    NOT (
      created_for_group_id IS NOT NULL
      AND visibility = 'public'
      AND EXISTS (
        SELECT 1 FROM groups
        WHERE groups.id = posts.created_for_group_id
        AND groups.group_type IN ('closed', 'hidden')
      )
    )
  );

COMMENT ON POLICY "Users can update own posts or admins can update" ON posts IS
  'Tillater redigering av egne innlegg, eller av gruppe/samfunns-moderatorer, eller site-admins';

-- =====================================================
-- DELETE POLICY: Eier eller moderatorer
-- =====================================================
CREATE POLICY "Users can delete own posts or admins can delete" ON posts
  FOR DELETE
  USING (
    -- Eier av innlegget
    auth.uid() = user_id

    -- Gruppe-moderatorer/admins kan slette gruppeinnlegg
    OR (created_for_group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = posts.created_for_group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role IN ('admin', 'moderator')
      AND group_members.status = 'approved'
    ))

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
  'Tillater sletting av egne innlegg, eller av gruppe/samfunns-moderatorer, eller site-admins';

-- =====================================================
-- VERIFIKASJON
-- =====================================================
DO $$
DECLARE
  select_policy_count INT;
  insert_policy_count INT;
  update_policy_count INT;
  delete_policy_count INT;
BEGIN
  -- Tell policies
  SELECT COUNT(*) INTO select_policy_count
  FROM pg_policies
  WHERE tablename = 'posts' AND cmd = 'SELECT';

  SELECT COUNT(*) INTO insert_policy_count
  FROM pg_policies
  WHERE tablename = 'posts' AND cmd = 'INSERT';

  SELECT COUNT(*) INTO update_policy_count
  FROM pg_policies
  WHERE tablename = 'posts' AND cmd = 'UPDATE';

  SELECT COUNT(*) INTO delete_policy_count
  FROM pg_policies
  WHERE tablename = 'posts' AND cmd = 'DELETE';

  RAISE NOTICE '=== RLS POLICY VERIFICATION ===';
  RAISE NOTICE 'SELECT policies: %', select_policy_count;
  RAISE NOTICE 'INSERT policies: %', insert_policy_count;
  RAISE NOTICE 'UPDATE policies: %', update_policy_count;
  RAISE NOTICE 'DELETE policies: %', delete_policy_count;

  IF select_policy_count = 0 THEN
    RAISE WARNING 'WARNING: No SELECT policy on posts table!';
  END IF;

  IF insert_policy_count = 0 THEN
    RAISE WARNING 'WARNING: No INSERT policy on posts table!';
  END IF;
END $$;

COMMIT;
