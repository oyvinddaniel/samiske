# Admin Panel - Dokumentasjon

> Sist oppdatert: 2025-12-18

## Oversikt

Admin-panelet er tilgjengelig på `/admin` og krever at brukeren har `role: 'admin'` i profiles-tabellen.

## Arkitektur

### Layout
- **Venstremeny (sidebar):** Fast navigasjon med kategoriserte lenker
- **Hovedinnhold:** Dynamisk innhold basert på aktiv fane
- **Header:** Global navbar synlig på alle sider (inkludert admin)

### Filer
```
src/app/admin/page.tsx              # Hovedside med sidebar og routing
src/components/admin/
├── AdminDashboard.tsx              # Dashboard med statistikk
├── BugReportsTab.tsx               # Bug-rapporter fra brukere
├── BroadcastMessagesTab.tsx        # Logg inn-meldinger til brukere
├── EmergencyTab.tsx                # Nødstopp-funksjonalitet
├── FeatureRequestsTab.tsx          # Brukerforslag
├── GeographyTab.tsx                # Geografi-administrasjon
├── PostsTab.tsx                    # Alle innlegg
├── ReportsTab.tsx                  # Innrapportert innhold
├── StatsCards.tsx                  # Statistikk-kort
├── UserAnalyticsTab.tsx            # Brukeranalyse
├── index.ts                        # Eksporter
├── types.ts                        # TypeScript-typer
└── utils.ts                        # Hjelpefunksjoner
```

---

## Navigasjon (Sidebar)

### Kategorier og faner

| Kategori | Fane | Beskrivelse |
|----------|------|-------------|
| **Oversikt** | Dashboard | Hovedoversikt med statistikk og brukeradministrasjon |
| | Nødstopp | Vedlikeholdsmodus og nødstoppfunksjoner |
| **Innhold** | Alle innlegg globalt | Alle innlegg på plattformen |
| | Innrapportert | Rapportert innhold fra brukere |
| **System** | Forslag | Brukerforslag (fra forslagskassen) |
| | Bug-rapporter | Feilrapporter fra brukere |
| | Logg inn-meldinger | Broadcast-meldinger ved innlogging |
| | Geografi | Administrer geografiske data |

---

## Fullførte funksjoner

### 1. Dashboard (AdminDashboard.tsx)

**Hovedstatistikk:**
- Totalt antall brukere (fra auth.users)
- Totalt antall innlegg
- Totalt antall kommentarer
- Totalt antall likes

**Auth vs Profiles sammenligning:**
- Viser differanse mellom auth.users og profiles
- Grønn boks hvis synkronisert
- Gul advarselsboks med forklaring hvis differanse

**Aktive brukere:**
- Siste 24 timer
- Siste 7 dager
- Siste 30 dager

**Nye brukere:**
- Registrert i dag
- Registrert denne uken
- Registrert denne måneden

**Aktivitet i dag:**
- Antall pålogginger
- Nye innlegg
- Nye kommentarer

**Engasjement:**
- Snitt kommentarer per innlegg
- Snitt likes per innlegg

**Kollapserbar brukerliste:**
- Viser 5 brukere som standard
- "Vis flere (+10)" knapp
- Rolleendring direkte i listen (Bruker/Moderator/Admin)

**Registreringstrend:**
- Graf over registreringer siste 30 dager

**Sidevisninger:**
- Detaljert aktivitetslogg
- Paginering

### 2. Arkiv-funksjon

Alle tabs med status har nå arkiv-toggle:

**FeatureRequestsTab:**
- Arkiverte statuser: `completed`, `rejected`
- Toggle: "Vis arkivert / Skjul arkivert"
- Badge med antall arkiverte

**BugReportsTab:**
- Arkiverte statuser: `resolved`, `dismissed`
- Toggle: "Vis arkivert / Skjul arkivert"
- Badge med antall arkiverte

**ReportsTab:**
- Arkiverte statuser: `resolved`, `dismissed`
- Toggle: "Vis arkivert / Skjul arkivert"
- Badge med antall arkiverte
- Ny statusfilter-dropdown

### 3. Forslag-funksjon (FeatureRequestsTab)

**Database:** `feature_requests` tabell
```sql
- id: UUID
- user_id: UUID (referanse til profiles)
- title: TEXT
- description: TEXT
- status: 'new' | 'in_progress' | 'completed' | 'rejected' | 'on_hold'
- admin_notes: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**Funksjonalitet:**
- Liste over alle forslag
- Statusfiltrering
- Detaljvisning med admin-notater
- Direktemelding til bruker fra admin

**Brukergrensesnitt (FeatureRequestDropdown):**
- Plus-ikon i navbar
- Dropdown med skjema for nye forslag
- Viser siste 5 forslag anonymt

---

## Gjenstående oppgaver

### Prioritet 1 (Bør gjøres)
- [ ] Slette orphaned auth-brukere (brukere uten profil)
- [ ] Slette orphaned profiler (profiler uten auth-bruker)
- [ ] Bulk-operasjoner på brukere

### Prioritet 2 (Kan gjøres)
- [ ] Eksport av data (CSV/JSON)
- [ ] Avansert søk i alle tabs
- [ ] Statistikk-grafer (charts)
- [ ] Automatisk opprydding av gamle data

### Prioritet 3 (Nice to have)
- [ ] Admin-aktivitetslogg
- [ ] Roller og tilganger for moderatorer
- [ ] Dashboard-widgets som kan tilpasses
- [ ] Varsler for nye rapporter/bugs

---

## Tekniske detaljer

### Sanntidsoppdateringer
Dashboard bruker Supabase Realtime for automatisk oppdatering:
```typescript
supabase
  .channel('admin-realtime')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchData)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchData)
  // ... flere tabeller
  .subscribe()
```

### RPC-funksjoner brukt
- `get_auth_users_count()` - Teller auth.users
- `get_auth_users_list()` - Liste over auth-brukere
- `get_users_registered_today()` - Registrert i dag
- `get_users_registered_this_week()` - Registrert denne uken
- `get_users_registered_this_month()` - Registrert denne måneden
- `get_users_logged_in_today()` - Pålogget i dag
- `get_user_registration_trend()` - Registreringstrend

### Komponenter brukt
- shadcn/ui: Card, Badge, Button, Select, Dialog, Collapsible
- lucide-react: Ikoner
- sonner: Toast-varsler

---

## Endringer (Changelog)

### 2025-12-18
- Flyttet brukerliste fra egen tab til Dashboard som kollapserbar seksjon
- La til arkiv-toggle i FeatureRequestsTab, BugReportsTab og ReportsTab
- La til auth vs profiles sammenligning i Dashboard
- Endret "Varsler" til "Innstillinger" i kontomeny
- Installert shadcn/ui collapsible komponent
- Oppdatert nav-tekster og subtekster i sidebar

### Tidligere
- Opprettet FeatureRequestsTab med full funksjonalitet
- Opprettet FeatureRequestDropdown i navbar
- Redesignet admin fra tabs til sidebar-layout
- La til Header/navbar på admin-siden
