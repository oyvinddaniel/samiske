-- Fiks for manglende profiler (18. desember 2025)
-- Problemet: Brukere kan registrere seg uten at profil opprettes hvis trigger feiler

-- 1. Sjekk først hvor mange brukere som mangler profil
SELECT
  COUNT(*) as missing_profiles,
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 2. Opprett manglende profiler
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

-- 3. Opprett også notification_preferences for nye profiler
INSERT INTO notification_preferences (user_id)
SELECT id FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- 4. Bekreft at alle er fikset
SELECT
  COUNT(*) as still_missing
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
