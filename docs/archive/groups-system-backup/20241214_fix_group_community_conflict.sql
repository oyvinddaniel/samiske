-- =====================================================
-- KRITISK SIKKERHETSFIKS: Forhindre gruppe + samfunn samtidig
-- =====================================================
-- Beskrivelse: Innlegg kan ikke tilhøre både en gruppe OG et samfunn.
-- Dette er et sikkerhets-hull fordi innlegg fra lukkede/skjulte grupper
-- kan vises på samfunnssider.
--
-- Løsning:
-- 1. CHECK constraint som forhindrer at begge feltene er satt
-- 2. Trigger som validerer før insert/update
-- 3. Data-cleanup av eksisterende innlegg som bryter regelen
-- =====================================================

BEGIN;

-- =====================================================
-- STEG 1: Rydd opp eksisterende data
-- =====================================================
-- Regel: Hvis et innlegg har BÅDE created_for_group_id OG created_for_community_id,
-- prioriter gruppen (siden grupper er private) og fjern samfunns-assosiasjonen.

DO $$
DECLARE
  affected_posts INT;
  affected_community_posts INT;
BEGIN
  -- Tell innlegg med begge feltene satt
  SELECT COUNT(*) INTO affected_posts
  FROM posts
  WHERE created_for_group_id IS NOT NULL
    AND created_for_community_id IS NOT NULL;

  RAISE NOTICE 'Fant % innlegg med både gruppe og samfunn', affected_posts;

  IF affected_posts > 0 THEN
    -- Fjern samfunns-assosiasjon fra disse innleggene
    -- Gruppen prioriteres fordi den er privat
    UPDATE posts
    SET created_for_community_id = NULL
    WHERE created_for_group_id IS NOT NULL
      AND created_for_community_id IS NOT NULL;

    RAISE NOTICE 'Fjernet samfunns-assosiasjon fra % innlegg (beholdt gruppe)', affected_posts;

    -- Fjern også fra community_posts junction-tabellen
    DELETE FROM community_posts
    WHERE post_id IN (
      SELECT id FROM posts
      WHERE created_for_group_id IS NOT NULL
    );

    GET DIAGNOSTICS affected_community_posts = ROW_COUNT;
    RAISE NOTICE 'Fjernet % rader fra community_posts', affected_community_posts;
  END IF;
END $$;

-- =====================================================
-- STEG 2: Legg til CHECK constraint
-- =====================================================
-- Forhindre at nye innlegg får begge feltene satt
ALTER TABLE posts
DROP CONSTRAINT IF EXISTS posts_group_or_community_check;

ALTER TABLE posts
ADD CONSTRAINT posts_group_or_community_check
CHECK (
  NOT (created_for_group_id IS NOT NULL AND created_for_community_id IS NOT NULL)
);

COMMENT ON CONSTRAINT posts_group_or_community_check ON posts IS
  'Sikkerhet: Et innlegg kan ikke tilhøre både en gruppe OG et samfunn samtidig';

-- =====================================================
-- STEG 3: Oppdater triggers for å håndheve regelen
-- =====================================================
CREATE OR REPLACE FUNCTION validate_post_group_community()
RETURNS TRIGGER AS $$
BEGIN
  -- SIKKERHET: Forhindre at innlegg tilhører både gruppe og samfunn
  IF NEW.created_for_group_id IS NOT NULL AND NEW.created_for_community_id IS NOT NULL THEN
    RAISE EXCEPTION 'Sikkerhetsfeil: Et innlegg kan ikke tilhøre både en gruppe og et samfunn. Gruppe-ID: %, Samfunn-ID: %',
      NEW.created_for_group_id, NEW.created_for_community_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dropp trigger hvis den eksisterer
DROP TRIGGER IF EXISTS trigger_validate_post_group_community ON posts;

-- Opprett trigger som kjører før INSERT og UPDATE
CREATE TRIGGER trigger_validate_post_group_community
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION validate_post_group_community();

