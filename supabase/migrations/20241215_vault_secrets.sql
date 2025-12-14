-- =====================================================
-- VAULT SETUP FOR SECURE SECRETS STORAGE
-- Pattern from 20241213_push_cron_jobs.sql (CORRECT PATTERN)
-- Date: 2024-12-15
-- =====================================================

-- IMPORTANT: Before running this migration, manually create secrets in Supabase SQL Editor:
--
-- SELECT vault.create_secret('https://uifgiyjalowwwjvrbpxi.supabase.co', 'project_url');
-- SELECT vault.create_secret('your-actual-service-role-key-here', 'service_role_key');
--
-- Verify secrets exist:
-- SELECT name FROM vault.decrypted_secrets;

-- Drop old email cron jobs with hardcoded keys
SELECT cron.unschedule('send-pending-emails');
SELECT cron.unschedule('daily-digest');
SELECT cron.unschedule('weekly-digest');
SELECT cron.unschedule('cleanup-emails');

-- Recreate email cron jobs with Vault pattern
SELECT cron.schedule(
  'send-pending-emails',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/send-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{"max_emails": 20}'::jsonb
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'daily-digest',
  '0 7 * * *', -- Daily at 07:00 UTC (08:00 CET)
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/send-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{"generate_digest": true, "digest_type": "daily"}'::jsonb
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'weekly-digest',
  '0 7 * * 1', -- Mondays at 07:00 UTC (08:00 CET)
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/send-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{"generate_digest": true, "digest_type": "weekly"}'::jsonb
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'cleanup-emails',
  '0 3 * * *', -- Daily at 03:00 UTC
  $$
  DELETE FROM email_queue
  WHERE (status = 'sent' AND sent_at < NOW() - INTERVAL '30 days')
     OR (status = 'failed' AND created_at < NOW() - INTERVAL '7 days');
  $$
);

-- Add SMS cron job (if Twilio configured)
SELECT cron.schedule(
  'send-pending-sms',
  '*/2 * * * *', -- Every 2 minutes
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/send-sms',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{"max_sms": 10}'::jsonb
  ) AS request_id;
  $$
);

-- Cleanup SMS queue
SELECT cron.schedule(
  'cleanup-sms',
  '0 3 * * *', -- Daily at 03:00 UTC
  $$
  DELETE FROM sms_queue
  WHERE (status = 'sent' AND sent_at < NOW() - INTERVAL '7 days')
     OR (status = 'failed' AND created_at < NOW() - INTERVAL '3 days');
  $$
);

-- Verify all cron jobs are active
DO $$
DECLARE
  job_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO job_count
  FROM cron.job
  WHERE jobname IN ('send-pending-emails', 'daily-digest', 'weekly-digest',
                    'cleanup-emails', 'send-pending-sms', 'cleanup-sms')
    AND active = true;

  RAISE NOTICE 'Active cron jobs using Vault: %', job_count;

  IF job_count < 6 THEN
    RAISE WARNING 'Expected 6 cron jobs, found %', job_count;
  END IF;
END $$;
