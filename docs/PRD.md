# Product Requirements Document (PRD)

## Status: Under utvikling

---

## 1. Oversikt

**Prosjektnavn:** Samisk miljø Trondheim - Kommunikasjonsplattform

**Problemstilling:**
- Det samiske miljøet i Trondheim har utfordringer med intern kommunikasjon
- Facebook, som brukes i dag, struper synligheten av innlegg algoritmisk
- Ikke alle får se viktige meldinger om arrangementer og aktiviteter

**Løsning:**
En enkel, nettbasert plattform der miljøet kan dele:
- Nyheter
- Aktiviteter
- Arrangementer
- Spørsmål
- Annen relevant informasjon for miljøet

**Nøkkelkrav:**
- Enkel løsning (ikke overkomplisert)
- Nettbasert (ingen installasjon)
- Beskyttelse mot trolling/spam via godkjenningssystem for brukere

## 2. Målgruppe
Det samiske miljøet i Trondheim (ikke så mange personer)

## 3. Hovedfunksjoner (MVP)

### 3.1 Innlegg/Feed
- Kronologisk feed med alle innlegg
- Kategorifiltrering (klikk på kategori for å filtrere)
- Innlegg kan være offentlige eller kun for medlemmer

### 3.2 Innleggstyper
**Standard innlegg:**
- Bilde (valgfritt)
- Tittel
- Tekst/beskrivelse
- Dato (valgfritt)
- Kategori

**Arrangement:**
- Bilde (valgfritt)
- Tittel
- Tekst/beskrivelse
- Dato (påkrevd)
- Klokkeslett (påkrevd)
- Sted/adresse (påkrevd)

### 3.3 Brukerinteraksjon
- Kommentere innlegg (krever innlogging)
- Like innlegg (krever innlogging)

### 3.4 Brukerroller
- **Admin/Moderator:** Kan moderere og slette innlegg
- **Medlem:** Kan opprette, kommentere og like

### 3.5 Varsling
- E-postliste for nye innlegg
- SMS-varsling (hvis mulig)

### 3.6 Brukerregistrering
- Åpen registrering i starten
- Mulighet for godkjenning av nye medlemmer senere

## 4. Brukeropplevelse

### 4.1 Designprinsipper
- Moderne og minimalistisk
- Maks 1-2 klikk for å finne det man trenger
- Intuitivt og enkelt

### 4.2 Visuell stil
- Lyse bakgrunner (hvit/lys blå gradienter)
- Kortbasert layout med avrundede hjørner
- Sidebar-navigasjon
- Myke skygger
- Samiske farger som aksentfarger (rød, blå, grønn, gul)

### 4.3 Responsivt design
- Fungerer like godt på mobil og desktop
- PWA-forberedt for fremtidig app-installasjon

## 5. Tekniske krav

### 5.1 Tech Stack
| Komponent | Teknologi |
|-----------|-----------|
| Frontend | Next.js (React) |
| Styling | Tailwind CSS + Shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Autentisering | Supabase Auth |
| Hosting | Vercel |
| Domene | samiske.no |

### 5.2 Sikkerhet
- Sikker autentisering via Supabase
- Row Level Security i databasen
- HTTPS via Vercel

## 6. Implementeringsplan

### Fase 1: Prosjektoppsett
- Opprett Next.js-prosjekt med TypeScript
- Konfigurer Tailwind CSS og Shadcn/ui
- Sett opp Supabase-prosjekt
- Koble til Vercel

### Fase 2: Database og autentisering
- Design databaseskjema (brukere, innlegg, kategorier, kommentarer, likes)
- Implementer Supabase Auth (registrering, innlogging)
- Sett opp Row Level Security

### Fase 3: Kjernefunksjonalitet
- Hovedfeed med kronologisk visning
- Opprette innlegg (standard og arrangement)
- Kategorifiltrering
- Offentlig/privat innlegg

### Fase 4: Brukerinteraksjon
- Kommentarsystem
- Like-funksjon
- Brukerprofiler

### Fase 5: Admin/Moderering
- Admin-panel
- Moderering av innlegg
- Brukeradministrasjon

### Fase 6: Varsling
- E-postliste og varsling
- SMS-integrasjon (valgfritt)

### Fase 7: Ferdigstilling
- PWA-oppsett
- Testing og feilretting
- Deploy til produksjon (samiske.no)

---

## 7. Utviklingsprosess (Vibe Coding)

