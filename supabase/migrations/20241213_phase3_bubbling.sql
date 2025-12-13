-- =====================================================
-- FASE 3: INNLEGGSBOBLING
-- Logikk for at innlegg "bobler opp" i geografihierarkiet
-- =====================================================

-- 1. HOVEDFUNKSJON: Hent innlegg for en geografisk enhet
-- =====================================================
-- Denne funksjonen henter innlegg basert pa geografisk tilhorighet
-- og inkluderer alle innlegg fra underordnede geografier.
--
-- Eksempel: Hent innlegg for Norge inkluderer ogsa innlegg fra
-- alle norske kommuner og steder.

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
    CASE geography_type_param
      -- Sapmi: Vis alle innlegg
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

      -- Sprakområde: Vis innlegg fra kommuner i dette sprakområdet
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

-- 2. MIGRER EKSISTERENDE INNLEGG TIL TRONDHEIM
-- =====================================================
-- Finn Trondheim kommune-ID og sett alle eksisterende innlegg til denne

DO $$
DECLARE
  trondheim_id UUID;
BEGIN
  -- Finn Trondheim
  SELECT id INTO trondheim_id
  FROM municipalities
  WHERE slug = 'trondheim' AND country_id = (SELECT id FROM countries WHERE code = 'NO');

  -- Oppdater alle innlegg som ikke har geografisk tilknytning
  IF trondheim_id IS NOT NULL THEN
    UPDATE posts
    SET municipality_id = trondheim_id
    WHERE municipality_id IS NULL AND place_id IS NULL;

    RAISE NOTICE 'Migrerte innlegg til Trondheim (ID: %)', trondheim_id;
  ELSE
    RAISE NOTICE 'Trondheim ikke funnet - hopper over migrering';
  END IF;
END $$;

-- 3. INDEKSER FOR YTELSE
-- =====================================================
-- Sammensatt indeks for geografisk filtrering
CREATE INDEX IF NOT EXISTS idx_posts_geography_combined
ON posts(municipality_id, place_id, geography_scope, created_at DESC);

-- Indeks for bobling-queries
CREATE INDEX IF NOT EXISTS idx_posts_bubbling
ON posts(created_at DESC)
WHERE municipality_id IS NOT NULL OR place_id IS NOT NULL;

-- 4. HJELPEFUNKSJON: Tell innlegg per geografi
-- =====================================================
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

-- 5. GRANT PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION get_posts_for_geography TO authenticated;
GRANT EXECUTE ON FUNCTION get_posts_for_geography TO anon;
GRANT EXECUTE ON FUNCTION count_posts_for_geography TO authenticated;
GRANT EXECUTE ON FUNCTION count_posts_for_geography TO anon;
