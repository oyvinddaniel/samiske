-- Migration: Polls/Avstemninger
-- Dato: 2025-12-18
-- Beskrivelse: Støtte for avstemninger på innlegg

-- ============================================
-- 1. Opprett polls tabell
-- ============================================

CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  allow_multiple BOOLEAN DEFAULT FALSE,
  ends_at TIMESTAMPTZ,
  total_votes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id) -- Kun én poll per innlegg
);

-- ============================================
-- 2. Opprett poll_options tabell
-- ============================================

CREATE TABLE IF NOT EXISTS poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  vote_count INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. Opprett poll_votes tabell
-- ============================================

CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, option_id, user_id) -- Én stemme per valg per bruker
);

-- Indekser
CREATE INDEX IF NOT EXISTS idx_polls_post ON polls(post_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user ON poll_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_option ON poll_votes(option_id);

-- ============================================
-- 4. RLS Policies
-- ============================================

ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Polls: Alle kan lese
CREATE POLICY "polls_select" ON polls
FOR SELECT USING (TRUE);

-- Polls: Innleggseier kan opprette
CREATE POLICY "polls_insert" ON polls
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = polls.post_id
    AND posts.user_id = auth.uid()
  )
);

-- Polls: Innleggseier kan oppdatere
CREATE POLICY "polls_update" ON polls
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = polls.post_id
    AND posts.user_id = auth.uid()
  )
);

-- Poll options: Alle kan lese
CREATE POLICY "poll_options_select" ON poll_options
FOR SELECT USING (TRUE);

-- Poll options: Via poll-eier
CREATE POLICY "poll_options_insert" ON poll_options
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM polls p
    JOIN posts ON posts.id = p.post_id
    WHERE p.id = poll_options.poll_id
    AND posts.user_id = auth.uid()
  )
);

-- Poll votes: Alle kan lese (for å telle)
CREATE POLICY "poll_votes_select" ON poll_votes
FOR SELECT USING (TRUE);

-- Poll votes: Innloggede brukere kan stemme
CREATE POLICY "poll_votes_insert" ON poll_votes
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Poll votes: Brukere kan fjerne egen stemme
CREATE POLICY "poll_votes_delete" ON poll_votes
FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 5. Funksjon: Opprett poll med valg
-- ============================================

