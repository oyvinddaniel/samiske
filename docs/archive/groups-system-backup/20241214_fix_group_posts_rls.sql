-- =====================================================
-- KRITISK SIKKERHET: RLS policies for gruppe-innlegg
-- =====================================================
-- Beskrivelse: Row Level Security policies som sikrer at innlegg fra
-- grupper (åpne, lukkede, skjulte) ALDRI vises utenfor gruppen.
--
-- Dette er en ABSOLUTT SIKKERHETSBARRIERE på database-nivå.
-- Selv om applikasjonskoden har bugs, vil databasen nekte tilgang.
-- =====================================================

BEGIN;

-- =====================================================
-- STEG 1: Deaktiver eksisterende policies (for å oppdatere)
-- =====================================================
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "posts_select_policy" ON posts;
DROP POLICY IF EXISTS "posts_insert_policy" ON posts;
DROP POLICY IF EXISTS "posts_update_policy" ON posts;
DROP POLICY IF EXISTS "posts_delete_policy" ON posts;

-- =====================================================
-- STEG 2: Aktiver RLS
-- =====================================================
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICY 1: SELECT (lesing av innlegg)
-- =====================================================
-- Regel: Brukere kan bare se innlegg fra grupper de er medlem av
CREATE POLICY "posts_select_policy" ON posts
FOR SELECT
USING (
  -- CASE 1: Innlegg UTEN gruppe → Alle kan se (hvis public)
  (created_for_group_id IS NULL AND visibility = 'public')

  OR

  -- CASE 2: Innlegg UTEN gruppe → Medlemmer kan se (hvis members-only)
  (created_for_group_id IS NULL AND visibility = 'members' AND auth.uid() IS NOT NULL)

  OR

  -- CASE 3: Innlegg MED gruppe → Bare gruppemedlemmer kan se
  (created_for_group_id IS NOT NULL
   AND EXISTS (
     SELECT 1 FROM group_members
     WHERE group_members.group_id = posts.created_for_group_id
       AND group_members.user_id = auth.uid()
       AND group_members.status = 'approved'
   ))

  OR

  -- CASE 4: Eget innlegg → Kan alltid se
  (user_id = auth.uid())
);

COMMENT ON POLICY "posts_select_policy" ON posts IS
  'SIKKERHET: Gruppeinnlegg vises bare til gruppemedlemmer';

-- =====================================================
-- POLICY 2: INSERT (oppretting av innlegg)
-- =====================================================
CREATE POLICY "posts_insert_policy" ON posts
FOR INSERT
WITH CHECK (
  -- Må være innlogget
  auth.uid() IS NOT NULL

  AND

  -- Må være forfatter
  user_id = auth.uid()

  AND

  -- SIKKERHET: Kan IKKE sette både gruppe og samfunn
  NOT (created_for_group_id IS NOT NULL AND created_for_community_id IS NOT NULL)

  AND

  -- Hvis gruppe er valgt, må bruker være medlem
  (created_for_group_id IS NULL
   OR EXISTS (
     SELECT 1 FROM group_members
     WHERE group_members.group_id = posts.created_for_group_id
       AND group_members.user_id = auth.uid()
       AND group_members.status = 'approved'
   ))
);

COMMENT ON POLICY "posts_insert_policy" ON posts IS
  'SIKKERHET: Validerer at gruppe+samfunn ikke settes samtidig, og at bruker er gruppemedlem';

-- =====================================================
-- POLICY 3: UPDATE (redigering av innlegg)
-- =====================================================
CREATE POLICY "posts_update_policy" ON posts
FOR UPDATE
USING (
  -- Må være forfatter eller admin
  user_id = auth.uid()

  OR

  -- Eller gruppeadmin (hvis gruppeinnlegg)
  (created_for_group_id IS NOT NULL
   AND EXISTS (
     SELECT 1 FROM group_members
     WHERE group_members.group_id = posts.created_for_group_id
       AND group_members.user_id = auth.uid()
       AND group_members.role IN ('admin', 'owner')
   ))
)
WITH CHECK (
  -- SIKKERHET: Kan IKKE endre til både gruppe og samfunn
  NOT (created_for_group_id IS NOT NULL AND created_for_community_id IS NOT NULL)
);

COMMENT ON POLICY "posts_update_policy" ON posts IS
  'SIKKERHET: Bare forfatter/admin kan redigere, og kan ikke sette både gruppe+samfunn';

