# Neste steg: samiske.no

## Sist oppdatert: 2025-12-12

---

## Status
**Prosjektet er LIVE på samiske.no**

GitHub: https://github.com/oyvinddaniel/samiske
Automatisk deploy via Vercel ved push til main.

---

## Mulige fremtidige forbedringer

### 1. E-postvarsling
- [ ] Sett opp e-postliste for nye innlegg
- [ ] Konfigurer Supabase Edge Functions eller ekstern tjeneste
- [ ] La brukere velge varslingsfrekvens

### 2. PWA (Progressive Web App)
- [ ] Legg til manifest.json
- [ ] Konfigurer service worker
- [ ] Legg til installeringsknapp
- [ ] Offline-støtte for lest innhold

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
- `/src/components/layout/` - Header, Sidebar, MobileNav
- `/src/app/` - Sider (Next.js App Router)
- `/supabase/` - Database-migrasjoner

---

## Miljøvariabler (Vercel)
Disse må være satt i Vercel Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Tips
- Kjør `npm run build` lokalt før push for å sjekke at alt kompilerer
- Se Vercel dashboard for deploy-logger
- Supabase dashboard for database og auth-administrasjon
