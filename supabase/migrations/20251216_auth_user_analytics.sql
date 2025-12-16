-- Auth User Analytics Functions
-- Created: 2025-12-16
-- These functions provide detailed user analytics from auth.users for admin

-- 1. Get all auth users with details (for admin user list)
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

-- 2. Get users registered today
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

-- 3. Get users who logged in today
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

-- 4. Get users registered this week
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

-- 5. Get users registered this month
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

-- 6. Get user registration trend (last 30 days)
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

-- Grant execute permissions to authenticated users (admin check is in function)
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

-- Comments
COMMENT ON FUNCTION public.get_auth_users_list() IS 'Returns detailed user list from auth.users (admin only)';
COMMENT ON FUNCTION public.get_users_registered_today() IS 'Returns count of users registered today';
COMMENT ON FUNCTION public.get_users_logged_in_today() IS 'Returns count of users who logged in today';
COMMENT ON FUNCTION public.get_users_registered_this_week() IS 'Returns count of users registered this week';
COMMENT ON FUNCTION public.get_users_registered_this_month() IS 'Returns count of users registered this month';
COMMENT ON FUNCTION public.get_user_registration_trend() IS 'Returns daily registration counts for last 30 days (admin only)';
