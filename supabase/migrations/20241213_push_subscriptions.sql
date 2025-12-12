-- Push notification subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- RLS policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Function to send push notification (called by triggers or manually)
CREATE OR REPLACE FUNCTION queue_push_notification(
  p_user_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_url TEXT DEFAULT '/',
  p_tag TEXT DEFAULT 'samiske-notification'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert into a push_queue table (will be processed by Edge Function)
  INSERT INTO push_queue (user_id, title, body, url, tag)
  VALUES (p_user_id, p_title, p_body, p_url, p_tag);
END;
$$;

-- Push notification queue
CREATE TABLE IF NOT EXISTS push_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT DEFAULT '/',
  tag TEXT DEFAULT 'samiske-notification',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_push_queue_status ON push_queue(status);
CREATE INDEX IF NOT EXISTS idx_push_queue_user_id ON push_queue(user_id);

-- Trigger to queue push notifications when email notifications are created
-- (for users who have push_enabled = true)
CREATE OR REPLACE FUNCTION trigger_push_on_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_push_enabled BOOLEAN;
  v_title TEXT;
  v_body TEXT;
BEGIN
  -- Check if user has push enabled
  SELECT push_enabled INTO v_push_enabled
  FROM notification_preferences
  WHERE user_id = NEW.recipient_id;

  IF v_push_enabled = true THEN
    -- Create appropriate title/body based on notification type
    CASE NEW.email_type
      WHEN 'new_comment' THEN
        v_title := 'Ny kommentar';
        v_body := NEW.subject;
      WHEN 'new_like' THEN
        v_title := 'Ny like';
        v_body := NEW.subject;
      WHEN 'new_post' THEN
        v_title := 'Nytt innlegg';
        v_body := NEW.subject;
      ELSE
        v_title := 'samiske.no';
        v_body := NEW.subject;
    END CASE;

    INSERT INTO push_queue (user_id, title, body, url)
    VALUES (NEW.recipient_id, v_title, v_body, '/');
  END IF;

  RETURN NEW;
END;
$$;

-- Note: Don't create the trigger yet - it should be on email_queue if that exists
-- CREATE TRIGGER on_email_notification_queue_push
-- AFTER INSERT ON email_queue
-- FOR EACH ROW
-- EXECUTE FUNCTION trigger_push_on_notification();
