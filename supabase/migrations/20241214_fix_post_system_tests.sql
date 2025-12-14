-- =====================================================
-- TESTING AV INNLEGGSSYSTEM
-- =====================================================
-- Verifiser at alt fungerer som forventet

BEGIN;

DO $$
BEGIN
  RAISE NOTICE '=== STARTER AUTOMATISERTE TESTER ===';
END $$;

-- Test 1: Åpne gruppe-innlegg vises i geografiske feeds
DO $$
DECLARE
  test_group_id UUID;
  test_post_id UUID;
  test_place_id UUID;
  test_user_id UUID;
  posts_count INT;
BEGIN
  -- Hent en eksisterende bruker
  SELECT id INTO test_user_id FROM profiles LIMIT 1;

  IF test_user_id IS NULL THEN
    RAISE NOTICE 'TEST 1 SKIPPED: Ingen brukere funnet i databasen';
    RETURN;
  END IF;

  -- Opprett testgruppe (åpen)
  INSERT INTO groups (name, slug, group_type, created_by)
  VALUES ('Test Åpen Gruppe', 'test-open-group-' || gen_random_uuid(), 'open', test_user_id)
  RETURNING id INTO test_group_id;

  -- Hent et sted
  SELECT id INTO test_place_id FROM places LIMIT 1;

  IF test_place_id IS NULL THEN
    RAISE NOTICE 'TEST 1 SKIPPED: Ingen steder funnet i databasen';
    DELETE FROM groups WHERE id = test_group_id;
    RETURN;
  END IF;

  -- Tilknytt gruppe til sted
  INSERT INTO group_places (group_id, place_id)
  VALUES (test_group_id, test_place_id);

  -- Opprett testinnlegg i gruppen
  INSERT INTO posts (user_id, title, content, type, visibility, created_for_group_id)
  VALUES (
    test_user_id,
    'Test innlegg åpen gruppe',
    'Dette skal vises i geografisk feed',
    'standard',
    'public',
    test_group_id
  )
  RETURNING id INTO test_post_id;

  -- Test: Hent innlegg for stedet
  SELECT COUNT(*) INTO posts_count
  FROM get_posts_for_geography('place', test_place_id, 50, 0) AS posts
  WHERE posts.id = test_post_id;

  IF posts_count = 1 THEN
    RAISE NOTICE 'TEST 1 PASSED ✅: Åpne gruppe-innlegg vises i geografisk feed';
  ELSE
    RAISE WARNING 'TEST 1 FAILED ❌: Åpne gruppe-innlegg vises IKKE i geografisk feed (fant % innlegg)', posts_count;
  END IF;

  -- Rydd opp
  DELETE FROM posts WHERE id = test_post_id;
  DELETE FROM groups WHERE id = test_group_id;
END $$;

-- Test 2: Lukkede gruppe-innlegg vises IKKE i geografiske feeds
DO $$
DECLARE
  test_group_id UUID;
  test_post_id UUID;
  test_place_id UUID;
  test_user_id UUID;
  posts_count INT;
BEGIN
  -- Hent en eksisterende bruker
  SELECT id INTO test_user_id FROM profiles LIMIT 1;

  IF test_user_id IS NULL THEN
    RAISE NOTICE 'TEST 2 SKIPPED: Ingen brukere funnet i databasen';
    RETURN;
  END IF;

  -- Opprett testgruppe (lukket)
  INSERT INTO groups (name, slug, group_type, created_by)
  VALUES ('Test Lukket Gruppe', 'test-closed-group-' || gen_random_uuid(), 'closed', test_user_id)
  RETURNING id INTO test_group_id;

  -- Opprett testinnlegg i gruppen
  INSERT INTO posts (user_id, title, content, type, visibility, created_for_group_id)
  VALUES (
    test_user_id,
    'Test innlegg lukket gruppe',
    'Dette skal IKKE vises i geografisk feed',
    'standard',
    'public',
    test_group_id
  )
  RETURNING id INTO test_post_id;

  -- Hent et sted
  SELECT id INTO test_place_id FROM places LIMIT 1;

  IF test_place_id IS NULL THEN
    RAISE NOTICE 'TEST 2 SKIPPED: Ingen steder funnet i databasen';
    DELETE FROM posts WHERE id = test_post_id;
    DELETE FROM groups WHERE id = test_group_id;
    RETURN;
  END IF;

  -- Test: Hent innlegg for stedet (selv uten stedstilknytning, skal ikke vises)
  SELECT COUNT(*) INTO posts_count
  FROM get_posts_for_geography('place', test_place_id, 50, 0)
  WHERE id = test_post_id;

  IF posts_count = 0 THEN
    RAISE NOTICE 'TEST 2 PASSED ✅: Lukkede gruppe-innlegg vises IKKE i geografisk feed';
  ELSE
    RAISE WARNING 'TEST 2 FAILED ❌: Lukkede gruppe-innlegg vises i geografisk feed (fant % innlegg)', posts_count;
  END IF;

  -- Rydd opp
  DELETE FROM posts WHERE id = test_post_id;
  DELETE FROM groups WHERE id = test_group_id;
