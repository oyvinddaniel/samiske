# CLAUDE.md - Instruksjoner for AI-assistert utvikling

> **Prosjekt:** samiske.no - Sosialt nettverk for samer
> **Status:** Produksjon (live med brukere)
> **Kritisk:** Appen har ekte brukere. Alle endringer må være trygge.

---

## Om prosjektet

Samiske.no er et sosialt nettverk for det samiske miljøet i Trondheim. Erstatter Facebook for intern kommunikasjon om arrangementer og aktiviteter.

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Supabase (database + autentisering)
- **Hosting:** Vercel
- **Domene:** samiske.no
- **Språk:** Norsk UI

### Viktige filer å lese først

1. `/docs/PROGRESS.md` - Hvor langt vi har kommet
2. `/docs/NEXT-STEPS.md` - Hva som skal gjøres nå
3. `/docs/ISSUES.md` - Kjente problemer
4. `/docs/DECISIONS.md` - Beslutninger tatt
5. `/docs/SECURITY-AUDIT-2025-12-12.md` - Siste sikkerhetsgjennomgang

### Mappestruktur

```
src/
├── app/                  # Sider og API-ruter
│   ├── api/              # Backend-endepunkter
│   ├── innstillinger/    # Brukerinnstillinger
│   └── ny/               # Opprett nytt innlegg
├── components/           # React-komponenter
│   ├── posts/            # PostCard, PostActions, etc. (refaktorert)
│   ├── feed/             # Feed-komponent
│   └── search/           # Søkefunksjonalitet
└── lib/                  # Hjelpefunksjoner

supabase/
├── schema.sql            # Database-struktur og RLS policies
└── migrations/           # Database-migrasjoner
```

---

## KRITISKE SIKKERHETSREGLER

Disse reglene er UFRAVIKELIGE. Bryt dem aldri.

### 1. Secrets og nøkler

- **ALDRI** commit secrets til git (API-nøkler, service role keys, etc.)
- **ALDRI** bruk Service Role Key i frontend-kode
- **ALLTID** bruk environment variables for sensitive verdier
- **ALLTID** sjekk at `.env.local` er i `.gitignore`

### 2. Database og RLS (Row Level Security)

- **ALLE** tabeller MÅ ha RLS aktivert
- **ALDRI** bruk `WITH CHECK (true)` uten god grunn
- **ALLTID** krev `auth.uid()` for brukerrelaterte operasjoner
- **ALLTID** valider at bruker har tilgang til data de ber om

### 3. API-ruter

- **ALLTID** valider input (lengde, format, type)
- **ALLTID** sjekk autentisering før sensitive operasjoner
- **ALDRI** stol på data fra klienten
- **ALLTID** håndter feil gracefully (ikke eksponer stack traces)

### 4. Brukerdata

- **ALDRI** logg sensitive brukerdata
- **ALLTID** sanitize brukerinput før visning (XSS-beskyttelse)
- **ALLTID** bruk parameteriserte queries (aldri string concatenation)

---

## KVALITETSKRAV

### Feilhåndtering

```typescript
// FEIL - Ingen feilhåndtering
const { data } = await supabase.from('posts').select('*')

// RIKTIG - Med feilhåndtering og toast
const { data, error } = await supabase.from('posts').select('*')
if (error) {
  console.error('Feil ved henting av innlegg:', error)
  toast.error('Kunne ikke hente innlegg')
  return
}
```

### Database-queries

- **UNNGÅ** N+1 queries (ikke hent relatert data i løkker)
- **BRUK** joins eller batch-fetching
- **BEGRENS** resultater med `.limit()` der det gir mening

### Komponentstørrelse

- Komponenter over 300 linjer BØR splittes
- Én komponent = én oppgave
- Ekstraher gjenbrukbar logikk til custom hooks

### TypeScript

- **ALLTID** definer typer for props og state
- **UNNGÅ** `any` - bruk spesifikke typer

---

## SJEKKPUNKTER

### Før HVER endring

- [ ] Kan denne koden eksponere brukerdata?
- [ ] Håndterer jeg alle feilsituasjoner?
- [ ] Validerer jeg input fra brukeren?
- [ ] Er det noen hardkodede secrets?

### Før DEPLOY til produksjon

