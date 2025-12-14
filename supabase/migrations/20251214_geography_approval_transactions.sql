-- =====================================================
-- TRANSACTION-SAFE GEOGRAPHY SUGGESTION APPROVAL
-- Ensures atomic approval operations with rollback on failure
-- Date: 2025-12-14
-- =====================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS approve_geography_suggestion(UUID, UUID);

-- Create comprehensive approval function with transaction safety
CREATE OR REPLACE FUNCTION approve_geography_suggestion(
  p_suggestion_id UUID,
  p_reviewer_id UUID
) RETURNS JSON AS $$
DECLARE
  v_suggestion geography_suggestions%ROWTYPE;
  v_entity_id UUID;
  v_region_id UUID;
  v_norway_id UUID;
  v_result JSON;
  v_language_area_ids TEXT[];
BEGIN
  -- Lock the suggestion row for this transaction
  SELECT * INTO v_suggestion
  FROM geography_suggestions
  WHERE id = p_suggestion_id
  FOR UPDATE;

  -- Validate suggestion exists
  IF v_suggestion.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Forslag ikke funnet'
    );
  END IF;

  -- Check if already processed
  IF v_suggestion.status != 'pending' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Forslag er allerede behandlet (' || v_suggestion.status || ')'
    );
  END IF;

  -- Verify reviewer is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_reviewer_id AND role = 'admin'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Kun admin kan godkjenne forslag'
    );
  END IF;

  -- BEGIN TRANSACTION (implicitly started by function)
  BEGIN
    -- Process based on suggestion type
    IF v_suggestion.suggestion_type = 'new_item' THEN

      -- CREATE NEW LANGUAGE AREA
      IF v_suggestion.entity_type = 'language_area' THEN
        -- Get region (should only be one)
        SELECT id INTO v_region_id FROM regions LIMIT 1;

        IF v_region_id IS NULL THEN
          RAISE EXCEPTION 'Ingen region funnet - kan ikke opprette språkområde';
        END IF;

        INSERT INTO language_areas (
          region_id,
          name,
          name_sami,
          code,
          sort_order
        ) VALUES (
          v_region_id,
          COALESCE(v_suggestion.suggested_data->>'name', ''),
          NULLIF(v_suggestion.suggested_data->>'name_sami', ''),
          COALESCE(
            v_suggestion.suggested_data->>'slug',
            lower(regexp_replace(v_suggestion.suggested_data->>'name', '\s+', '-', 'g'))
          ),
          (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM language_areas)
        ) RETURNING id INTO v_entity_id;

      -- CREATE NEW MUNICIPALITY
      ELSIF v_suggestion.entity_type = 'municipality' THEN
        -- Get Norway country ID
        SELECT id INTO v_norway_id FROM countries WHERE code = 'NO' LIMIT 1;

        IF v_norway_id IS NULL THEN
          RAISE EXCEPTION 'Norge ikke funnet i countries-tabellen';
        END IF;

        -- Extract language area IDs from JSONB array
        SELECT ARRAY(
          SELECT jsonb_array_elements_text(v_suggestion.suggested_data->'language_area_ids')
        ) INTO v_language_area_ids;

        INSERT INTO municipalities (
          country_id,
          name,
          name_sami,
          slug,
          language_area_id
        ) VALUES (
          v_norway_id,
          COALESCE(v_suggestion.suggested_data->>'name', ''),
          NULLIF(v_suggestion.suggested_data->>'name_sami', ''),
          COALESCE(
            v_suggestion.suggested_data->>'slug',
            lower(regexp_replace(v_suggestion.suggested_data->>'name', '\s+', '-', 'g'))
          ),
          NULLIF(v_language_area_ids[1], '')::UUID
        ) RETURNING id INTO v_entity_id;

        -- Add language area relationships
        IF v_language_area_ids IS NOT NULL AND array_length(v_language_area_ids, 1) > 0 THEN
          INSERT INTO municipality_language_areas (municipality_id, language_area_id, is_primary)
          SELECT
            v_entity_id,
            la_id::UUID,
            (idx = 1) as is_primary
          FROM unnest(v_language_area_ids) WITH ORDINALITY AS t(la_id, idx)
          WHERE la_id IS NOT NULL AND la_id != '';
        END IF;

      -- CREATE NEW PLACE
      ELSIF v_suggestion.entity_type = 'place' THEN
        IF v_suggestion.suggested_data->>'municipality_id' IS NULL THEN
          RAISE EXCEPTION 'Kommune-ID mangler for nytt sted';
        END IF;

        INSERT INTO places (
          municipality_id,
          name,
          name_sami,
          slug,
          place_type
        ) VALUES (
          (v_suggestion.suggested_data->>'municipality_id')::UUID,
          COALESCE(v_suggestion.suggested_data->>'name', ''),
          NULLIF(v_suggestion.suggested_data->>'name_sami', ''),
          COALESCE(
            v_suggestion.suggested_data->>'slug',
            lower(regexp_replace(v_suggestion.suggested_data->>'name', '\s+', '-', 'g'))
          ),
          'area'
        ) RETURNING id INTO v_entity_id;
      END IF;

    -- EDIT NAME
    ELSIF v_suggestion.suggestion_type = 'edit_name' THEN
      IF v_suggestion.entity_id IS NULL THEN
        RAISE EXCEPTION 'Entity ID mangler for navneendring';
      END IF;

      IF v_suggestion.entity_type = 'language_area' THEN
        UPDATE language_areas SET
          name = COALESCE(v_suggestion.suggested_data->>'name', name),
          name_sami = NULLIF(v_suggestion.suggested_data->>'name_sami', '')
        WHERE id = v_suggestion.entity_id;

      ELSIF v_suggestion.entity_type = 'municipality' THEN
        UPDATE municipalities SET
          name = COALESCE(v_suggestion.suggested_data->>'name', name),
          name_sami = NULLIF(v_suggestion.suggested_data->>'name_sami', '')
        WHERE id = v_suggestion.entity_id;

      ELSIF v_suggestion.entity_type = 'place' THEN
        UPDATE places SET
          name = COALESCE(v_suggestion.suggested_data->>'name', name),
          name_sami = NULLIF(v_suggestion.suggested_data->>'name_sami', '')
        WHERE id = v_suggestion.entity_id;
      END IF;

      v_entity_id := v_suggestion.entity_id;

    -- EDIT RELATIONSHIP
    ELSIF v_suggestion.suggestion_type = 'edit_relationship' THEN
      IF v_suggestion.entity_id IS NULL THEN
        RAISE EXCEPTION 'Entity ID mangler for relasjonsendring';
      END IF;

      IF v_suggestion.entity_type = 'municipality' THEN
        -- Extract language area IDs
        SELECT ARRAY(
          SELECT jsonb_array_elements_text(v_suggestion.suggested_data->'language_area_ids')
        ) INTO v_language_area_ids;

        -- Update primary language area
        UPDATE municipalities SET
          language_area_id = NULLIF(v_language_area_ids[1], '')::UUID
        WHERE id = v_suggestion.entity_id;

        -- Clear existing language area relationships
        DELETE FROM municipality_language_areas
        WHERE municipality_id = v_suggestion.entity_id;

        -- Add new relationships
        IF v_language_area_ids IS NOT NULL AND array_length(v_language_area_ids, 1) > 0 THEN
          INSERT INTO municipality_language_areas (municipality_id, language_area_id, is_primary)
          SELECT
            v_suggestion.entity_id,
            la_id::UUID,
            (idx = 1) as is_primary
          FROM unnest(v_language_area_ids) WITH ORDINALITY AS t(la_id, idx)
          WHERE la_id IS NOT NULL AND la_id != '';
        END IF;

      ELSIF v_suggestion.entity_type = 'place' THEN
        UPDATE places SET
          municipality_id = (v_suggestion.suggested_data->>'municipality_id')::UUID
        WHERE id = v_suggestion.entity_id;
      END IF;

      v_entity_id := v_suggestion.entity_id;
    END IF;

    -- Mark suggestion as approved
    UPDATE geography_suggestions SET
      status = 'approved',
      reviewed_at = NOW(),
      reviewed_by = p_reviewer_id,
      entity_id = COALESCE(entity_id, v_entity_id)
    WHERE id = p_suggestion_id;

    -- Success response
    v_result := json_build_object(
      'success', true,
      'message', 'Forslag godkjent og endringer utført',
      'entity_id', v_entity_id,
      'suggestion_id', p_suggestion_id
    );

  EXCEPTION WHEN OTHERS THEN
    -- Transaction automatically rolls back on exception
    RAISE WARNING 'Godkjenning feilet for suggestion %: % (SQLSTATE: %)',
      p_suggestion_id, SQLERRM, SQLSTATE;

    v_result := json_build_object(
      'success', false,
      'message', 'Feil ved godkjenning: ' || SQLERRM,
      'error_code', SQLSTATE
    );
  END;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION approve_geography_suggestion IS
  'Atomically approves a geography suggestion with full transaction safety. Rolls back all changes on any error.';

