# samiske.no

Kommunikasjonsplattform for det samiske miljøet i Trondheim.

## Om prosjektet

samiske.no er en nettbasert plattform som erstatter Facebook for intern kommunikasjon i det samiske miljøet i Trondheim. Plattformen gjør det enkelt å dele arrangementer, aktiviteter, nyheter og annen relevant informasjon uten algoritmisk struping.

## Funksjoner

- Kronologisk feed med innlegg
- Kategorifiltrering
- Arrangementer med dato, tid og sted
- Offentlige og medlems-only innlegg
- Kommentarer og likes
- E-postvarsling
- **Avansert søkesystem med 8 kategorier** (brukere, innlegg, arrangementer, kommentarer, geografi, samfunn, tjenester, produkter)
- Geografi-stjernemerking
- Samfunnsfunksjonalitet
- Tjenester og produkter fra samfunn

## Tech Stack

- **Frontend:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS + Shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Hosting:** Vercel
- **Search:** Custom search system with in-memory caching
- **Icons:** Lucide React

## Kom i gang

### Forutsetninger
- Node.js 18+
- npm
- Supabase-konto

### Installasjon

```bash
# Installer avhengigheter
npm install

# Kopier miljøvariabler
cp .env.example .env.local

# Rediger .env.local med dine Supabase-nøkler
# NEXT_PUBLIC_SUPABASE_URL=din-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=din-nøkkel

# Start utviklingsserver
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000) i nettleseren.

## Kommandoer

```bash
npm run dev      # Start utviklingsserver
npm run build    # Bygg for produksjon
npm run start    # Start produksjonsserver
npm run lint     # Kjør linting
```

## Dokumentasjon

Se `/agent_docs` mappen for full dokumentasjon:
- `search.md` - Komplett søkesystem-dokumentasjon
- `CLAUDE.md` - Rask start-guide og regler

For tidligere dokumentasjon, se `/docs` mappen:
- `PRD.md` - Produktkrav
- `PROGRESS.md` - Prosjektstatus
- `DECISIONS.md` - Beslutningslogg
- `ISSUES.md` - Problemlogg
- `NEXT-STEPS.md` - Neste steg

## Bidra

Dette prosjektet er utviklet for det samiske miljøet i Trondheim.

## Lisens

Privat prosjekt.