CREATE OR REPLACE FUNCTION create_poll(
  p_post_id UUID,
  p_question TEXT,
  p_options TEXT[],
  p_allow_multiple BOOLEAN DEFAULT FALSE,
  p_ends_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_poll_id UUID;
  v_max_options INT;
  i INT;
BEGIN
  -- Hent maks valg fra innstillinger
  SELECT COALESCE((value->>'max_poll_options')::INT, 10) INTO v_max_options
  FROM app_settings
  WHERE key = 'post_settings';

  -- Valider at brukeren eier innlegget
  IF NOT EXISTS (
    SELECT 1 FROM posts WHERE id = p_post_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Ikke tilgang til dette innlegget';
  END IF;

  -- Valider antall valg
  IF array_length(p_options, 1) < 2 THEN
    RAISE EXCEPTION 'Minimum 2 valg kreves';
  END IF;

  IF array_length(p_options, 1) > v_max_options THEN
    RAISE EXCEPTION 'Maks % valg tillatt', v_max_options;
  END IF;

  -- Opprett poll
  INSERT INTO polls (post_id, question, allow_multiple, ends_at)
  VALUES (p_post_id, p_question, p_allow_multiple, p_ends_at)
  RETURNING id INTO v_poll_id;

  -- Opprett valg
  FOR i IN 1..array_length(p_options, 1) LOOP
    INSERT INTO poll_options (poll_id, text, sort_order)
    VALUES (v_poll_id, p_options[i], i - 1);
  END LOOP;

  RETURN v_poll_id;
END;
$$;

-- ============================================
-- 6. Funksjon: Stem på poll
-- ============================================

CREATE OR REPLACE FUNCTION vote_on_poll(
  p_poll_id UUID,
  p_option_ids UUID[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_poll RECORD;
  v_option_id UUID;
BEGIN
  -- Hent poll info
  SELECT * INTO v_poll FROM polls WHERE id = p_poll_id;

  IF v_poll IS NULL THEN
    RAISE EXCEPTION 'Poll ikke funnet';
  END IF;

  -- Sjekk om poll har utløpt
  IF v_poll.ends_at IS NOT NULL AND v_poll.ends_at < NOW() THEN
    RAISE EXCEPTION 'Avstemningen er avsluttet';
  END IF;

  -- Valider antall valg
  IF NOT v_poll.allow_multiple AND array_length(p_option_ids, 1) > 1 THEN
    RAISE EXCEPTION 'Kun ett valg tillatt';
  END IF;

  -- Fjern eksisterende stemmer hvis ikke allow_multiple
  IF NOT v_poll.allow_multiple THEN
    DELETE FROM poll_votes
    WHERE poll_id = p_poll_id AND user_id = auth.uid();

    -- Oppdater vote_count for fjernede valg
    UPDATE poll_options
    SET vote_count = vote_count - 1
    WHERE poll_id = p_poll_id
    AND id IN (
      SELECT option_id FROM poll_votes
      WHERE poll_id = p_poll_id AND user_id = auth.uid()
    );
  END IF;

  -- Legg til nye stemmer
  FOREACH v_option_id IN ARRAY p_option_ids LOOP
    -- Sjekk at valget tilhører denne pollen
    IF NOT EXISTS (
      SELECT 1 FROM poll_options WHERE id = v_option_id AND poll_id = p_poll_id
    ) THEN
      RAISE EXCEPTION 'Ugyldig valg';
    END IF;

    -- Sett inn stemme (ignorer duplikater)
    INSERT INTO poll_votes (poll_id, option_id, user_id)
    VALUES (p_poll_id, v_option_id, auth.uid())
    ON CONFLICT (poll_id, option_id, user_id) DO NOTHING;

    -- Oppdater vote_count
    UPDATE poll_options
    SET vote_count = vote_count + 1
    WHERE id = v_option_id;
  END LOOP;

  -- Oppdater total_votes
  UPDATE polls
  SET total_votes = (
    SELECT COUNT(DISTINCT user_id) FROM poll_votes WHERE poll_id = p_poll_id
  )
  WHERE id = p_poll_id;

  RETURN TRUE;
END;
$$;

-- ============================================
-- 7. Funksjon: Hent poll med resultater
-- ============================================

CREATE OR REPLACE FUNCTION get_poll_results(p_poll_id UUID)
RETURNS TABLE (
  poll_id UUID,
  question TEXT,
  allow_multiple BOOLEAN,
  ends_at TIMESTAMPTZ,
  total_votes INT,
  is_ended BOOLEAN,
  user_voted BOOLEAN,
  user_votes UUID[],
  options JSONB
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    p.id AS poll_id,
    p.question,
    p.allow_multiple,
    p.ends_at,
    p.total_votes,
    (p.ends_at IS NOT NULL AND p.ends_at < NOW()) AS is_ended,
    EXISTS (
      SELECT 1 FROM poll_votes WHERE poll_id = p.id AND user_id = auth.uid()
    ) AS user_voted,
    ARRAY(
      SELECT option_id FROM poll_votes WHERE poll_id = p.id AND user_id = auth.uid()
    ) AS user_votes,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', o.id,
          'text', o.text,
          'vote_count', o.vote_count,
          'percentage', CASE WHEN p.total_votes > 0
            THEN ROUND((o.vote_count::DECIMAL / p.total_votes) * 100)
            ELSE 0
          END
        ) ORDER BY o.sort_order
      )
      FROM poll_options o WHERE o.poll_id = p.id
    ) AS options
  FROM polls p
  WHERE p.id = p_poll_id;
$$;

-- ============================================
-- 8. Funksjon: Hent poll for post
-- ============================================

CREATE OR REPLACE FUNCTION get_post_poll(p_post_id UUID)
RETURNS TABLE (
  poll_id UUID,
  question TEXT,
  allow_multiple BOOLEAN,
  ends_at TIMESTAMPTZ,
  total_votes INT,
  is_ended BOOLEAN,
  user_voted BOOLEAN,
  user_votes UUID[],
  options JSONB
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT * FROM get_poll_results(
    (SELECT id FROM polls WHERE post_id = p_post_id)
  );
$$;

-- ============================================
-- 9. App settings for polls
-- ============================================

UPDATE app_settings
SET value = value || '{"max_poll_options": 10}'::jsonb
WHERE key = 'post_settings';

-- ============================================
-- NOTATER:
-- - Maks 10 valg per avstemning (konfigurerbart)
-- - Støtter enkelt- og flervalg
-- - Valgfri utløpsdato
-- - Stemmer kan ikke endres etter at man har stemt (unless allow_multiple)
-- - Vote counts oppdateres i sanntid
-- ============================================
