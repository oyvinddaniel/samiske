-- =====================================================
-- GRUPPER: SLETT ALLE GRUPPE-INNLEGG
-- PERMANENT SLETTING - IKKE REVERSIBELT
-- =====================================================

BEGIN;

-- Tell før sletting (for logging)
DO $$
DECLARE
  post_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO post_count
  FROM posts
  WHERE created_for_group_id IS NOT NULL;

  RAISE NOTICE 'Sletter % gruppe-innlegg permanent', post_count;
END $$;

-- PERMANENT SLETTING AV ALLE GRUPPE-INNLEGG
DELETE FROM posts WHERE created_for_group_id IS NOT NULL;

-- Verifiser at alle er slettet
DO $$
DECLARE
  remaining INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining
  FROM posts
  WHERE created_for_group_id IS NOT NULL;

  IF remaining > 0 THEN
    RAISE EXCEPTION 'KRITISK FEIL: % innlegg gjenstår med created_for_group_id!', remaining;
  ELSE
    RAISE NOTICE 'SUCCESS: Alle gruppe-innlegg slettet';
  END IF;
END $$;

COMMIT;
