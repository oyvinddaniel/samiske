# Arkitektur-veiledning for samiske.no

## Overordnet arkitektur

```
┌─────────────────────────────────────────────────────────┐
│                      Vercel                              │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                 Next.js 15 (App Router)             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │ │
│  │  │   Pages      │  │  API Routes  │  │  Static   │  │ │
│  │  │  (src/app)   │  │ (src/app/api)│  │  (public) │  │ │
│  │  └──────────────┘  └──────────────┘  └───────────┘  │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                      Supabase                            │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   Postgres   │  │    Auth      │  │   Realtime    │  │
│  │  (Database)  │  │  (Sessions)  │  │ (WebSockets)  │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │   Storage    │  │ Edge Funcs   │                     │
│  │   (Bilder)   │  │ (E-post)     │                     │
│  └──────────────┘  └──────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

---

## Mappestruktur detaljert

```
src/
├── app/                      # App Router
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Hovedside (/)
│   ├── api/                  # API-endepunkter
│   │   ├── delete-account/   # Slett konto
│   │   └── ...
│   ├── admin/                # Admin-panel
│   ├── innstillinger/        # Brukerinnstillinger
│   ├── ny/                   # Opprett innlegg
│   ├── onboarding/           # Onboarding-wizard
│   ├── bokmerker/            # Lagrede innlegg
│   └── profil/               # Min profil
│
├── components/
│   ├── ui/                   # Shadcn/ui komponenter
│   ├── layout/               # Header, Sidebar, Footer
│   ├── posts/                # PostCard, PostActions, etc.
│   ├── feed/                 # Feed-komponent
│   ├── social/               # Venner, meldinger
│   ├── search/               # Søkefunksjon
│   ├── onboarding/           # OnboardingWizard
│   └── geography/            # GeographySelector
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser-klient
│   │   └── server.ts         # Server-klient
│   ├── geography.ts          # Lokasjonsfunksjoner
│   └── utils.ts              # Hjelpefunksjoner
│
└── hooks/                    # Custom React hooks (om noen)
```

---

## Dataflyt

### Innlegg-oppretting
```
1. Bruker fyller ut skjema (/ny)
2. Klient validerer input (lengde, type)
3. Supabase insert med auth.uid()
4. RLS policy verifiserer bruker
5. Realtime pusher til andre klienter
6. Feed oppdateres
```

### Autentisering
```
1. Bruker logger inn via Supabase Auth
2. Session lagres i cookie
3. Middleware sjekker session på beskyttede ruter
4. API-ruter verifiserer auth.uid()
```

---

## Komponent-hierarki

```
RootLayout
├── Header
│   ├── Logo
│   ├── SearchButton (Cmd+K)
│   ├── NotificationBell
│   └── UserMenu
├── MainContent
│   ├── Sidebar (desktop)
│   │   ├── CategoryFilter
│   │   └── MyPlaces
│   ├── Feed
│   │   └── PostCard (mange)
│   │       ├── PostActions
│   │       ├── PostComments
│   │       └── EditPostDialog
│   └── RightSidebar (desktop)
├── SocialPanel (flytende)
└── FeedbackBubble (flytende)
```

---

## Tilstandshåndtering

### Lokal state
- `useState` for komponent-spesifikk state
- `useMemo` for Supabase-klient (stabil referanse)

### Server state
- Supabase Realtime for sanntidsoppdateringer
- Refetch ved brukerhandlinger

### URL state
- Kategori-filter via URL-params
- Søkeresultater via SearchModal

---

## Ytelsesoptimaliseringer

1. **Bildekomprimering** - browser-image-compression før opplasting
2. **Batch-fetching** - Hent relatert data i én query
3. **Lazy loading** - Bilder lastes ved behov
4. **Memoization** - useMemo for tunge beregninger
5. **Subscription cleanup** - Unsubscribe ved unmount
