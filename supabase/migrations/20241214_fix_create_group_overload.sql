-- Fix create_group() function overloading issue
-- This script drops both versions and creates only the new 4-parameter version

-- Step 1: Drop both existing versions
DROP FUNCTION IF EXISTS create_group(TEXT, TEXT, TEXT, TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS create_group(TEXT, TEXT, TEXT, TEXT);

-- Step 2: Create only the new 4-parameter version
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
  -- Insert the new group
  INSERT INTO groups (name, slug, description, group_type, created_by)
  VALUES (name_param, slug_param, description_param, group_type_param, auth.uid())
  RETURNING id INTO new_group_id;

  -- Add creator as admin member
  INSERT INTO group_members (group_id, user_id, role, status)
  VALUES (new_group_id, auth.uid(), 'admin', 'approved');

  -- Set initial member count
  UPDATE groups SET member_count = 1 WHERE id = new_group_id;

  RETURN new_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_group(TEXT, TEXT, TEXT, TEXT) TO authenticated;
