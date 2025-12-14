-- =====================================================
-- KRITISK FIX: Auto-koble innlegg til grupper/samfunn
-- =====================================================
-- Beskrivelse: Denne migrasjonen legger til triggers som automatisk
-- populerer group_posts og community_posts junction-tabeller når
-- et innlegg opprettes med created_for_group_id eller created_for_community_id.
--
-- Tidligere: Innlegg ble opprettet med created_for_group_id, men ingen
-- rad ble lagt til i group_posts, så lukk/skjulte gruppeinnlegg vises i hovedfeed.
--
-- Løsning: Trigger som automatisk oppretter junction-tabellrader.
-- =====================================================

BEGIN;

-- =====================================================
-- TRIGGER 1: Auto-populer group_posts
-- =====================================================
CREATE OR REPLACE FUNCTION auto_populate_group_posts()
RETURNS TRIGGER AS $$
BEGIN
  -- Hvis innlegg opprettes for en gruppe, legg til i group_posts
  IF NEW.created_for_group_id IS NOT NULL THEN
    INSERT INTO group_posts (group_id, post_id, created_at)
    VALUES (NEW.created_for_group_id, NEW.id, NEW.created_at)
    ON CONFLICT (group_id, post_id) DO NOTHING;

    RAISE LOG 'Auto-populated group_posts: post_id=%, group_id=%', NEW.id, NEW.created_for_group_id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Logg feil men ikke blokkér post-opprettelsen
    RAISE WARNING 'Failed to auto-populate group_posts: post_id=%, error=%', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dropp trigger hvis den allerede eksisterer
DROP TRIGGER IF EXISTS trigger_auto_populate_group_posts ON posts;

-- Opprett trigger
CREATE TRIGGER trigger_auto_populate_group_posts
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_group_posts();

COMMENT ON FUNCTION auto_populate_group_posts() IS
  'Automatisk populer group_posts junction-tabell når innlegg opprettes med created_for_group_id';

-- =====================================================
-- TRIGGER 2: Auto-populer community_posts
-- =====================================================
CREATE OR REPLACE FUNCTION auto_populate_community_posts()
RETURNS TRIGGER AS $$
BEGIN
  -- Hvis innlegg opprettes for et samfunn, legg til i community_posts
  IF NEW.created_for_community_id IS NOT NULL THEN
    INSERT INTO community_posts (community_id, post_id, created_at)
    VALUES (NEW.created_for_community_id, NEW.id, NEW.created_at)
    ON CONFLICT (community_id, post_id) DO NOTHING;

    RAISE LOG 'Auto-populated community_posts: post_id=%, community_id=%', NEW.id, NEW.created_for_community_id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Logg feil men ikke blokkér post-opprettelsen
    RAISE WARNING 'Failed to auto-populate community_posts: post_id=%, error=%', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dropp trigger hvis den allerede eksisterer
DROP TRIGGER IF EXISTS trigger_auto_populate_community_posts ON posts;

-- Opprett trigger
CREATE TRIGGER trigger_auto_populate_community_posts
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_community_posts();

COMMENT ON FUNCTION auto_populate_community_posts() IS
  'Automatisk populer community_posts junction-tabell når innlegg opprettes med created_for_community_id';

-- =====================================================
-- TRIGGER 3: Rydd opp referanser når gruppe slettes
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_group_post_references()
RETURNS TRIGGER AS $$
BEGIN
  -- Sett created_for_group_id til NULL for innlegg i slettet gruppe
  -- Innleggene beholdes men mister gruppe-tilhørighet
  UPDATE posts
  SET created_for_group_id = NULL
  WHERE created_for_group_id = OLD.id;

  RAISE LOG 'Cleaned up post references for deleted group: group_id=%', OLD.id;

  RETURN OLD;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to cleanup group post references: group_id=%, error=%', OLD.id, SQLERRM;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dropp trigger hvis den allerede eksisterer
DROP TRIGGER IF EXISTS trigger_cleanup_group_posts ON groups;

-- Opprett trigger
CREATE TRIGGER trigger_cleanup_group_posts
  BEFORE DELETE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_group_post_references();

COMMENT ON FUNCTION cleanup_group_post_references() IS
  'Rydd opp created_for_group_id referanser når gruppe slettes';

-- =====================================================
-- TRIGGER 4: Rydd opp referanser når samfunn slettes
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_community_post_references()
RETURNS TRIGGER AS $$
BEGIN
  -- Sett created_for_community_id til NULL for innlegg i slettet samfunn
  UPDATE posts
  SET created_for_community_id = NULL
  WHERE created_for_community_id = OLD.id;

  RAISE LOG 'Cleaned up post references for deleted community: community_id=%', OLD.id;

  RETURN OLD;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to cleanup community post references: community_id=%, error=%', OLD.id, SQLERRM;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dropp trigger hvis den allerede eksisterer
