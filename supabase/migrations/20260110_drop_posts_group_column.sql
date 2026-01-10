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
-- DROPP KOLONNE
-- =====================================================

ALTER TABLE posts DROP COLUMN IF EXISTS created_for_group_id;

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
