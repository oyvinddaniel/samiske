-- ================================================
-- MIGRATION: Post Images Edit Support
-- Date: 2026-01-10
-- Description: Functions to delete and reorder post images
-- ================================================

-- 1. ADD FUNCTION TO DELETE POST IMAGE
CREATE OR REPLACE FUNCTION delete_post_image(
  p_image_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_post_owner UUID;
BEGIN
  -- Get post owner
  SELECT p.user_id INTO v_post_owner
  FROM post_images pi
  JOIN posts p ON p.id = pi.post_id
  WHERE pi.id = p_image_id;

  -- Verify ownership
  IF v_post_owner IS NULL OR v_post_owner != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Delete image
  DELETE FROM post_images WHERE id = p_image_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ADD FUNCTION TO REORDER POST IMAGES
CREATE OR REPLACE FUNCTION reorder_post_images(
  p_post_id UUID,
  p_image_order UUID[] -- Array of image IDs in desired order
)
RETURNS BOOLEAN AS $$
DECLARE
  v_image_id UUID;
  v_order INT := 0;
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM posts
    WHERE id = p_post_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Update sort_order for each image
  FOREACH v_image_id IN ARRAY p_image_order
  LOOP
    UPDATE post_images
    SET sort_order = v_order
    WHERE id = v_image_id AND post_id = p_post_id;

    v_order := v_order + 1;
  END LOOP;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION delete_post_image TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_post_images TO authenticated;

-- ================================================
-- END MIGRATION
-- ================================================
