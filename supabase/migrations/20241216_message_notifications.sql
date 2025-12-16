-- =====================================================
-- MESSAGE NOTIFICATIONS
-- Lag notifikasjoner for nye meldinger
-- Dato: 2024-12-16
-- =====================================================

-- 1. Trigger for nye meldinger
-- =====================================================
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_user_id UUID;
BEGIN
  -- Finn mottakeren (den andre deltakeren i samtalen)
  SELECT user_id INTO recipient_user_id
  FROM conversation_participants
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id
  LIMIT 1;

  -- Ikke lag notifikasjon hvis ingen mottaker funnet
  IF recipient_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Opprett notifikasjon
  INSERT INTO notifications (
    recipient_id,
    type,
    actor_id,
    message_id
  ) VALUES (
    recipient_user_id,
    'new_message',
    NEW.sender_id,
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- 2. Oppdater get_notifications RPC for å håndtere meldinger
-- =====================================================
-- Drop existing function first
DROP FUNCTION IF EXISTS get_notifications(uuid, integer, integer, boolean);

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
  message_id UUID,
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
    n.message_id,
    n.is_read,
    n.created_at,
    CASE n.type
      WHEN 'comment_on_my_post' THEN 'kommenterte på innlegget ditt'
      WHEN 'like_on_my_post' THEN 'likte innlegget ditt'
      WHEN 'new_post' THEN 'opprettet et nytt innlegg'
      WHEN 'new_message' THEN 'sendte deg en melding'
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

-- 3. RPC for å markere meldingsnotifikasjoner som lest
-- =====================================================
CREATE OR REPLACE FUNCTION mark_message_notifications_as_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
  sender_user_id UUID;
BEGIN
  -- Finn avsenderen (den andre deltakeren i samtalen)
  SELECT user_id INTO sender_user_id
  FROM conversation_participants
  WHERE conversation_id = p_conversation_id
    AND user_id != p_user_id
  LIMIT 1;

  -- Marker alle uleste meldingsnotifikasjoner fra denne avsenderen som lest
  IF sender_user_id IS NOT NULL THEN
    UPDATE notifications
    SET
      is_read = TRUE,
      read_at = NOW()
    WHERE recipient_id = p_user_id
      AND actor_id = sender_user_id
      AND type = 'new_message'
      AND is_read = FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION mark_message_notifications_as_read TO authenticated;

-- 4. COMMENTS
-- =====================================================
COMMENT ON FUNCTION notify_new_message IS
  'Lager notifikasjon når noen sender deg en melding';

COMMENT ON FUNCTION mark_message_notifications_as_read IS
  'Markerer alle uleste meldingsnotifikasjoner fra en spesifikk samtale som lest';
