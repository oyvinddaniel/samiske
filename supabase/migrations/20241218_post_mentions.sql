-- =====================================================
-- POST MENTIONS TABLE
-- Sporer hvilke entiteter som er nevnt i innlegg
-- Dato: 2024-12-18
-- =====================================================

-- 1. OPPRETT POST_MENTIONS TABELL
-- =====================================================
CREATE TABLE IF NOT EXISTS post_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  mention_type TEXT NOT NULL CHECK (mention_type IN ('user', 'group', 'community', 'place', 'municipality', 'language_area')),
  mentioned_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unikt constraint for å unngå duplikater
  UNIQUE(post_id, mention_type, mentioned_id)
);

-- 2. INDEKSER FOR RASK OPPSLAG
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_post_mentions_post_id ON post_mentions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_mentions_mentioned ON post_mentions(mention_type, mentioned_id);
CREATE INDEX IF NOT EXISTS idx_post_mentions_type_id ON post_mentions(mentioned_id) WHERE mention_type IN ('group', 'community', 'place', 'municipality', 'language_area');

-- 3. RLS POLICIES
-- =====================================================
ALTER TABLE post_mentions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read post mentions" ON post_mentions;
DROP POLICY IF EXISTS "Authenticated users can create mentions" ON post_mentions;

-- Alle kan lese mentions
CREATE POLICY "Anyone can read post mentions" ON post_mentions
  FOR SELECT USING (true);

-- Kun autentiserte brukere kan opprette mentions (via RPC)
CREATE POLICY "Authenticated users can create mentions" ON post_mentions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 4. FUNKSJON FOR Å LAGRE POST MENTIONS
-- =====================================================
CREATE OR REPLACE FUNCTION save_post_mentions(
  p_post_id UUID,
  p_mentions JSONB -- Array av {type: string, id: string}
)
RETURNS VOID AS $$
DECLARE
  mention JSONB;
BEGIN
  -- Slett eksisterende mentions for denne posten
  DELETE FROM post_mentions WHERE post_id = p_post_id;

  -- Sett inn nye mentions
  FOR mention IN SELECT * FROM jsonb_array_elements(p_mentions)
  LOOP
    INSERT INTO post_mentions (post_id, mention_type, mentioned_id)
    VALUES (
      p_post_id,
      mention->>'type',
      (mention->>'id')::UUID
    )
    ON CONFLICT (post_id, mention_type, mentioned_id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNKSJON FOR Å HENTE INNLEGG SOM NEVNER EN ENTITET
-- =====================================================
CREATE OR REPLACE FUNCTION get_posts_mentioning_entity(
  p_mention_type TEXT,
  p_mentioned_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  post_id UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT pm.post_id, p.created_at
  FROM post_mentions pm
  JOIN posts p ON p.id = pm.post_id
  WHERE pm.mention_type = p_mention_type
    AND pm.mentioned_id = p_mentioned_id
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 6. FUNKSJON FOR Å VARSLE GRUPPEMEDLEMMER VED MENTION
-- =====================================================
CREATE OR REPLACE FUNCTION notify_group_members_on_mention(
  p_actor_id UUID,
  p_group_id UUID,
  p_post_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  member_id UUID;
  notification_count INTEGER := 0;
BEGIN
  -- Hent alle medlemmer av gruppen (unntatt aktøren selv)
  FOR member_id IN
    SELECT user_id FROM group_members
    WHERE group_id = p_group_id
    AND user_id != p_actor_id
  LOOP
    -- Opprett varsel for hvert medlem
    INSERT INTO notifications (recipient_id, type, actor_id, post_id)
    VALUES (member_id, 'mention', p_actor_id, p_post_id)
    ON CONFLICT DO NOTHING;

    notification_count := notification_count + 1;
  END LOOP;

  RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. FUNKSJON FOR Å VARSLE SAMFUNNSFØLGERE VED MENTION
-- =====================================================
CREATE OR REPLACE FUNCTION notify_community_followers_on_mention(
  p_actor_id UUID,
  p_community_id UUID,
  p_post_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  follower_id UUID;
  notification_count INTEGER := 0;
BEGIN
  -- Hent alle følgere av samfunnet (unntatt aktøren selv)
  FOR follower_id IN
    SELECT user_id FROM community_members
    WHERE community_id = p_community_id
    AND user_id != p_actor_id
  LOOP
    -- Opprett varsel for hver følger
    INSERT INTO notifications (recipient_id, type, actor_id, post_id)
    VALUES (follower_id, 'mention', p_actor_id, p_post_id)
    ON CONFLICT DO NOTHING;

    notification_count := notification_count + 1;
  END LOOP;

  RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. GRANT PERMISSIONS
-- =====================================================
GRANT SELECT ON post_mentions TO authenticated;
GRANT INSERT ON post_mentions TO authenticated;
GRANT DELETE ON post_mentions TO authenticated;
GRANT EXECUTE ON FUNCTION save_post_mentions TO authenticated;
GRANT EXECUTE ON FUNCTION get_posts_mentioning_entity TO authenticated;
GRANT EXECUTE ON FUNCTION notify_group_members_on_mention TO authenticated;
GRANT EXECUTE ON FUNCTION notify_community_followers_on_mention TO authenticated;

-- 9. COMMENTS
-- =====================================================
COMMENT ON TABLE post_mentions IS 'Sporer hvilke entiteter (brukere, grupper, samfunn, steder, etc.) som er nevnt i innlegg';
COMMENT ON FUNCTION save_post_mentions IS 'Lagrer alle mentions for et innlegg. Kalles etter at et innlegg er opprettet/oppdatert.';
COMMENT ON FUNCTION get_posts_mentioning_entity IS 'Henter innlegg som nevner en spesifikk entitet (for feed-visning)';
COMMENT ON FUNCTION notify_group_members_on_mention IS 'Sender varsler til alle gruppemedlemmer når gruppen nevnes';
COMMENT ON FUNCTION notify_community_followers_on_mention IS 'Sender varsler til alle samfunnsfølgere når samfunnet nevnes';
