-- Tracking av når brukere sist så changelog
-- Brukes for å vise rød notifikasjon-prikk

CREATE TABLE IF NOT EXISTS user_changelog_seen (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE user_changelog_seen ENABLE ROW LEVEL SECURITY;

-- Brukere kan kun lese sin egen rad
CREATE POLICY "Users can read own changelog seen"
  ON user_changelog_seen FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Brukere kan opprette sin egen rad
CREATE POLICY "Users can insert own changelog seen"
  ON user_changelog_seen FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Brukere kan oppdatere sin egen rad
CREATE POLICY "Users can update own changelog seen"
  ON user_changelog_seen FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Funksjon for å markere changelog som sett
CREATE OR REPLACE FUNCTION mark_changelog_seen()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_changelog_seen (user_id, last_seen_at)
  VALUES (auth.uid(), NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET last_seen_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION mark_changelog_seen() TO authenticated;

-- Funksjon for å sjekke om det finnes uleste changelog-entries
CREATE OR REPLACE FUNCTION get_unread_changelog_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_last_seen TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  -- Hent brukerens siste sett-tidspunkt
  SELECT last_seen_at INTO v_last_seen
  FROM user_changelog_seen
  WHERE user_id = auth.uid();

  -- Hvis brukeren aldri har sett changelog, tell alle
  IF v_last_seen IS NULL THEN
    SELECT COUNT(*) INTO v_count FROM changelog_entries;
  ELSE
    -- Tell kun nyere entries
    SELECT COUNT(*) INTO v_count
    FROM changelog_entries
    WHERE created_at > v_last_seen;
  END IF;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_unread_changelog_count() TO authenticated;

COMMENT ON TABLE user_changelog_seen IS 'Tracker når brukere sist så changelog for notifikasjoner';
COMMENT ON FUNCTION mark_changelog_seen IS 'Markerer changelog som sett for innlogget bruker';
COMMENT ON FUNCTION get_unread_changelog_count IS 'Returnerer antall uleste changelog-entries';