### 7.1 Prinsipper
- **Steg-for-steg:** Vi bygger én ting om gangen, tester, og går videre
- **Forklaringer:** Jeg forklarer hva jeg gjør i enkle termer
- **Sjekkpunkter:** Etter hver fase sjekker vi sammen at alt fungerer
- **Forhåndsvisning:** Du kan se endringer lokalt før de går live

### 7.2 Utviklingsarbeidsflyt

**For hver funksjon:**
1. **Planlegg** - Jeg forklarer hva vi skal bygge
2. **Kode** - Jeg skriver koden
3. **Test** - Vi sjekker at det fungerer
4. **Gjennomgang** - Du gir tilbakemelding
5. **Juster** - Vi fikser eventuelle problemer

### 7.3 Kvalitetssikring

**Før hver fase er ferdig:**
- [ ] Fungerer på desktop
- [ ] Fungerer på mobil
- [ ] Ingen feilmeldinger i konsollen
- [ ] Ser ut som designet
- [ ] Brukervennlig og intuitivt

### 7.4 Verktøy og kommandoer

**Utviklingsserver:**
```bash
npm run dev          # Start lokal server (localhost:3000)
```

**Testing:**
```bash
npm run build        # Sjekk at alt kompilerer
npm run lint         # Sjekk kodekvalitet
```

**Deploy:**
```bash
git push             # Push til Vercel (automatisk deploy)
```

### 7.5 Feilsøking

Når noe ikke fungerer:
1. Les feilmeldingen
2. Finn årsaken
3. Fiks problemet
4. Test at det fungerer
5. Gå videre

### 7.6 Kommunikasjon underveis

- Jeg forteller deg hva jeg gjør
- Du sier fra hvis noe ser feil ut
- Vi tar pauser mellom fasene for å sjekke status
- Spør hvis noe er uklart!

### 7.7 Prosjektlogging og kontinuitet

**Formål:** Sikre at ny AI-sesjon kan fortsette der vi slapp

**Loggfiler i prosjektet:**

```
/docs/
  ├── PROGRESS.md      # Status og fremdrift
  ├── DECISIONS.md     # Viktige beslutninger tatt
  ├── ISSUES.md        # Kjente problemer og løsninger
  └── NEXT-STEPS.md    # Hva som skal gjøres neste gang
```

**PROGRESS.md innhold:**
```markdown
# Prosjektstatus: samiske.no

## Sist oppdatert: [dato]

## Fullførte faser
- [x] Fase 1: Prosjektoppsett
- [ ] Fase 2: Database og autentisering
- [ ] Fase 3: Kjernefunksjonalitet
...

## Sist fullførte oppgave
[Beskrivelse av hva som ble gjort]

## Nåværende status
[Hva fungerer, hva fungerer ikke]

## Neste steg
[Hva som skal gjøres når AI starter på nytt]
```

**Ved avslutning av hver sesjon:**
1. Oppdater PROGRESS.md med status
2. Logg eventuelle feil i ISSUES.md
3. Skriv neste steg i NEXT-STEPS.md

**Ved start av ny sesjon:**
1. Les alle loggfiler i /docs/
2. Forstå nåværende status
3. Fortsett fra der vi slapp

### 7.8 Instruksjonsfiler

**CLAUDE.md (hovedinstruksjon i prosjektrot):**
```markdown
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
- npm run dev - Start utviklingsserver
- npm run build - Bygg for produksjon
- npm run lint - Sjekk kodekvalitet
```

**Mappestruktur som opprettes:**
```
samiske/
├── CLAUDE.md                 # Hovedinstruksjon for AI
├── README.md                 # Prosjektbeskrivelse
├── docs/
│   ├── PRD.md               # Denne PRD-en (kopi)
│   ├── PROGRESS.md          # Fremdriftsstatus
│   ├── DECISIONS.md         # Beslutningslogg
│   ├── ISSUES.md            # Problemlogg
│   └── NEXT-STEPS.md        # Neste steg
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React-komponenter
│   ├── lib/                 # Hjelpefunksjoner
│   └── types/               # TypeScript-typer
├── public/                  # Statiske filer
└── supabase/               # Database-migrasjoner
```

---

## Spørsmål og svar

### Spørsmål 1: Hovedidé
**Svar:** Kommunikasjonsplattform for det samiske miljøet i Trondheim. Erstatte Facebook pga. algoritmisk struping. Enkel nettside for nyheter, aktiviteter, arrangementer, spørsmål. Må ha godkjenningssystem for å unngå spam/trolling.

