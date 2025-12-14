-- =====================================================
-- KALENDER MED GEOGRAFISK STRUKTUR
-- Fase 2: RPC-funksjoner
-- =====================================================

-- 1. GET_EVENTS_FOR_GEOGRAPHY
-- =====================================================
-- Henter arrangementer for et geografisk område, inkludert:
-- - Arrangementer med primær lokasjon i området
-- - Arrangementer som bobler opp fra underordnede områder
-- - Arrangementer som er delt til området
-- - Digitale arrangementer (hvis valgt av arrangør)

CREATE OR REPLACE FUNCTION get_events_for_geography(
  geography_type_param TEXT,  -- 'sapmi', 'country', 'language_area', 'municipality', 'place'
  geography_id_param UUID DEFAULT NULL,
  from_date_param DATE DEFAULT CURRENT_DATE,
  to_date_param DATE DEFAULT NULL,
  limit_param INT DEFAULT 100,
  offset_param INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  content TEXT,
  image_url TEXT,
  event_date DATE,
  event_time TIME,
  event_end_time TIME,
  event_location TEXT,
  is_digital BOOLEAN,
  meeting_url TEXT,
  meeting_platform TEXT,
  max_participants INT,
  created_at TIMESTAMPTZ,
  -- Geografisk info
  municipality_id UUID,
  place_id UUID,
  language_area_id UUID,
  posted_from_name TEXT,
  posted_from_type TEXT,
  -- Opprettet på vegne av
  created_for_group_id UUID,
  created_for_community_id UUID,
  -- Kilde (primær lokasjon eller delt)
  source_type TEXT  -- 'primary', 'bubbled', 'shared'
) AS $$
BEGIN
  RETURN QUERY
  WITH target_events AS (
    -- Primære arrangementer i området (inkl. bobling)
    SELECT
      p.id,
      p.user_id,
      p.title,
      p.content,
      p.image_url,
      p.event_date,
      p.event_time,
      p.event_end_time,
      p.event_location,
      COALESCE(p.is_digital, FALSE) as is_digital,
      p.meeting_url,
      p.meeting_platform,
      p.max_participants,
      p.created_at,
      p.municipality_id,
      p.place_id,
      p.language_area_id,
      COALESCE(pl.name, m.name, la.name, 'Sapmi') as posted_from_name,
      CASE
        WHEN p.place_id IS NOT NULL THEN 'place'
        WHEN p.municipality_id IS NOT NULL THEN 'municipality'
        WHEN p.language_area_id IS NOT NULL THEN 'language_area'
        ELSE 'sapmi'
      END as posted_from_type,
      p.created_for_group_id,
      p.created_for_community_id,
      CASE
        WHEN geography_type_param = 'sapmi' THEN 'primary'
        WHEN geography_type_param = 'place' AND p.place_id = geography_id_param THEN 'primary'
        WHEN geography_type_param = 'municipality' AND p.municipality_id = geography_id_param THEN 'primary'
        WHEN geography_type_param = 'language_area' AND p.language_area_id = geography_id_param THEN 'primary'
        ELSE 'bubbled'
      END as source_type
    FROM posts p
    LEFT JOIN places pl ON p.place_id = pl.id
    LEFT JOIN municipalities m ON p.municipality_id = m.id
    LEFT JOIN language_areas la ON p.language_area_id = la.id
    WHERE p.type = 'event'
      AND p.event_date >= from_date_param
      AND (to_date_param IS NULL OR p.event_date <= to_date_param)
      AND (
        CASE geography_type_param
          -- Sapmi: Alle arrangementer
          WHEN 'sapmi' THEN TRUE

          -- Land: Arrangementer fra dette landet
          WHEN 'country' THEN
            p.municipality_id IN (
              SELECT mid.id FROM municipalities mid WHERE mid.country_id = geography_id_param
            )
            OR p.place_id IN (
              SELECT pid.id FROM places pid
              JOIN municipalities mid2 ON pid.municipality_id = mid2.id
              WHERE mid2.country_id = geography_id_param
            )

          -- Språkområde: Arrangementer fra dette språkområdet
          WHEN 'language_area' THEN
            p.language_area_id = geography_id_param
            OR p.municipality_id IN (
              SELECT mid.id FROM municipalities mid WHERE mid.language_area_id = geography_id_param
            )
            OR p.place_id IN (
              SELECT pid.id FROM places pid
              JOIN municipalities mid2 ON pid.municipality_id = mid2.id
              WHERE mid2.language_area_id = geography_id_param
            )

          -- Kommune: Arrangementer fra denne kommunen
          WHEN 'municipality' THEN
            p.municipality_id = geography_id_param
            OR p.place_id IN (
              SELECT pid.id FROM places pid WHERE pid.municipality_id = geography_id_param
            )

          -- Sted: Kun arrangementer fra dette stedet
          WHEN 'place' THEN
            p.place_id = geography_id_param

          ELSE FALSE
        END
      )

    UNION

    -- Delte arrangementer til dette området
    SELECT
      p.id,
      p.user_id,
      p.title,
      p.content,
      p.image_url,
      p.event_date,
      p.event_time,
      p.event_end_time,
      p.event_location,
      COALESCE(p.is_digital, FALSE) as is_digital,
      p.meeting_url,
      p.meeting_platform,
      p.max_participants,
      p.created_at,
      p.municipality_id,
      p.place_id,
      p.language_area_id,
      COALESCE(pl.name, m.name, la.name, 'Sapmi') as posted_from_name,
      CASE
        WHEN p.place_id IS NOT NULL THEN 'place'
        WHEN p.municipality_id IS NOT NULL THEN 'municipality'
        WHEN p.language_area_id IS NOT NULL THEN 'language_area'
        ELSE 'sapmi'
      END as posted_from_type,
      p.created_for_group_id,
      p.created_for_community_id,
      'shared'::TEXT as source_type
    FROM posts p
    JOIN event_shares es ON es.post_id = p.id
    LEFT JOIN places pl ON p.place_id = pl.id
    LEFT JOIN municipalities m ON p.municipality_id = m.id
    LEFT JOIN language_areas la ON p.language_area_id = la.id
    WHERE p.type = 'event'
      AND p.event_date >= from_date_param
      AND (to_date_param IS NULL OR p.event_date <= to_date_param)
      AND (
        CASE geography_type_param
          WHEN 'sapmi' THEN es.share_to_sapmi = TRUE
          WHEN 'country' THEN es.country_id = geography_id_param
          WHEN 'language_area' THEN es.language_area_id = geography_id_param
          WHEN 'municipality' THEN es.municipality_id = geography_id_param
          WHEN 'place' THEN es.place_id = geography_id_param
          ELSE FALSE
        END
      )
  )
  SELECT DISTINCT ON (te.id)
    te.id,
    te.user_id,
    te.title,
    te.content,
    te.image_url,
    te.event_date,
    te.event_time,
    te.event_end_time,
    te.event_location,
    te.is_digital,
    te.meeting_url,
    te.meeting_platform,
    te.max_participants,
    te.created_at,
    te.municipality_id,
    te.place_id,
    te.language_area_id,
    te.posted_from_name,
    te.posted_from_type,
    te.created_for_group_id,
    te.created_for_community_id,
    te.source_type
  FROM target_events te
  ORDER BY te.id, te.source_type  -- Prefer 'primary' over 'shared'
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. GET_EVENTS_FOR_USER_LOCATIONS
-- =====================================================
-- Henter arrangementer for brukerens stjernemerkede steder

