# Problemlogg: samiske.no

## Sist oppdatert: 2025-12-12

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

## LØSTE PROBLEMER (2025-12-12)

### ✅ MEDIUM: PostCard.tsx for stor
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

---

## Kjente begrensninger

- Kalendervisning tas i senere versjon
- Sletting av egne innlegg ikke implementert ennå
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