END $$;

-- Test 3: Personlige innlegg vises IKKE i geografiske feeds
DO $$
DECLARE
  test_post_id UUID;
  test_place_id UUID;
  test_user_id UUID;
  posts_count INT;
BEGIN
  -- Hent en eksisterende bruker
  SELECT id INTO test_user_id FROM profiles LIMIT 1;

  IF test_user_id IS NULL THEN
    RAISE NOTICE 'TEST 3 SKIPPED: Ingen brukere funnet i databasen';
    RETURN;
  END IF;

  -- Hent et sted
  SELECT id INTO test_place_id FROM places LIMIT 1;

  IF test_place_id IS NULL THEN
    RAISE NOTICE 'TEST 3 SKIPPED: Ingen steder funnet i databasen';
    RETURN;
  END IF;

  -- Opprett personlig innlegg med geografi (dette er feil bruk, men må håndteres)
  INSERT INTO posts (user_id, title, content, type, visibility, place_id)
  VALUES (
    test_user_id,
    'Test personlig innlegg',
    'Dette skal IKKE vises i geografisk feed',
    'standard',
    'public',
    test_place_id
  )
  RETURNING id INTO test_post_id;

  -- Test: Hent innlegg for stedet
  SELECT COUNT(*) INTO posts_count
  FROM get_posts_for_geography('place', test_place_id, 50, 0) AS posts
  WHERE posts.id = test_post_id;

  IF posts_count = 0 THEN
    RAISE NOTICE 'TEST 3 PASSED ✅: Personlige innlegg vises IKKE i geografisk feed';
  ELSE
    RAISE WARNING 'TEST 3 FAILED ❌: Personlige innlegg vises i geografisk feed (fant % innlegg)', posts_count;
  END IF;

  -- Rydd opp
  DELETE FROM posts WHERE id = test_post_id;
END $$;

-- Test 4: Samfunns-innlegg med sted vises i geografiske feeds
DO $$
DECLARE
  test_community_id UUID;
  test_post_id UUID;
  test_place_id UUID;
  test_user_id UUID;
  posts_count INT;
