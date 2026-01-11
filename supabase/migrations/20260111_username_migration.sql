-- =====================================================
-- USERNAME MIGRATION FOR EXISTING USERS
-- Dato: 2026-01-11
-- Beskrivelse: Genererer usernames for eksisterende brukere
-- =====================================================

-- Generate usernames for existing users without one
-- Format: firstname_lastname_randomnumber

CREATE OR REPLACE FUNCTION generate_username_from_name(full_name TEXT, user_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INT := 0;
BEGIN
  -- Generate base from name
  base_username := LOWER(REGEXP_REPLACE(
    COALESCE(full_name, 'user'),
    '[^a-zA-Z0-9]',
    '_',
    'g'
  ));

  -- Trim to max 20 chars to leave room for number
  base_username := LEFT(base_username, 20);

  -- Try base_username first
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE username = base_username) AND
     NOT EXISTS (SELECT 1 FROM reserved_usernames WHERE username = base_username) THEN
    RETURN base_username;
  END IF;

  -- Try adding numbers
  LOOP
    counter := counter + 1;
    final_username := base_username || '_' || counter;

    IF NOT EXISTS (SELECT 1 FROM profiles WHERE username = final_username) AND
       NOT EXISTS (SELECT 1 FROM reserved_usernames WHERE username = final_username) THEN
      RETURN final_username;
    END IF;

    EXIT WHEN counter > 1000; -- Safety limit
  END LOOP;

  -- Fallback: use part of UUID
  RETURN 'user_' || SUBSTRING(user_id::TEXT, 1, 8);
END;
$$ LANGUAGE plpgsql;

-- Update all profiles without username
UPDATE profiles
SET username = generate_username_from_name(full_name, id)
WHERE username IS NULL;

-- Make username NOT NULL after migration
-- Note: We do this in a separate statement to ensure all users have usernames first
ALTER TABLE profiles
ALTER COLUMN username SET NOT NULL;

-- Drop the generation function as it's no longer needed
DROP FUNCTION IF EXISTS generate_username_from_name(TEXT, UUID);

-- Add comment
COMMENT ON COLUMN profiles.username IS 'Unique username handle (required), 3-30 chars, alphanumeric + underscore';
