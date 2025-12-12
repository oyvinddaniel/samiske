# E-postvarsling - Oppsettguide

Denne guiden forklarer hvordan du setter opp e-postvarsling for samiske.no ved hjelp av din egen e-postkonto fra cPanel/webhotellet.

## Steg 1: Opprett e-postkonto i cPanel

1. Logg inn på cPanel for ditt webhotell
2. Gå til **Email Accounts**
3. Opprett en ny e-postkonto, f.eks. `noreply@samiske.no`
4. Noter deg:
   - **E-postadresse**: `noreply@samiske.no`
   - **Passord**: (det du valgte)
   - **SMTP-server**: Vanligvis `mail.samiske.no` eller `smtp.samiske.no`
   - **Port**: `465` (SSL) eller `587` (TLS)

## Steg 2: Kjør SQL-migrasjonen

Kjør denne SQL-koden i Supabase SQL Editor:

```sql
-- Kopier innholdet fra:
-- /supabase/migrations/20241213_email_notifications.sql
```

Dette oppretter:
- `email_queue` - Kø for e-poster som skal sendes
- `email_digest_items` - For daglig/ukentlig oppsummering
- Triggers som automatisk legger varsler i køen

## Steg 3: Konfigurer Edge Function

### 3a. Installer Supabase CLI (hvis ikke installert)

```bash
npm install -g supabase
```

### 3b. Logg inn og link prosjektet

```bash
supabase login
supabase link --project-ref DIN_PROJECT_REF
```

### 3c. Sett environment variables

Gå til **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**

Legg til disse:

| Navn | Verdi | Eksempel |
|------|-------|----------|
| `SMTP_HOST` | SMTP-serveren | `mail.samiske.no` |
| `SMTP_PORT` | Port-nummer | `465` |
| `SMTP_USER` | E-postadressen | `noreply@samiske.no` |
| `SMTP_PASS` | Passordet | `ditt-passord` |
| `SMTP_FROM` | Avsender-format | `samiske.no <noreply@samiske.no>` |

### 3d. Deploy Edge Function

```bash
cd samiske
supabase functions deploy send-emails
```

## Steg 4: Test e-postsending

### Manuell test via cURL:

```bash
curl -X POST 'https://DIN_PROJECT_REF.supabase.co/functions/v1/send-emails' \
  -H 'Authorization: Bearer DIN_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"max_emails": 1}'
```

### Test via Supabase Dashboard:

1. Gå til **Edge Functions** → **send-emails**
2. Klikk **Invoke**
3. Sjekk loggene for resultater

## Steg 5: Sett opp automatisk kjøring (Cron)

For å sende e-poster automatisk, bruk **Supabase Cron** (pg_cron):

### Aktiver pg_cron

1. Gå til **Database** → **Extensions**
2. Aktiver `pg_cron`

### Sett opp cron-jobber

Kjør denne SQL-en:

```sql
-- Send ventende e-poster hvert 5. minutt
SELECT cron.schedule(
  'send-pending-emails',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://DIN_PROJECT_REF.supabase.co/functions/v1/send-emails',
    headers := '{"Authorization": "Bearer DIN_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{"max_emails": 20}'::jsonb
  );
  $$
);

-- Generer daglig digest kl. 08:00 (norsk tid = 07:00 UTC)
SELECT cron.schedule(
  'daily-digest',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://DIN_PROJECT_REF.supabase.co/functions/v1/send-emails',
    headers := '{"Authorization": "Bearer DIN_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{"generate_digest": true, "email_type": "daily_digest"}'::jsonb
  );
  $$
);

-- Generer ukentlig digest hver mandag kl. 08:00
SELECT cron.schedule(
  'weekly-digest',
  '0 7 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://DIN_PROJECT_REF.supabase.co/functions/v1/send-emails',
    headers := '{"Authorization": "Bearer DIN_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{"generate_digest": true, "email_type": "weekly_digest"}'::jsonb
  );
  $$
);

-- Rydd opp gamle e-poster hver natt kl. 03:00
SELECT cron.schedule(
  'cleanup-emails',
  '0 2 * * *',
  $$
  SELECT cleanup_old_emails();
  $$
);
```

### Se aktive cron-jobber:

```sql
SELECT * FROM cron.job;
```

### Stopp en cron-job:

```sql
SELECT cron.unschedule('send-pending-emails');
```

## Feilsøking

### Sjekk e-postkø:

```sql
-- Se ventende e-poster
SELECT * FROM email_queue WHERE status = 'pending' ORDER BY created_at DESC LIMIT 10;

-- Se feilede e-poster
SELECT * FROM email_queue WHERE status = 'failed' ORDER BY created_at DESC LIMIT 10;
```

### Vanlige feil:

| Feil | Løsning |
|------|---------|
| `SMTP not configured` | Sjekk at alle SMTP-variabler er satt i Edge Function Secrets |
| `Connection refused` | Sjekk at SMTP_HOST og SMTP_PORT er riktig |
| `Authentication failed` | Sjekk SMTP_USER og SMTP_PASS |
| `Certificate error` | Prøv port 587 med TLS istedenfor 465 |

### Test SMTP-tilkobling manuelt:

Du kan teste SMTP-oppsettet med et verktøy som:
- [SMTPer](https://www.smtper.net/)
- [Mail Tester](https://www.mail-tester.com/)

## Sikkerhetsnotater

1. **Aldri del** SMTP-passordet
2. Bruk en dedikert e-postkonto for varsler (ikke din personlige)
3. Service Role Key skal **kun** brukes i cron-jobber, aldri eksponeres til frontend
4. Vurder å sette opp SPF og DKIM i DNS for bedre leveranse

## Kostnad

- **cPanel SMTP**: Gratis (inkludert i webhotellet)
- **Supabase Edge Functions**: Gratis opp til 500K invocations/måned
- **pg_cron**: Gratis (inkludert i Supabase)
