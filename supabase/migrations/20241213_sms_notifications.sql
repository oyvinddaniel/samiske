-- Add phone number to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_number TEXT;
  END IF;
END $$;

-- SMS queue table
CREATE TABLE IF NOT EXISTS sms_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  sms_type TEXT DEFAULT 'notification',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  error_message TEXT,
  twilio_sid TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sms_queue_status ON sms_queue(status);
CREATE INDEX IF NOT EXISTS idx_sms_queue_user_id ON sms_queue(user_id);

-- Function to queue SMS notification
CREATE OR REPLACE FUNCTION queue_sms_notification(
  p_user_id UUID,
  p_message TEXT,
  p_sms_type TEXT DEFAULT 'notification'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_phone TEXT;
  v_sms_enabled BOOLEAN;
BEGIN
  -- Get user's phone and SMS preference
  SELECT p.phone_number, np.sms_enabled
  INTO v_phone, v_sms_enabled
  FROM profiles p
  LEFT JOIN notification_preferences np ON np.user_id = p.id
  WHERE p.id = p_user_id;

  -- Only queue if SMS is enabled and phone exists
  IF v_sms_enabled = true AND v_phone IS NOT NULL AND v_phone != '' THEN
    INSERT INTO sms_queue (user_id, phone_number, message, sms_type)
    VALUES (p_user_id, v_phone, p_message, p_sms_type);
  END IF;
END;
$$;

-- Trigger function to auto-queue SMS for important notifications
CREATE OR REPLACE FUNCTION trigger_sms_on_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sms_new_posts BOOLEAN;
  v_sms_comments BOOLEAN;
  v_message TEXT;
BEGIN
  -- Get user's SMS preferences
  SELECT sms_new_posts, sms_comments
  INTO v_sms_new_posts, v_sms_comments
  FROM notification_preferences
  WHERE user_id = NEW.recipient_id;

  -- Check notification type and preferences
  IF NEW.email_type = 'new_post' AND v_sms_new_posts = true THEN
    v_message := 'Nytt innlegg på samiske.no: ' || LEFT(NEW.subject, 100);
    PERFORM queue_sms_notification(NEW.recipient_id, v_message, 'new_post');
  ELSIF NEW.email_type = 'new_comment' AND v_sms_comments = true THEN
    v_message := 'Ny kommentar på samiske.no: ' || LEFT(NEW.subject, 100);
    PERFORM queue_sms_notification(NEW.recipient_id, v_message, 'new_comment');
  END IF;

  RETURN NEW;
END;
$$;

-- Note: Create trigger on email_queue if needed:
-- CREATE TRIGGER on_email_notification_queue_sms
-- AFTER INSERT ON email_queue
-- FOR EACH ROW
-- EXECUTE FUNCTION trigger_sms_on_notification();
