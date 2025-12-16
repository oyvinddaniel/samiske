-- Add location privacy settings to profiles table
-- Users can choose whether to show current and home location publicly

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS show_current_location BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_home_location BOOLEAN DEFAULT true;

COMMENT ON COLUMN profiles.show_current_location IS 'Whether to show current location publicly on profile';
COMMENT ON COLUMN profiles.show_home_location IS 'Whether to show home location publicly on profile';
