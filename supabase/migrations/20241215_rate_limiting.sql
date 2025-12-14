-- =====================================================
-- RATE LIMITING FOR NOTIFICATION TRIGGERS
-- Prevent spam and abuse
-- Date: 2024-12-15
-- =====================================================

-- 1. Rate limiting table
CREATE TABLE IF NOT EXISTS notification_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('post', 'comment', 'email', 'sms', 'push')),
  action_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, action_type, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action
  ON notification_rate_limits(user_id, action_type);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window
  ON notification_rate_limits(window_start);

COMMENT ON TABLE notification_rate_limits IS
  'Tracks user actions per hour to prevent spam and abuse';

-- 2. Rate limit check function
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_action_type TEXT,
  p_max_per_hour INTEGER DEFAULT 100
) RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_current_hour TIMESTAMPTZ;
BEGIN
  v_current_hour := date_trunc('hour', NOW());

  -- Get count for current hour
  SELECT COALESCE(action_count, 0) INTO v_count
  FROM notification_rate_limits
  WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND window_start = v_current_hour;

  IF v_count >= p_max_per_hour THEN
    RAISE WARNING 'Rate limit exceeded for user % action % (% >= %)',
      p_user_id, p_action_type, v_count, p_max_per_hour;
    RETURN FALSE; -- Rate limit exceeded
  END IF;

  -- Increment counter
  INSERT INTO notification_rate_limits (user_id, action_type, action_count, window_start)
  VALUES (p_user_id, p_action_type, 1, v_current_hour)
  ON CONFLICT (user_id, action_type, window_start)
  DO UPDATE SET action_count = notification_rate_limits.action_count + 1;

  RETURN TRUE; -- Within rate limit
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_rate_limit IS
  'Checks if user is within rate limit for given action type. Returns false if limit exceeded.';

-- 3. Update post notification trigger with rate limiting
CREATE OR REPLACE FUNCTION queue_new_post_notifications()
RETURNS TRIGGER AS $$
DECLARE
  recipient RECORD;
  post_author_name TEXT;
  post_url TEXT;
  v_can_send BOOLEAN;
  v_notification_count INTEGER := 0;
BEGIN
  -- Rate limit: Max 50 posts per hour per user
  v_can_send := check_rate_limit(NEW.user_id, 'post', 50);

  IF NOT v_can_send THEN
    RAISE WARNING 'Rate limit exceeded for user % posting', NEW.user_id;
    RETURN NEW; -- Skip notifications but allow post
  END IF;

  -- Get author name
  SELECT full_name INTO post_author_name FROM profiles WHERE id = NEW.user_id;

  -- URL to post
  post_url := 'https://samiske.no/#post-' || NEW.id;

  -- For each user with email notifications enabled
  FOR recipient IN
    SELECT
      p.id as user_id,
      p.email,
      p.full_name,
      np.email_new_posts
    FROM profiles p
    JOIN notification_preferences np ON np.user_id = p.id
    WHERE np.email_new_posts != 'none'
      AND p.id != NEW.user_id
      AND p.email IS NOT NULL
    LIMIT 100 -- Safety limit to prevent massive loops
  LOOP
    IF recipient.email_new_posts = 'instant' THEN
      -- Check email rate limit (max 200 emails per hour per recipient)
      IF check_rate_limit(recipient.user_id, 'email', 200) THEN
        BEGIN
          INSERT INTO email_queue (
            recipient_email,
            recipient_name,
            recipient_id,
            subject,
            body_html,
            body_text,
            email_type,
            reference_id
          ) VALUES (
            recipient.email,
            recipient.full_name,
            recipient.user_id,
            'Nytt innlegg på samiske.no: ' || NEW.title,
            '<h2>Nytt innlegg på samiske.no</h2>' ||
            '<p><strong>' || COALESCE(post_author_name, 'Noen') || '</strong> har publisert et nytt innlegg:</p>' ||
            '<h3>' || NEW.title || '</h3>' ||
            '<p>' || LEFT(NEW.content, 200) || CASE WHEN LENGTH(NEW.content) > 200 THEN '...' ELSE '' END || '</p>' ||
            '<p><a href="' || post_url || '">Les hele innlegget</a></p>' ||
            '<hr><p style="font-size:12px;color:#666;">Du mottar denne e-posten fordi du har aktivert varsler på samiske.no. ' ||
            '<a href="https://samiske.no/innstillinger">Endre innstillinger</a></p>',
            'Nytt innlegg på samiske.no: ' || NEW.title || E'\n\n' ||
            COALESCE(post_author_name, 'Noen') || ' har publisert et nytt innlegg:' || E'\n\n' ||
            NEW.title || E'\n\n' ||
            LEFT(NEW.content, 200) || E'\n\n' ||
            'Les mer: ' || post_url,
            'new_post',
            NEW.id
          ) ON CONFLICT (recipient_id, email_type, reference_id) DO NOTHING;

          v_notification_count := v_notification_count + 1;
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Failed to queue email for user %: %', recipient.user_id, SQLERRM;
        END;
      END IF;
    ELSE
      -- Digest: No rate limiting needed (controlled by cron)
      BEGIN
        INSERT INTO email_digest_items (
          user_id,
          item_type,
          post_id
        ) VALUES (
          recipient.user_id,
          'new_post',
          NEW.id
        ) ON CONFLICT DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to add digest item for user %: %', recipient.user_id, SQLERRM;
      END;
    END IF;
  END LOOP;

  RAISE NOTICE 'Queued % notifications for post %', v_notification_count, NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_new_post_notify ON posts;
CREATE TRIGGER on_new_post_notify
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION queue_new_post_notifications();

-- 4. Cleanup old rate limit records
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notification_rate_limits
  WHERE window_start < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RAISE NOTICE 'Cleaned up % old rate limit records', deleted_count;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Schedule cleanup cron job
SELECT cron.schedule(
  'cleanup-rate-limits',
  '0 * * * *', -- Every hour at minute 0
  $$ SELECT cleanup_rate_limits(); $$
);

-- 6. RLS for rate limits table
ALTER TABLE notification_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits"
  ON notification_rate_limits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all rate limits"
  ON notification_rate_limits
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Service role can manage all
CREATE POLICY "Service role can manage rate limits"
  ON notification_rate_limits
  FOR ALL
  USING (auth.role() = 'service_role');

-- 7. Create monitoring view for admins
CREATE OR REPLACE VIEW rate_limit_stats AS
SELECT
  action_type,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(action_count) as total_actions,
  AVG(action_count) as avg_actions_per_user,
  MAX(action_count) as max_actions_by_single_user,
  window_start
FROM notification_rate_limits
WHERE window_start > NOW() - INTERVAL '24 hours'
GROUP BY action_type, window_start
ORDER BY window_start DESC, action_type;

GRANT SELECT ON rate_limit_stats TO authenticated;

COMMENT ON VIEW rate_limit_stats IS
  'Shows rate limiting statistics for the last 24 hours';

-- 8. Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_rate_limits TO authenticated;

-- Verification
DO $$
DECLARE
  test_result BOOLEAN;
BEGIN
  -- Test rate limit function
  test_result := check_rate_limit(
    '00000000-0000-0000-0000-000000000000'::UUID,
    'post',
    5
  );

  IF test_result THEN
    RAISE NOTICE 'Rate limiting system initialized successfully';
  ELSE
    RAISE WARNING 'Rate limiting test failed';
  END IF;
END $$;
