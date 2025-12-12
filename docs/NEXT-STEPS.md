# Neste steg: samiske.no

## Sist oppdatert: 2025-12-12

---

## Status
**Prosjektet er LIVE på samiske.no**

GitHub: https://github.com/oyvinddaniel/samiske
Automatisk deploy via Vercel ved push til main.

---

## Nylig implementert

### E-postvarsling
- Admin får e-post ved nye brukerregistreringer
- E-poster sendes automatisk hvert 5. minutt via cron-jobb
- SMTP konfigurert via Supabase Edge Functions

### Feedback-system
- Lilla chatboble i venstre hjørne
- Auto-åpner etter 10 sekunder (kun innloggede)
- Tilbakemeldinger vises i admin-panelet

### Slett konto
- Brukere kan slette egen konto fra /profil
- Bekreftelsesdialog før sletting
- All data slettes (CASCADE)

---

## Mulige fremtidige forbedringer

### 1. Utvidet e-postvarsling
- [ ] E-post ved nye innlegg i kategorier brukeren følger
- [ ] Ukentlig digest med aktivitetsoppsummering
- [ ] La brukere velge varslingsfrekvens i innstillinger

### 2. PWA (Progressive Web App)
- [ ] Forbedre manifest.json
- [ ] Konfigurer service worker for offline
- [ ] Legg til installeringsknapp
- [ ] Push-varsling til enheter

### 3. Ekstra brukerinteraksjon
- [ ] Slette egne innlegg
- [ ] Bokmerke innlegg
- [ ] Dele innlegg (kopier lenke)
- [ ] Melde fra om upassende innhold

### 4. Forbedringer
- [ ] Søkefunksjon
- [ ] Kalendervisning for arrangementer
- [ ] Bildegalleri
- [ ] Rike tekst-editor (markdown/WYSIWYG)

### 5. SMS-varsling
- [ ] Velg SMS-leverandør (Twilio, etc.)
- [ ] Implementer opt-in for SMS
- [ ] Send SMS ved viktige hendelser

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
