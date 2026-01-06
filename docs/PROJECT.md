# PROJECT.md - samiske.no

> **AI: Les denne filen først ved hver ny chat-sesjon.**  
> Sist oppdatert: 2025-12-26

## Hva er dette prosjektet?

samiske.no er et sosialt medium og community-plattform for det samiske folk, bygget med moderne teknologi og AI-assistert utvikling.

### Hovedfunksjoner

- **Feed & innlegg** - Kronologisk feed med standard-innlegg og arrangementer
- **Geografisk hierarki** - Sápmi → Land → Språkområder → Kommuner → Steder
- **Sosiale funksjoner** - Venner, direktemeldinger, grupper, vennesirkler
- **Samfunn (Communities)** - Bedrifter og organisasjoner med produkter/tjenester
- **Arrangementer** - Events med RSVP og kalenderintegrasjon
- **Universelt søk** - 8 kategorier med caching
- **Admin-panel** - Moderering, statistikk, bug-rapporter

---

## Tech Stack

| Kategori | Teknologi | Versjon/Detaljer |
|----------|-----------|------------------|
| **Frontend** | Next.js | 15 (App Router) |
| **Språk** | TypeScript | Strict mode |
| **Styling** | Tailwind CSS | + shadcn/ui komponenter |
| **Backend** | Supabase | PostgreSQL + Realtime |
| **Auth** | Supabase Auth | Auto-confirm aktivert |
| **Storage** | Supabase Storage | + Image Transform |
| **Video** | Bunny Stream | Library 567838 |
| **Hosting** | Vercel | Produksjon + Preview |
| **Repo** | GitHub | Privat repository |

---

## Prosjektstatus

| Status | Verdi |
|--------|-------|
| **Fase** | Live med aktive brukere |
| **URL** | samiske.no |
| **Sikkerhetsscore** | 8/10 |
| **Kodekvalitet** | 7/10 |

### Fullførte hovedprosjekter
- ✅ Sapmi-transformasjon (9 faser) - Des 2025
- ✅ Universelt søk (8 kategorier) - Des 2025
- ✅ Admin-panel med moderering - Des 2025
- ✅ Media Service (sentralisert bildehåndtering) - Des 2025
- ✅ @mention-system (7 entitetstyper) - Des 2025

### Pågående
- 🔄 SPA-konvertering (Fase 1/6 fullført)
- 🔄 Post-Composer testing (75% fullført)
- 🔄 Media Service manuell testing (2/7 fullført)

---

## Viktige filer å lese

| Fil | Når du skal lese den |
|-----|---------------------|
| `docs/STATUS.md` | Nåværende tilstand, bugs, pågående arbeid |
| `docs/BACKLOG.md` | Hva som skal gjøres |
| `docs/guides/AGENTS.md` | AI-roller og slash-kommandoer |
| `docs/guides/CONVENTIONS.md` | Før du skriver kode |
| `docs/prd/[feature].md` | Når du jobber med spesifikk feature |
| `docs/security/SECURITY.md` | Ved sikkerhetsarbeid |

---

## Mappestruktur (kode)

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API-endepunkter
│   ├── admin/              # Admin-panel
│   ├── kalender/           # Kalender-side
│   ├── innlegg/[id]/       # Innlegg-detalj
│   ├── bruker/[username]/  # Brukerprofil
│   ├── samfunn/[slug]/     # Community-side
│   ├── grupper/            # Grupper
│   └── sapmi/              # Geografisk hierarki
│
├── components/
│   ├── ui/                 # shadcn/ui komponenter
│   ├── layout/             # Header, Sidebar, Footer, HomeLayout
│   ├── posts/              # PostCard, PostActions, CreatePostSheet
│   ├── feed/               # Feed-komponent
│   ├── social/             # Venner, meldinger
│   ├── search/             # UnifiedSearchBar, SearchResultsList
│   ├── geography/          # GeographySelector, ImageUploadModal
│   ├── admin/              # Admin-komponenter (13 filer)
│   └── onboarding/         # OnboardingWizard
│
├── lib/
│   ├── supabase/           # client.ts, server.ts
│   ├── media/              # MediaService (5 filer)
│   ├── search/             # Søkefunksjoner og cache
│   ├── navigation/         # SPA-utils, useLinkInterceptor
│   └── config/             # sidebar.ts
│
└── hooks/                  # Custom React hooks
```

---

## Database-struktur

### Kjernetabeller
- `profiles` - Brukerprofiler
- `posts` - Innlegg og arrangementer
- `comments` - Kommentarer
- `likes` / `comment_likes` - Likes

### Sosiale funksjoner
- `friendships` - Venneforespørsler
- `messages` / `conversations` - Direktemeldinger
- `groups` / `group_members` - Grupper

### Geografisk hierarki
- `regions` - Sápmi
- `countries` - Norge, Sverige, Finland, Russland
- `language_areas` - 7 språkområder
- `municipalities` - Kommuner
- `places` - Steder
- `user_starred_*` - Brukerens favoritter

### Media & System
- `media` - Sentralisert bildelagring
- `media_audit_log` - GDPR-sporing
- `feedback` / `notifications` - System

---

## Eksterne tjenester

| Tjeneste | Formål | Dashboard |
|----------|--------|-----------|
| **Supabase** | Database, Auth, Storage, Realtime | supabase.com/dashboard |
| **Vercel** | Hosting, Preview deploys | vercel.com/dashboard |
| **Bunny.net** | Video streaming (Stream) | bunny.net |
| **GitHub** | Kodeversjonering | github.com |
| **Google Cloud** | Tenor GIF API | console.cloud.google.com |

---

## Designprinsipper

1. **UI-språk:** Kun norsk
2. **Kode-språk:** Kun engelsk
3. **Ikoner:** Lucide icons (ingen emojis i UI)
4. **Farger:** Samiske flaggfarger som aksenter
5. **Ingen page reloads:** SPA-opplevelse (pågående)

---

## Kjente begrensninger

1. **Auto-confirm brukere** - Dokumentert risiko, akseptert
2. **Ingen gruppechat ennå** - Kun 1-1 meldinger
3. **E-postbekreftelse** - Ikke implementert (venter til spam blir problem)
4. **PWA offline** - Ikke implementert

---

## Migrasjoner

**Plassering:** `supabase/migrations/`  
**Antall:** ~95 filer (per des 2025)  
**Navnekonvensjon:** `YYYYMMDD_beskrivelse.sql`

⚠️ **OBS:** Noen filer har `2024`-prefiks, noen `2025`. Ikke endre dette.

**Hvordan kjøre:** Via Supabase Dashboard > SQL Editor (ikke CLI)

---

## Kontakt

- **Byggherre:** [Du]
- **AI-assistent:** Claude (Anthropic)
- **Metodikk:** Builder Codex-inspirert dokumentasjonssystem

---

**Sist oppdatert:** 2025-12-26  
**Oppdatert av:** Claude (migrering fra eksisterende docs)