CREATE OR REPLACE FUNCTION get_events_for_user_locations(
  user_id_param UUID,
  from_date_param DATE DEFAULT CURRENT_DATE,
  to_date_param DATE DEFAULT NULL,
  limit_param INT DEFAULT 100,
  offset_param INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  content TEXT,
  image_url TEXT,
  event_date DATE,
  event_time TIME,
  event_end_time TIME,
  event_location TEXT,
  is_digital BOOLEAN,
  meeting_url TEXT,
  meeting_platform TEXT,
  max_participants INT,
  created_at TIMESTAMPTZ,
  municipality_id UUID,
  place_id UUID,
  language_area_id UUID,
  posted_from_name TEXT,
  posted_from_type TEXT,
  created_for_group_id UUID,
  created_for_community_id UUID,
  source_type TEXT
) AS $$
DECLARE
  starred_municipalities UUID[];
  starred_places UUID[];
  starred_language_areas UUID[];
BEGIN
  -- Hent brukerens stjernemerkede lokasjoner
  SELECT ARRAY_AGG(municipality_id) INTO starred_municipalities
  FROM user_starred_municipalities
  WHERE user_starred_municipalities.user_id = user_id_param;

  SELECT ARRAY_AGG(place_id) INTO starred_places
  FROM user_starred_places
  WHERE user_starred_places.user_id = user_id_param;

  SELECT ARRAY_AGG(language_area_id) INTO starred_language_areas
  FROM user_starred_language_areas
  WHERE user_starred_language_areas.user_id = user_id_param;

  RETURN QUERY
  SELECT DISTINCT
    p.id,
    p.user_id,
    p.title,
    p.content,
    p.image_url,
    p.event_date,
    p.event_time,
    p.event_end_time,
    p.event_location,
    COALESCE(p.is_digital, FALSE) as is_digital,
    p.meeting_url,
    p.meeting_platform,
    p.max_participants,
    p.created_at,
    p.municipality_id,
    p.place_id,
    p.language_area_id,
    COALESCE(pl.name, m.name, la.name, 'Sapmi') as posted_from_name,
    CASE
      WHEN p.place_id IS NOT NULL THEN 'place'
      WHEN p.municipality_id IS NOT NULL THEN 'municipality'
      WHEN p.language_area_id IS NOT NULL THEN 'language_area'
      ELSE 'sapmi'
    END as posted_from_type,
    p.created_for_group_id,
    p.created_for_community_id,
    'user_starred'::TEXT as source_type
  FROM posts p
  LEFT JOIN places pl ON p.place_id = pl.id
  LEFT JOIN municipalities m ON p.municipality_id = m.id
  LEFT JOIN language_areas la ON p.language_area_id = la.id
  WHERE p.type = 'event'
    AND p.event_date >= from_date_param
    AND (to_date_param IS NULL OR p.event_date <= to_date_param)
    AND (
      -- Arrangementer fra stjernemerkede kommuner
      p.municipality_id = ANY(starred_municipalities)
      -- Arrangementer fra steder i stjernemerkede kommuner
      OR p.place_id IN (
        SELECT pid.id FROM places pid WHERE pid.municipality_id = ANY(starred_municipalities)
      )
      -- Arrangementer fra stjernemerkede steder
      OR p.place_id = ANY(starred_places)
      -- Arrangementer fra stjernemerkede språkområder
      OR p.language_area_id = ANY(starred_language_areas)
      OR p.municipality_id IN (
        SELECT mid.id FROM municipalities mid WHERE mid.language_area_id = ANY(starred_language_areas)
      )
      -- Digitale arrangementer delt til Sápmi (alltid vis)
      OR (p.is_digital = TRUE AND EXISTS (
        SELECT 1 FROM event_shares es WHERE es.post_id = p.id AND es.share_to_sapmi = TRUE
      ))
    )
  ORDER BY p.event_date, p.event_time
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. SHARE_EVENT_TO_GEOGRAPHY
-- =====================================================
-- Deler et arrangement til et annet geografisk område

