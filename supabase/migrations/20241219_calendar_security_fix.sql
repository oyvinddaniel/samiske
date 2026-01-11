-- =====================================================
-- KALENDER SIKKERHETSFIKS
-- Dato: 2024-12-19
-- =====================================================
-- PROBLEM: Private arrangementer og gruppe-arrangementer
-- vises i offentlige kalendere
--
-- LØSNING: Filtrer på visibility='public' og
-- created_for_group_id IS NULL
-- =====================================================

-- 1. OPPDATER get_events_for_geography
-- =====================================================

CREATE OR REPLACE FUNCTION get_events_for_geography(
  geography_type_param TEXT,
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
  municipality_id UUID,
  place_id UUID,
  language_area_id UUID,
  posted_from_name TEXT,
  posted_from_type TEXT,
  created_for_group_id UUID,
  created_for_community_id UUID,
  source_type TEXT
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
      -- 🔒 SIKKERHET: Kun offentlige arrangementer
      AND p.visibility = 'public'
      -- 🔒 SIKKERHET: Ikke gruppe-arrangementer
      AND p.created_for_group_id IS NULL
      AND p.event_date >= from_date_param
      AND (to_date_param IS NULL OR p.event_date <= to_date_param)
      AND (
        CASE geography_type_param
          WHEN 'sapmi' THEN TRUE
          WHEN 'country' THEN
            p.municipality_id IN (
              SELECT mid.id FROM municipalities mid WHERE mid.country_id = geography_id_param
            )
            OR p.place_id IN (
              SELECT pid.id FROM places pid
              JOIN municipalities mid2 ON pid.municipality_id = mid2.id
              WHERE mid2.country_id = geography_id_param
            )
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
          WHEN 'municipality' THEN
            p.municipality_id = geography_id_param
            OR p.place_id IN (
              SELECT pid.id FROM places pid WHERE pid.municipality_id = geography_id_param
            )
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
      -- 🔒 SIKKERHET: Kun offentlige arrangementer
      AND p.visibility = 'public'
      -- 🔒 SIKKERHET: Ikke gruppe-arrangementer
      AND p.created_for_group_id IS NULL
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
  ORDER BY te.id, te.source_type
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. OPPDATER get_events_for_user_locations
-- =====================================================

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
    -- 🔒 SIKKERHET: Kun offentlige arrangementer
    AND p.visibility = 'public'
    -- 🔒 SIKKERHET: Ikke gruppe-arrangementer
    AND p.created_for_group_id IS NULL
    AND p.event_date >= from_date_param
    AND (to_date_param IS NULL OR p.event_date <= to_date_param)
    AND (
      p.municipality_id = ANY(starred_municipalities)
      OR p.place_id IN (
        SELECT pid.id FROM places pid WHERE pid.municipality_id = ANY(starred_municipalities)
      )
      OR p.place_id = ANY(starred_places)
      OR p.language_area_id = ANY(starred_language_areas)
      OR p.municipality_id IN (
        SELECT mid.id FROM municipalities mid WHERE mid.language_area_id = ANY(starred_language_areas)
      )
      OR (p.is_digital = TRUE AND EXISTS (
        SELECT 1 FROM event_shares es WHERE es.post_id = p.id AND es.share_to_sapmi = TRUE
      ))
    )
  ORDER BY p.event_date, p.event_time
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FERDIG
-- =====================================================
-- Sikkerhetshull er tettet.
-- Private arrangementer og gruppe-arrangementer
-- vises ikke lenger i offentlige kalendere.
