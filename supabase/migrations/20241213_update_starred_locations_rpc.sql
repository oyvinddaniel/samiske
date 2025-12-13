-- =====================================================
-- OPPDATERING: get_user_starred_locations
-- Legg til municipality_slug for steder
-- =====================================================

DROP FUNCTION IF EXISTS get_user_starred_locations(UUID);

CREATE OR REPLACE FUNCTION get_user_starred_locations(user_id_param UUID)
RETURNS TABLE (
  location_type TEXT,
  location_id UUID,
  location_name TEXT,
  location_slug TEXT,
  municipality_name TEXT,
  municipality_slug TEXT,
  country_code TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Stjernemerkede kommuner
  SELECT
    'municipality'::TEXT as location_type,
    m.id as location_id,
    m.name as location_name,
    m.slug as location_slug,
    NULL::TEXT as municipality_name,
    m.slug as municipality_slug,  -- For kommuner er dette samme som location_slug
    c.code as country_code
  FROM user_starred_municipalities usm
  JOIN municipalities m ON usm.municipality_id = m.id
  JOIN countries c ON m.country_id = c.id
  WHERE usm.user_id = user_id_param

  UNION ALL

  -- Stjernemerkede steder
  SELECT
    'place'::TEXT as location_type,
    p.id as location_id,
    p.name as location_name,
    p.slug as location_slug,
    m.name as municipality_name,
    m.slug as municipality_slug,  -- Kommunens slug for URL-bygging
    c.code as country_code
  FROM user_starred_places usp
  JOIN places p ON usp.place_id = p.id
  JOIN municipalities m ON p.municipality_id = m.id
  JOIN countries c ON m.country_id = c.id
  WHERE usp.user_id = user_id_param

  ORDER BY location_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
