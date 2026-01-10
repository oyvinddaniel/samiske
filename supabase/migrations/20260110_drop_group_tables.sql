-- =====================================================
-- GRUPPER: DROPP ALLE TABELLER
-- CASCADE vil håndtere foreign keys
-- =====================================================

BEGIN;

-- Dropp i rekkefølge (fra child til parent)
-- CASCADE sikrer at alle foreign keys håndteres

DROP TABLE IF EXISTS group_welcome_seen CASCADE;
DROP TABLE IF EXISTS group_notification_preferences CASCADE;
DROP TABLE IF EXISTS group_invites CASCADE;
DROP TABLE IF EXISTS group_places CASCADE;
DROP TABLE IF EXISTS group_posts CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;

-- =====================================================
-- VERIFISER AT ALLE ER BORTE
-- =====================================================

DO $$
DECLARE
  table_count INTEGER;
  table_list TEXT;
BEGIN
  -- Tell gjenstående gruppe-tabeller
  SELECT COUNT(*), string_agg(table_name, ', ')
  INTO table_count, table_list
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name LIKE 'group%';

  IF table_count > 0 THEN
    RAISE EXCEPTION 'KRITISK: % gruppe-tabeller gjenstår: %', table_count, table_list;
  ELSE
    RAISE NOTICE 'SUCCESS: Alle gruppe-tabeller slettet';
  END IF;
END $$;

COMMIT;
