# Neste steg: samiske.no

## Sist oppdatert: 2025-12-14

---

## Status
**Prosjektet er LIVE på samiske.no**

GitHub: https://github.com/oyvinddaniel/samiske
Automatisk deploy via Vercel ved push til main.

**Sikkerhetsfaser 1-4 er FULLFØRT!**

---

## FULLFØRTE FASER

### ✅ FASE 1: KRITISK SIKKERHET (FULLFØRT 2025-12-12)
- [x] Ny `sb_secret_` nøkkel opprettet (gammel eksponert nøkkel ugyldig)
- [x] Vercel, cron-jobb og .env.local oppdatert med ny nøkkel
- [x] RLS policies fikset (email_subscribers, conversations, conversation_participants)

### ✅ FASE 2: HØY PRIORITET SIKKERHET (FULLFØRT 2025-12-12)
- [x] Passordbekreftelse kreves før kontosletting
- [x] Input-validering: tittel maks 100 tegn, innhold maks 5000 tegn
- [x] Tegntellere synlig for brukere

### ✅ FASE 3: KODEKVALITET (DELVIS FULLFØRT 2025-12-12)
- [x] N+1 query problem fikset (31 → 4 queries)
- [x] Toast notifications system (sonner)
- [x] Error handling med brukervenlige meldinger
- [ ] Splitt PostCard.tsx (stor refaktorering, kan tas senere)
- [ ] Memory leaks - subscriptions cleanup

### ✅ FASE 4: FUNKSJONALITET (FULLFØRT 2025-12-12)
- [x] SMS fjernet fra innstillinger
- [x] Søkefunksjon fungerer (Cmd+K)
- [x] Tilgjengelighet (a11y) - aria-labels, keyboard nav (FULLFØRT 2025-12-13)

### ✅ NYE VERKTØY: Code Analyzer Agent (FULLFØRT 2025-12-14)
- [x] Custom Claude Code agent for systematisk kodeanalyse
- [x] Analysekategorier: code, security, UX, content
- [x] Detaljerte analyseregler basert på 2025 beste praksis
- [x] `/analyze` slash-kommando implementert
- [x] Dokumentasjon oppdatert

**Bruk:**
```bash
/analyze          # Full analyse (alle kategorier)
/analyze code     # Kun kodekvalitet
/analyze security # Kun sikkerhet
/analyze ux       # Kun UX/tilgjengelighet
/analyze content  # Kun innleggsstruktur
```

**Output:** Detaljert rapport med:
- 🔴 Kritiske problemer
- 🟡 Advarsler
- 🟢 Forslag
- File:line referanser
- Konkrete fix-forslag

**Regler basert på:**
- ESLint, SonarQube (kodekvalitet)
- OWASP, CodeMender (sikkerhet)
- WCAG 2.1 AA (tilgjengelighet)
- Social Media Best Practices 2025 (innhold)

---

## GJENSTÅENDE OPPGAVER

### Kodekvalitet (FULLFØRT 2025-12-12)
- [x] Splitt PostCard.tsx (1139 → 670 linjer + 5 nye filer)
- [x] Memory leaks - alle subscriptions har korrekt cleanup
- [x] Extract utility functions til src/components/posts/utils.ts

### ✅ Tilgjengelighet (a11y) (FULLFØRT 2025-12-13)
- [x] Legg til aria-labels på icon-buttons (PostCard, Header, SearchModal, NotificationBell, InstallPrompt)
- [x] Keyboard navigation for floating bubbles (focus-visible styling)
- [x] Escape for å lukke modaler (BottomSheet, FloatingSocialBubbles, ProfileOverlay)

### ✅ Rate Limiting (FULLFØRT 2025-12-13)
- [x] In-memory rate limiter (src/lib/rate-limit.ts)
- [x] /api/delete-account: 3 forespørsler per time (sensitiv operasjon)
- [x] /api/export-data: 5 forespørsler per time
- [x] Standard rate limit headers (X-RateLimit-*, Retry-After)

### FASE 5: FREMTIDIG (Planlagt)