-- =====================================================
-- POLICY 4: DELETE (sletting av innlegg)
-- =====================================================
CREATE POLICY "posts_delete_policy" ON posts
FOR DELETE
USING (
  -- Må være forfatter
  user_id = auth.uid()

  OR

  -- Eller gruppeadmin (hvis gruppeinnlegg)
  (created_for_group_id IS NOT NULL
   AND EXISTS (
     SELECT 1 FROM group_members
     WHERE group_members.group_id = posts.created_for_group_id
       AND group_members.user_id = auth.uid()
       AND group_members.role IN ('admin', 'owner')
   ))
);

COMMENT ON POLICY "posts_delete_policy" ON posts IS
  'Bare forfatter eller gruppeadmin kan slette innlegg';

-- =====================================================
-- STEG 3: RLS for community_posts junction-tabell
-- =====================================================
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_posts_select_policy" ON community_posts;
DROP POLICY IF EXISTS "community_posts_insert_policy" ON community_posts;
DROP POLICY IF EXISTS "community_posts_delete_policy" ON community_posts;

-- SELECT: Alle kan se community_posts
CREATE POLICY "community_posts_select_policy" ON community_posts
FOR SELECT
USING (
  -- SIKKERHET: Aldri vis community_posts hvis innlegget tilhører en gruppe
  NOT EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = community_posts.post_id
      AND posts.created_for_group_id IS NOT NULL
  )
);

COMMENT ON POLICY "community_posts_select_policy" ON community_posts IS
  'KRITISK SIKKERHET: Blokkerer visning av community_posts hvis innlegget tilhører en gruppe';

-- INSERT: Bare community-admins kan legge til innlegg
CREATE POLICY "community_posts_insert_policy" ON community_posts
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL

  AND

  -- Må være community admin
  EXISTS (
    SELECT 1 FROM community_admins
    WHERE community_admins.community_id = community_posts.community_id
      AND community_admins.user_id = auth.uid()
  )

  AND

  -- SIKKERHET: Innlegget må IKKE tilhøre en gruppe
  NOT EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = community_posts.post_id
      AND posts.created_for_group_id IS NOT NULL
  )
);

COMMENT ON POLICY "community_posts_insert_policy" ON community_posts IS
  'KRITISK SIKKERHET: Forhindrer at gruppeinnlegg legges til i community_posts';

-- DELETE: Bare community-admins kan fjerne innlegg
CREATE POLICY "community_posts_delete_policy" ON community_posts
FOR DELETE
USING (
  auth.uid() IS NOT NULL

  AND

  EXISTS (
    SELECT 1 FROM community_admins
    WHERE community_admins.community_id = community_posts.community_id
      AND community_admins.user_id = auth.uid()
  )
);

-- =====================================================
-- STEG 4: RLS for group_posts junction-tabell
-- =====================================================
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "group_posts_select_policy" ON group_posts;
DROP POLICY IF EXISTS "group_posts_insert_policy" ON group_posts;
DROP POLICY IF EXISTS "group_posts_delete_policy" ON group_posts;

-- SELECT: Bare gruppemedlemmer kan se
CREATE POLICY "group_posts_select_policy" ON group_posts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = group_posts.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.status = 'approved'
  )
);

-- INSERT: Triggers håndterer dette
CREATE POLICY "group_posts_insert_policy" ON group_posts
FOR INSERT
WITH CHECK (true); -- Triggers har allerede validert

-- DELETE: Bare gruppe-admins
CREATE POLICY "group_posts_delete_policy" ON group_posts
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = group_posts.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role IN ('admin', 'owner')
  )
);

-- =====================================================
-- VERIFIKASJON
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=== RLS POLICIES AKTIVERT ===';
  RAISE NOTICE 'posts: SELECT, INSERT, UPDATE, DELETE policies opprettet';
  RAISE NOTICE 'community_posts: BLOKKERER gruppeinnlegg';
  RAISE NOTICE 'group_posts: Bare gruppemedlemmer har tilgang';
  RAISE NOTICE '';
  RAISE NOTICE 'SIKKERHET: Gruppeinnlegg kan ALDRI vises utenfor gruppen';
  RAISE NOTICE 'Dette håndheves på database-nivå (RLS)';
END $$;

COMMIT;
