# Neste steg: samiske.no

## Sist oppdatert: 2025-12-12

---

## Status
**Prosjektet er LIVE på samiske.no**

GitHub: https://github.com/oyvinddaniel/samiske
Automatisk deploy via Vercel ved push til main.

---

## PRIORITET 1: Fiks MobileNav auth-problem

### Bakgrunn
Sosial-seksjonen (Venner/Meldinger) fungerer på desktop-sidebar, men ikke på mobil-menyen (MobileNav). Debug-bokser som er lagt til vises heller ikke, noe som tyder på at endringene ikke når nettleseren.

### Feilsøkingssteg
1. **Restart dev-server:**
   ```bash
   # Stopp pågående server (Ctrl+C)
   # Slett .next cache
   rm -rf .next
   npm run dev
   ```

2. **Sjekk at MobileNav faktisk rendres:**
   - På mobil (smal skjerm) skal MobileNav vises
   - Sidebar er `md:flex` så den skjules på mobil
   - MobileNav har `md:hidden` så den skjules på desktop

3. **Sjekk createPortal:**
   - MobileNav bruker `createPortal` for å rendre menyen
   - Sjekk at `mounted` state er `true` før portal rendres
   - Prøv å fjerne createPortal midlertidig for testing

4. **Sjekk dev-server output:**
   - Se etter kompileringsfeil i terminal
   - Se etter TypeScript-feil

### Relevant kode
Filen `/src/components/layout/MobileNav.tsx` har debug-boks på linje 321-324:
```tsx
<div className="p-2 bg-red-100 text-xs border-b">
  Debug: userId={currentUserId || 'NULL'}
</div>
```

Denne skal vises når hamburgermenyen åpnes, uansett auth-status.

---

## PRIORITET 2: Når MobileNav er fikset

### Test vennefunksjonen fullstendig
1. Logg inn som bruker A
2. Åpne profil-popup til bruker B
3. Klikk "Legg til venn"
4. Logg inn som bruker B
5. Sjekk at venneforespørsel vises
6. Godta forespørsel
7. Test meldingsfunksjon mellom venner

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
- `/src/components/layout/MobileNav.tsx` - Mobil hamburger-meny (HAR AKTIVT PROBLEM)
- `/src/components/layout/Sidebar.tsx` - Desktop sidebar (fungerer)
- `/src/components/layout/Header.tsx` - Header med innlogging
- `/src/components/social/SocialPanel.tsx` - Venner og meldinger panel
- `/src/components/profile/ProfileOverlay.tsx` - Profil-popup med vennefunksjon
- `/src/app/` - Sider (Next.js App Router)
- `/supabase/` - Database-migrasjoner

---

## Miljøvariabler (Vercel)
Disse må være satt i Vercel Settings -> Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Tips
- Kjør `npm run build` lokalt før push for å sjekke at alt kompilerer
- Se Vercel dashboard for deploy-logger
- Supabase dashboard for database og auth-administrasjon
- Bruk `rm -rf .next && npm run dev` hvis endringer ikke vises
