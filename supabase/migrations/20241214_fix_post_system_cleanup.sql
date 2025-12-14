-- =====================================================
-- FJERN DEPRECATED KOLONNER
-- =====================================================
-- Etter at data er migrert til group_places og community_places,
-- fjern de gamle kolonnene fra groups og communities

BEGIN;

-- Sjekk om kolonner eksisterer før vi prøver å fjerne dem
DO $$
BEGIN
  -- Fjern fra groups (vi bruker nå group_places)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'groups'
    AND column_name = 'municipality_id'
  ) THEN
    ALTER TABLE groups DROP COLUMN municipality_id;
    RAISE NOTICE 'Fjernet groups.municipality_id';
  ELSE
    RAISE NOTICE 'groups.municipality_id finnes ikke, hopper over';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'groups'
    AND column_name = 'place_id'
  ) THEN
    ALTER TABLE groups DROP COLUMN place_id;
    RAISE NOTICE 'Fjernet groups.place_id';
  ELSE
    RAISE NOTICE 'groups.place_id finnes ikke, hopper over';
  END IF;

  -- Fjern fra communities (vi bruker nå community_places)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'communities'
    AND column_name = 'municipality_id'
  ) THEN
    ALTER TABLE communities DROP COLUMN municipality_id;
    RAISE NOTICE 'Fjernet communities.municipality_id';
  ELSE
    RAISE NOTICE 'communities.municipality_id finnes ikke, hopper over';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'communities'
    AND column_name = 'place_id'
  ) THEN
    ALTER TABLE communities DROP COLUMN place_id;
    RAISE NOTICE 'Fjernet communities.place_id';
  ELSE
    RAISE NOTICE 'communities.place_id finnes ikke, hopper over';
  END IF;
END $$;

-- Oppdater kommentarer
COMMENT ON TABLE groups IS
  'Grupper. Stedstilknytning håndteres via group_places (kun for åpne grupper).';

COMMENT ON TABLE communities IS
  'Samfunn. Stedstilknytninger håndteres via community_places (many-to-many).';

DO $$
BEGIN
  RAISE NOTICE '=== CLEANUP FULLFØRT ===';
  RAISE NOTICE 'Deprecated kolonner er fjernet fra groups og communities';
  RAISE NOTICE 'Stedstilknytninger håndteres nå via group_places og community_places';
END $$;

COMMIT;
