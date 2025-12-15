-- =====================================================
-- OPPDATER INNLEGGSKONTEKST-VISNING
-- Vis hvor innlegg er publisert: grupper, bedrifter, steder, privat
-- =====================================================

-- 1. OPPDATER get_posts_for_geography TIL Å INKLUDERE GRUPPE OG BEDRIFT
-- =====================================================
-- Drop existing function first
DROP FUNCTION IF EXISTS get_posts_for_geography(TEXT, UUID, INT, INT);

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
  created_for_group_id UUID,
  created_for_community_id UUID,
  -- Ekstra felter for visning av kontekst
  posted_from_name TEXT,
  posted_from_type TEXT,
  posted_from_id UUID
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
    p.created_for_group_id,
    p.created_for_community_id,
    -- Prioriter kontekst: gruppe -> bedrift -> sted -> kommune -> sapmi
    COALESCE(
      g.name,           -- Gruppenavn først
      c.name,           -- Bedriftsnavn
      pl.name,          -- Stednavn
      m.name,           -- Kommunenavn
      'Sápmi'           -- Standard
    ) as posted_from_name,
    CASE
      WHEN p.created_for_group_id IS NOT NULL THEN 'group'
      WHEN p.created_for_community_id IS NOT NULL THEN 'community'
      WHEN p.place_id IS NOT NULL THEN 'place'
      WHEN p.municipality_id IS NOT NULL THEN 'municipality'
      ELSE 'private'
    END as posted_from_type,
    COALESCE(
      p.created_for_group_id,
      p.created_for_community_id,
      p.place_id,
      p.municipality_id
    ) as posted_from_id
  FROM posts p
  LEFT JOIN groups g ON p.created_for_group_id = g.id
  LEFT JOIN communities c ON p.created_for_community_id = c.id
  LEFT JOIN places pl ON p.place_id = pl.id
  LEFT JOIN municipalities m ON p.municipality_id = m.id
  WHERE
    -- Ekskluder gruppe-innlegg fra geografiske feeds (med mindre de er knyttet til geografien)
    (
      p.created_for_group_id IS NULL
      OR (
        geography_type_param = 'place'
        AND EXISTS (
          SELECT 1 FROM group_places gp
          WHERE gp.group_id = p.created_for_group_id
          AND gp.place_id = geography_id_param
        )
      )
      OR (
        geography_type_param = 'municipality'
        AND EXISTS (
          SELECT 1 FROM group_places gp
          WHERE gp.group_id = p.created_for_group_id
          AND gp.municipality_id = geography_id_param
        )
      )
    )
    AND
    CASE geography_type_param
      -- Sapmi: Vis alle innlegg (unntatt gruppe-spesifikke)
      WHEN 'sapmi' THEN p.created_for_group_id IS NULL

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

-- 2. GRANT PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION get_posts_for_geography TO authenticated;
GRANT EXECUTE ON FUNCTION get_posts_for_geography TO anon;