DROP TRIGGER IF EXISTS trigger_cleanup_community_posts ON communities;

-- Opprett trigger
CREATE TRIGGER trigger_cleanup_community_posts
  BEFORE DELETE ON communities
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_community_post_references();

COMMENT ON FUNCTION cleanup_community_post_references() IS
  'Rydd opp created_for_community_id referanser når samfunn slettes';

-- =====================================================
-- DATA-MIGRERING: Backfill eksisterende innlegg
-- =====================================================

-- Backfill group_posts for eksisterende innlegg
DO $$
DECLARE
  group_posts_added INT;
BEGIN
  INSERT INTO group_posts (group_id, post_id, created_at)
  SELECT
    p.created_for_group_id,
    p.id,
    p.created_at
  FROM posts p
  WHERE p.created_for_group_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM group_posts gp
    WHERE gp.post_id = p.id
    AND gp.group_id = p.created_for_group_id
  )
  ON CONFLICT (group_id, post_id) DO NOTHING;

  GET DIAGNOSTICS group_posts_added = ROW_COUNT;
  RAISE NOTICE 'Backfilled % group_posts entries', group_posts_added;
END $$;

-- Backfill community_posts for eksisterende innlegg
DO $$
DECLARE
  community_posts_added INT;
BEGIN
  INSERT INTO community_posts (community_id, post_id, created_at)
  SELECT
    p.created_for_community_id,
    p.id,
    p.created_at
  FROM posts p
  WHERE p.created_for_community_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_posts cp
    WHERE cp.post_id = p.id
    AND cp.community_id = p.created_for_community_id
  )
  ON CONFLICT (community_id, post_id) DO NOTHING;

  GET DIAGNOSTICS community_posts_added = ROW_COUNT;
  RAISE NOTICE 'Backfilled % community_posts entries', community_posts_added;
END $$;

-- Rydd opp orf orphaned group_posts (grupper som er slettet)
DO $$
DECLARE
  orphaned_removed INT;
BEGIN
  DELETE FROM group_posts
  WHERE NOT EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_posts.group_id
  );

  GET DIAGNOSTICS orphaned_removed = ROW_COUNT;
  RAISE NOTICE 'Removed % orphaned group_posts entries', orphaned_removed;
END $$;

-- Rydd opp orphaned community_posts
DO $$
DECLARE
  orphaned_removed INT;
BEGIN
  DELETE FROM community_posts
  WHERE NOT EXISTS (
    SELECT 1 FROM communities c
    WHERE c.id = community_posts.community_id
  );

  GET DIAGNOSTICS orphaned_removed = ROW_COUNT;
  RAISE NOTICE 'Removed % orphaned community_posts entries', orphaned_removed;
END $$;

-- =====================================================
-- VERIFIKASJON
-- =====================================================
DO $$
DECLARE
  total_posts INT;
  posts_with_group INT;
  group_posts_count INT;
  posts_with_community INT;
  community_posts_count INT;
BEGIN
  SELECT COUNT(*) INTO total_posts FROM posts;
  SELECT COUNT(*) INTO posts_with_group FROM posts WHERE created_for_group_id IS NOT NULL;
  SELECT COUNT(*) INTO group_posts_count FROM group_posts;
  SELECT COUNT(*) INTO posts_with_community FROM posts WHERE created_for_community_id IS NOT NULL;
  SELECT COUNT(*) INTO community_posts_count FROM community_posts;

  RAISE NOTICE '=== MIGRATION RESULTS ===';
  RAISE NOTICE 'Total posts: %', total_posts;
  RAISE NOTICE 'Posts with created_for_group_id: %', posts_with_group;
  RAISE NOTICE 'group_posts entries: %', group_posts_count;
  RAISE NOTICE 'Posts with created_for_community_id: %', posts_with_community;
  RAISE NOTICE 'community_posts entries: %', community_posts_count;

  IF posts_with_group > 0 AND group_posts_count = 0 THEN
    RAISE WARNING 'WARNING: Posts have created_for_group_id but no group_posts entries!';
  END IF;

  IF posts_with_community > 0 AND community_posts_count = 0 THEN
    RAISE WARNING 'WARNING: Posts have created_for_community_id but no community_posts entries!';
  END IF;
END $$;

COMMIT;
