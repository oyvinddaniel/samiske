-- =====================================================
-- PUSH NOTIFICATIONS FOR MENTIONS
-- Legger til push-varsler når noen nevnes
-- Dato: 2024-12-18
-- =====================================================

-- 1. OPPDATER TRIGGER FUNKSJON FOR Å STØTTE MENTION-VARSLER
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_push_on_notification_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_push_enabled BOOLEAN;
  v_title TEXT;
  v_body TEXT;
  v_url TEXT;
  v_actor_name TEXT;
  v_post_title TEXT;
BEGIN
  -- Check if user has push enabled in notification preferences
  SELECT push_enabled INTO v_push_enabled
  FROM notification_preferences
  WHERE user_id = NEW.recipient_id;

  -- If push not enabled or no preference, skip
  IF v_push_enabled IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  -- Get actor name
  SELECT full_name INTO v_actor_name
  FROM profiles
  WHERE id = NEW.actor_id;

  -- Get post title if available
  IF NEW.post_id IS NOT NULL THEN
    SELECT title INTO v_post_title
    FROM posts
    WHERE id = NEW.post_id;
    v_url := '/innlegg/' || NEW.post_id::TEXT;
  ELSE
    v_url := '/';
  END IF;

  -- Create appropriate title/body based on notification type
  CASE NEW.type
    WHEN 'mention' THEN
      v_title := 'Du ble nevnt';
      IF NEW.comment_id IS NOT NULL THEN
        v_body := COALESCE(v_actor_name, 'Noen') || ' nevnte deg i en kommentar';
      ELSE
        v_body := COALESCE(v_actor_name, 'Noen') || ' nevnte deg i et innlegg';
      END IF;
    WHEN 'comment_on_my_post' THEN
      v_title := 'Ny kommentar';
      v_body := COALESCE(v_actor_name, 'Noen') || ' kommenterte på innlegget ditt';
    WHEN 'like_on_my_post' THEN
      v_title := 'Ny like';
      v_body := COALESCE(v_actor_name, 'Noen') || ' likte innlegget ditt';
    WHEN 'new_post' THEN
      v_title := 'Nytt innlegg';
      v_body := COALESCE(v_actor_name, 'Noen') || ' publiserte et nytt innlegg';
    WHEN 'friend_request' THEN
      v_title := 'Venneforespørsel';
      v_body := COALESCE(v_actor_name, 'Noen') || ' sendte deg en venneforespørsel';
    WHEN 'friend_accepted' THEN
      v_title := 'Venn akseptert';
      v_body := COALESCE(v_actor_name, 'Noen') || ' aksepterte venneforespørselen din';
    WHEN 'new_message' THEN
      v_title := 'Ny melding';
      v_body := COALESCE(v_actor_name, 'Noen') || ' sendte deg en melding';
      v_url := '/meldinger';
    ELSE
      v_title := 'samiske.no';
      v_body := 'Du har en ny varsling';
  END CASE;

  -- Queue the push notification
  INSERT INTO push_queue (user_id, title, body, url, tag)
  VALUES (NEW.recipient_id, v_title, v_body, v_url, 'notification-' || NEW.type);

  RETURN NEW;
END;
$$;

-- 2. OPPRETT TRIGGER PÅ NOTIFICATIONS-TABELLEN
-- =====================================================
DROP TRIGGER IF EXISTS on_notification_insert_queue_push ON notifications;

CREATE TRIGGER on_notification_insert_queue_push
AFTER INSERT ON notifications
FOR EACH ROW
EXECUTE FUNCTION trigger_push_on_notification_insert();

-- 3. COMMENTS
-- =====================================================
COMMENT ON FUNCTION trigger_push_on_notification_insert IS
  'Trigger som automatisk legger til push-varsler når en notifikasjon opprettes. Sjekker brukerens push-preferanser først.';
