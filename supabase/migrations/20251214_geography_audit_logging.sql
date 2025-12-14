-- =====================================================
-- AUDIT LOGGING FOR GEOGRAPHY SUGGESTIONS
-- Tracks all admin actions on geography suggestions
-- Date: 2025-12-14
-- =====================================================

-- 1. Create audit log table
CREATE TABLE IF NOT EXISTS geography_suggestion_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID NOT NULL REFERENCES geography_suggestions(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'pending_review')),

  -- Snapshot of suggestion before action
  suggestion_snapshot JSONB NOT NULL,

  -- Changes made (for approvals)
  entity_id UUID,
  entity_type TEXT CHECK (entity_type IN ('language_area', 'municipality', 'place')),

  -- Admin notes
  admin_notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,

  -- Indexes for querying
  CONSTRAINT valid_entity_on_approval CHECK (
    (action = 'approved' AND entity_id IS NOT NULL) OR
    (action != 'approved')
  )
);

-- 2. Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_suggestion ON geography_suggestion_audit(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON geography_suggestion_audit(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON geography_suggestion_audit(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON geography_suggestion_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON geography_suggestion_audit(entity_type, entity_id) WHERE entity_id IS NOT NULL;

-- 3. Add RLS policies
ALTER TABLE geography_suggestion_audit ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON geography_suggestion_audit
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Service role can insert (used by triggers and functions)
CREATE POLICY "Service role can insert audit logs"
  ON geography_suggestion_audit
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- 4. Add audit logging to approval function
CREATE OR REPLACE FUNCTION log_geography_suggestion_action(
  p_suggestion_id UUID,
  p_admin_id UUID,
  p_action TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_admin_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_suggestion geography_suggestions%ROWTYPE;
BEGIN
  -- Get suggestion snapshot
  SELECT * INTO v_suggestion FROM geography_suggestions WHERE id = p_suggestion_id;

  IF v_suggestion.id IS NULL THEN
    RAISE WARNING 'Cannot log audit - suggestion % not found', p_suggestion_id;
    RETURN;
  END IF;

  -- Insert audit log
  INSERT INTO geography_suggestion_audit (
    suggestion_id,
    admin_id,
    action,
    suggestion_snapshot,
    entity_id,
    entity_type,
    admin_notes
  ) VALUES (
    p_suggestion_id,
    p_admin_id,
    p_action,
    row_to_json(v_suggestion)::JSONB,
    p_entity_id,
    v_suggestion.entity_type,
    p_admin_notes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_geography_suggestion_action IS
  'Logs admin actions on geography suggestions for audit trail';

-- 5. Update approval function to include audit logging
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
        SELECT id INTO v_norway_id FROM countries WHERE code = 'NO' LIMIT 1;

        IF v_norway_id IS NULL THEN
          RAISE EXCEPTION 'Norge ikke funnet i countries-tabellen';
        END IF;

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
        SELECT ARRAY(
          SELECT jsonb_array_elements_text(v_suggestion.suggested_data->'language_area_ids')
        ) INTO v_language_area_ids;

        UPDATE municipalities SET
          language_area_id = NULLIF(v_language_area_ids[1], '')::UUID
        WHERE id = v_suggestion.entity_id;

        DELETE FROM municipality_language_areas
        WHERE municipality_id = v_suggestion.entity_id;

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

    -- Log the approval action
    PERFORM log_geography_suggestion_action(
      p_suggestion_id,
      p_reviewer_id,
      'approved',
      v_entity_id,
      NULL
    );

    -- Success response
    v_result := json_build_object(
      'success', true,
      'message', 'Forslag godkjent og endringer utført',
      'entity_id', v_entity_id,
      'suggestion_id', p_suggestion_id
    );

  EXCEPTION WHEN OTHERS THEN
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

-- 6. Update reject function to include audit logging
CREATE OR REPLACE FUNCTION reject_geography_suggestion(
  p_suggestion_id UUID,
  p_reviewer_id UUID,
  p_admin_notes TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_suggestion geography_suggestions%ROWTYPE;
  v_result JSON;
BEGIN
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

  -- Log the rejection
  PERFORM log_geography_suggestion_action(
    p_suggestion_id,
    p_reviewer_id,
    'rejected',
    NULL,
    p_admin_notes
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Forslag avvist',
    'suggestion_id', p_suggestion_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create view for audit log reporting
CREATE OR REPLACE VIEW geography_audit_summary AS
SELECT
  a.id,
  a.suggestion_id,
  a.action,
  a.created_at,
  p.full_name as admin_name,
  p.email as admin_email,
  a.entity_type,
  a.entity_id,
  a.admin_notes,
  gs.suggestion_type,
  gs.suggested_data->>'name' as suggested_name,
  u.full_name as submitter_name,
  u.email as submitter_email
FROM geography_suggestion_audit a
JOIN profiles p ON p.id = a.admin_id
JOIN geography_suggestions gs ON gs.id = a.suggestion_id
LEFT JOIN profiles u ON u.id = gs.user_id
ORDER BY a.created_at DESC;

COMMENT ON VIEW geography_audit_summary IS
  'Human-readable summary of geography suggestion audit logs';

-- 8. Grant permissions
GRANT EXECUTE ON FUNCTION log_geography_suggestion_action TO authenticated;
GRANT SELECT ON geography_audit_summary TO authenticated;

-- 9. Create cleanup function for old audit logs (optional retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(
  p_retention_days INTEGER DEFAULT 730  -- 2 years default
) RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM geography_suggestion_audit
  WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RAISE NOTICE 'Cleaned up % audit logs older than % days', v_deleted_count, p_retention_days;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_audit_logs IS
  'Removes audit logs older than specified retention period (default 2 years)';

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'Geography suggestion audit logging system initialized';
  RAISE NOTICE 'All admin actions will be logged to geography_suggestion_audit table';
  RAISE NOTICE 'Retention policy: Logs kept for 2 years (configurable)';
END $$;
