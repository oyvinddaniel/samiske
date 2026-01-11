-- Migration: Setup Cron Jobs
-- Dato: 2025-12-19
-- Beskrivelse: Konfigurer automatiske cron jobs for planlagte innlegg og cleanup

-- ============================================
-- 1. Aktiver pg_cron extension
-- ============================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- 2. Cron job: Publiser planlagte innlegg
-- ============================================

-- Kjør hvert minutt for å publisere innlegg som har nådd scheduled_for tidspunkt
SELECT cron.schedule(
  'publish-scheduled-posts',
  '* * * * *', -- Hvert minutt
  $$SELECT publish_scheduled_posts()$$
);

-- ============================================
-- 3. Cron job: Cleanup gamle utkast
-- ============================================

-- Kjør daglig kl 03:00 for å slette utkast eldre enn 30 dager
SELECT cron.schedule(
  'cleanup-expired-drafts',
  '0 3 * * *', -- Kl 03:00 hver dag
  $$SELECT cleanup_expired_drafts()$$
);

-- ============================================
-- 4. Verify jobs er opprettet
-- ============================================

COMMENT ON EXTENSION pg_cron IS 'Automatiske cron jobs for planlagte innlegg og cleanup';

-- ============================================
-- NOTATER:
-- - publish-scheduled-posts kjører hvert minutt
-- - cleanup-expired-drafts kjører daglig kl 03:00
-- - Se aktive jobs: SELECT * FROM cron.job;
-- - Se job-historikk: SELECT * FROM cron.job_run_details;
-- - Slett job: SELECT cron.unschedule('job-name');
-- ============================================
