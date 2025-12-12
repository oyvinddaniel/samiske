# Neste steg: samiske.no

## Sist oppdatert: 2025-12-12

---

## Status
**Prosjektet er LIVE på samiske.no**

GitHub: https://github.com/oyvinddaniel/samiske
Automatisk deploy via Vercel ved push til main.

**VIKTIG:** Sikkerhetsgjennomgang utført - se prioritert handlingsplan nedenfor.

---

## PRIORITERT HANDLINGSPLAN

### FASE 1: KRITISK SIKKERHET (MÅ gjøres UMIDDELBART)

#### 1.1 Roter Service Role Key
- [ ] Gå til Supabase Dashboard → Settings → API
- [ ] Generer ny Service Role Key
- [ ] Oppdater kun i Vercel Environment Variables (IKKE i .env.local)
- [ ] Fjern SUPABASE_SERVICE_ROLE_KEY fra .env.local

#### 1.2 Fiks åpne RLS policies
Kjør dette i Supabase SQL Editor:
```sql
-- email_subscribers: Krev autentisering
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.email_subscribers;
CREATE POLICY "Authenticated users can subscribe"
  ON public.email_subscribers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- conversations: Krev at bruker er autentisert
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- conversation_participants: Kun egne deltakelser
DROP POLICY IF EXISTS "Users can add participants" ON conversation_participants;
CREATE POLICY "Users can add themselves as participants"
  ON conversation_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

#### 1.3 Dokumenter auto-confirm risiko
- Auto-confirm er besluttet beholdt for enkel onboarding
- Planlegg overgang til e-postbekreftelse i Fase 5
- Risiko: Spam-kontoer og impersonering mulig

### FASE 2: HØY PRIORITET SIKKERHET (Dag 2-3)

#### 2.1 Forbedre delete-account
- [ ] Legg til passordbekreftelse før sletting
- [ ] Vurder CSRF-token eller annen beskyttelse

#### 2.2 Input-validering
- [ ] Maks lengde på tittel (100 tegn) og innhold (5000 tegn)
- [ ] Valider telefonnummer-format
- [ ] Valider feedback-melding lengde

#### 2.3 Rate limiting (valgfritt)
- [ ] Implementer rate limiting på kritiske endpoints

### FASE 3: KODEKVALITET (Uke 1-2)

#### 3.1 Error handling
- [ ] Opprett global error boundary komponent
- [ ] Legg til toast notification system
- [ ] Gå gjennom alle Supabase queries og legg til feilhåndtering

#### 3.2 Fiks N+1 query problem i Feed
- [ ] Batch-fetch likes og comments counts
- [ ] Reduser fra 31 til 2-3 queries per sidelast

#### 3.3 Splitt PostCard.tsx (1139 linjer → 4 komponenter)
- [ ] PostCard.tsx (display) - ~280 linjer
- [ ] PostActions.tsx (likes/comments buttons) - ~200 linjer
- [ ] PostComments.tsx (comment thread) - ~300 linjer
- [ ] EditPostDialog.tsx (edit modal) - ~250 linjer

#### 3.4 Extract utility functions
- [ ] lib/formatting.ts: formatDate, getInitials, normalizeRelation

### FASE 4: FUNKSJONALITET (Uke 2-3)

#### 4.1 Implementer søkefunksjon
- [ ] Søk i innlegg (tittel og innhold)
- [ ] Søk i brukere (navn)
- [ ] Vise resultater i SearchModal
- [ ] Keyboard shortcut (Cmd+K) fungerer allerede

#### 4.2 Fjern SMS-varsling fra UI
- [ ] Fjern SMS-toggle fra innstillinger-siden
- [ ] Fjern eller behold telefonnummer-felt som kontaktinfo
- [ ] Rydd opp i notification_preferences tabell

#### 4.3 Tilgjengelighet (a11y)
- [ ] Legg til aria-labels på icon-buttons
- [ ] Keyboard navigation for floating bubbles
- [ ] Escape for å lukke modaler

### FASE 5: FREMTIDIG (Planlagt)

#### 5.1 E-postbekreftelse
- [ ] Fjern auto-confirm trigger
- [ ] Aktiver Supabase e-postbekreftelse
- [ ] Lag "verifiser e-post" side
- [ ] Håndter uverifiserte brukere

#### 5.2 Utvidet e-postvarsling
- [ ] E-post ved nye innlegg i kategorier brukeren følger
- [ ] Ukentlig digest med aktivitetsoppsummering
- [ ] La brukere velge varslingsfrekvens i innstillinger

#### 5.3 PWA (Progressive Web App)
- [ ] Forbedre manifest.json
- [ ] Konfigurer service worker for offline
- [ ] Legg til installeringsknapp
- [ ] Push-varsling til enheter

#### 5.4 Ekstra brukerinteraksjon
- [ ] Slette egne innlegg
- [ ] Bokmerke innlegg
- [ ] Dele innlegg (kopier lenke)
- [ ] Melde fra om upassende innhold

---

## KRITISKE FILER

### Sikkerhet:
- `supabase/schema.sql` - RLS policies
- `supabase/migrations/20241212_friends_and_messages.sql` - Conversation policies
- `src/app/api/delete-account/route.ts` - Kontosletting
- `.env.local` - Credentials (MÅ RYDDES)

### Kodekvalitet:
- `src/components/posts/PostCard.tsx` - 1139 linjer, må splittes
- `src/components/feed/Feed.tsx` - N+1 query problem
- `src/app/ny/page.tsx` - Input validering

### Funksjonalitet:
- `src/components/search/SearchModal.tsx` - Ikke implementert
- `src/app/innstillinger/page.tsx` - SMS uten backend

---

## Utviklingsarbeidsflyt

### Gjøre endringer:
1. Gjør endringer lokalt (`npm run dev`)
2. Test at alt fungerer
3. Commit og push: `git add -A && git commit -m "Beskrivelse" && git push`
4. Vercel deployer automatisk innen 1-2 minutter

### Viktige filer:
- `/src/components/posts/PostCard.tsx` - Hovedkomponent for innlegg
- `/src/components/feed/Feed.tsx` - Hovedfeed
- `/src/components/layout/MobileNav.tsx` - Mobil hamburger-meny
- `/src/components/layout/Sidebar.tsx` - Desktop sidebar
- `/src/components/layout/Header.tsx` - Header med innlogging
- `/src/components/social/SocialPanel.tsx` - Venner og meldinger panel
- `/src/components/feedback/FeedbackBubble.tsx` - Feedback-boble
- `/src/app/profil/page.tsx` - Profilside med slett konto
- `/src/app/admin/page.tsx` - Admin-panel
- `/src/app/api/delete-account/route.ts` - API for kontosletting
- `/supabase/functions/send-emails/` - E-postsending

---

## Miljøvariabler

### Vercel (produksjon):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Supabase Edge Functions:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

---

## Database-jobber (cron)

Aktive cron-jobber i Supabase:
- `send-pending-emails`: Kjører hvert 5. minutt, sender ventende e-poster

Se aktive jobber:
```sql
SELECT * FROM cron.job;
```

---

## Tips
- Kjør `npm run build` lokalt før push for å sjekke at alt kompilerer
- Se Vercel dashboard for deploy-logger
- Supabase dashboard for database og auth-administrasjon
- Bruk `rm -rf .next && npm run dev` hvis endringer ikke vises