CREATE OR REPLACE FUNCTION share_event_to_geography(
  post_id_param UUID,
  target_type TEXT,  -- 'municipality', 'place', 'language_area', 'country', 'sapmi'
  target_id_param UUID DEFAULT NULL
)
RETURNS event_shares
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_result event_shares;
BEGIN
  -- Sjekk autentisering
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Sjekk at brukeren eier arrangementet
  IF NOT EXISTS (
    SELECT 1 FROM posts
    WHERE id = post_id_param
    AND user_id = v_user_id
    AND type = 'event'
  ) THEN
    RAISE EXCEPTION 'You can only share your own events';
  END IF;

  -- Opprett deling basert på type
  CASE target_type
    WHEN 'municipality' THEN
      INSERT INTO event_shares (post_id, municipality_id, shared_by)
      VALUES (post_id_param, target_id_param, v_user_id)
      ON CONFLICT (post_id, municipality_id) DO NOTHING
      RETURNING * INTO v_result;

    WHEN 'place' THEN
      INSERT INTO event_shares (post_id, place_id, shared_by)
      VALUES (post_id_param, target_id_param, v_user_id)
      ON CONFLICT (post_id, place_id) DO NOTHING
      RETURNING * INTO v_result;

    WHEN 'language_area' THEN
      INSERT INTO event_shares (post_id, language_area_id, shared_by)
      VALUES (post_id_param, target_id_param, v_user_id)
      ON CONFLICT (post_id, language_area_id) DO NOTHING
      RETURNING * INTO v_result;

    WHEN 'country' THEN
      INSERT INTO event_shares (post_id, country_id, shared_by)
      VALUES (post_id_param, target_id_param, v_user_id)
      ON CONFLICT (post_id, country_id) DO NOTHING
      RETURNING * INTO v_result;

    WHEN 'sapmi' THEN
      INSERT INTO event_shares (post_id, share_to_sapmi, shared_by)
      VALUES (post_id_param, TRUE, v_user_id)
      ON CONFLICT DO NOTHING
      RETURNING * INTO v_result;

    ELSE
      RAISE EXCEPTION 'Invalid target type: %', target_type;
  END CASE;

  RETURN v_result;
