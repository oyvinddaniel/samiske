-- Fix create_group() function to remove deprecated municipality_id and place_id parameters
-- These columns no longer exist in groups table - geographic associations now handled via group_places table

CREATE OR REPLACE FUNCTION create_group(
  name_param TEXT,
  slug_param TEXT,
  description_param TEXT DEFAULT NULL,
  group_type_param TEXT DEFAULT 'open'
)
RETURNS UUID AS $$
DECLARE
  new_group_id UUID;
BEGIN
  -- Opprett gruppen
  INSERT INTO groups (name, slug, description, group_type, created_by)
  VALUES (name_param, slug_param, description_param, group_type_param, auth.uid())
  RETURNING id INTO new_group_id;

  -- Legg til oppretteren som admin
  INSERT INTO group_members (group_id, user_id, role, status)
  VALUES (new_group_id, auth.uid(), 'admin', 'approved');

  -- Oppdater member_count
  UPDATE groups SET member_count = 1 WHERE id = new_group_id;

  RETURN new_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_group(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Note: To add geographic association to a group, use group_places table separately
-- Example:
-- INSERT INTO group_places (group_id, place_id) VALUES (new_group_id, your_place_id);
-- OR
-- INSERT INTO group_places (group_id, municipality_id) VALUES (new_group_id, your_municipality_id);
