# 🚀 DEPLOYMENT INSTRUKSJONER - FASE 1 (KRITISK SIKKERHET)

**Dato**: 2024-12-15
**Status**: KREVER MANUELLE STEG

---

## ⚠️ VIKTIG: Nye VAPID-nøkler generert

Gamle VAPID-nøkler er kompromittert og MÅ byttes ut.

### Nye VAPID-nøkler:

**Public Key:**
```
BA03nno94qaeL5awknnrS-ugwGHNoAVbxaTKCHVWQVu-krYKR3cJU82PVA0uhJbq_RwS6X0aRhw6jyXAad_b5Ss
```

**Private Key:**
```
MSPU4MvnBwsta2-By5iLqJ_QoqZPPIdxvAqvOeesYUM
```

**VAPID Subject:**
```
mailto:noreply@samiske.no
```

---

## 📋 MANUELLE STEG SOM MÅ GJØRES

### STEG 1: Sett Supabase Secrets (Edge Functions)

```bash
cd "/Users/oyvind/Library/CloudStorage/Dropbox/HD Øyvind/Obsidian/AI Code Projects/Samisk/samiske"

# Sett VAPID keys
supabase secrets set VAPID_PUBLIC_KEY="BA03nno94qaeL5awknnrS-ugwGHNoAVbxaTKCHVWQVu-krYKR3cJU82PVA0uhJbq_RwS6X0aRhw6jyXAad_b5Ss"
supabase secrets set VAPID_PRIVATE_KEY="MSPU4MvnBwsta2-By5iLqJ_QoqZPPIdxvAqvOeesYUM"
supabase secrets set VAPID_SUBJECT="mailto:noreply@samiske.no"

# Sett Supabase URL og Service Role Key (fra dashboard)
supabase secrets set SUPABASE_URL="https://uifgiyjalowwwjvrbpxi.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<din-service-role-key-her>"

# Verifiser at secrets er satt
supabase secrets list
```

---

### STEG 2: Oppdater .env.local (lokal utvikling)

Åpne `.env.local` og oppdater:

```bash
# Oppdater kun PUBLIC key (private key skal IKKE være her)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BA03nno94qaeL5awknnrS-ugwGHNoAVbxaTKCHVWQVu-krYKR3cJU82PVA0uhJbq_RwS6X0aRhw6jyXAad_b5Ss
```

**VIKTIG**: Ikke legg til private key i .env.local!

---

### STEG 3: Oppdater Vercel Environment Variables

1. Gå til Vercel Dashboard: https://vercel.com
2. Velg prosjektet "samiske"
3. Gå til Settings → Environment Variables
4. Oppdater:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = `BA03nno94qaeL5awknnrS-ugwGHNoAVbxaTKCHVWQVu-krYKR3cJU82PVA0uhJbq_RwS6X0aRhw6jyXAad_b5Ss`
5. Redeploy appen for at endringene skal tre i kraft

---

### STEG 4: Opprett Vault Secrets i Supabase

**Viktig**: Dette MÅ gjøres MANUELT i Supabase SQL Editor FØR du kjører migrasjonen.

1. Gå til Supabase Dashboard: https://supabase.com/dashboard
2. Velg prosjektet
3. Gå til SQL Editor
4. Kjør følgende kommandoer:

```sql
-- Opprett project_url secret
SELECT vault.create_secret(
  'https://uifgiyjalowwwjvrbpxi.supabase.co',
  'project_url'
);

-- Opprett service_role_key secret (hent nøkkelen fra Settings → API Keys)
SELECT vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...<din-faktiske-service-role-key>',
  'service_role_key'
);

-- Verifiser at secrets er opprettet
SELECT name FROM vault.decrypted_secrets;
```

Du skal se:
```
project_url
service_role_key
```

---

### STEG 5: Kjør Database-migrasjoner

**REKKEFØLGE ER VIKTIG!**

