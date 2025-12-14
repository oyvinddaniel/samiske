-- =====================================================
-- FIKSE get_posts_for_geography() FUNKSJONEN
-- =====================================================
-- Implementer EKTE bubbling og korrekt gruppehåndtering

BEGIN;

CREATE OR REPLACE FUNCTION get_posts_for_geography(
  geography_type_param TEXT,  -- 'sapmi', 'country', 'language_area', 'municipality', 'place'
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
    COALESCE(pl.name, m.name, 'Sápmi') as posted_from_name,
    CASE
      WHEN p.place_id IS NOT NULL THEN 'place'
      WHEN p.municipality_id IS NOT NULL THEN 'municipality'
      ELSE 'sapmi'
    END as posted_from_type
  FROM posts p
  LEFT JOIN places pl ON p.place_id = pl.id
  LEFT JOIN municipalities m ON p.municipality_id = m.id
  WHERE
    -- =============================================
    -- EKSKLUDER PERSONLIGE INNLEGG
    -- =============================================
    -- Personlige innlegg (uten gruppe/samfunn) skal ALDRI vises i geografiske feeds,
    -- selv om de har municipality_id eller place_id
    (
      p.created_for_group_id IS NOT NULL
      OR p.created_for_community_id IS NOT NULL
    )

    AND

    -- =============================================
    -- EKSKLUDER LUKKEDE/SKJULTE GRUPPE-INNLEGG
    -- =============================================
    -- Kun åpne gruppe-innlegg skal vises i geografiske feeds
    (
      -- Ikke et gruppe-innlegg, eller...
      p.created_for_group_id IS NULL

      OR

      -- ...et åpen gruppe-innlegg
      EXISTS (
        SELECT 1 FROM groups g
        WHERE g.id = p.created_for_group_id
        AND g.group_type = 'open'
      )
    )

    AND

    -- =============================================
    -- GEOGRAFISK FILTRERING MED EKTE BUBBLING
    -- =============================================
    CASE geography_type_param
      -- =============================================
      -- SÁPMI: Vis alt (men respekter gruppefilter over)
      -- =============================================
      WHEN 'sapmi' THEN TRUE

      -- =============================================
      -- LAND: Vis innlegg fra dette landet og nedenfor
      -- =============================================
      WHEN 'country' THEN (
        -- Direkte fra kommuner i landet
        p.municipality_id IN (
          SELECT municipalities.id FROM municipalities WHERE municipalities.country_id = geography_id_param
        )

        OR

        -- Fra steder i kommuner i landet
        p.place_id IN (
          SELECT pl2.id FROM places pl2
          JOIN municipalities m2 ON pl2.municipality_id = m2.id
          WHERE m2.country_id = geography_id_param
        )

        OR

        -- Åpne gruppe-innlegg hvis gruppen er tilknyttet sted i landet
        (
          p.created_for_group_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM group_places gpl
            WHERE gpl.group_id = p.created_for_group_id
            AND (
              gpl.municipality_id IN (
                SELECT municipalities.id FROM municipalities WHERE municipalities.country_id = geography_id_param
              )
              OR
              gpl.place_id IN (
                SELECT pl3.id FROM places pl3
                JOIN municipalities m3 ON pl3.municipality_id = m3.id
                WHERE m3.country_id = geography_id_param
              )
            )
          )
        )

        OR

        -- Samfunns-innlegg hvis samfunnet publiserte til sted i landet
        (
          p.created_for_community_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM community_post_locations cpl
            WHERE cpl.post_id = p.id
            AND (
              cpl.municipality_id IN (
                SELECT municipalities.id FROM municipalities WHERE municipalities.country_id = geography_id_param
              )
              OR
              cpl.place_id IN (
                SELECT pl4.id FROM places pl4
                JOIN municipalities m4 ON pl4.municipality_id = m4.id
                WHERE m4.country_id = geography_id_param
              )
            )
          )
        )
      )

      -- =============================================
      -- SPRÅKOMRÅDE: Vis innlegg fra kommuner i området
      -- =============================================
      WHEN 'language_area' THEN (
        -- Direkte på språkområdet
        p.municipality_id IN (
          SELECT municipalities.id FROM municipalities WHERE municipalities.language_area_id = geography_id_param
        )

        OR

        -- Steder i kommuner i språkområdet
        p.place_id IN (
          SELECT pl2.id FROM places pl2
          JOIN municipalities m2 ON pl2.municipality_id = m2.id
          WHERE m2.language_area_id = geography_id_param
        )

        OR

        -- Åpne gruppe-innlegg
        (
          p.created_for_group_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM group_places gpl
            WHERE gpl.group_id = p.created_for_group_id
            AND (
              gpl.municipality_id IN (
                SELECT municipalities.id FROM municipalities WHERE municipalities.language_area_id = geography_id_param
              )
              OR
              gpl.place_id IN (
                SELECT pl3.id FROM places pl3
                JOIN municipalities m3 ON pl3.municipality_id = m3.id
                WHERE m3.language_area_id = geography_id_param
              )
            )
          )
        )

        OR

        -- Samfunns-innlegg
        (
          p.created_for_community_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM community_post_locations cpl
            WHERE cpl.post_id = p.id
            AND (
              cpl.municipality_id IN (
                SELECT municipalities.id FROM municipalities WHERE municipalities.language_area_id = geography_id_param
              )
              OR
              cpl.place_id IN (
                SELECT pl4.id FROM places pl4
                JOIN municipalities m4 ON pl4.municipality_id = m4.id
                WHERE m4.language_area_id = geography_id_param
              )
            )
          )
        )
      )

      -- =============================================
      -- KOMMUNE: Vis innlegg fra kommunen og steder i den
      -- =============================================
      WHEN 'municipality' THEN (
        -- Direkte på kommunen
        p.municipality_id = geography_id_param

        OR

        -- Steder i kommunen (BUBBLING NED)
        p.place_id IN (
          SELECT places.id FROM places WHERE places.municipality_id = geography_id_param
        )

        OR

        -- Åpne gruppe-innlegg
        (
          p.created_for_group_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM group_places gpl
            WHERE gpl.group_id = p.created_for_group_id
            AND (
              gpl.municipality_id = geography_id_param
              OR gpl.place_id IN (SELECT places.id FROM places WHERE places.municipality_id = geography_id_param)
            )
          )
        )

        OR

        -- Samfunns-innlegg
        (
          p.created_for_community_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM community_post_locations cpl
            WHERE cpl.post_id = p.id
            AND (
              cpl.municipality_id = geography_id_param
              OR cpl.place_id IN (SELECT places.id FROM places WHERE places.municipality_id = geography_id_param)
            )
          )
        )
      )

      -- =============================================
      -- STED: Kun innlegg fra dette stedet
      -- =============================================
      WHEN 'place' THEN (
        -- Direkte på stedet
        p.place_id = geography_id_param

        OR

        -- Åpne gruppe-innlegg
        (
          p.created_for_group_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM group_places gpl
            WHERE gpl.group_id = p.created_for_group_id
            AND gpl.place_id = geography_id_param
          )
        )

        OR

        -- Samfunns-innlegg
        (
          p.created_for_community_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM community_post_locations cpl
            WHERE cpl.post_id = p.id
            AND cpl.place_id = geography_id_param
          )
        )
      )

      ELSE FALSE
    END
  ORDER BY p.pinned DESC NULLS LAST, p.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_posts_for_geography IS
  'Henter innlegg for geografisk enhet med EKTE bubbling oppover.
   - Ekskluderer personlige innlegg (uten gruppe/samfunn)
   - Inkluderer åpne gruppe-innlegg basert på gruppe-stedstilknytning
   - Inkluderer samfunns-innlegg basert på valgt publiseringslokasjon
   - Ekskluderer lukkede/skjulte gruppe-innlegg
   - Bubbling oppover: Tromsø by → Tromsø kommune → Nord-Troms → Sápmi';

COMMIT;
