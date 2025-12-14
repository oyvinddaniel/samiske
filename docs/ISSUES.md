# Problemlogg: samiske.no

## Sist oppdatert: 2025-12-14

---

## GJENSTÅENDE PROBLEMER

### LAV: Manglende tilgjengelighet (a11y)
**Status:** AKTIV
**Alvorlighet:** 🟢 LAV
**Beskrivelse:** Aria-labels og keyboard navigation mangler steder
**Løsning:** Legg til aria-labels på icon-buttons, keyboard nav for bubbles

### DOKUMENTERT: Auto-confirm users
**Status:** DOKUMENTERT RISIKO
**Alvorlighet:** 🟡 MEDIUM
**Beskrivelse:** Brukere bekreftes automatisk uten e-postvalidering
**Beslutning:** Behold for nå, planlegg overgang til e-postbekreftelse (Fase 5)

---

## LØSTE PROBLEMER

### ✅ KRITISK: Infinite recursion i community_admins RLS (2025-12-14)
**Status:** LØST
**Alvorlighet:** 🔴 KRITISK
**Beskrivelse:** Brukere fikk "infinite recursion detected in policy for relation 'community_admins'" når de prøvde å poste innlegg med bilde
**Årsak:** `FOR ALL` policy på `community_admins` sjekket `community_admins` i sin egen USING-clause, noe som skapte en uendelig løkke når andre tabeller (f.eks. `posts`) prøvde å verifisere admin-status
**Løsning:** Separerte SELECT policy (permissiv `USING (TRUE)`) fra INSERT/UPDATE/DELETE policies (restriktive). Dette forhindrer rekursjon siden SELECT-operasjoner fra andre tabeller ikke lenger trigger de restriktive sjekkene.
**Migrasjonsfil:** `supabase/migrations/20241214_fix_community_admins_recursion.sql`
**Fil:** `supabase/migrations/20241213_phase5_communities.sql:115-124`

### ✅ MEDIUM: Hard refresh hver 40. sekund i lokal utvikling (2025-12-14)
**Status:** LØST
**Alvorlighet:** 🟡 MEDIUM
**Beskrivelse:** Nettsiden gjorde hard refresh hvert 40. sekund under lokal utvikling (`npm run dev`)
**Årsak:** Next.js sitt Hot Module Replacement (HMR) WebSocket prøvde å koble til `ws://localhost:3002/_next/webpack-hmr` i stedet for port 3000, noe som førte til gjentatte tilkoblingsfeil og recovery-refreshes
**Løsning:** Ryddet Next.js cache (`.next`-mappen) og restartet dev-server. HMR WebSocket kobler nå korrekt til port 3000.
**Fix:**
```bash
cd samiske
rm -rf .next
npm run dev
# Hard refresh i nettleser: Cmd+Shift+R
```

### ✅ MEDIUM: PostCard.tsx for stor (2025-12-12)
**Status:** LØST
**Løsning:** Splittet i 6 filer: PostCard.tsx (670 linjer), PostActions.tsx, PostComments.tsx, EditPostDialog.tsx, PostDialogContent.tsx, types.ts, utils.ts

### ✅ MEDIUM: Memory leaks i React
**Status:** LØST
**Løsning:** Alle subscriptions har nå korrekt cleanup. RightSidebar.tsx fikset med useMemo.

### ✅ KRITISK: Service Role Key eksponert
**Status:** LØST
**Løsning:** Opprettet ny `sb_secret_` nøkkel. Gammel nøkkel er ugyldig.

### ✅ KRITISK: Åpne RLS policies
**Status:** LØST
**Løsning:** Fikset policies for email_subscribers, conversations, conversation_participants

### ✅ HØY: Delete account uten beskyttelse
**Status:** LØST
**Løsning:** Passordbekreftelse kreves nå før kontosletting

### ✅ KRITISK: Manglende error handling
**Status:** LØST
**Løsning:** Toast notifications (sonner) lagt til med brukervenlige feilmeldinger

### ✅ KRITISK: N+1 query problem
**Status:** LØST
**Løsning:** Batch-fetch i Feed.tsx - redusert fra 31 til 4 queries

### ✅ HØY: Søk fungerte ikke
**Status:** LØST
**Beskrivelse:** Søkefunksjon var faktisk allerede implementert og fungerer (Cmd+K)

### ✅ MEDIUM: SMS uten backend
**Status:** LØST
**Løsning:** SMS-seksjonen fjernet fra innstillinger-siden

### ✅ Manglende profiler for brukere
**Løsning:** SQL INSERT for å opprette manglende profiler

### ✅ Auth-tilstand ikke synkronisert
**Løsning:** Byttet til `window.location.href` for hard reload

### ✅ Supabase-klient ustabil referanse
**Løsning:** `useMemo(() => createClient(), [])` for stabil referanse

### ✅ Vercel miljøvariabler med linjeskift
**Løsning:** Slettet og la inn på nytt uten linjeskift

### ✅ LAV: Manglende PWA-ikoner
**Status:** LØST
**Alvorlighet:** 🟢 LAV
**Beskrivelse:** `/icons/icon-192x192.png` returnerte 404
**Løsning:** Genererte ikoner med sharp (icon-192x192.png og icon-512x512.png)

---

## Kjente begrensninger

- Kalendervisning tas i senere versjon
- PWA-oppsett ikke fullført

---

## Feilsøkingstips

### Utviklingsserver starter ikke
```bash
cd /path/to/samiske
rm -rf node_modules
npm install
npm run dev
```

### Supabase-tilkobling feiler
- Sjekk at .env.local har riktige verdier
- Sjekk at Supabase-prosjektet kjører

### Vercel deploy feiler
- Kjør `npm run build` lokalt for å finne feil
- Sjekk miljøvariabler (ingen linjeskift!)

### E-post sendes ikke
- Sjekk SMTP-variabler i Supabase Edge Functions Secrets
- Sjekk email_queue tabellen:
  ```sql
  SELECT * FROM email_queue WHERE status = 'failed';
  ```
