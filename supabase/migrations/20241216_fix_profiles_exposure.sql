-- KRITISK SIKKERHETSFIX: Fjerner e-post og telefon eksponering til anonyme brukere
-- Funnet: 37 e-postadresser var offentlig tilgjengelige via anon-tilgang

-- 1. Dropp den åpne policy-en
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- 2. Opprett ny policy som krever autentisering for å se profiler
CREATE POLICY "Authenticated users can view profiles"
ON profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 3. Opprett policy for å telle brukere (for landing page statistikk)
-- Denne tillater anon å gjøre count queries, men ikke SELECT data
CREATE POLICY "Anyone can count profiles"
ON profiles FOR SELECT
USING (
  -- Kun tillat count-queries fra landing page via RPC
  -- Dette virker ikke direkte, men vi løser det med en funksjon
  false
);

-- 4. Lag en sikker funksjon for å telle aktive brukere
CREATE OR REPLACE FUNCTION get_active_users_count(since_hours INTEGER DEFAULT 24)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM profiles
  WHERE last_seen_at >= NOW() - (since_hours || ' hours')::INTERVAL;
$$;

-- Gi tilgang til funksjonen for anon
GRANT EXECUTE ON FUNCTION get_active_users_count(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_active_users_count(INTEGER) TO authenticated;

-- 5. Lag en sikker funksjon for å hente offentlig profilinfo (uten sensitiv data)
CREATE OR REPLACE FUNCTION get_public_profile(profile_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    id,
    full_name,
    avatar_url,
    bio,
    location,
    created_at
  FROM profiles
  WHERE id = profile_id;
$$;

GRANT EXECUTE ON FUNCTION get_public_profile(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_public_profile(UUID) TO authenticated;

COMMENT ON FUNCTION get_active_users_count IS 'Sikker funksjon for å telle aktive brukere uten å eksponere data';
COMMENT ON FUNCTION get_public_profile IS 'Henter kun offentlig profilinfo (uten e-post, telefon, etc.)';

-- 6. Dropp den ubrukelige "Anyone can count profiles" policy-en
DROP POLICY IF EXISTS "Anyone can count profiles" ON profiles;
