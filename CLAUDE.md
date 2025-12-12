# samiske.no - Prosjektinstruksjoner

## Om prosjektet
Kommunikasjonsplattform for det samiske miljøet i Trondheim.
Erstatter Facebook for intern kommunikasjon om arrangementer og aktiviteter.

## Tech Stack
- Frontend: Next.js 14 (App Router) + TypeScript
- Styling: Tailwind CSS + Shadcn/ui
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth
- Hosting: Vercel
- Domene: samiske.no

## Viktige filer å lese først
1. /docs/PROGRESS.md - Hvor langt vi har kommet
2. /docs/NEXT-STEPS.md - Hva som skal gjøres nå
3. /docs/ISSUES.md - Kjente problemer
4. /docs/DECISIONS.md - Beslutninger tatt
5. /docs/PRD.md - Full produktspesifikasjon

## Designprinsipper
- Moderne, minimalistisk design
- Samiske farger (rød, blå, grønn, gul) som aksent
- Maks 1-2 klikk for å finne noe
- Mobile-first, responsivt

## Utviklingsregler
- Test hver funksjon før du går videre
- Oppdater /docs/PROGRESS.md etter hver fullført oppgave
- Forklar hva du gjør i enkle termer
- Spør hvis noe er uklart

## Kommandoer
```bash
npm run dev      # Start utviklingsserver (localhost:3000)
npm run build    # Bygg for produksjon
npm run lint     # Sjekk kodekvalitet
```

## Mappestruktur
```
samiske/
├── CLAUDE.md                 # Denne filen
├── docs/                     # Dokumentasjon
│   ├── PRD.md               # Produktkrav
│   ├── PROGRESS.md          # Fremdrift
│   ├── DECISIONS.md         # Beslutninger
│   ├── ISSUES.md            # Problemer
│   └── NEXT-STEPS.md        # Neste steg
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React-komponenter
│   │   └── ui/             # Shadcn/ui komponenter
│   ├── lib/                 # Hjelpefunksjoner
│   └── types/               # TypeScript-typer
├── public/                  # Statiske filer
└── supabase/               # Database-migrasjoner
```

## MVP Funksjoner
1. Kronologisk feed med innlegg
2. Kategorifiltrering
3. Standard innlegg + arrangementer
4. Offentlige og medlems-only innlegg
5. Kommentarer og likes
6. Brukerregistrering og innlogging
7. Admin/moderator-funksjoner
