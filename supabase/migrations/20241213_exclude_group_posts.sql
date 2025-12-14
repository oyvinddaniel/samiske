-- =====================================================
-- FIX: Ekskluder gruppeinnlegg fra hovedfeed og geografifeeds
-- Innlegg som tilhører grupper skal IKKE vises utenfor gruppen
-- =====================================================

-- Oppdater get_posts_for_geography for å ekskludere gruppeinnlegg
CREATE OR REPLACE FUNCTION get_posts_for_geography(
  geography_type_param TEXT,  -- 'sapmi', 'country', 'language_area', 'municipality', 'place'
  geography_id_param UUID DEFAULT NULL,  -- NULL for 'sapmi'
  limit_param INT DEFAULT 50,
  offset_param INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  category_id UUID,
  type TEXT,
  visibility TEXT,
  title TEXT,
  content TEXT,
  image_url TEXT,
  event_date DATE,
  event_time TIME,
  event_location TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  pinned BOOLEAN,
  municipality_id UUID,
  place_id UUID,
  geography_scope TEXT,
  -- Ekstra felter for visning
  posted_from_name TEXT,
  posted_from_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.category_id,
    p.type,
    p.visibility,
    p.title,
    p.content,
    p.image_url,
    p.event_date,
    p.event_time,
    p.event_location,
    p.created_at,
    p.updated_at,
    p.pinned,
    p.municipality_id,
    p.place_id,
    p.geography_scope,
    -- Vis hvor innlegget ble postet fra
    COALESCE(pl.name, m.name, 'Sapmi') as posted_from_name,
    CASE
      WHEN p.place_id IS NOT NULL THEN 'place'
      WHEN p.municipality_id IS NOT NULL THEN 'municipality'
      ELSE 'sapmi'
    END as posted_from_type
  FROM posts p
  LEFT JOIN places pl ON p.place_id = pl.id
  LEFT JOIN municipalities m ON p.municipality_id = m.id
  WHERE
    -- EKSKLUDER innlegg som tilhører skjulte/lukkede grupper
    -- Åpne grupper skal vises i geografiske feeds
    NOT EXISTS (
      SELECT 1 FROM group_posts gp
      JOIN groups g ON gp.group_id = g.id
      WHERE gp.post_id = p.id
      AND g.group_type IN ('hidden', 'closed')
    )
    AND
    CASE geography_type_param
      -- Sapmi: Vis alle innlegg (unntatt gruppeinnlegg)
      WHEN 'sapmi' THEN TRUE

      -- Land: Vis innlegg fra dette landet og alle underordnede
      WHEN 'country' THEN
        p.municipality_id IN (
          SELECT id FROM municipalities WHERE country_id = geography_id_param
        )
        OR p.place_id IN (
          SELECT pl2.id FROM places pl2
          JOIN municipalities m2 ON pl2.municipality_id = m2.id
          WHERE m2.country_id = geography_id_param
        )
        OR (p.municipality_id IS NULL AND p.place_id IS NULL AND p.geography_scope = 'country')

      -- Språkområde: Vis innlegg fra kommuner i dette språkområdet
      WHEN 'language_area' THEN
        p.municipality_id IN (
          SELECT id FROM municipalities WHERE language_area_id = geography_id_param
        )
        OR p.place_id IN (
          SELECT pl2.id FROM places pl2
          JOIN municipalities m2 ON pl2.municipality_id = m2.id
          WHERE m2.language_area_id = geography_id_param
        )
        OR (p.municipality_id IS NULL AND p.place_id IS NULL AND p.geography_scope = 'language_area')

      -- Kommune: Vis innlegg fra denne kommunen og alle steder i den
      WHEN 'municipality' THEN
        p.municipality_id = geography_id_param
        OR p.place_id IN (
          SELECT id FROM places WHERE municipality_id = geography_id_param
        )

      -- Sted: Kun innlegg fra dette stedet
      WHEN 'place' THEN
        p.place_id = geography_id_param

      ELSE FALSE
    END
  ORDER BY p.pinned DESC NULLS LAST, p.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Oppdater count_posts_for_geography til å bruke den oppdaterte funksjonen
CREATE OR REPLACE FUNCTION count_posts_for_geography(
  geography_type_param TEXT,
  geography_id_param UUID DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  post_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO post_count
  FROM get_posts_for_geography(geography_type_param, geography_id_param, 10000, 0);

  RETURN post_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
