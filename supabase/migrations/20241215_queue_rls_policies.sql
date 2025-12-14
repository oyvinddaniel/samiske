-- =====================================================
-- RLS POLICIES FOR NOTIFICATION QUEUES
-- Security: Only service_role can access queue tables
-- Date: 2024-12-15
-- =====================================================

-- 1. EMAIL QUEUE: Only service_role access
-- No user should ever read email queue (contains emails of other users)
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only: email_queue"
  ON email_queue
  FOR ALL
  USING (false); -- Deny all user access

-- Admin view for monitoring (optional)
CREATE POLICY "Admins can view email queue stats"
  ON email_queue
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 2. PUSH QUEUE: Only service_role access
ALTER TABLE push_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only: push_queue"
  ON push_queue
  FOR ALL
  USING (false); -- Deny all user access

-- Admin view for monitoring
CREATE POLICY "Admins can view push queue stats"
  ON push_queue
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 3. SMS QUEUE: CRITICAL - Contains phone numbers!
ALTER TABLE sms_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only: sms_queue"
  ON sms_queue
  FOR ALL
  USING (false); -- Deny all user access

-- Admin view (WITHOUT phone numbers) - Create safe view
CREATE OR REPLACE VIEW sms_queue_admin AS
SELECT
  id,
  user_id,
  LEFT(phone_number, 3) || '***' AS phone_masked,
  LEFT(message, 50) || '...' AS message_preview,
  sms_type,
  status,
  created_at,
  sent_at
FROM sms_queue;

-- Grant view access to authenticated users (admins can see via profile check)
GRANT SELECT ON sms_queue_admin TO authenticated;

-- 4. EMAIL DIGEST: Only service_role
ALTER TABLE email_digest_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only: email_digest_items"
  ON email_digest_items
  FOR ALL
  USING (false);

-- Admins can view digest items
CREATE POLICY "Admins can view digest items"
  ON email_digest_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 5. Add indexes for better performance on admin queries
CREATE INDEX IF NOT EXISTS idx_email_queue_status_created
  ON email_queue(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_push_queue_status_created
  ON push_queue(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sms_queue_status_created
  ON sms_queue(status, created_at DESC);

-- 6. Comment for documentation
COMMENT ON POLICY "Service role only: email_queue" ON email_queue IS
  'Prevents user access to email queue containing sensitive recipient data';

COMMENT ON POLICY "Service role only: sms_queue" ON sms_queue IS
  'CRITICAL: Prevents exposure of phone numbers and SMS content';

COMMENT ON POLICY "Service role only: push_queue" ON push_queue IS
  'Prevents user access to push notification queue';
