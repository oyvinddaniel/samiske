-- =====================================================
-- ENABLE EMAIL VERIFICATION FOR NEW USERS
-- Removes auto-confirmation and requires email verification
-- Date: 2025-12-14
-- =====================================================

-- 1. Drop the auto-confirm trigger
DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;

-- 2. Drop the auto-confirm function
DROP FUNCTION IF EXISTS public.auto_confirm_user();

-- 3. Add comment explaining the change
COMMENT ON SCHEMA public IS
  'Email verification is now ENABLED. New users must verify their email address before accessing the platform. This improves security and ensures valid contact information.';

-- Verification
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'EMAIL VERIFICATION NOW ENABLED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  - Auto-confirmation trigger removed';
  RAISE NOTICE '  - Auto-confirmation function dropped';
  RAISE NOTICE '  - New users MUST verify email before login';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps in Supabase Dashboard:';
  RAISE NOTICE '  1. Go to Authentication > Email Templates';
  RAISE NOTICE '  2. Customize the confirmation email template';
  RAISE NOTICE '  3. Ensure SMTP settings are configured';
  RAISE NOTICE '  4. Test registration flow';
  RAISE NOTICE '';
  RAISE NOTICE 'Existing users:';
  RAISE NOTICE '  - Already confirmed users are unaffected';
  RAISE NOTICE '  - Unconfirmed users will need to verify';
  RAISE NOTICE '========================================';
END $$;
