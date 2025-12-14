-- =====================================================
-- PUSH-VARSLER: Koble til eksisterende e-postvarsler
-- =====================================================

-- Trigger som legger til push-varsler når e-post legges i kø
-- (for brukere som har push_enabled = true)
CREATE OR REPLACE FUNCTION trigger_push_on_email_queue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_push_enabled BOOLEAN;
  v_title TEXT;
  v_body TEXT;
  v_url TEXT;
  v_tag TEXT;
BEGIN
  -- Sjekk om brukeren har push aktivert
  SELECT push_enabled INTO v_push_enabled
  FROM notification_preferences
  WHERE user_id = NEW.recipient_id;

  -- Hopp over hvis push ikke er aktivert eller bruker-ID mangler
  IF v_push_enabled IS NOT TRUE OR NEW.recipient_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Sett tittel og body basert på e-posttype
  CASE NEW.email_type
    WHEN 'new_post' THEN
      v_title := 'Nytt innlegg';
      v_body := COALESCE(NEW.subject, 'Noen har publisert et nytt innlegg');
      v_tag := 'new-post-' || COALESCE(NEW.reference_id::text, gen_random_uuid()::text);
    WHEN 'comment' THEN
      v_title := 'Ny kommentar';
      v_body := COALESCE(NEW.subject, 'Noen har kommentert');
      v_tag := 'comment-' || COALESCE(NEW.reference_id::text, gen_random_uuid()::text);
    WHEN 'daily_digest' THEN
      v_title := 'Daglig oppsummering';
      v_body := COALESCE(NEW.subject, 'Din daglige oppsummering er klar');
      v_tag := 'daily-digest';
    WHEN 'weekly_digest' THEN
      v_title := 'Ukentlig oppsummering';
      v_body := COALESCE(NEW.subject, 'Din ukentlige oppsummering er klar');
      v_tag := 'weekly-digest';
    ELSE
      v_title := 'samiske.no';
      v_body := COALESCE(NEW.subject, 'Du har en ny varsling');
      v_tag := 'notification';
  END CASE;

  -- URL til innlegget hvis tilgjengelig
  IF NEW.reference_id IS NOT NULL THEN
    v_url := '/#post-' || NEW.reference_id;
  ELSE
    v_url := '/';
  END IF;

  -- Legg til i push-køen
  INSERT INTO push_queue (user_id, title, body, url, tag)
  VALUES (NEW.recipient_id, v_title, v_body, v_url, v_tag)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Aktiver trigger på email_queue
DROP TRIGGER IF EXISTS on_email_queue_push ON email_queue;
CREATE TRIGGER on_email_queue_push
  AFTER INSERT ON email_queue
  FOR EACH ROW
  EXECUTE FUNCTION trigger_push_on_email_queue();

-- Alternativ: Direkte trigger på posts og comments for raskere push
-- (brukes hvis du vil ha push selv uten e-post)
CREATE OR REPLACE FUNCTION trigger_push_on_new_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recipient RECORD;
  v_author_name TEXT;
BEGIN
  -- Hent forfatterens navn
  SELECT full_name INTO v_author_name FROM profiles WHERE id = NEW.user_id;

  -- For hver bruker med push aktivert
  FOR recipient IN
    SELECT np.user_id
    FROM notification_preferences np
    WHERE np.push_enabled = true
      AND np.user_id != NEW.user_id
  LOOP
    INSERT INTO push_queue (user_id, title, body, url, tag)
    VALUES (
      recipient.user_id,
      'Nytt innlegg',
      COALESCE(v_author_name, 'Noen') || ': ' || LEFT(NEW.title, 50),
      '/#post-' || NEW.id,
      'post-' || NEW.id
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION trigger_push_on_new_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_post_owner_id UUID;
  v_post_title TEXT;
  v_commenter_name TEXT;
  v_push_enabled BOOLEAN;
BEGIN
  -- Hent post-info
  SELECT user_id, title INTO v_post_owner_id, v_post_title
  FROM posts WHERE id = NEW.post_id;

  -- Hent kommentarforfatterens navn
  SELECT full_name INTO v_commenter_name FROM profiles WHERE id = NEW.user_id;

  -- Varsle post-eieren hvis de har push aktivert (og ikke kommenterte selv)
  IF v_post_owner_id != NEW.user_id THEN
    SELECT push_enabled INTO v_push_enabled
    FROM notification_preferences
    WHERE user_id = v_post_owner_id;

    IF v_push_enabled = true THEN
      INSERT INTO push_queue (user_id, title, body, url, tag)
      VALUES (
        v_post_owner_id,
        'Ny kommentar',
        COALESCE(v_commenter_name, 'Noen') || ' kommenterte på "' || LEFT(v_post_title, 30) || '"',
        '/#post-' || NEW.post_id,
        'comment-' || NEW.id
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Aktiver direkte triggers (valgfritt - gir raskere push enn via email_queue)
DROP TRIGGER IF EXISTS on_new_post_push ON posts;
CREATE TRIGGER on_new_post_push
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_push_on_new_post();

DROP TRIGGER IF EXISTS on_new_comment_push ON comments;
CREATE TRIGGER on_new_comment_push
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_push_on_new_comment();

-- Funksjon for å sende test-push (kan kalles fra admin)
CREATE OR REPLACE FUNCTION send_test_push(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO push_queue (user_id, title, body, url, tag)
  VALUES (
    p_user_id,
    'Test fra samiske.no',
    'Push-varsler fungerer!',
    '/',
    'test-' || gen_random_uuid()
  );
END;
$$;

-- RLS for push_queue (kun service_role har tilgang)
ALTER TABLE push_queue ENABLE ROW LEVEL SECURITY;

-- Opprydding: Slett gamle push-meldinger
CREATE OR REPLACE FUNCTION cleanup_old_push_queue()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM push_queue
  WHERE (status = 'sent' AND sent_at < NOW() - INTERVAL '7 days')
     OR (status = 'failed' AND created_at < NOW() - INTERVAL '3 days');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
