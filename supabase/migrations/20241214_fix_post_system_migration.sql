-- =====================================================
-- MIGRER ING AV EKSISTERENDE DATA
-- =====================================================
-- Rydd opp i eksisterende data som bryter nye regler

BEGIN;

-- 1. FINN OG RAPPORTER PERSONLIGE INNLEGG MED GEOGRAFI
DO $$
DECLARE
  personal_posts_count INT;
BEGIN
  SELECT COUNT(*) INTO personal_posts_count
  FROM posts
  WHERE created_for_group_id IS NULL
  AND created_for_community_id IS NULL
  AND (municipality_id IS NOT NULL OR place_id IS NOT NULL);

  IF personal_posts_count > 0 THEN
    RAISE NOTICE 'ADVARSEL: % personlige innlegg har geografisk tilknytning', personal_posts_count;
    RAISE NOTICE 'Disse vil ikke lenger vises i geografiske feeds, kun i brukerens egen feed';
  ELSE
    RAISE NOTICE 'OK: Ingen personlige innlegg med geografisk tilknytning funnet';
  END IF;
END $$;

-- 2. FINN LUKKEDE/SKJULTE GRUPPER MED STEDSTILKNYTNING
DO $$
DECLARE
  invalid_groups_count INT;
BEGIN
  -- Sjekk først om groups-tabellen har municipality_id/place_id kolonner
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'groups'
    AND column_name IN ('municipality_id', 'place_id')
  ) THEN
    SELECT COUNT(*) INTO invalid_groups_count
    FROM groups
    WHERE group_type IN ('closed', 'hidden')
    AND (municipality_id IS NOT NULL OR place_id IS NOT NULL);

    IF invalid_groups_count > 0 THEN
      RAISE WARNING 'ADVARSEL: % lukkede/skjulte grupper har stedstilknytning!', invalid_groups_count;
      RAISE WARNING 'Stedstilknytning vil bli fjernet for disse gruppene i cleanup-migrasjonen';

      -- Vi fjerner IKKE dataene her, det gjøres i cleanup-migrasjonen
    ELSE
      RAISE NOTICE 'OK: Ingen lukkede/skjulte grupper med stedstilknytning funnet';
    END IF;
  ELSE
    RAISE NOTICE 'Kolonner municipality_id/place_id finnes ikke i groups-tabellen';
  END IF;
END $$;

-- 3. FINN GRUPPER SOM ALLEREDE ER MIGRERT TIL group_places
DO $$
DECLARE
  already_migrated_count INT;
BEGIN
  SELECT COUNT(*) INTO already_migrated_count
  FROM group_places;

  IF already_migrated_count > 0 THEN
    RAISE NOTICE 'INFO: % grupper allerede migrert til group_places', already_migrated_count;
  ELSE
    RAISE NOTICE 'INFO: Ingen grupper migrert til group_places ennå';
  END IF;
END $$;

-- 4. FINN SAMFUNN SOM ALLEREDE ER MIGRERT TIL community_places
DO $$
DECLARE
  already_migrated_count INT;
BEGIN
  SELECT COUNT(*) INTO already_migrated_count
  FROM community_places;

  IF already_migrated_count > 0 THEN
    RAISE NOTICE 'INFO: % samfunn allerede migrert til community_places', already_migrated_count;
  ELSE
    RAISE NOTICE 'INFO: Ingen samfunn migrert til community_places ennå';
  END IF;
END $$;

-- 5. STATISTIKK OVER INNLEGG
DO $$
DECLARE
  total_posts INT;
  personal_posts INT;
  group_posts INT;
  community_posts INT;
  open_group_posts INT;
  closed_group_posts INT;
  personal_with_geo INT;
BEGIN
  SELECT COUNT(*) INTO total_posts FROM posts;

  SELECT COUNT(*) INTO personal_posts
  FROM posts
  WHERE created_for_group_id IS NULL AND created_for_community_id IS NULL;

  SELECT COUNT(*) INTO group_posts
  FROM posts
  WHERE created_for_group_id IS NOT NULL;

  SELECT COUNT(*) INTO community_posts
  FROM posts
  WHERE created_for_community_id IS NOT NULL;

  SELECT COUNT(*) INTO open_group_posts
  FROM posts p
  JOIN groups g ON p.created_for_group_id = g.id
  WHERE g.group_type = 'open';

  SELECT COUNT(*) INTO closed_group_posts
  FROM posts p
  JOIN groups g ON p.created_for_group_id = g.id
  WHERE g.group_type IN ('closed', 'hidden');

  SELECT COUNT(*) INTO personal_with_geo
  FROM posts
  WHERE created_for_group_id IS NULL
  AND created_for_community_id IS NULL
  AND (municipality_id IS NOT NULL OR place_id IS NOT NULL);

  RAISE NOTICE '=== MIGRERINGSSTATISTIKK ===';
  RAISE NOTICE 'Totalt innlegg: %', total_posts;
  RAISE NOTICE 'Personlige innlegg: %', personal_posts;
  RAISE NOTICE '  - Med geografi (vil skjules fra geo-feeds): %', personal_with_geo;
  RAISE NOTICE 'Gruppe-innlegg: %', group_posts;
  RAISE NOTICE '  - Åpne grupper (vil vises i geo-feeds): %', open_group_posts;
  RAISE NOTICE '  - Lukkede/skjulte (vil IKKE vises i geo-feeds): %', closed_group_posts;
  RAISE NOTICE 'Samfunns-innlegg: %', community_posts;
END $$;

COMMIT;