END;
$$;

-- 4. OPPDATER SET_EVENT_RSVP MED KAPASITETSSJEKK
-- =====================================================

CREATE OR REPLACE FUNCTION set_event_rsvp(
  p_post_id UUID,
  p_status TEXT
)
RETURNS event_rsvps
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_result event_rsvps;
  v_max_participants INT;
  v_current_going_count INT;
  v_existing_status TEXT;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate status
  IF p_status NOT IN ('interested', 'going') THEN
    RAISE EXCEPTION 'Invalid status. Must be "interested" or "going"';
  END IF;

  -- Sjekk om brukeren allerede har RSVP
  SELECT status INTO v_existing_status
  FROM event_rsvps
  WHERE post_id = p_post_id AND user_id = v_user_id;

  -- Hvis bruker prøver å endre til 'going', sjekk kapasitet
  IF p_status = 'going' AND (v_existing_status IS NULL OR v_existing_status != 'going') THEN
    -- Hent maks deltakere
    SELECT max_participants INTO v_max_participants
    FROM posts
    WHERE id = p_post_id AND type = 'event';

    -- Hvis maks er satt, sjekk om det er plass
    IF v_max_participants IS NOT NULL THEN
      SELECT COUNT(*) INTO v_current_going_count
      FROM event_rsvps
      WHERE post_id = p_post_id AND status = 'going';

      IF v_current_going_count >= v_max_participants THEN
        RAISE EXCEPTION 'Event is full (% of % spots taken)', v_current_going_count, v_max_participants;
      END IF;
    END IF;
  END IF;

  -- Upsert RSVP
  INSERT INTO event_rsvps (post_id, user_id, status)
  VALUES (p_post_id, v_user_id, p_status)
  ON CONFLICT (post_id, user_id)
  DO UPDATE SET status = p_status, updated_at = NOW()
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