-- Grant execute permission to authenticated admins
GRANT EXECUTE ON FUNCTION approve_geography_suggestion TO authenticated;

-- Create helper function to reject suggestions
CREATE OR REPLACE FUNCTION reject_geography_suggestion(
  p_suggestion_id UUID,
  p_reviewer_id UUID,
  p_admin_notes TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_suggestion geography_suggestions%ROWTYPE;
  v_result JSON;
BEGIN
  -- Lock the suggestion
  SELECT * INTO v_suggestion
  FROM geography_suggestions
  WHERE id = p_suggestion_id
  FOR UPDATE;

  IF v_suggestion.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Forslag ikke funnet');
  END IF;

  IF v_suggestion.status != 'pending' THEN
    RETURN json_build_object('success', false, 'message', 'Forslag er allerede behandlet');
  END IF;

  -- Verify reviewer is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_reviewer_id AND role = 'admin') THEN
    RETURN json_build_object('success', false, 'message', 'Kun admin kan avvise forslag');
  END IF;

  -- Mark as rejected
  UPDATE geography_suggestions SET
    status = 'rejected',
    reviewed_at = NOW(),
    reviewed_by = p_reviewer_id,
    admin_notes = p_admin_notes
  WHERE id = p_suggestion_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Forslag avvist',
    'suggestion_id', p_suggestion_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION reject_geography_suggestion IS
  'Rejects a geography suggestion with optional admin notes.';

GRANT EXECUTE ON FUNCTION reject_geography_suggestion TO authenticated;

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'Geography approval transaction functions created successfully';
  RAISE NOTICE 'Functions: approve_geography_suggestion, reject_geography_suggestion';
  RAISE NOTICE 'All operations are now transaction-safe with automatic rollback on errors';
END $$;
