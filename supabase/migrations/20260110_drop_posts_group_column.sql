-- =====================================================
-- POSTS: DROPP created_for_group_id KOLONNE
-- Må gjøres etter at gruppe-innlegg er slettet
-- =====================================================

BEGIN;

-- =====================================================
-- SIKKERHETSJEKK: Verifiser at ingen innlegg har gruppe-tilknytning
-- =====================================================

DO $$
DECLARE
  remaining INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining
  FROM posts
  WHERE created_for_group_id IS NOT NULL;

  IF remaining > 0 THEN
    RAISE EXCEPTION 'KRITISK FEIL: % innlegg har fortsatt created_for_group_id! Kan ikke droppe kolonne.', remaining;
  END IF;
END $$;

-- =====================================================
-- DROPP AVHENGIGE RLS POLICIES FØRST
-- =====================================================

-- Dropp policies på community_posts som refererer til created_for_group_id
DROP POLICY IF EXISTS community_posts_select_policy ON community_posts;
DROP POLICY IF EXISTS community_posts_insert_policy ON community_posts;

-- =====================================================
-- DROPP KOLONNE
-- =====================================================

ALTER TABLE posts DROP COLUMN IF EXISTS created_for_group_id CASCADE;

-- =====================================================
-- GJENOPPRETT RLS POLICIES UTEN GRUPPE-REFERANSER
-- =====================================================

-- Gjenopprett SELECT policy uten created_for_group_id sjekk
CREATE POLICY community_posts_select_policy ON community_posts
  FOR SELECT
  USING (true);  -- Alle kan se community_posts (men posts har egne RLS)

-- Gjenopprett INSERT policy uten created_for_group_id sjekk
CREATE POLICY community_posts_insert_policy ON community_posts
  FOR INSERT
  WITH CHECK (
    -- Sjekk at brukeren har tilgang til å poste i dette samfunnet
    EXISTS (
      SELECT 1 FROM community_followers
      WHERE community_id = community_posts.community_id
      AND user_id = auth.uid()
    )
  );

-- =====================================================
-- VERIFISER AT KOLONNE ER BORTE
-- =====================================================

DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'posts'
    AND column_name = 'created_for_group_id'
  ) INTO column_exists;

  IF column_exists THEN
    RAISE EXCEPTION 'KRITISK: created_for_group_id kolonne eksisterer fortsatt!';
  ELSE
    RAISE NOTICE 'SUCCESS: created_for_group_id kolonne droppet fra posts';
  END IF;
END $$;

COMMIT;
