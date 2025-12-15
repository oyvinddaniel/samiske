-- Create RPC function to delete (soft delete) a community
-- Only admins of the community can delete it

CREATE OR REPLACE FUNCTION delete_community(p_community_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();

  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user is an admin of this community
  SELECT EXISTS (
    SELECT 1
    FROM community_admins
    WHERE community_id = p_community_id
    AND user_id = v_user_id
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only community admins can delete the community';
  END IF;

  -- Soft delete the community by setting is_active to false
  UPDATE communities
  SET
    is_active = false,
    updated_at = NOW()
  WHERE id = p_community_id;

  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_community(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION delete_community IS 'Soft deletes a community. Only community admins can delete their community.';
