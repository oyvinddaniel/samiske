-- Prevent the last admin from leaving a group
-- This ensures groups always have at least one admin

CREATE OR REPLACE FUNCTION prevent_last_admin_leave()
RETURNS TRIGGER AS $$
DECLARE
  admin_count INTEGER;
  is_admin BOOLEAN;
BEGIN
  -- Check if the member being deleted is an admin
  IF OLD.role = 'admin' THEN
    -- Count remaining admins in the group (excluding the one being deleted)
    SELECT COUNT(*) INTO admin_count
    FROM group_members
    WHERE group_id = OLD.group_id
      AND role = 'admin'
      AND status = 'approved'
      AND id != OLD.id;

    -- If this is the last admin, prevent deletion
    IF admin_count = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last admin from the group. Please promote another member to admin first.'
        USING ERRCODE = '23514'; -- check_violation error code
    END IF;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce this rule
DROP TRIGGER IF EXISTS trigger_prevent_last_admin_leave ON group_members;

CREATE TRIGGER trigger_prevent_last_admin_leave
  BEFORE DELETE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_admin_leave();

-- Also prevent changing the last admin's role to non-admin
CREATE OR REPLACE FUNCTION prevent_last_admin_role_change()
RETURNS TRIGGER AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- Check if role is being changed from admin to something else
  IF OLD.role = 'admin' AND NEW.role != 'admin' AND OLD.status = 'approved' THEN
    -- Count remaining admins (excluding the one being updated)
    SELECT COUNT(*) INTO admin_count
    FROM group_members
    WHERE group_id = OLD.group_id
      AND role = 'admin'
      AND status = 'approved'
      AND id != OLD.id;

    -- If this is the last admin, prevent role change
    IF admin_count = 0 THEN
      RAISE EXCEPTION 'Cannot change the role of the last admin. Please promote another member to admin first.'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role change prevention
DROP TRIGGER IF EXISTS trigger_prevent_last_admin_role_change ON group_members;

CREATE TRIGGER trigger_prevent_last_admin_role_change
  BEFORE UPDATE ON group_members
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION prevent_last_admin_role_change();
