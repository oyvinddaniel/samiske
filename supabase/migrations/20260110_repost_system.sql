-- ================================================
-- MIGRATION: Repost/Reshare System
-- Date: 2026-01-10
-- Description: Enable users to repost posts to their feed
-- ================================================

-- 1. CREATE REPOSTS TABLE
CREATE TABLE IF NOT EXISTS public.post_reposts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  repost_comment TEXT, -- Optional comment when reposting
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(post_id, user_id) -- One repost per user per post
);

-- 2. INDEXES
CREATE INDEX IF NOT EXISTS idx_reposts_user ON post_reposts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reposts_post ON post_reposts(post_id, created_at DESC);

-- 3. RLS POLICIES
ALTER TABLE post_reposts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reposts are viewable by everyone"
ON post_reposts FOR SELECT
USING (true);

CREATE POLICY "Users can create reposts"
ON post_reposts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reposts"
ON post_reposts FOR DELETE
USING (auth.uid() = user_id);

-- 4. REPOST COUNT TRIGGER
CREATE OR REPLACE FUNCTION update_repost_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET share_count = COALESCE(share_count, 0) + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET share_count = GREATEST(0, COALESCE(share_count, 0) - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS repost_count_trigger ON post_reposts;
CREATE TRIGGER repost_count_trigger
  AFTER INSERT OR DELETE ON post_reposts
  FOR EACH ROW
  EXECUTE FUNCTION update_repost_count();

-- 5. REPOST FUNCTION
CREATE OR REPLACE FUNCTION repost_post(
  p_post_id UUID,
  p_comment TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_repost_id UUID;
BEGIN
  -- Insert repost (UNIQUE constraint handles duplicates)
  INSERT INTO post_reposts (post_id, user_id, repost_comment)
  VALUES (p_post_id, auth.uid(), p_comment)
  ON CONFLICT (post_id, user_id) DO NOTHING
  RETURNING id INTO v_repost_id;

  -- Send notification to original author (TODO: implement notification)

  RETURN v_repost_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. UNREPOST FUNCTION
CREATE OR REPLACE FUNCTION unrepost_post(p_post_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM post_reposts
  WHERE post_id = p_post_id AND user_id = auth.uid();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. CHECK IF USER HAS REPOSTED
CREATE OR REPLACE FUNCTION check_user_reposted(p_post_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM post_reposts
    WHERE post_id = p_post_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION repost_post TO authenticated;
GRANT EXECUTE ON FUNCTION unrepost_post TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_reposted TO authenticated;

-- ================================================
-- END MIGRATION
-- ================================================