```bash
cd "/Users/oyvind/Library/CloudStorage/Dropbox/HD Øyvind/Obsidian/AI Code Projects/Samisk/samiske"

# 1. RLS policies (KRITISK - beskytter sensitive data)
PGPASSWORD='eXillion20!sam' psql "postgresql://postgres:eXillion20!sam@db.uifgiyjalowwwjvrbpxi.supabase.co:5432/postgres" \
  -f supabase/migrations/20241215_queue_rls_policies.sql

# 2. Rate limiting (forhindrer spam)
PGPASSWORD='eXillion20!sam' psql "postgresql://postgres:eXillion20!sam@db.uifgiyjalowwwjvrbpxi.supabase.co:5432/postgres" \
  -f supabase/migrations/20241215_rate_limiting.sql

# 3. HTML sanitization (forhindrer XSS)
PGPASSWORD='eXillion20!sam' psql "postgresql://postgres:eXillion20!sam@db.uifgiyjalowwwjvrbpxi.supabase.co:5432/postgres" \
  -f supabase/migrations/20241215_email_html_sanitization.sql

# 4. Vault secrets (MÅ kjøres ETTER at vault secrets er opprettet i STEG 4)
PGPASSWORD='eXillion20!sam' psql "postgresql://postgres:eXillion20!sam@db.uifgiyjalowwwjvrbpxi.supabase.co:5432/postgres" \
  -f supabase/migrations/20241215_vault_secrets.sql
```

---

### STEG 6: Verifiser at alt fungerer

```sql
-- 1. Sjekk RLS policies
SELECT tablename, policyname FROM pg_policies WHERE tablename IN ('email_queue', 'push_queue', 'sms_queue');

-- 2. Sjekk rate limiting
SELECT * FROM notification_rate_limits LIMIT 5;

-- 3. Sjekk cron jobs
SELECT jobname, schedule, active FROM cron.job WHERE active = true;

-- 4. Test HTML escaping
SELECT html_escape('<script>alert("XSS")</script>');
-- Skal returnere: &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;

-- 5. Sjekk vault secrets
SELECT name FROM vault.decrypted_secrets;
-- Skal vise: project_url, service_role_key
```

---

### STEG 7: Test i produksjon

1. **Test push notifications**:
   - Gå til https://samiske.no/innstillinger
   - Aktiver push-varsler
   - Lag et nytt innlegg
   - Verifiser at push-varsel mottas

2. **Test rate limiting**:
   - Prøv å lage >50 innlegg på kort tid
   - Skal se warning i logs

3. **Test email queue**:
   ```sql
   SELECT status, COUNT(*) FROM email_queue GROUP BY status;
   ```

4. **Monitor for feil**:
   ```sql
   -- Sjekk feilede varsler
   SELECT * FROM email_queue WHERE status = 'failed' LIMIT 10;
   SELECT * FROM push_queue WHERE status = 'failed' LIMIT 10;
   ```

---

## 🔍 TROUBLESHOOTING

### Problem: "relation vault.decrypted_secrets does not exist"
**Løsning**: Vault-extension er ikke aktivert. Kontakt Supabase support.

### Problem: Cron jobs kjører ikke
**Løsning**:
```sql
-- Sjekk cron status
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- Restart cron jobs
SELECT cron.unschedule('send-pending-emails');
-- Kjør vault_secrets.sql på nytt
```

### Problem: Push notifications fungerer ikke
**Løsning**:
1. Verifiser at VAPID public key er oppdatert i Vercel
2. Clear browser cache og re-subscribe
3. Sjekk at service worker er oppdatert

### Problem: Rate limiting blokkerer legitime brukere
**Løsning**:
```sql
-- Fjern rate limits for en spesifikk bruker
DELETE FROM notification_rate_limits WHERE user_id = '<user-uuid>';

-- Eller juster grensene i koden
```

---

## 📊 MONITORING

### Daglig sjekk (første uken):

```sql
-- Queue health
SELECT
  'email' as type,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'sent') as sent,
  COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM email_queue
WHERE created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT
  'push' as type,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'sent') as sent,
  COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM push_queue
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Rate limiting stats
SELECT * FROM rate_limit_stats ORDER BY window_start DESC LIMIT 20;
```

---

## ✅ SJEKKPUNKTER

- [ ] VAPID secrets satt i Supabase
- [ ] .env.local oppdatert med ny public key
- [ ] Vercel environment variables oppdatert
- [ ] Vault secrets opprettet (project_url, service_role_key)
- [ ] Alle 4 migrasjoner kjørt uten feil
- [ ] RLS policies aktive (test at vanlige brukere ikke kan lese køer)
- [ ] Rate limiting fungerer (test med mange requests)
- [ ] HTML sanitization fungerer (test XSS-payload)
- [ ] Cron jobs kjører (sjekk cron.job tabellen)
- [ ] Push notifications fungerer
- [ ] Ingen feilmeldinger i logs

---

## 🎯 NESTE STEG

Når Fase 1 er fullført og verifisert:
- **FASE 2**: Sanntids-optimalisering (migrasjoner er klare)
- **FASE 3**: Email/Push leveranse (konfigurasjon)
- **FASE 4**: PWA forbedringer (frontend)

---

**Opprettet av**: Claude Code
**Dato**: 2024-12-15