#### 5.1 E-postbekreftelse (når spam blir problem)
- [ ] Fjern auto-confirm trigger
- [ ] Aktiver Supabase e-postbekreftelse
- [ ] Lag "verifiser e-post" side
- [ ] Håndter uverifiserte brukere

#### 5.2 Utvidet e-postvarsling
- [ ] E-post ved nye innlegg i kategorier brukeren følger
- [ ] Ukentlig digest med aktivitetsoppsummering
- [ ] La brukere velge varslingsfrekvens i innstillinger

#### 5.3 PWA (Progressive Web App)
- [x] Forbedre manifest.json (FULLFØRT)
- [x] Konfigurer service worker for offline (FULLFØRT)
- [x] Legg til installeringsknapp (FULLFØRT 2025-12-13)
- [x] PWA-ikoner (FULLFØRT 2025-12-13)
- [x] Push-varsling til enheter (FULLFØRT 2025-12-13)

### Push-varsling oppsett (FULLFØRT 2025-12-13)

**Kode implementert:**
- Database triggers: `on_new_post_push`, `on_new_comment_push`
- Cron-jobb: `send-pending-push` (kjører hvert 2. minutt)
- Edge function: `supabase/functions/send-push/index.ts`
- Client-side: `src/lib/push-notifications.ts`
- Service worker: `public/sw.js`

**Supabase secrets som MÅ konfigureres:**
```
VAPID_PUBLIC_KEY=<din public key fra .env.local>
VAPID_PRIVATE_KEY=<generer med: npx web-push generate-vapid-keys>
VAPID_SUBJECT=mailto:noreply@samiske.no
```

Sett secrets via: Supabase Dashboard → Edge Functions → send-push → Secrets

#### 5.4 Ekstra brukerinteraksjon
- [x] Slette egne innlegg (FULLFØRT 2025-12-13)
- [x] Bokmerke innlegg (FULLFØRT 2025-12-13)
- [x] Dele innlegg (kopier lenke) (FULLFØRT 2025-12-13)
- [x] Melde fra om upassende innhold (FULLFØRT 2025-12-13)

---

## Viktige filer

### Hovedkomponenter:
- `/src/components/posts/PostCard.tsx` - Hovedkomponent for innlegg (670 linjer, refaktorert)
- `/src/components/posts/PostActions.tsx` - Like/kommentar-knapper
- `/src/components/posts/PostComments.tsx` - Kommentarseksjon
- `/src/components/posts/EditPostDialog.tsx` - Redigerings-dialog
- `/src/components/posts/PostDialogContent.tsx` - Fullvisning i dialog
- `/src/components/posts/types.ts` - Delte typer
- `/src/components/posts/utils.ts` - Hjelpefunksjoner (formatDate, getInitials)
- `/src/components/feed/Feed.tsx` - Hovedfeed (N+1 fikset)
- `/src/components/layout/Header.tsx` - Header med innlogging
- `/src/components/social/SocialPanel.tsx` - Venner og meldinger
- `/src/components/feedback/FeedbackBubble.tsx` - Feedback-boble
- `/src/components/search/SearchModal.tsx` - Søkefunksjon

### Sider:
- `/src/app/profil/page.tsx` - Profilside med slett konto (passordbekreftelse)
- `/src/app/admin/page.tsx` - Admin-panel
- `/src/app/innstillinger/page.tsx` - Innstillinger (SMS fjernet)
- `/src/app/ny/page.tsx` - Opprett innlegg (input-validering)

### API:
- `/src/app/api/delete-account/route.ts` - Kontosletting med passord

---

## Miljøvariabler

### Vercel (produksjon):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (ny sb_secret_ nøkkel)

### Supabase Edge Functions:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

---

## Database-jobber (cron)

Aktive cron-jobber i Supabase:
- `send-pending-emails`: Kjører hvert 5. minutt, sender ventende e-poster (oppdatert med ny nøkkel)

---

## Tips
- Kjør `npm run build` lokalt før push
- Se Vercel dashboard for deploy-logger
- Supabase dashboard for database og auth
- Bruk `rm -rf .next && npm run dev` hvis endringer ikke vises
