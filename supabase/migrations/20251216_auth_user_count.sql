-- Function to count users from auth.users table
-- Created: 2025-12-16
-- This allows us to get the accurate count of registered users

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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_auth_users_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_users_count() TO anon;

COMMENT ON FUNCTION public.get_auth_users_count() IS 'Returns the total count of registered users from auth.users table';