-- 5. GET_EVENT_CAPACITY
-- =====================================================
-- Returnerer kapasitetsinformasjon for et arrangement

CREATE OR REPLACE FUNCTION get_event_capacity(
  p_post_id UUID
)
RETURNS TABLE (
  max_participants INT,
  going_count BIGINT,
  interested_count BIGINT,
  spots_remaining INT,
  is_full BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max INT;
  v_going BIGINT;
  v_interested BIGINT;
BEGIN
  -- Hent maks deltakere
  SELECT p.max_participants INTO v_max
  FROM posts p
  WHERE p.id = p_post_id;

  -- Tell RSVP-er
  SELECT
    COUNT(*) FILTER (WHERE status = 'going'),
    COUNT(*) FILTER (WHERE status = 'interested')
  INTO v_going, v_interested
  FROM event_rsvps
  WHERE post_id = p_post_id;

  RETURN QUERY
  SELECT
    v_max as max_participants,
    v_going as going_count,
    v_interested as interested_count,
    CASE WHEN v_max IS NOT NULL THEN v_max - v_going::INT ELSE NULL END as spots_remaining,
    CASE WHEN v_max IS NOT NULL THEN v_going >= v_max ELSE FALSE END as is_full;
END;
$$;

-- 6. CAN_CREATE_EVENT_FOR_GROUP
-- =====================================================
-- Sjekker om bruker kan opprette arrangement for en gruppe

CREATE OR REPLACE FUNCTION can_create_event_for_group(
  p_group_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_permission TEXT;
  v_is_owner BOOLEAN;
  v_is_member BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Sjekk om bruker er eier
  SELECT (created_by = v_user_id) INTO v_is_owner
  FROM groups
  WHERE id = p_group_id;

  IF v_is_owner THEN
    RETURN TRUE;
  END IF;

  -- Hent permission-innstilling
  SELECT can_create_events INTO v_permission
  FROM group_event_permissions
  WHERE group_id = p_group_id;

  -- Default er 'admin' (kun eier)
  IF v_permission IS NULL OR v_permission = 'admin' THEN
    RETURN FALSE;
  END IF;

  -- Sjekk om bruker er medlem
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
    AND user_id = v_user_id
  ) INTO v_is_member;

  RETURN v_is_member;
END;
$$;

-- 7. CAN_CREATE_EVENT_FOR_COMMUNITY
-- =====================================================
-- Sjekker om bruker kan opprette arrangement for et samfunn

CREATE OR REPLACE FUNCTION can_create_event_for_community(
  p_community_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_permission TEXT;
  v_is_owner BOOLEAN;
  v_is_follower BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Sjekk om bruker er eier
  SELECT (created_by = v_user_id) INTO v_is_owner
  FROM communities
  WHERE id = p_community_id;

  IF v_is_owner THEN
    RETURN TRUE;
  END IF;

  -- Hent permission-innstilling
  SELECT can_create_events INTO v_permission
  FROM community_event_permissions
  WHERE community_id = p_community_id;

  -- Default er 'admin' (kun eier)
  IF v_permission IS NULL OR v_permission = 'admin' THEN
    RETURN FALSE;
  END IF;

  -- Sjekk om bruker følger samfunnet
  SELECT EXISTS (
    SELECT 1 FROM community_followers
    WHERE community_id = p_community_id
    AND user_id = v_user_id
  ) INTO v_is_follower;

  RETURN v_is_follower;
END;
$$;

-- 8. GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_events_for_geography TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_events_for_user_locations TO authenticated;
GRANT EXECUTE ON FUNCTION share_event_to_geography TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_capacity TO authenticated, anon;
GRANT EXECUTE ON FUNCTION can_create_event_for_group TO authenticated;
GRANT EXECUTE ON FUNCTION can_create_event_for_community TO authenticated;
