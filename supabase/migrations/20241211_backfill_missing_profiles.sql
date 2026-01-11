-- Backfill missing profiles for existing auth users
-- Run this in Supabase SQL Editor

-- Create profiles for any auth.users that don't have a profile yet
INSERT INTO public.profiles (id, email, full_name, avatar_url, last_seen_at, created_at)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  u.raw_user_meta_data->>'avatar_url',
  NOW(),
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Note: notification_preferences will be created in 20241213_notification_preferences.sql
-- That migration will handle backfilling notification preferences for existing users

-- Show how many profiles exist now
SELECT COUNT(*) as total_profiles FROM public.profiles;
