-- Push-varsler cron-jobber for samiske.no
-- Følger Supabase best practices: https://supabase.com/docs/guides/functions/schedule-functions

-- Aktiver nødvendige extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================
-- STEG 1: Lagre credentials sikkert i Vault
-- ============================================
-- Kjør disse EN GANG for å lagre project URL og service role key:

-- SELECT vault.create_secret(
--   'https://uifgiyjalowwwjvrbpxi.supabase.co',
--   'project_url'
-- );

-- SELECT vault.create_secret(
--   'din-service-role-key-her',
--   'service_role_key'
-- );

-- ============================================
-- STEG 2: Opprett cron-jobb som bruker Vault
-- ============================================

-- Send ventende push-varsler hvert 2. minutt
SELECT cron.schedule(
  'send-pending-push',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{"max_notifications": 20}'::jsonb
  ) AS request_id;
  $$
);

-- Rydd opp gamle push-varsler hver natt kl. 03:00 (02:00 UTC)
SELECT cron.schedule(
  'cleanup-push',
  '0 2 * * *',
  $$
  SELECT cleanup_old_push_queue();
  $$
);

-- ============================================
-- Nyttige kommandoer:
-- ============================================

-- Se alle aktive cron-jobber:
-- SELECT * FROM cron.job WHERE jobname LIKE '%push%';

-- Se kjøringshistorikk for push-jobber:
-- SELECT * FROM cron.job_run_details WHERE jobname = 'send-pending-push' ORDER BY start_time DESC LIMIT 20;

-- Manuelt kjøre push-sending (for testing):
-- SELECT net.http_post(
--   url := 'https://uifgiyjalowwwjvrbpxi.supabase.co/functions/v1/send-push',
--   headers := '{"Authorization": "Bearer [SERVICE_ROLE_KEY]", "Content-Type": "application/json"}'::jsonb,
--   body := '{"max_notifications": 20}'::jsonb
-- );

-- Stopp push-jobber (hvis nødvendig):
-- SELECT cron.unschedule('send-pending-push');
-- SELECT cron.unschedule('cleanup-push');
