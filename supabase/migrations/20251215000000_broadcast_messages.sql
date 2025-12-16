-- Broadcast Messages System
-- Allows owner to send informational messages to all users

-- Table: broadcast_messages
-- Stores broadcast messages created by the owner
CREATE TABLE IF NOT EXISTS broadcast_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) <= 100),
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0
);

-- Index for efficient queries
CREATE INDEX idx_broadcast_messages_active ON broadcast_messages(is_active, priority DESC, created_at DESC);
CREATE INDEX idx_broadcast_messages_created_by ON broadcast_messages(created_by);

-- Table: user_broadcast_dismissals
-- Tracks which users have dismissed which broadcast messages
CREATE TABLE IF NOT EXISTS user_broadcast_dismissals (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  broadcast_id UUID NOT NULL REFERENCES broadcast_messages(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, broadcast_id)
);

-- Index for efficient queries
CREATE INDEX idx_user_broadcast_dismissals_user ON user_broadcast_dismissals(user_id);
CREATE INDEX idx_user_broadcast_dismissals_broadcast ON user_broadcast_dismissals(broadcast_id);

-- Enable Row Level Security
ALTER TABLE broadcast_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_broadcast_dismissals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for broadcast_messages

-- Everyone can read active broadcast messages
CREATE POLICY "Anyone can view active broadcasts"
  ON broadcast_messages
  FOR SELECT
  USING (is_active = true);

-- Only admin can insert broadcast messages
CREATE POLICY "Only admin can create broadcasts"
  ON broadcast_messages
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admin can update broadcast messages
CREATE POLICY "Only admin can update broadcasts"
  ON broadcast_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admin can delete broadcast messages
CREATE POLICY "Only admin can delete broadcasts"
  ON broadcast_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can view all broadcasts (including inactive ones)
CREATE POLICY "Admin can view all broadcasts"
  ON broadcast_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for user_broadcast_dismissals

-- Users can view their own dismissals
CREATE POLICY "Users can view own dismissals"
  ON user_broadcast_dismissals
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own dismissals
CREATE POLICY "Users can dismiss broadcasts"
  ON user_broadcast_dismissals
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Helper Function: Get unread broadcasts for a user
-- Returns all active broadcasts that the user has not dismissed
CREATE OR REPLACE FUNCTION get_unread_broadcasts(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  created_at TIMESTAMPTZ,
  created_by UUID,
  is_active BOOLEAN,
  priority INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bm.id,
    bm.title,
    bm.content,
    bm.created_at,
    bm.created_by,
    bm.is_active,
    bm.priority
  FROM broadcast_messages bm
  WHERE bm.is_active = true
    AND NOT EXISTS (
      SELECT 1
      FROM user_broadcast_dismissals ubd
      WHERE ubd.broadcast_id = bm.id
        AND ubd.user_id = p_user_id
    )
  ORDER BY bm.priority DESC, bm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper Function: Get count of unread broadcasts for a user
CREATE OR REPLACE FUNCTION get_unread_broadcasts_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM broadcast_messages bm
  WHERE bm.is_active = true
    AND NOT EXISTS (
      SELECT 1
      FROM user_broadcast_dismissals ubd
      WHERE ubd.broadcast_id = bm.id
        AND ubd.user_id = p_user_id
    );

  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION get_unread_broadcasts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_broadcasts_count(UUID) TO authenticated;
