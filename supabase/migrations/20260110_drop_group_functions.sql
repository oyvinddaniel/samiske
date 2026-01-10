-- =====================================================
-- GRUPPER: DROPP ALLE TRIGGERS OG FUNKSJONER
-- Må gjøres før tabeller droppes
-- =====================================================

BEGIN;

-- =====================================================
-- DROPP TRIGGERS (fra posts tabell)
-- =====================================================

DROP TRIGGER IF EXISTS trigger_cleanup_group_posts ON posts;
DROP TRIGGER IF EXISTS trigger_validate_post_group_community ON posts;
DROP TRIGGER IF EXISTS trigger_auto_populate_group_posts ON posts;

-- =====================================================
-- DROPP TRIGGERS (fra groups og group_members tabeller)
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_group_post_count ON group_posts;
DROP TRIGGER IF EXISTS trigger_update_group_member_count ON group_members;

-- =====================================================
-- DROPP RPC-FUNKSJONER (lagrede funksjoner)
-- =====================================================

-- Dropp alle overloads av create_group
DROP FUNCTION IF EXISTS create_group(TEXT, TEXT, TEXT, TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS create_group(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_group(name_param TEXT, slug_param TEXT, description_param TEXT, group_type_param TEXT);

-- Andre RPC-funksjoner
DROP FUNCTION IF EXISTS join_group(UUID);
DROP FUNCTION IF EXISTS join_group(group_id_param UUID);
DROP FUNCTION IF EXISTS approve_member(UUID, UUID);
DROP FUNCTION IF EXISTS approve_member(group_id_param UUID, user_id_param UUID);
DROP FUNCTION IF EXISTS get_user_groups(UUID);
DROP FUNCTION IF EXISTS get_user_groups(user_id_param UUID);
DROP FUNCTION IF EXISTS delete_group(UUID);
DROP FUNCTION IF EXISTS delete_group(group_id_param UUID);
DROP FUNCTION IF EXISTS remove_group_member(UUID, UUID);
DROP FUNCTION IF EXISTS remove_group_member(group_id_param UUID, user_id_param UUID);
DROP FUNCTION IF EXISTS transfer_group_ownership(UUID, UUID);
DROP FUNCTION IF EXISTS transfer_group_ownership(group_id_param UUID, new_admin_id UUID);
DROP FUNCTION IF EXISTS get_group_statistics(UUID);
DROP FUNCTION IF EXISTS get_group_statistics(group_id_param UUID);
DROP FUNCTION IF EXISTS update_group(UUID, TEXT, TEXT, TEXT, TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS update_group(group_id_param UUID, name_param TEXT, slug_param TEXT, description_param TEXT, group_type_param TEXT, municipality_id_param UUID, place_id_param UUID);

-- =====================================================
-- DROPP TRIGGER-FUNKSJONER (internal functions)
-- =====================================================

DROP FUNCTION IF EXISTS update_group_post_count();
DROP FUNCTION IF EXISTS cleanup_group_posts();
DROP FUNCTION IF EXISTS update_group_member_count();
DROP FUNCTION IF EXISTS auto_populate_group_posts();
DROP FUNCTION IF EXISTS validate_post_group_community();

-- =====================================================
-- VERIFISER
-- =====================================================

DO $$
DECLARE
  trigger_count INTEGER;
  function_count INTEGER;
BEGIN
  -- Tell gjenstående triggers
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%group%';

  -- Tell gjenstående funksjoner
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name LIKE '%group%';

  IF trigger_count > 0 THEN
    RAISE WARNING '% gruppe-triggers gjenstår (kan være ok hvis de ikke er relatert)', trigger_count;
  END IF;

  IF function_count > 0 THEN
    RAISE WARNING '% gruppe-funksjoner gjenstår (kan være ok hvis de ikke er relatert)', function_count;
  END IF;

  RAISE NOTICE 'Triggers og funksjoner droppet';
END $$;

COMMIT;
