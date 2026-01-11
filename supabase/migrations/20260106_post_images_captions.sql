-- Add caption support to post_images
-- Date: 2026-01-06
-- Purpose: Enable per-image captions, titles, and alt text for accessibility and context

-- Add caption-related columns to post_images
ALTER TABLE post_images
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS caption TEXT,
ADD COLUMN IF NOT EXISTS alt_text TEXT;

-- Create index for caption search (using simple dictionary for Norwegian text)
CREATE INDEX IF NOT EXISTS idx_post_images_caption
ON post_images USING gin(to_tsvector('simple', COALESCE(caption, '')));

-- Drop existing function before recreating with new signature
DROP FUNCTION IF EXISTS get_post_images(UUID);

-- Update helper function to include new fields
CREATE OR REPLACE FUNCTION get_post_images(p_post_id UUID)
RETURNS TABLE (
  id UUID,
  url TEXT,
  thumbnail_url TEXT,
  width INT,
  height INT,
  sort_order INT,
  title TEXT,
  caption TEXT,
  alt_text TEXT
)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT
    id, url, thumbnail_url, width, height, sort_order,
    title, caption, alt_text
  FROM post_images
  WHERE post_id = p_post_id
  ORDER BY sort_order ASC;
$$;

-- Comment on new columns for documentation
COMMENT ON COLUMN post_images.title IS 'Optional title for the image';
COMMENT ON COLUMN post_images.caption IS 'Optional caption/description for the image';
COMMENT ON COLUMN post_images.alt_text IS 'Alt text for accessibility (screen readers)';
