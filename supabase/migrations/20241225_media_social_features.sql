-- Media Social Features: Comments and Likes on Individual Images
-- Created: 2025-12-25
-- Purpose: Enable commenting and liking on individual media items globally

-- =====================================================
-- MEDIA COMMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS media_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to media item
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,

  -- Comment author
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Comment content
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_media_comments_media_id ON media_comments(media_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_media_comments_user_id ON media_comments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_media_comments_created_at ON media_comments(created_at DESC) WHERE deleted_at IS NULL;

-- =====================================================
-- MEDIA LIKES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS media_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to media item
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,

  -- User who liked
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: One like per user per media
  CONSTRAINT media_likes_unique UNIQUE (media_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_media_likes_media_id ON media_likes(media_id);
CREATE INDEX IF NOT EXISTS idx_media_likes_user_id ON media_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_media_likes_created_at ON media_likes(created_at DESC);

-- =====================================================
-- RLS POLICIES - MEDIA COMMENTS
-- =====================================================

ALTER TABLE media_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read non-deleted comments
CREATE POLICY "Anyone can read media comments"
  ON media_comments FOR SELECT
  USING (deleted_at IS NULL);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create media comments"
  ON media_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND deleted_at IS NULL);

-- Users can update their own comments
CREATE POLICY "Users can update own media comments"
  ON media_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments (soft delete)
CREATE POLICY "Users can delete own media comments"
  ON media_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can delete any comment
CREATE POLICY "Admins can delete any media comment"
  ON media_comments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- RLS POLICIES - MEDIA LIKES
-- =====================================================

ALTER TABLE media_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can read likes
CREATE POLICY "Anyone can read media likes"
  ON media_likes FOR SELECT
  USING (true);

-- Authenticated users can create likes
CREATE POLICY "Authenticated users can create media likes"
  ON media_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete own media likes"
  ON media_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp on media_comments
CREATE OR REPLACE FUNCTION update_media_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER media_comments_updated_at
  BEFORE UPDATE ON media_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_media_comments_updated_at();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get comment count for media item
CREATE OR REPLACE FUNCTION get_media_comment_count(p_media_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM media_comments
  WHERE media_id = p_media_id AND deleted_at IS NULL;
$$ LANGUAGE SQL STABLE;

-- Get like count for media item
CREATE OR REPLACE FUNCTION get_media_like_count(p_media_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM media_likes
  WHERE media_id = p_media_id;
$$ LANGUAGE SQL STABLE;

-- Check if user has liked media
CREATE OR REPLACE FUNCTION has_user_liked_media(p_media_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM media_likes
    WHERE media_id = p_media_id AND user_id = p_user_id
  );
$$ LANGUAGE SQL STABLE;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE media_comments IS 'Comments on individual media items (images)';
COMMENT ON TABLE media_likes IS 'Likes on individual media items (images)';
COMMENT ON FUNCTION get_media_comment_count(UUID) IS 'Get total non-deleted comments for a media item';
COMMENT ON FUNCTION get_media_like_count(UUID) IS 'Get total likes for a media item';
COMMENT ON FUNCTION has_user_liked_media(UUID, UUID) IS 'Check if user has liked a specific media item';