BEGIN
  -- Hent en eksisterende bruker
  SELECT id INTO test_user_id FROM profiles LIMIT 1;

  IF test_user_id IS NULL THEN
    RAISE NOTICE 'TEST 4 SKIPPED: Ingen brukere funnet i databasen';
    RETURN;
  END IF;

  -- Opprett testsamfunn
  INSERT INTO communities (name, slug, created_by, is_active)
  VALUES ('Test Samfunn', 'test-community-' || gen_random_uuid(), test_user_id, true)
  RETURNING id INTO test_community_id;

  -- Hent et sted
  SELECT id INTO test_place_id FROM places LIMIT 1;

  IF test_place_id IS NULL THEN
    RAISE NOTICE 'TEST 4 SKIPPED: Ingen steder funnet i databasen';
    DELETE FROM communities WHERE id = test_community_id;
    RETURN;
  END IF;

  -- Tilknytt samfunn til sted
  INSERT INTO community_places (community_id, place_id)
  VALUES (test_community_id, test_place_id);

  -- Opprett testinnlegg i samfunnet
  INSERT INTO posts (user_id, title, content, type, visibility, created_for_community_id)
  VALUES (
    test_user_id,
    'Test innlegg samfunn',
    'Dette skal vises i geografisk feed',
    'standard',
    'public',
    test_community_id
  )
  RETURNING id INTO test_post_id;

  -- Lagre stedstilknytning for innlegget
  INSERT INTO community_post_locations (post_id, community_id, place_id)
  VALUES (test_post_id, test_community_id, test_place_id);

  -- Test: Hent innlegg for stedet
  SELECT COUNT(*) INTO posts_count
  FROM get_posts_for_geography('place', test_place_id, 50, 0) AS posts
  WHERE posts.id = test_post_id;

  IF posts_count = 1 THEN
    RAISE NOTICE 'TEST 4 PASSED ✅: Samfunns-innlegg vises i geografisk feed';
  ELSE
    RAISE WARNING 'TEST 4 FAILED ❌: Samfunns-innlegg vises IKKE i geografisk feed (fant % innlegg)', posts_count;
  END IF;

  -- Rydd opp
  DELETE FROM posts WHERE id = test_post_id;
  DELETE FROM communities WHERE id = test_community_id;
END $$;

-- Test 5: Bubbling oppover fungerer (by -> kommune)
DO $$
DECLARE
  test_group_id UUID;
  test_post_id UUID;
  test_place_id UUID;
  test_municipality_id UUID;
  test_user_id UUID;
  posts_in_place INT;
  posts_in_municipality INT;
BEGIN
  -- Hent en eksisterende bruker
  SELECT id INTO test_user_id FROM profiles LIMIT 1;

  IF test_user_id IS NULL THEN
    RAISE NOTICE 'TEST 5 SKIPPED: Ingen brukere funnet i databasen';
    RETURN;
  END IF;

  -- Hent et sted og dets kommune
  SELECT p.id, p.municipality_id INTO test_place_id, test_municipality_id
  FROM places p
  WHERE p.municipality_id IS NOT NULL
  LIMIT 1;

  IF test_place_id IS NULL OR test_municipality_id IS NULL THEN
    RAISE NOTICE 'TEST 5 SKIPPED: Ingen steder med kommune funnet';
    RETURN;
  END IF;

  -- Opprett testgruppe (åpen) tilknyttet stedet
  INSERT INTO groups (name, slug, group_type, created_by)
  VALUES ('Test Bubbling Gruppe', 'test-bubbling-group-' || gen_random_uuid(), 'open', test_user_id)
  RETURNING id INTO test_group_id;

  INSERT INTO group_places (group_id, place_id)
  VALUES (test_group_id, test_place_id);

  -- Opprett testinnlegg
  INSERT INTO posts (user_id, title, content, type, visibility, created_for_group_id)
  VALUES (
    test_user_id,
    'Test bubbling innlegg',
    'Dette skal boble oppover',
    'standard',
    'public',
    test_group_id
  )
  RETURNING id INTO test_post_id;

  -- Test: Innlegg vises i place-feed
  SELECT COUNT(*) INTO posts_in_place
  FROM get_posts_for_geography('place', test_place_id, 50, 0) AS posts
  WHERE posts.id = test_post_id;

  -- Test: Innlegg bobler opp til municipality-feed
  SELECT COUNT(*) INTO posts_in_municipality
  FROM get_posts_for_geography('municipality', test_municipality_id, 50, 0) AS posts
  WHERE posts.id = test_post_id;

  IF posts_in_place = 1 AND posts_in_municipality = 1 THEN
    RAISE NOTICE 'TEST 5 PASSED ✅: Bubbling oppover fungerer (by -> kommune)';
  ELSE
    RAISE WARNING 'TEST 5 FAILED ❌: Bubbling fungerer ikke (place: %, municipality: %)', posts_in_place, posts_in_municipality;
  END IF;

  -- Rydd opp
  DELETE FROM posts WHERE id = test_post_id;
  DELETE FROM groups WHERE id = test_group_id;
END $$;

DO $$
BEGIN
  RAISE NOTICE '=== TESTING FULLFØRT ===';
END $$;

ROLLBACK; -- Rull tilbake alle testdata