```markdown
## Pre-deploy sjekkliste

### Sikkerhet
- [ ] Ingen secrets i koden (søk etter "sk_", "key", "password", "secret")
- [ ] Alle nye database-operasjoner har RLS policies
- [ ] Alle API-ruter validerer autentisering
- [ ] Input-validering på alle brukerinput

### Kvalitet
- [ ] `npm run build` kjører uten feil
- [ ] Ingen TypeScript-feil
- [ ] Nye features er testet manuelt
- [ ] Feilhåndtering er på plass
```

---

## REVIEW-RUTINER

### Sikkerhetsreview (kjør ukentlig eller før større endringer)

```
Gjør en full sikkerhetsgjennomgang av prosjektet.

Sjekk spesielt:
1. RLS policies i supabase/schema.sql og migrations
2. API-ruter i src/app/api/
3. Autentiseringssjekker i alle beskyttede ruter
4. Eksponerte secrets eller nøkler
5. Input-validering

Rapporter alle funn med alvorlighetsgrad.
```

### Kodekvalitetsreview (kjør ved behov)

```
Analyser kodekvaliteten i prosjektet.

Se etter:
1. Manglende feilhåndtering på Supabase-queries
2. N+1 query-problemer
3. Komponenter som bør splittes (>300 linjer)
4. Duplisert kode som kan ekstraheres

Gi en score fra 1-10 og prioritert liste over forbedringer.
```

### Pre-deploy review

```
Jeg skal deploye til produksjon.

1. Vis alle endringer siden siste commit
2. Sjekk at ingen secrets er eksponert
3. Verifiser at RLS policies er intakte
4. Bekreft at det er trygt å pushe

Gi et klart JA eller NEI med begrunnelse.
```

---

## STATUS: LØSTE PROBLEMER (2025-12-12)

### Kritisk (LØST)
- [x] Service Role Key rotert - ny `sb_secret_` nøkkel opprettet
- [x] RLS policies fikset på email_subscribers, conversations, conversation_participants

### Høy prioritet (LØST)
- [x] Delete account har passordbekreftelse
- [x] Input-validering: tittel (100), innhold (5000), sted (200)
- [x] PostCard.tsx splittet (1139 → 670 linjer + 5 nye komponenter)

### Medium prioritet (LØST)
- [x] N+1 query problem fikset (31 → 4 queries)
- [x] Søkefunksjon fungerer (Cmd+K)
- [x] SMS fjernet fra UI (ingen backend)
- [x] Toast notifications system (sonner)

---

## GJENSTÅENDE OPPGAVER

### Lav prioritet (kan tas ved behov)
- [ ] Auto-confirm brukere (dokumentert risiko - ta når spam blir problem)
- [ ] Rate limiting på API-ruter
- [ ] Tilgjengelighet (a11y) - aria-labels, keyboard nav

---

## KONVENSJONER

### Commit-meldinger

```
[TYPE] Kort beskrivelse

Typer:
- [FIX] Bugfix
- [FEAT] Ny funksjonalitet
- [SEC] Sikkerhetsrelatert
- [REFACTOR] Kodeomstrukturering
```

### Fil-navngiving

- Komponenter: PascalCase (`PostCard.tsx`)
- Utilities: camelCase (`formatDate.ts`)
- Sider: kebab-case mapper (`/innstillinger/page.tsx`)

### Norsk i UI, engelsk i kode

- Brukersynlig tekst: Norsk
- Variabelnavn, funksjoner: Engelsk

---

## VED SIKKERHETSHENDELSE

1. **IKKE PANIKK**
2. Vurder alvorlighetsgrad
3. Hvis kritisk: Ta ned tjenesten midlertidig
4. Roter kompromitterte nøkler
5. Dokumenter hva som skjedde
6. Fiks problemet

---

## Kommandoer

```bash
npm run dev      # Start utviklingsserver (localhost:3000)
npm run build    # Bygg for produksjon
npm run lint     # Sjekk kodekvalitet
```

---

## Kontekst for Claude Code

1. **Sikkerhet først** - Aldri ta snarveier på sikkerhet
2. **Forklar endringer** - Øyvind lærer, forklar hva og hvorfor
3. **Test før deploy** - Kjør alltid `npm run build`
4. **Små commits** - Én logisk endring per commit
5. **Spør ved tvil** - Bedre å spørre enn å gjette

Prosjekteier har begrenset kodeerfaring. Forklar tekniske konsepter med enkle analogier når relevant.

**Sikkerhetsscore:** 8/10 (per 2025-12-12)
