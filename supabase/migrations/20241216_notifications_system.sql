-- =====================================================
-- DEDIKERT NOTIFICATIONS SYSTEM
-- Persistent notification storage med individuell markering
-- Dato: 2024-12-16
-- =====================================================

-- 1. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Mottaker
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Type notifikasjon
  type TEXT NOT NULL CHECK (type IN (
    'new_post',
    'comment_on_my_post',
    'comment_on_followed',
    'like_on_my_post',
    'friend_request',
    'friend_accepted',
    'new_message'
  )),

  -- Aktør (hvem gjorde handlingen)
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Relatert innhold
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  like_id UUID REFERENCES likes(id) ON DELETE CASCADE,
  friendship_id UUID REFERENCES friendships(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,

  -- Status
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  read_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CHECK (actor_id != recipient_id), -- Kan ikke varsle seg selv
  CHECK (is_read = FALSE OR read_at IS NOT NULL) -- Hvis read, må ha read_at
);

-- 2. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_notifications_recipient_read
  ON notifications(recipient_id, is_read, created_at DESC);

CREATE INDEX idx_notifications_recipient_created
  ON notifications(recipient_id, created_at DESC);

CREATE INDEX idx_notifications_type
  ON notifications(type);

CREATE INDEX idx_notifications_post
  ON notifications(post_id) WHERE post_id IS NOT NULL;

CREATE INDEX idx_notifications_actor
  ON notifications(actor_id) WHERE actor_id IS NOT NULL;

-- 3. ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Brukere kan kun se sine egne notifikasjoner
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = recipient_id);

-- System kan opprette notifikasjoner (via triggers)
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Brukere kan oppdatere sine egne notifikasjoner (markere som lest)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = recipient_id);

-- Brukere kan slette sine egne notifikasjoner (hvis ønsket)
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid() = recipient_id);

-- 4. TRIGGERS FOR AUTOMATISK POPULERING
-- =====================================================

-- 4.1 Ny kommentar -> notifiser post-eier
CREATE OR REPLACE FUNCTION notify_comment_on_post()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  -- Finn post-eier
  SELECT user_id INTO post_owner_id
  FROM posts
  WHERE id = NEW.post_id;

  -- Ikke varsle hvis man kommenterer på egen post
  IF post_owner_id IS NULL OR post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Opprett notifikasjon
  INSERT INTO notifications (
    recipient_id,
    type,
    actor_id,
    post_id,
    comment_id
  ) VALUES (
    post_owner_id,
    'comment_on_my_post',
    NEW.user_id,
    NEW.post_id,
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_comment
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_on_post();

-- 4.2 Ny like -> notifiser post-eier
CREATE OR REPLACE FUNCTION notify_like_on_post()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  -- Finn post-eier
  SELECT user_id INTO post_owner_id
  FROM posts
  WHERE id = NEW.post_id;

  -- Ikke varsle hvis man liker egen post
  IF post_owner_id IS NULL OR post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Opprett notifikasjon
  INSERT INTO notifications (
    recipient_id,
    type,
    actor_id,
    post_id,
    like_id
  ) VALUES (
    post_owner_id,
    'like_on_my_post',
    NEW.user_id,
    NEW.post_id,
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_like
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_like_on_post();

-- 5. RPC FUNCTIONS
-- =====================================================

-- 5.1 Hent notifikasjoner med detaljer
CREATE OR REPLACE FUNCTION get_notifications(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_unread_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  actor_id UUID,
  actor_name TEXT,
  actor_avatar TEXT,
  post_id UUID,
  post_title TEXT,
  comment_id UUID,
  like_id UUID,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ,
  message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.type,
    n.actor_id,
    p.full_name AS actor_name,
    p.avatar_url AS actor_avatar,
    n.post_id,
    po.title AS post_title,
    n.comment_id,
    n.like_id,
    n.is_read,
    n.created_at,
    CASE n.type
      WHEN 'comment_on_my_post' THEN 'kommenterte på innlegget ditt'
      WHEN 'like_on_my_post' THEN 'likte innlegget ditt'
      WHEN 'new_post' THEN 'opprettet et nytt innlegg'
      WHEN 'friend_request' THEN 'sendte deg en venneforespørsel'
      WHEN 'friend_accepted' THEN 'aksepterte venneforespørselen din'
      ELSE 'ukjent handling'
    END AS message
  FROM notifications n
  LEFT JOIN profiles p ON p.id = n.actor_id
  LEFT JOIN posts po ON po.id = n.post_id
  WHERE n.recipient_id = p_user_id
    AND (NOT p_unread_only OR n.is_read = FALSE)
  ORDER BY n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5.2 Telle uleste notifikasjoner
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE recipient_id = p_user_id
    AND is_read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5.3 Markere enkelt notifikasjon som lest
CREATE OR REPLACE FUNCTION mark_notification_as_read(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET
    is_read = TRUE,
    read_at = NOW()
  WHERE id = p_notification_id
    AND recipient_id = auth.uid()
    AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.4 Markere alle notifikasjoner som lest
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE notifications
  SET
    is_read = TRUE,
    read_at = NOW()
  WHERE recipient_id = p_user_id
    AND is_read = FALSE;

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. REALTIME SETUP
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 7. GRANT PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION get_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_as_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_as_read TO authenticated;

-- 8. COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE notifications IS
  'Persistent notification storage. Hver rad er en individuell notifikasjon som kan markeres som lest.';

COMMENT ON FUNCTION get_notifications IS
  'Henter notifikasjoner med full metadata. Støtter paginering og filtrering på uleste.';

COMMENT ON FUNCTION mark_notification_as_read IS
  'Markerer en enkelt notifikasjon som lest. Kalles når bruker klikker på notifikasjon.';

COMMENT ON FUNCTION mark_all_notifications_as_read IS
  'Markerer alle uleste notifikasjoner som lest. Brukes av "Merk alle som lest"-knappen.';
