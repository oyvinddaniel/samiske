# Neste steg: samiske.no

## Sist oppdatert: 2025-12-12

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
- [ ] Tilgjengelighet (a11y) - aria-labels, keyboard nav

---

## GJENSTÅENDE OPPGAVER

### Kodekvalitet (FULLFØRT 2025-12-12)
- [x] Splitt PostCard.tsx (1139 → 670 linjer + 5 nye filer)
- [x] Memory leaks - alle subscriptions har korrekt cleanup
- [x] Extract utility functions til src/components/posts/utils.ts

### Tilgjengelighet (a11y)
- [ ] Legg til aria-labels på icon-buttons
- [ ] Keyboard navigation for floating bubbles
- [ ] Escape for å lukke modaler

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
