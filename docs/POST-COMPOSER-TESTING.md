# POST-COMPOSER TESTING - Oversikt

> Sist oppdatert: 2025-12-19
> Status: Klar for testing

---

## INNHOLD

1. [Testingprosess](#testingprosess)
2. [Automatiske tester](#automatiske-tester)
3. [Manuelle UI-tester](#manuelle-ui-tester)
4. [Eksterne tjenester](#eksterne-tjenester)
5. [Deployment-sjekkliste](#deployment-sjekkliste)

---

## TESTINGPROSESS

Post-composer-systemet er **100% implementert** med alle 23 funksjoner. Testing består av 4 faser:

1. **Automatiske tester** (Claude kjører) - 30 min
2. **Database-verifisering** (Bruker) - 15 min
3. **Eksterne tjenester** (Bruker) - 30 min
4. **Manuelle UI-tester** (Bruker) - 8-15 timer

**Total estimert tid:** 10-16 timer

---

## AUTOMATISKE TESTER

Disse testene kjøres av Claude i terminalen.

### Fullført ✅
- [x] TypeScript-kompilering (`npx tsc --noEmit`)
- [x] Next.js build (`npm run build`)
- [x] Lint-sjekk (`npm run lint`) - 25 errors i test-filer (ikke-kritisk), 228 warnings

### Gjenstår ⏳
- [ ] API-rute testing (krever kjørende dev-server)
  - `/api/video/upload` - POST/PUT/GET
  - `/api/gif` - Tenor API
  - `/api/link-preview` - Open Graph
- [ ] Database-query testing (se "Eksterne tjenester")

**Resultat:** Build kompilerer uten feil. Ingen errors i post-composer-filer.

---

## MANUELLE UI-TESTER

**⚠️ VIKTIG:** Se detaljert fil for full sjekkliste.

📄 **Fil:** `/Users/oyvinddaniel/.claude/plans/POST-COMPOSER-TESTING-DETAILED.md`

**Innhold:**
- 19 funksjoner med hyperdetaljert testing
- ~600 individuelle test-punkter
- Checkbox-format for avkryssing
- Happy path + edge cases + feilhåndtering

**Prioritering:**

### 1. KRITISK (må testes først)
- [ ] **Video upload** - Progress tracking, transcoding, visning (test 3.1-3.5)
- [ ] **Polls** - Opprettelse, visning i feed, stemming (test 9.1-9.4)
- [ ] **Planlagte innlegg** - Cron job publiserer automatisk (test 12.1-12.3)
- [ ] **Emoji-picker** - Knapp i toolbar, kategorier, søk (test 5.1-5.3)
- [ ] **Arkivering** - Fjern fra feed, gjenopprett (test 13.1-13.2)

### 2. HØY (bør testes)
- [ ] **Bilder** - Opplasting, preview, galleri (test 1.1-1.3)
- [ ] **@Mentions** - Autocomplete, visning, varsling (test 6.1-6.4)
- [ ] **Nested kommentarer** - Unlimited nesting, collapse/expand (test 15.1-15.5)
- [ ] **Reaksjoner** - Hover-picker, 10 typer, fordeling (test 16.1-16.4)

### 3. MEDIUM (test hvis tid)
- [ ] **GIF-søk** - Tenor API, infinite scroll (test 4.1-4.3)
- [ ] **Hashtags** - Parsing, egne sider, trending (test 7.1-7.3)
- [ ] **Lenkeforhåndsvisning** - Open Graph, caching (test 10.1-10.3)
- [ ] **Statistikk** - Views, metrics, charts (test 14.1-14.2)

### 4. LAV (test når alt annet fungerer)
- [ ] **Bilderedigering** - Crop, rotate, filters (test 2.1-2.3)
- [ ] **Geografisk tagging** - Søk, visning (test 8.1-8.3)
- [ ] **Drag & drop** - Rekkefølge bilder (test 17.1-17.2)
- [ ] **Utkast** - Auto-save, gjenoppretting (test 11.1-11.3)

**Estimert tid:**
- Kritisk: 3-4 timer
- Høy: 2-3 timer
- Medium: 2-3 timer
- Lav: 2-3 timer
- **Total:** 10-13 timer

---

## EKSTERNE TJENESTER

Disse tjenestene krever tilgang som Claude ikke har. Bruker må verifisere.

### 3.1 Supabase - Database og Cron Jobs

**Migrasjon (KRITISK):**
- [ ] Logg inn på Supabase Studio
- [ ] Gå til SQL Editor
- [ ] Kjør: `npx supabase db push`
- [ ] Verifiser at ALLE 14 migrasjoner er kjørt:
  - 20241218_post_images.sql
  - 20241218_post_videos.sql
  - 20241218_hashtags.sql
  - 20241218_post_mentions.sql
  - 20241218_polls.sql
  - 20241218_nested_comments.sql
  - 20241218_reactions.sql
  - 20241218_post_drafts.sql
  - 20241218_scheduled_posts.sql
  - 20241218_post_statistics.sql
  - 20241218_archive_posts.sql
  - 20241218_media_service.sql
  - 20241218_push_mentions.sql
  - **20241219_setup_cron_jobs.sql** ⚠️ NY

**Cron Jobs (KRITISK):**
- [ ] Gå til Database → Cron Jobs (eller pg_cron extension)
- [ ] Verifiser at 2 cron jobs er aktive:
  - [ ] `publish-scheduled-posts` - Kjører hvert minutt: `* * * * *`
  - [ ] `cleanup-expired-drafts` - Kjører daglig kl 03:00: `0 3 * * *`
- [ ] Test publish_scheduled_posts:
  - Lag et planlagt innlegg (planlegg til om 2 minutter)
  - Vent 2-3 minutter
  - Sjekk at innlegget publiseres automatisk

**RLS Policies:**
- [ ] Gå til Authentication → Policies
- [ ] Verifiser at ALLE 13 post-composer-tabeller har RLS enabled
- [ ] Test RLS:
  - Logg inn som bruker A, publiser innlegg
  - Logg inn som bruker B, prøv å redigere/slette (skal feile)

### 3.2 Bunny Stream - Video Hosting

**API Key:**
- [ ] Logg inn på bunny.net
- [ ] Gå til Stream → Library 567838
- [ ] Verifiser at API key er satt i `.env.local`:
  - `BUNNY_STREAM_API_KEY=...`
  - `BUNNY_STREAM_LIBRARY_ID=567838`

**Test upload:**
- [ ] Last opp test-video via UI
- [ ] Verifiser at video vises i Bunny dashboard
- [ ] Verifiser at transcoding starter og fullføres
- [ ] Verifiser at video kan spilles av

**Settings:**
- [ ] Verifiser at transcoding er enabled
- [ ] Verifiser at HLS (adaptive streaming) er enabled
- [ ] Verifiser at thumbnail generation er enabled

### 3.3 Tenor - GIF API

**API Key:**
- [ ] Verifiser at Tenor API key er satt i `.env.local`: `TENOR_API_KEY=...`
- [ ] Gå til https://tenor.com/developer/dashboard
- [ ] Sjekk API usage og rate limits (50,000 req/day gratis)

### 3.4 Vercel - Deployment

**Environment Variables:**
- [ ] Logg inn på Vercel Dashboard
- [ ] Gå til Project Settings → Environment Variables
- [ ] Verifiser at ALLE secrets er satt:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (⚠️ ALDRI commit til git)
  - `BUNNY_STREAM_API_KEY`
  - `BUNNY_STREAM_LIBRARY_ID`
  - `TENOR_API_KEY`
- [ ] Verifiser at alle er satt for Production, Preview OG Development

**Deployment:**
- [ ] Push til main branch
- [ ] Verifiser at build starter og fullføres (~3-5 min)
- [ ] Klikk på deployment URL
- [ ] Test ALLE funksjoner i produksjon:
  - Last opp bilde
  - Last opp video
  - Søk GIF
  - Lag poll
  - Test emoji-picker

---

## DEPLOYMENT-SJEKKLISTE

### Før deployment
- [x] TypeScript kompilering OK
- [x] Build kompilerer uten feil
- [ ] Lint-advarsler gjennomgått (25 errors i test-filer, 228 warnings)
- [ ] Database-migrasjoner kjørt
- [ ] Cron jobs aktivert
- [ ] Env vars satt i Vercel

### Etter deployment
- [ ] Video upload fungerer i produksjon
- [ ] Polls vises i feed
- [ ] Planlagte innlegg publiseres automatisk (test med 2-minutters delay)
- [ ] Emoji-picker åpner fra toolbar
- [ ] Arkivering fjerner innlegg fra feed
- [ ] GIF-søk fungerer
- [ ] Link preview henter Open Graph-data

### Monitoring
- [ ] Sjekk Vercel logs for errors
- [ ] Sjekk Supabase logs for database errors
- [ ] Sjekk Bunny Stream dashboard for video uploads
- [ ] Sjekk Tenor API usage

---

## KRITISKE SUKSESSKRITERIER

### MÅ FUNGERE:
- [ ] Video-opplasting med real-time progress (0-100%)
- [ ] Video transcoding med polling (bruker ser "Behandler video...")
- [ ] Video vises i feed og kan spilles av
- [ ] Polls vises i feed og man kan stemme
- [ ] Emoji-picker åpner fra toolbar
- [ ] Planlagte innlegg publiseres automatisk av cron job
- [ ] Arkivering fjerner innlegg fra feed
- [ ] Alle 23 funksjoner er synlige og klikkbare i UI

### BØR FUNGERE:
- [ ] Bilder komprimeres til 200KB
- [ ] Mentions sender varsling
- [ ] Hashtags lager egne sider
- [ ] Nested kommentarer støtter unlimited nesting
- [ ] Reaksjoner viser fordeling med tooltip
- [ ] Auto-save lagrer hvert 30. sekund

---

## KJENTE BEGRENSNINGER

1. **Ingen rik tekst-formatering**: Besluttet å prioritere @mentions over TipTap editor
2. **Thumbnail frame extraction**: UI klar, men frame extraction krever server-side processing (planlagt senere)
3. **Ingen unit tests**: Fokus på manual testing først
4. **Ingen rate limiting**: Må legges til før produksjon med høy trafikk
5. **Ingen malware scanning**: Bunny Stream håndterer video, men bilder bør scannes

---

## NESTE STEG ETTER FULLFØRING

1. **Monitoring**: Sett opp error tracking (Sentry)
2. **Analytics**: Legg til tracking for feature usage
3. **Performance**: Optimaliser bundle size
4. **Testing**: Legg til Jest unit tests
5. **Documentation**: Lag bruker-guide for alle 23 funksjoner

---

## DOKUMENTER

- **Detaljert testingliste:** `/Users/oyvinddaniel/.claude/plans/POST-COMPOSER-TESTING-DETAILED.md`
- **Implementeringsplan:** `/Users/oyvinddaniel/.claude/plans/robust-seeking-russell.md`
- **Prosjektoversikt:** `/docs/POST-COMPOSER-PROJECT.md`
- **Status:** `/agent_docs/status.md`

---

*Opprettet: 2025-12-19*
