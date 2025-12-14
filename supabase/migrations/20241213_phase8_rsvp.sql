-- Phase 8: Arrangementer med RSVP
-- Created: 2025-12-13
-- Description: RSVP functionality for events

-- ============================================
-- TABLE: event_rsvps
-- ============================================

CREATE TABLE IF NOT EXISTS event_rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('interested', 'going')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each user can only have one RSVP per event
  UNIQUE(post_id, user_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_event_rsvps_post_id ON event_rsvps(post_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON event_rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_status ON event_rsvps(status);

-- Enable RLS
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Anyone can view RSVPs (for public events)
CREATE POLICY "Anyone can view rsvps"
  ON event_rsvps FOR SELECT
  USING (true);

-- Authenticated users can create RSVPs
CREATE POLICY "Users can create own rsvps"
  ON event_rsvps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own RSVPs
CREATE POLICY "Users can update own rsvps"
  ON event_rsvps FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own RSVPs
CREATE POLICY "Users can delete own rsvps"
  ON event_rsvps FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_event_rsvp_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_rsvp_timestamp
  BEFORE UPDATE ON event_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION update_event_rsvp_timestamp();

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Set or update RSVP status
CREATE OR REPLACE FUNCTION set_event_rsvp(
  p_post_id UUID,
  p_status TEXT
)
RETURNS event_rsvps
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_result event_rsvps;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate status
  IF p_status NOT IN ('interested', 'going') THEN
    RAISE EXCEPTION 'Invalid status. Must be "interested" or "going"';
  END IF;

  -- Upsert RSVP
  INSERT INTO event_rsvps (post_id, user_id, status)
  VALUES (p_post_id, v_user_id, p_status)
  ON CONFLICT (post_id, user_id)
  DO UPDATE SET status = p_status, updated_at = NOW()
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

-- Remove RSVP
CREATE OR REPLACE FUNCTION remove_event_rsvp(
  p_post_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete RSVP
  DELETE FROM event_rsvps
  WHERE post_id = p_post_id AND user_id = v_user_id;

  RETURN TRUE;
END;
$$;

-- Get user's RSVP status for a post
CREATE OR REPLACE FUNCTION get_user_rsvp_status(
  p_post_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_status TEXT;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get status
  SELECT status INTO v_status
  FROM event_rsvps
  WHERE post_id = p_post_id AND user_id = v_user_id;

  RETURN v_status;
END;
$$;

-- Get RSVP counts for a post
CREATE OR REPLACE FUNCTION get_event_rsvp_counts(
  p_post_id UUID
)
RETURNS TABLE(interested_count BIGINT, going_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'interested') AS interested_count,
    COUNT(*) FILTER (WHERE status = 'going') AS going_count
  FROM event_rsvps
  WHERE post_id = p_post_id;
END;
$$;

-- Get list of users with RSVP for a post
CREATE OR REPLACE FUNCTION get_event_rsvp_users(
  p_post_id UUID,
  p_status TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.user_id,
    p.username,
    p.avatar_url,
    r.status,
    r.created_at
  FROM event_rsvps r
  JOIN profiles p ON p.id = r.user_id
  WHERE r.post_id = p_post_id
    AND (p_status IS NULL OR r.status = p_status)
  ORDER BY
    CASE WHEN r.status = 'going' THEN 0 ELSE 1 END,
    r.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================
-- GRANTS
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON event_rsvps TO authenticated;
GRANT EXECUTE ON FUNCTION set_event_rsvp TO authenticated;
GRANT EXECUTE ON FUNCTION remove_event_rsvp TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_rsvp_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_rsvp_counts TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_event_rsvp_users TO authenticated, anon;
