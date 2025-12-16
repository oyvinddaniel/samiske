-- ============================================================================
-- KJØR DENNE SQL-EN I SUPABASE DASHBOARD → SQL EDITOR
-- ============================================================================
-- Dette vil:
-- 1. Fikse brukerantallet på forsiden (vise 53 fra Auth, ikke 37 fra Profiles)
-- 2. Legge til detaljert brukerlogg og statistikk i admin-panelet
-- ============================================================================

-- 1. FUNKSJON FOR Å TELLE BRUKERE FRA AUTH.USERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_auth_users_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT COUNT(*)::INTEGER FROM auth.users);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_auth_users_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_users_count() TO anon;

COMMENT ON FUNCTION public.get_auth_users_count() IS 'Returns the total count of registered users from auth.users table';


-- 2. BRUKERANALYTIKK-FUNKSJONER (KUN FOR ADMIN)
-- ============================================================================

-- 2A. Hent alle brukere med detaljer
CREATE OR REPLACE FUNCTION public.get_auth_users_list()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  email_confirmed_at TIMESTAMPTZ,
  raw_user_meta_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to see this
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can access user analytics';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at,
    u.raw_user_meta_data
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;

-- 2B. Brukere registrert i dag
CREATE OR REPLACE FUNCTION public.get_users_registered_today()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM auth.users
    WHERE DATE(created_at) = CURRENT_DATE
  );
END;
$$;

-- 2C. Brukere som logget inn i dag
CREATE OR REPLACE FUNCTION public.get_users_logged_in_today()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM auth.users
    WHERE DATE(last_sign_in_at) = CURRENT_DATE
  );
END;
$$;

-- 2D. Brukere registrert denne uken
CREATE OR REPLACE FUNCTION public.get_users_registered_this_week()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM auth.users
    WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)
  );
END;
$$;

-- 2E. Brukere registrert denne måneden
CREATE OR REPLACE FUNCTION public.get_users_registered_this_month()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM auth.users
    WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
  );
END;
$$;

-- 2F. Registreringstrend (siste 30 dager)
CREATE OR REPLACE FUNCTION public.get_user_registration_trend()
RETURNS TABLE (
  date DATE,
  count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can access user analytics';
  END IF;

  RETURN QUERY
  SELECT
    DATE(created_at) as date,
    COUNT(*) as count
  FROM auth.users
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
END;
$$;


-- 3. TILGANGSTILLATELSER
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_auth_users_list() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_registered_today() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_registered_today() TO anon;
GRANT EXECUTE ON FUNCTION public.get_users_logged_in_today() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_logged_in_today() TO anon;
GRANT EXECUTE ON FUNCTION public.get_users_registered_this_week() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_registered_this_week() TO anon;
GRANT EXECUTE ON FUNCTION public.get_users_registered_this_month() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_registered_this_month() TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_registration_trend() TO authenticated;


-- 4. KOMMENTARER
-- ============================================================================

COMMENT ON FUNCTION public.get_auth_users_list() IS 'Returns detailed user list from auth.users (admin only)';
COMMENT ON FUNCTION public.get_users_registered_today() IS 'Returns count of users registered today';
COMMENT ON FUNCTION public.get_users_logged_in_today() IS 'Returns count of users who logged in today';
COMMENT ON FUNCTION public.get_users_registered_this_week() IS 'Returns count of users registered this week';
COMMENT ON FUNCTION public.get_users_registered_this_month() IS 'Returns count of users registered this month';
COMMENT ON FUNCTION public.get_user_registration_trend() IS 'Returns daily registration counts for last 30 days (admin only)';


-- ============================================================================
-- FERDIG!
-- ============================================================================
-- Nå vil:
-- 1. Forsiden vise 53 brukere (fra Auth) i stedet for 37 (fra Profiles)
-- 2. Admin-panelet ha en ny fane "Brukerlogg & Statistikk" med:
--    - Totalt antall brukere
--    - Registrert i dag
--    - Logget inn i dag
--    - Denne uken
--    - Denne måneden
--    - Registreringstrend (siste 30 dager)
--    - Fullstendig liste over alle brukere
-- ============================================================================
