-- E-post cron-jobber for samiske.no
-- Kjør denne ETTER at du har satt inn din SERVICE_ROLE_KEY

-- Aktiver nødvendige extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================
-- VIKTIG: Bytt ut eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZmdpeWphbG93d3dqdnJicHhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4MDc3NSwiZXhwIjoyMDgxMDU2Nzc1fQ.tCSKljs3cciH1D5SCZDGt9KUjKocVJmXPG5RAT3LAyY med din faktiske service role key
-- Finn den i Supabase Dashboard → Project Settings → API → service_role (secret)
-- ============================================

-- Send ventende e-poster hvert 5. minutt
SELECT cron.schedule(
  'send-pending-emails',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://uifgiyjalowwwjvrbpxi.supabase.co/functions/v1/send-emails',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZmdpeWphbG93d3dqdnJicHhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4MDc3NSwiZXhwIjoyMDgxMDU2Nzc1fQ.tCSKljs3cciH1D5SCZDGt9KUjKocVJmXPG5RAT3LAyY", "Content-Type": "application/json"}'::jsonb,
    body := '{"max_emails": 20}'::jsonb
  );
  $$
);

-- Generer daglig digest kl. 08:00 norsk tid (07:00 UTC)
SELECT cron.schedule(
  'daily-digest',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://uifgiyjalowwwjvrbpxi.supabase.co/functions/v1/send-emails',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZmdpeWphbG93d3dqdnJicHhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4MDc3NSwiZXhwIjoyMDgxMDU2Nzc1fQ.tCSKljs3cciH1D5SCZDGt9KUjKocVJmXPG5RAT3LAyY", "Content-Type": "application/json"}'::jsonb,
    body := '{"generate_digest": true, "email_type": "daily_digest"}'::jsonb
  );
  $$
);

-- Generer ukentlig digest hver mandag kl. 08:00 norsk tid
SELECT cron.schedule(
  'weekly-digest',
  '0 7 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://uifgiyjalowwwjvrbpxi.supabase.co/functions/v1/send-emails',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZmdpeWphbG93d3dqdnJicHhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ4MDc3NSwiZXhwIjoyMDgxMDU2Nzc1fQ.tCSKljs3cciH1D5SCZDGt9KUjKocVJmXPG5RAT3LAyY", "Content-Type": "application/json"}'::jsonb,
    body := '{"generate_digest": true, "email_type": "weekly_digest"}'::jsonb
  );
  $$
);

-- Rydd opp gamle sendte e-poster hver natt kl. 03:00 (02:00 UTC)
SELECT cron.schedule(
  'cleanup-emails',
  '0 2 * * *',
  $$
  SELECT cleanup_old_emails();
  $$
);

-- ============================================
-- Nyttige kommandoer:
-- ============================================

-- Se alle aktive cron-jobber:
-- SELECT * FROM cron.job;

-- Se kjøringshistorikk:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Stopp en spesifikk jobb:
-- SELECT cron.unschedule('send-pending-emails');

-- Stopp alle e-post-jobber:
-- SELECT cron.unschedule('send-pending-emails');
-- SELECT cron.unschedule('daily-digest');
-- SELECT cron.unschedule('weekly-digest');
-- SELECT cron.unschedule('cleanup-emails');
