-- Brukeraktivitetslogg for detaljert tracking av sidevisninger
-- Hver gang en bruker laster en side logges det her

CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL,
  page_title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  -- Denormalisert for enklere queries i admin
  user_name TEXT,
  user_email TEXT
);

-- Index for rask henting av nylige aktiviteter
CREATE INDEX idx_user_activity_log_created_at ON user_activity_log(created_at DESC);
CREATE INDEX idx_user_activity_log_user_id ON user_activity_log(user_id);

-- RLS policies
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Brukere kan bare logge sin egen aktivitet
CREATE POLICY "Users can insert own activity"
  ON user_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Kun platform_admins kan lese aktivitetsloggen
CREATE POLICY "Platform admins can view activity log"
  ON user_activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM platform_admins WHERE user_id = auth.uid()
    )
  );

-- Funksjon for å logge aktivitet (med rate limiting - maks 1 per side per 30 sek)
CREATE OR REPLACE FUNCTION log_user_activity(
  p_page_path TEXT,
  p_page_title TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_user_email TEXT;
  v_last_log TIMESTAMPTZ;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Sjekk om samme side ble logget siste 30 sekunder (rate limiting)
  SELECT created_at INTO v_last_log
  FROM user_activity_log
  WHERE user_id = v_user_id
    AND page_path = p_page_path
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_last_log IS NOT NULL AND v_last_log > NOW() - INTERVAL '30 seconds' THEN
    RETURN; -- Skip logging, for nylig
  END IF;

  -- Hent brukerinfo
  SELECT full_name, email INTO v_user_name, v_user_email
  FROM profiles
  WHERE id = v_user_id;

  -- Logg aktiviteten
  INSERT INTO user_activity_log (user_id, page_path, page_title, user_agent, user_name, user_email)
  VALUES (v_user_id, p_page_path, p_page_title, p_user_agent, v_user_name, v_user_email);

  -- Oppdater last_seen_at samtidig
  UPDATE profiles SET last_seen_at = NOW() WHERE id = v_user_id;
END;
$$;

-- Grant execute til authenticated users
GRANT EXECUTE ON FUNCTION log_user_activity(TEXT, TEXT, TEXT) TO authenticated;

-- Automatisk cleanup av gamle logger (behold 30 dager)
-- Kjøres via cron job
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM user_activity_log
  WHERE created_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Sett opp daglig cleanup (hvis pg_cron er tilgjengelig)
-- SELECT cron.schedule('cleanup-activity-logs', '0 3 * * *', 'SELECT cleanup_old_activity_logs()');

COMMENT ON TABLE user_activity_log IS 'Detaljert logg over brukeraktivitet - sidevisninger';
COMMENT ON FUNCTION log_user_activity IS 'Logger brukeraktivitet med rate limiting (30 sek per side)';