COMMENT ON FUNCTION validate_post_group_community() IS
  'Valider at innlegg ikke tilhører både gruppe og samfunn (sikkerhet)';

-- =====================================================
-- STEG 4: Oppdater auto-populate triggers
-- =====================================================
-- Sørg for at auto-populate triggers ikke bryter regelen

CREATE OR REPLACE FUNCTION auto_populate_community_posts()
RETURNS TRIGGER AS $$
BEGIN
  -- SIKKERHET: ALDRI legg til i community_posts hvis innlegget tilhører en gruppe
  IF NEW.created_for_community_id IS NOT NULL AND NEW.created_for_group_id IS NULL THEN
    INSERT INTO community_posts (community_id, post_id, created_at)
    VALUES (NEW.created_for_community_id, NEW.id, NEW.created_at)
    ON CONFLICT (community_id, post_id) DO NOTHING;

    RAISE LOG 'Auto-populated community_posts: post_id=%, community_id=%', NEW.id, NEW.created_for_community_id;
  ELSIF NEW.created_for_community_id IS NOT NULL AND NEW.created_for_group_id IS NOT NULL THEN
    -- Dette skal aldri skje på grunn av constraint, men logg det hvis det gjør det
    RAISE WARNING 'SIKKERHETSFEIL: Forsøkte å opprette innlegg med både gruppe og samfunn! post_id=%, group_id=%, community_id=%',
      NEW.id, NEW.created_for_group_id, NEW.created_for_community_id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to auto-populate community_posts: post_id=%, error=%', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_populate_community_posts() IS
  'Automatisk populer community_posts - MEN IKKE hvis innlegget tilhører en gruppe (sikkerhet)';

-- =====================================================
-- STEG 5: Rydd opp orphaned community_posts
-- =====================================================
-- Fjern community_posts rader for innlegg som tilhører grupper
DO $$
DECLARE
  orphaned_removed INT;
BEGIN
  DELETE FROM community_posts
  WHERE post_id IN (
    SELECT id FROM posts
    WHERE created_for_group_id IS NOT NULL
  );

  GET DIAGNOSTICS orphaned_removed = ROW_COUNT;
  RAISE NOTICE 'Fjernet % orphaned community_posts (innlegg tilhører grupper)', orphaned_removed;
END $$;

-- =====================================================
-- VERIFIKASJON
-- =====================================================
DO $$
DECLARE
  posts_with_both INT;
  community_posts_with_groups INT;
BEGIN
  -- Sjekk at ingen innlegg har begge feltene
  SELECT COUNT(*) INTO posts_with_both
  FROM posts
  WHERE created_for_group_id IS NOT NULL
    AND created_for_community_id IS NOT NULL;

  -- Sjekk at ingen community_posts har gruppe-innlegg
  SELECT COUNT(*) INTO community_posts_with_groups
  FROM community_posts cp
  INNER JOIN posts p ON p.id = cp.post_id
  WHERE p.created_for_group_id IS NOT NULL;

  RAISE NOTICE '=== SIKKERHET VERIFIKASJON ===';
  RAISE NOTICE 'Innlegg med både gruppe og samfunn: % (skal være 0)', posts_with_both;
  RAISE NOTICE 'community_posts med gruppe-innlegg: % (skal være 0)', community_posts_with_groups;

  IF posts_with_both > 0 THEN
    RAISE EXCEPTION 'SIKKERHETSFEIL: % innlegg har fortsatt både gruppe og samfunn!', posts_with_both;
  END IF;

  IF community_posts_with_groups > 0 THEN
    RAISE EXCEPTION 'SIKKERHETSFEIL: % community_posts rader refererer til gruppe-innlegg!', community_posts_with_groups;
  END IF;

  RAISE NOTICE 'SUKSESS: Alle sikkerhetsregler er implementert korrekt';
END $$;

COMMIT;
