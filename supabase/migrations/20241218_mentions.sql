-- =====================================================
-- MENTIONS SYSTEM
-- Støtte for @mentions i innlegg og kommentarer
-- Dato: 2024-12-18
-- =====================================================

-- 1. LEGG TIL 'mention' TIL NOTIFICATION TYPES
-- =====================================================
-- Drop og gjenskape CHECK constraint for å inkludere 'mention'
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'new_post',
    'comment_on_my_post',
    'comment_on_followed',
    'like_on_my_post',
    'friend_request',
    'friend_accepted',
    'new_message',
    'mention'
  ));

-- 2. OPPDATER get_notifications FUNKSJON
-- =====================================================
-- Drop eksisterende funksjon først (return type endres)
DROP FUNCTION IF EXISTS get_notifications(UUID, INTEGER, INTEGER, BOOLEAN);

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
      WHEN 'mention' THEN 'nevnte deg i et innlegg'
      WHEN 'new_message' THEN 'sendte deg en melding'
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

-- 3. FUNKSJON FOR Å OPPRETTE MENTION-VARSLER
-- =====================================================
CREATE OR REPLACE FUNCTION create_mention_notification(
  p_actor_id UUID,
  p_mentioned_user_id UUID,
  p_post_id UUID DEFAULT NULL,
  p_comment_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Ikke varsle hvis man nevner seg selv
  IF p_actor_id = p_mentioned_user_id THEN
    RETURN NULL;
  END IF;

  -- Opprett notifikasjon
  INSERT INTO notifications (
    recipient_id,
    type,
    actor_id,
    post_id,
    comment_id
  ) VALUES (
    p_mentioned_user_id,
    'mention',
    p_actor_id,
    p_post_id,
    p_comment_id
  )
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. GRANT PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION create_mention_notification TO authenticated;

-- 5. COMMENTS
-- =====================================================
COMMENT ON FUNCTION create_mention_notification IS
  'Oppretter en notifikasjon for @mention. Kalles fra klient når bruker nevner andre.';
