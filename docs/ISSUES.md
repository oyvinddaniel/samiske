# Problemlogg: samiske.no

## Sist oppdatert: 2025-12-12

---

## AKTIVE SIKKERHETSPROBLEMER

### KRITISK: Service Role Key eksponert
**Status:** AKTIV - MÅ FIKSES UMIDDELBART
**Alvorlighet:** 🔴 KRITISK
**Beskrivelse:** Service Role Key ligger i .env.local og kan være committed til git. Gir full admin-tilgang til databasen.
**Løsning:**
1. Roter nøkkelen i Supabase Dashboard → Settings → API
2. Oppdater kun i Vercel Environment Variables
3. Fjern fra .env.local

### KRITISK: Åpne RLS policies
**Status:** AKTIV - MÅ FIKSES UMIDDELBART
**Alvorlighet:** 🔴 KRITISK
**Beskrivelse:** `email_subscribers`, `conversations`, `conversation_participants` har `WITH CHECK (true)` - hvem som helst kan skrive data.
**Løsning:** Se NEXT-STEPS.md Fase 1.2 for SQL-fix

### HØY: Delete account uten beskyttelse
**Status:** AKTIV
**Alvorlighet:** 🟠 HØY
**Beskrivelse:** Mangler passordbekreftelse og CSRF-token
**Løsning:** Legg til passordbekreftelse i delete-account API

### HØY: Auto-confirm users
**Status:** DOKUMENTERT RISIKO
**Alvorlighet:** 🟠 HØY
**Beskrivelse:** Brukere bekreftes automatisk uten e-postvalidering - muliggjør spam og impersonering
**Beslutning:** Behold for nå, planlegg overgang til e-postbekreftelse (Fase 5)

---

## AKTIVE KODEKVALITETSPROBLEMER

### KRITISK: Manglende error handling
**Status:** AKTIV
**Alvorlighet:** 🔴 KRITISK
**Beskrivelse:** 80% av Supabase queries håndterer ikke feil. Brukere ser ingen feilmeldinger.
**Løsning:** Gå gjennom alle queries, legg til try/catch og toast notifications

### KRITISK: N+1 query problem
**Status:** AKTIV
**Alvorlighet:** 🔴 KRITISK
**Beskrivelse:** Feed gjør 31 queries for 10 innlegg (bør være 2-3)
**Fil:** `src/components/feed/Feed.tsx`
**Løsning:** Batch-fetch likes og comments counts

### HØY: PostCard.tsx for stor
**Status:** AKTIV
**Alvorlighet:** 🟠 HØY
**Beskrivelse:** 1139 linjer - vanskelig å vedlikeholde
**Fil:** `src/components/posts/PostCard.tsx`
**Løsning:** Splitt i 4 komponenter (PostCard, PostActions, PostComments, EditPostDialog)

### HØY: Memory leaks i React
**Status:** AKTIV
**Alvorlighet:** 🟠 HØY
**Beskrivelse:** Supabase subscriptions ryddes ikke alltid opp ordentlig
**Løsning:** Gjennomgå alle useEffect med subscriptions, sikre cleanup

---

## AKTIVE FUNKSJONALITETSPROBLEMER

### HØY: Søk fungerer ikke
**Status:** AKTIV
**Alvorlighet:** 🟠 HØY
**Beskrivelse:** SearchModal åpnes (Cmd+K), men ingen søkefunksjon er implementert
**Fil:** `src/components/search/SearchModal.tsx`
**Løsning:** Implementer søk i innlegg og brukere

### MEDIUM: SMS uten backend
**Status:** BESLUTTET FJERNES
**Alvorlighet:** 🟡 MEDIUM
**Beskrivelse:** SMS-innstilling vises i UI, men gjør ingenting
**Fil:** `src/app/innstillinger/page.tsx`
**Løsning:** Fjern SMS-toggle fra UI

### MEDIUM: Manglende tilgjengelighet (a11y)
**Status:** AKTIV
**Alvorlighet:** 🟡 MEDIUM
**Beskrivelse:** Aria-labels og keyboard navigation mangler steder
**Løsning:** Legg til aria-labels på icon-buttons, keyboard nav for bubbles

---

## Løste problemer

### [2025-12-12] Manglende profiler for brukere

**Problem:** Statistikk i admin viste 8 brukere, men auth.users hadde 23.

**Årsak:** 15 brukere manglet profil i profiles-tabellen. Triggeren `on_auth_user_created` hadde ikke kjørt for disse.

**Løsning:**
```sql
INSERT INTO public.profiles (id, email, full_name)
SELECT u.id, u.email, u.raw_user_meta_data->>'full_name'
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
```

### [2025-12-12] Auth-tilstand ikke synkronisert mellom komponenter

**Problem:** Utlogging oppdaterte knapper i Header, men resten av siden viste fortsatt innlogget tilstand.

**Løsning:**
- Byttet fra `router.push()` + `router.refresh()` til `window.location.href = '/'`
- Hard page reload sikrer at all klient-side state nullstilles

### [2025-12-12] Supabase-klient ustabil referanse

**Problem:** Auth-tilstand var inkonsistent mellom renders.

**Løsning:**
- Bruker `useMemo(() => createClient(), [])` for stabil referanse
- Bruker `getSession()` først (cached), deretter `getUser()` som fallback

### [2025-12-12] Vercel miljøvariabler med linjeskift

**Problem:** Registrering feilet med "Failed to execute 'fetch' on 'Window': Invalid value"

**Årsak:** NEXT_PUBLIC_SUPABASE_ANON_KEY ble limt inn med linjeskift i Vercel

**Løsning:** Slettet variabelen og la den inn på nytt som én sammenhengende linje

---

## Kjente begrensninger

- SMS-varsling er ikke implementert (fjernes fra UI)
- Søkefunksjon tas i Fase 4
- Kalendervisning tas i senere versjon
- Sletting av egne innlegg ikke implementert ennå

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
- Sjekk nettverkstilgang

### Styling vises ikke riktig
- Sjekk at Tailwind er konfigurert
- Tøm nettleser-cache
- Restart utviklingsserver

### Vercel deploy feiler
- Sjekk at miljøvariabler er riktig satt (ingen linjeskift!)
- Kjør `npm run build` lokalt for å finne feil
- Se deploy-logg i Vercel dashboard

### Endringer vises ikke på produksjon
- Sjekk at du har pushet til GitHub
- Vent 1-2 minutter på Vercel deploy
- Sjekk Vercel dashboard for deploy-status
- Hard refresh i nettleser (Cmd+Shift+R / Ctrl+Shift+R)

### Endringer vises ikke i dev
- Sjekk at dev-serveren kjører (`npm run dev`)
- Sjekk terminal for kompileringsfeil
- Restart dev-server ved behov
- Slett `.next` mappen og start på nytt

### E-post sendes ikke
- Sjekk at SMTP-variabler er satt i Supabase Edge Functions Secrets
- Test Edge Function manuelt via Supabase Dashboard
- Sjekk email_queue tabellen for feilede e-poster:
  ```sql
  SELECT * FROM email_queue WHERE status = 'failed';
  ```
