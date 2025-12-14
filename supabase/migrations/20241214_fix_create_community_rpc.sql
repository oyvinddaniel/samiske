-- Fix create_community RPC to remove deprecated municipality_id and place_id parameters
-- These columns were removed from communities table in 20241214_fix_post_system_cleanup.sql
-- Location is now handled via community_places table (many-to-many)

DROP FUNCTION IF EXISTS create_community(TEXT, TEXT, TEXT, TEXT, UUID, UUID);

CREATE OR REPLACE FUNCTION create_community(
  p_name TEXT,
  p_slug TEXT,
  p_description TEXT DEFAULT NULL,
  p_category TEXT DEFAULT 'organization'
)
RETURNS UUID AS $$
DECLARE
  v_community_id UUID;
BEGIN
  -- Insert community (without municipality_id and place_id)
  INSERT INTO communities (name, slug, description, category, created_by)
  VALUES (p_name, p_slug, p_description, p_category, auth.uid())
  RETURNING id INTO v_community_id;

  -- Add creator as owner
  INSERT INTO community_admins (community_id, user_id, role)
  VALUES (v_community_id, auth.uid(), 'owner');

  RETURN v_community_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_community TO authenticated;

-- Add comment
COMMENT ON FUNCTION create_community IS
  'Oppretter ny community/samfunn-side og legger til creator som owner. ' ||
  'Lokasjon håndteres via community_places tabell (mange-til-mange).';