### Spørsmål 2: Synlighet og tilgang
**Svar:**
- Innlegg skal kunne merkes som **offentlige** (synlig for alle) eller **kun for medlemmer** (krever innlogging)
- Alle kan lese offentlige innlegg
- For å kommentere eller engasjere seg må man være innlogget
- I starten: Åpen brukerregistrering (hvem som helst kan opprette konto)
- Senere: Mulighet for å kreve godkjenning av nye medlemmer (når siden blir populær)

### Spørsmål 3: Innholdsstruktur
**Svar:**
- Alle innlegg vises i én felles kronologisk feed
- Hvert innlegg kan tagges/kategoriseres (f.eks. aktivitet, arrangement, møte, nyhet, osv.)
- Brukere kan klikke på kategorier for å filtrere og finne spesifikke typer innhold

### Spørsmål 4: Felter og brukeropplevelse
**Svar:**
- Alt skal være intuitivt og enkelt
- Maks 1-2 klikk for å finne det man trenger
- Ingen leting – alt skal være lett tilgjengelig

### Spørsmål 5: Kategorier og felter (forenklet)
**Svar:**
- Hold det enkelt – ikke for mange spesialfelter

**Standard innlegg (de fleste kategorier):**
- Bilde (valgfritt)
- Tittel
- Tekst/beskrivelse
- Dato (valgfritt)
- Kategori-tag

**Arrangement (utvidet):**
- Bilde (valgfritt)
- Tittel
- Tekst/beskrivelse
- Dato (påkrevd)
- Klokkeslett (påkrevd)
- Sted/adresse (påkrevd)

### Spørsmål 6: Varsling
**Svar:**
- **Primært:** Besøke nettsiden og se feeden
- **E-postliste:** Brukere kan abonnere med e-post og få varsel ved nye innlegg
- **SMS-varsling:** Hvis mulig, også SMS-varsel ved nye innlegg
- Åpen for gode løsninger og alternativer

### Spørsmål 7: Brukerroller
**Svar:**
- **Administrator/Moderator:** Kan moderere og slette innlegg
- **Alle innloggede medlemmer:** Kan opprette innlegg, kommentere og like
- Kombinasjon med forskjellige rettigheter

### Spørsmål 8: Design og visuell stil
**Svar:**
- **Navn:** samiske.no (+ tagline om det samiske miljøet i Trondheim)
- **Stil:** Moderne og minimalistisk

**Designinspirasjon (fra bildene):**
- Lyse bakgrunner (hvit/lys blå/lavendel gradienter)
- Kortbasert layout med avrundede hjørner
- Sidebar-navigasjon på venstre side
- Myke skygger og subtile gradienter
- Mye whitespace
- Brukerprofil øverst til høyre
- Tydelig søkefelt

### Spørsmål 9: Fargepalett
**Svar:**
- Bruk de samiske fargene som aksentfarger (rød, blå, grønn, gul fra det samiske flagget)

### Spørsmål 10: Mobil og app
**Svar:**
- Må fungere like godt på mobil som desktop (responsivt design)
- Fremtidig mål: Kunne lage en installerbar app
- Anbefaling: Bygge som PWA (Progressive Web App) fra start

### Spørsmål 11: Hosting og teknisk oppsett
**Svar:**
- **Domene:** samiske.no (allerede kjøpt)
- **Hosting:** Vercel
- **Database:** Åpen for anbefalinger – sikkerhet er viktig
- **Autentisering:** Må være sikker mot hacking

**Anbefaling:**
- **Supabase** for database + autentisering (alt-i-ett, sikker, gratis tier)

### Spørsmål 12: Språk
**Svar:**
- Brukergrensesnittet skal kun være på norsk
- Bekreftet: Bruker Supabase for database og autentisering

### Spørsmål 13: Frontend-rammeverk
**Svar:**
- **Next.js (React)** - bekreftet
- Tailwind CSS + Shadcn/ui for moderne design
- dnd-kit eller framer-motion for fremtidig dra-og-slipp-funksjonalitet

### Spørsmål 14: MVP-omfang
**Svar:**
- Hold MVP enkelt og fokusert
- **Kjernefunksjoner for MVP:**
  1. Opprette innlegg/arrangementer
  2. Kronologisk feed
  3. Kategorier med filtrering
- Andre funksjoner (søk, kalender, galleri) tas senere
