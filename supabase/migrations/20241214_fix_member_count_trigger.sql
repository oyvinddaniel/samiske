-- Add DELETE trigger for member_count to maintain integrity
-- Previously, member_count only updated on INSERT via join_group() and approve_member()
-- This ensures count decrements when members leave or are removed

CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
    -- Increment count when approved member added
    UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'approved' AND NEW.status = 'approved' THEN
    -- Increment count when member approved
    UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status != 'approved' THEN
    -- Decrement count when member status changes from approved
    UPDATE groups SET member_count = member_count - 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
    -- Decrement count when approved member deleted
    UPDATE groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists and create comprehensive new one
DROP TRIGGER IF EXISTS trigger_update_group_member_count ON group_members;

CREATE TRIGGER trigger_update_group_member_count
  AFTER INSERT OR UPDATE OR DELETE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_group_member_count();

-- Fix any incorrect counts (optional cleanup)
UPDATE groups g
SET member_count = (
  SELECT COUNT(*)
  FROM group_members gm
  WHERE gm.group_id = g.id AND gm.status = 'approved'
)
WHERE g.member_count != (
  SELECT COUNT(*)
  FROM group_members gm
  WHERE gm.group_id = g.id AND gm.status = 'approved'
);
