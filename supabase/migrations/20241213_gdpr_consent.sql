-- =====================================================
-- GDPR: SAMTYKKE-LOGGING
-- Migration for å lagre personvernsamtykke
-- =====================================================

-- 1. Legg til privacy_consent_at kolonne i profiles
-- =====================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_consent_at TIMESTAMPTZ;

-- Kommentar for dokumentasjon
COMMENT ON COLUMN profiles.privacy_consent_at IS 'Tidspunkt da brukeren godtok personvernerklæringen ved registrering (GDPR Art. 7)';

-- 2. Oppdater handle_new_user til å lagre samtykke
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, last_seen_at, privacy_consent_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    -- Hent samtykke-tidspunkt fra metadata (satt ved registrering)
    (NEW.raw_user_meta_data->>'privacy_consent_at')::TIMESTAMPTZ
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    privacy_consent_at = COALESCE(EXCLUDED.privacy_consent_at, profiles.privacy_consent_at),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail user creation
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Indeks for samtykke-spørringer (hvis man trenger å finne brukere uten samtykke)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_privacy_consent ON profiles(privacy_consent_at);

-- 4. Sett samtykke for eksisterende brukere (de registrerte før GDPR-oppdateringen)
-- Markerer dem som samtykket ved deres registreringstidspunkt (implisitt samtykke)
-- =====================================================
UPDATE profiles
SET privacy_consent_at = created_at
WHERE privacy_consent_at IS NULL;

-- 5. View for GDPR-compliance oversikt (kun for admin)
-- =====================================================
CREATE OR REPLACE VIEW gdpr_compliance_status AS
SELECT
  COUNT(*) FILTER (WHERE privacy_consent_at IS NOT NULL) as users_with_consent,
  COUNT(*) FILTER (WHERE privacy_consent_at IS NULL) as users_without_consent,
  COUNT(*) as total_users,
  MIN(privacy_consent_at) as earliest_consent,
  MAX(privacy_consent_at) as latest_consent
FROM profiles;

-- Sikre at kun admin kan se compliance-status
-- (RLS på views krever CREATE POLICY på underliggende tabell, som allerede finnes)
