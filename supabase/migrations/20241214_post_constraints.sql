-- =====================================================
-- DATABASE CONSTRAINTS FOR POSTS
-- =====================================================
-- Beskrivelse: Legger til database-level constraints for å
-- forhindre ugyldig data i posts-tabellen.
--
-- Constraints:
-- 1. Kan ikke ha både gruppe OG samfunn (mutually exclusive)
-- 2. Digitale arrangementer kan ikke ha fysisk sted
-- 3. Fysiske arrangementer må ha geografi
-- =====================================================

BEGIN;

-- =====================================================
-- CONSTRAINT 1: Single Entity Context
-- =====================================================
-- Et innlegg kan KUN tilhøre enten en gruppe ELLER et samfunn
-- (ikke begge samtidig)
DO $$
BEGIN
  -- Sjekk om constraint allerede eksisterer
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'posts_single_entity_context'
  ) THEN
    ALTER TABLE posts ADD CONSTRAINT posts_single_entity_context CHECK (
      (created_for_group_id IS NULL OR created_for_community_id IS NULL)
    );
    RAISE NOTICE 'Added constraint: posts_single_entity_context';
  ELSE
    RAISE NOTICE 'Constraint posts_single_entity_context already exists';
  END IF;
END $$;

COMMENT ON CONSTRAINT posts_single_entity_context ON posts IS
  'Sikrer at et innlegg kun tilhører enten en gruppe ELLER et samfunn, ikke begge';

-- =====================================================
-- CONSTRAINT 2: Digital Events Have No Physical Location
-- =====================================================
-- Digitale arrangementer kan ikke ha municipality_id, place_id eller event_location
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'posts_digital_no_physical'
  ) THEN
    ALTER TABLE posts ADD CONSTRAINT posts_digital_no_physical CHECK (
      (is_digital = FALSE OR is_digital IS NULL)
      OR (
        place_id IS NULL
        AND municipality_id IS NULL
        AND (event_location IS NULL OR event_location = '')
      )
    );
    RAISE NOTICE 'Added constraint: posts_digital_no_physical';
  ELSE
    RAISE NOTICE 'Constraint posts_digital_no_physical already exists';
  END IF;
END $$;

COMMENT ON CONSTRAINT posts_digital_no_physical ON posts IS
  'Sikrer at digitale arrangementer ikke har fysisk lokasjon (place_id, municipality_id, event_location)';

-- =====================================================
-- CONSTRAINT 3: Physical Events Must Have Geography
-- =====================================================
-- Fysiske arrangementer må ha enten municipality_id eller place_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'posts_physical_has_geography'
  ) THEN
    ALTER TABLE posts ADD CONSTRAINT posts_physical_has_geography CHECK (
      -- Ikke et arrangement, eller digitalt arrangement = OK
      (type != 'event' OR is_digital = TRUE)
      -- Eller fysisk arrangement med geografi
      OR (municipality_id IS NOT NULL OR place_id IS NOT NULL)
    );
    RAISE NOTICE 'Added constraint: posts_physical_has_geography';
  ELSE
    RAISE NOTICE 'Constraint posts_physical_has_geography already exists';
  END IF;
END $$;

COMMENT ON CONSTRAINT posts_physical_has_geography ON posts IS
  'Sikrer at fysiske arrangementer har enten municipality_id eller place_id';

-- =====================================================
-- VERIFIKASJON
-- =====================================================
DO $$
DECLARE
  constraint_count INT;
  posts_violating_single_entity INT := 0;
  posts_violating_digital INT := 0;
  posts_violating_physical INT := 0;
BEGIN
  -- Tell constraints
  SELECT COUNT(*) INTO constraint_count
  FROM pg_constraint
  WHERE conrelid = 'posts'::regclass
  AND conname IN (
    'posts_single_entity_context',
    'posts_digital_no_physical',
    'posts_physical_has_geography'
  );

  RAISE NOTICE '=== CONSTRAINT VERIFICATION ===';
  RAISE NOTICE 'Total post constraints added: %', constraint_count;

  -- Sjekk om det finnes innlegg som bryter constraints (før de ble lagt til)
  SELECT COUNT(*) INTO posts_violating_single_entity
  FROM posts
  WHERE created_for_group_id IS NOT NULL
  AND created_for_community_id IS NOT NULL;

  SELECT COUNT(*) INTO posts_violating_digital
  FROM posts
  WHERE is_digital = TRUE
  AND (
    place_id IS NOT NULL
    OR municipality_id IS NOT NULL
    OR (event_location IS NOT NULL AND event_location != '')
  );

  SELECT COUNT(*) INTO posts_violating_physical
  FROM posts
  WHERE type = 'event'
  AND (is_digital = FALSE OR is_digital IS NULL)
  AND municipality_id IS NULL
  AND place_id IS NULL;

  IF posts_violating_single_entity > 0 THEN
    RAISE WARNING 'WARNING: % posts have both created_for_group_id AND created_for_community_id!', posts_violating_single_entity;
  END IF;

  IF posts_violating_digital > 0 THEN
    RAISE WARNING 'WARNING: % digital events have physical location!', posts_violating_digital;
  END IF;

  IF posts_violating_physical > 0 THEN
    RAISE WARNING 'WARNING: % physical events missing geography!', posts_violating_physical;
  END IF;

  IF posts_violating_single_entity = 0 AND posts_violating_digital = 0 AND posts_violating_physical = 0 THEN
    RAISE NOTICE 'SUCCESS: All existing posts comply with new constraints';
  END IF;
END $$;

COMMIT;
