-- Migration: Reactions (utvider likes-systemet)
-- Dato: 2025-12-18
-- Beskrivelse: Utvider likes med 10 ulike reaksjonstyper

-- ============================================
-- 1. Legg til reaction_type kolonne på likes
-- ============================================

-- Legg til reaction_type med default 'elsker' for bakoverkompatibilitet
ALTER TABLE likes ADD COLUMN IF NOT EXISTS reaction_type TEXT DEFAULT 'elsker';

-- Opprett enum-type sjekk for gyldige reaksjoner
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_reaction_type_check;
ALTER TABLE likes ADD CONSTRAINT likes_reaction_type_check
  CHECK (reaction_type IN (
    'elsker',   -- ❤️
    'haha',     -- 😂
    'wow',      -- 😮
    'trist',    -- 😢
    'sint',     -- 😡
    'tommel',   -- 👍
    'ild',      -- 🔥
    'feiring',  -- 🎉
    'hundre',   -- 💯
    'takk'      -- 🙏
  ));

-- Indeks for raskere aggregering per reaksjonstype
CREATE INDEX IF NOT EXISTS idx_likes_reaction_type ON likes(post_id, reaction_type);

-- ============================================
-- 2. Funksjon: Reager på innlegg
-- ============================================

CREATE OR REPLACE FUNCTION react_to_post(
  p_post_id UUID,
  p_reaction_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_existing RECORD;
  v_result JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Ikke innlogget';
  END IF;

  -- Valider reaksjonstype
  IF p_reaction_type NOT IN ('elsker', 'haha', 'wow', 'trist', 'sint', 'tommel', 'ild', 'feiring', 'hundre', 'takk') THEN
    RAISE EXCEPTION 'Ugyldig reaksjonstype';
  END IF;

  -- Sjekk eksisterende reaksjon
  SELECT * INTO v_existing FROM likes
  WHERE post_id = p_post_id AND user_id = v_user_id;

  IF v_existing.id IS NOT NULL THEN
    IF v_existing.reaction_type = p_reaction_type THEN
      -- Samme reaksjon - fjern den
      DELETE FROM likes WHERE id = v_existing.id;
      v_result := jsonb_build_object('action', 'removed', 'reaction_type', p_reaction_type);
    ELSE
      -- Annen reaksjon - oppdater
      UPDATE likes SET reaction_type = p_reaction_type WHERE id = v_existing.id;
      v_result := jsonb_build_object('action', 'changed', 'reaction_type', p_reaction_type, 'previous', v_existing.reaction_type);
    END IF;
  ELSE
    -- Ny reaksjon
    INSERT INTO likes (post_id, user_id, reaction_type)
    VALUES (p_post_id, v_user_id, p_reaction_type);
    v_result := jsonb_build_object('action', 'added', 'reaction_type', p_reaction_type);
  END IF;

  RETURN v_result;
END;
$$;

-- ============================================
-- 3. Funksjon: Hent reaksjoner for innlegg
-- ============================================

CREATE OR REPLACE FUNCTION get_post_reactions(p_post_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT jsonb_build_object(
    'total_count', COUNT(*),
    'user_reaction', (
      SELECT reaction_type FROM likes
      WHERE post_id = p_post_id AND user_id = auth.uid()
    ),
    'reactions', (
      SELECT jsonb_object_agg(reaction_type, cnt)
      FROM (
        SELECT reaction_type, COUNT(*) as cnt
        FROM likes
        WHERE post_id = p_post_id
        GROUP BY reaction_type
      ) sub
    ),
    'recent_users', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'full_name', p.full_name,
          'avatar_url', p.avatar_url,
          'reaction_type', l.reaction_type
        )
      )
      FROM (
        SELECT user_id, reaction_type
        FROM likes
        WHERE post_id = p_post_id
        ORDER BY created_at DESC
        LIMIT 5
      ) l
      JOIN profiles p ON p.id = l.user_id
    )
  )
  FROM likes
  WHERE post_id = p_post_id;
$$;

-- ============================================
-- 4. Funksjon: Hent reaksjoner for flere innlegg (batch)
-- ============================================

CREATE OR REPLACE FUNCTION get_posts_reactions(p_post_ids UUID[])
RETURNS TABLE (
  post_id UUID,
  total_count BIGINT,
  user_reaction TEXT,
  reactions JSONB,
  recent_users JSONB
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    l.post_id,
    COUNT(*) as total_count,
    MAX(CASE WHEN l.user_id = auth.uid() THEN l.reaction_type ELSE NULL END) as user_reaction,
    jsonb_object_agg(DISTINCT l.reaction_type, sub.cnt) FILTER (WHERE sub.cnt IS NOT NULL) as reactions,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'full_name', p.full_name,
          'avatar_url', p.avatar_url,
          'reaction_type', l2.reaction_type
        )
      )
      FROM (
        SELECT user_id, reaction_type
        FROM likes
        WHERE post_id = l.post_id
        ORDER BY created_at DESC
        LIMIT 5
      ) l2
      JOIN profiles p ON p.id = l2.user_id
    ) as recent_users
  FROM likes l
  LEFT JOIN LATERAL (
    SELECT reaction_type, COUNT(*) as cnt
    FROM likes
    WHERE post_id = l.post_id
    GROUP BY reaction_type
  ) sub ON sub.reaction_type = l.reaction_type
  WHERE l.post_id = ANY(p_post_ids)
  GROUP BY l.post_id;
$$;

-- ============================================
-- 5. View for reaksjonsstatistikk
-- ============================================

CREATE OR REPLACE VIEW reaction_stats AS
SELECT
  post_id,
  reaction_type,
  COUNT(*) as count
FROM likes
GROUP BY post_id, reaction_type;

-- Grant access
GRANT SELECT ON reaction_stats TO authenticated;

-- ============================================
-- NOTATER:
-- - Bakoverkompatibelt: eksisterende likes får 'elsker' som default
-- - 10 reaksjonstyper støttet
-- - Brukere kan kun ha én reaksjon per innlegg
-- - Reaksjoner kan endres ved å velge ny type
-- - Batch-funksjon for effektiv feed-lasting
-- ============================================
