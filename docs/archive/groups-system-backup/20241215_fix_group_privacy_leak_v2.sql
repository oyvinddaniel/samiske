-- =====================================================
-- KRITISK SIKKERHETSFIKS V2: Korrekt håndtering av gruppeinnlegg og private poster
-- =====================================================
-- Problem 1: Gruppeinnlegg fra lukkede grupper vises på geografiske feeds
-- Problem 2: Private innlegg (uten geografi) vises overalt på Sapmi
-- Problem 3: Sapmi-logikk tillot gruppeinnlegg uten geografisk tilknytning
-- Løsning: INGEN gruppeinnlegg på geografiske feeds - de skal kun vises i gruppens egen feed
-- =====================================================

DROP FUNCTION IF EXISTS get_posts_for_geography(TEXT, UUID, INT, INT);

CREATE OR REPLACE FUNCTION get_posts_for_geography(
  geography_type_param TEXT,
  geography_id_param UUID DEFAULT NULL,
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
    COALESCE(
      g.name,
      c.name,
      pl.name,
      m.name,
      'Sápmi'
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
    -- =====================================================
    -- KRITISK SIKKERHET: Geografiske feeds skal ALDRI vise:
    -- 1. Gruppeinnlegg (de skal kun vises i gruppens egen feed)
    -- 2. Private innlegg uten geografisk eller community-tilknytning
    -- =====================================================

    -- Ekskluder ALLE gruppeinnlegg fra geografiske feeds
    p.created_for_group_id IS NULL

    AND

    -- Ekskluder private innlegg uten geografisk/community-tilknytning
    (
      p.created_for_community_id IS NOT NULL
      OR p.municipality_id IS NOT NULL
      OR p.place_id IS NOT NULL
    )

    AND

    -- Geografisk matching per type
    CASE geography_type_param
      -- Sapmi: Vis alle innlegg med geografisk/community-kontekst
      WHEN 'sapmi' THEN (
        p.created_for_community_id IS NOT NULL
        OR p.municipality_id IS NOT NULL
        OR p.place_id IS NOT NULL
      )

      -- Land: Vis innlegg fra dette landet
      WHEN 'country' THEN
        p.municipality_id IN (
          SELECT id FROM municipalities WHERE country_id = geography_id_param
        )
        OR p.place_id IN (
          SELECT pl2.id FROM places pl2
          JOIN municipalities m2 ON pl2.municipality_id = m2.id
          WHERE m2.country_id = geography_id_param
        )

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

      -- Kommune: Vis innlegg fra denne kommunen og steder i den
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

GRANT EXECUTE ON FUNCTION get_posts_for_geography TO authenticated;
GRANT EXECUTE ON FUNCTION get_posts_for_geography TO anon;

-- =====================================================
-- KOMMENTAR: Gruppeinnlegg ekskluderes nå fullstendig
-- =====================================================
-- Rasjonale: Gruppeinnlegg skal KUN vises i gruppens egen feed.
-- Geografiske feeds (Sapmi, land, språkområde, kommune, sted) skal
-- vise innlegg som er eksplisitt publisert til disse geografiene,
-- IKKE innlegg fra grupper som tilfeldigvis har geografisk tilknytning.
-- Dette sikrer at lukket/skjult gruppeinnlegg ALDRI lekker til
-- offentlige feeds.
-- =====================================================
