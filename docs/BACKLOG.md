# BACKLOG.md - Oppgaveliste

> Alt som skal bygges, fikses eller vurderes.
> Sist oppdatert: 2026-01-11

---

## Prioriteringsnøkkel

- 🔴 **Kritisk** - Blokkerer brukere eller sikkerhetsproblem
- 🟠 **Høy** - Viktig for neste milestone
- 🟡 **Medium** - Bør gjøres snart
- 🟢 **Lav** - Kan vente
- 💡 **Idé** - Vurder senere

---

## Pågående prosjekter 🔨

### Media Service Testing 🟠
- [ ] Profile avatar - manuell testing
- [ ] Geography images - manuell testing
- [ ] Bug reports - manuell testing
- [ ] Geography suggestions - manuell testing
- [ ] Migrere eksisterende bilder til ny `media` tabell
- [ ] Bunny.net video setup (fullføre)
- [ ] Slette legacy komponent (`ny/page.tsx`)

**Notis:** Group avatar fjernet fra scope (gruppe-funksjonalitet slettet 10-11. jan 2026)

### SPA-konvertering 🟠
- [ ] **Fase 2:** Bokmerker (`/bokmerker`)
- [ ] **Fase 2:** Innlegg detalj (`/innlegg/[id]`) - Delvis fullført (SSR med Open Graph 11. jan)
- [ ] **Fase 3:** Brukerprofiler (`/bruker/[username]`)
- [ ] **Fase 3:** Geografi enkelt-nivå
- [ ] **Fase 4:** Samfunn (`/samfunn/[slug]`) - Når samfunn gjøres synlige igjen
- [ ] **Fase 4:** Geografi hierarki (4 nivåer)
- [ ] **Fase 5:** Polering og UX
- [ ] **Fase 6:** Omfattende testing

**Notis:** Alle gruppe-relaterte routes fjernet fra scope (grupper slettet 10-11. jan 2026)


---

## Bugs 🐛

### Kritisk 🔴
*Ingen kjente kritiske bugs*

### Høy 🟠
*Ingen kjente høy-prioritet bugs*

### Medium 🟡
*Ingen kjente medium-prioritet bugs*

---

## Features - Neste milestone 🟠

### Composer-migrering til Media Service
- [ ] NewPostSheet.tsx
- [ ] InlineCreatePost.tsx
- [ ] usePostComposer.ts

---

## Features - Bør ha 🟡

### Video
- [ ] Bunny Stream fullstendig integrasjon
- [ ] Thumbnail selection UI
- [ ] Frame extraction

### Notifications
- [ ] VAPID secrets for push-varsler (krever Supabase-konfigurasjon)
- [ ] E-postvarsling til brukere (ikke bare admin)

### Søk
- [ ] Fuzzy search (typo-toleranse)
- [ ] Søkeforslag (autocomplete)
- [ ] Søkehistorikk per bruker

---

## Features - Kan ha 🟢

- [ ] PWA offline-støtte
- [ ] E-postbekreftelse ved registrering
- [ ] Gruppechat (flere deltakere)
- [ ] Infinite scroll i søkeresultater
- [ ] Populære søk (trending)
- [ ] Voice search
- [ ] Image search for produkter

---

## Ideer til senere 💡

### UX-forbedringer
- [ ] Prefetching på hover (SPA)
- [ ] Skeleton loading states overalt
- [ ] Optimistisk UI-oppdatering

### Analytics
- [ ] Search analytics (mest søkte termer)
- [ ] Brukeraktivitets-dashboard

### Sosiale funksjoner
- [x] Reactions (mer enn bare like) - ✅ Implementert (10 reaksjonstyper)
- [ ] Stories/ephemeral content
- [ ] Live streaming
- [ ] Grupper (gjenoppbygg fra arkiv)

### Integrasjoner
- [ ] Kalender-sync (Google/Apple)
- [x] Social sharing cards (OG images) - ✅ Implementert 11. jan (Open Graph meta tags)

---

## Teknisk gjeld 🔧

### Kode
- [ ] Fjerne `ny/page.tsx` (legacy)
- [ ] Konsolidere post_images → media tabell fullt
- [ ] Rydde opp i ubrukte komponenter

### Database
- [ ] Audit log cleanup (3-års retention)
- [ ] Indeks-optimalisering

### Testing
- [ ] Øke test coverage
- [x] E2E tester for kritiske flyter - ✅ Post System 2.0 baseline opprettet (11. jan)
  - Playwright-test med synlig browser
  - Screenshot-capture for visuell verifisering
  - Test-fil: `tests/e2e/post-system-v2.spec.ts`
- [ ] E2E tester for øvrige flyter (profil, samfunn, meldinger)

---

## Sikkerhet 🔐

*Se `docs/security/SECURITY.md` for detaljer*

### Fullført ✅
- [x] RLS policies på alle tabeller
- [x] Service Role Key rotert
- [x] Passordbekreftelse på kontosletting
- [x] Rate limiting på sensitive API-ruter
- [x] Privacy leak fikset (14. des)

### Gjenstår 🟡
- [ ] Periodisk sikkerhetsaudit
- [ ] Penetrasjonstesting

---

## Fullført ✅

> Flyttet hit med dato når ferdig

### Januar 2026

#### 13. januar - Pre-Launch: Samfunn skjult fra UI 🚀
**Samfunn-funksjonalitet midlertidig skjult før offentlig lansering (reversibelt):**
- [x] **Navigasjon** - Fjernet "Samfunn"-knapper fra Sidebar og MobileNav
- [x] **Søkesystem** - Fjernet samfunn/tjenester/produkter fra søk (8 filer)
  - SearchCategory type oppdatert (searchConstants.ts)
  - Search-funksjoner returnerer tomme arrays (searchQueries.ts)
  - Kommentert ut community-typer (searchTypes.ts)
  - Fjernet UI-komponenter (SearchCategoryFilter, SearchResultItem, UnifiedSearchBar, useSearch)
- [x] **Frontend** - HomeLayout oppdatert (fjernet community-panels fra ActivePanel type)
- [x] **Bugfikser** - ProfileTabs og SamiOrganizations TypeScript-feil fikset

**Tekniske detaljer:**
- 12 filer endret (8 søk, 2 navigasjon, 2 bugfixes)
- ~150 linjer kode kommentert ut/fjernet
- Database uendret (data bevares med is_hidden flag)
- Enkelt reversibelt (uncommit + is_hidden=false)

**Testing:** Build ✅, TypeScript ✅, Git push ✅ (440 files, d1abc86)
**Status:** Fullført og deployet til main

#### 11. januar (kveld) - Profile Hotfixes 🔧
**3 kritiske hotfixes for profilsystemet:**
- [x] **Fake statistikk i profile_stats view** ⚠️ KRITISK FIX
  - SQL view multipliserte likes pga. dårlige JOINs
  - Erstattet med separate subqueries
  - Migrering: `20260111_fix_profile_stats_view.sql`
  - Statistikk viser nå reelle tall
- [x] **Dårlig kontrast på profilnavn over banner** 🎨
  - Gradient overlay + hvit tekst med drop-shadow på mobil
  - Responsive design for optimal lesbarhet
  - Fil: `src/components/profile/ProfileHeader.tsx` (linjer 271, 296, 304, 311)
- [x] **Whitespace over banner** 📐
  - Fjernet padding på Card-komponenten
  - Banner går nå helt til kanten
  - Fil: `src/components/profile/ProfileHeader.tsx` (linje 258)

**Testing:** Build ✅, verifisert i localhost ✅
**Status:** Alle 3 fixes deployet og fungerer

#### 11. januar (sen kveld) - E2E Test Framework 🧪
**Opprettet automatisert E2E-test for Post System 2.0:**
- [x] **Playwright E2E test** (`tests/e2e/post-system-v2.spec.ts`)
  - Synlig browser med --headed flag
  - Komplett brukerflyt: innlogging → post-opprettelse → 3-prikk meny → kommentarer
  - Screenshot-capture (6 bilder) for visuell verifisering
  - Console logging med detaljerte teststeg
  - Kjøretid: ~21.5 sekunder
  - Status: ✅ 1 passed

**Dependencies installert:** Playwright Chromium browser (159.6 MB)
**Notater:** Baseline opprettet, trenger selector-justering for robusthet

#### 11. januar - Post System 2.0 🎯
**8 avanserte post-funksjoner implementert og testet:**
- [x] **Soft delete med restore** - Innlegg kan slettes og gjenopprettes fra arkiv
  - Database: `posts.deleted_at` timestamp-kolonne
  - RLS policies oppdatert for filtrering
  - Menyitems: "Slett" og "Gjenopprett fra arkiv"
- [x] **Edit tracking** - "Redigert"-badge med timestamp og edit count
  - Database: `posts.edited_at`, `posts.edit_count`
  - Badge med hover-tooltip
- [x] **Kommentar-redigering UI** - Inline editing med lagre/avbryt
  - Komponenter: NestedComments.tsx, CommentSection.tsx
  - "(redigert)"-indikator på kommentarer
- [x] **Bilderedigering** - Drag-and-drop reordering og sletting
  - Ny komponent: EditPostImagesDialog.tsx (450+ linjer)
  - Database-funksjoner: update_post_images_order, delete_post_image
- [x] **Repost/reshare** - Del innlegg til egen feed
  - Ny tabell: `reposts` med RLS policies
  - Attribution til original poster
  - Menyitem: "Repost til feed"
- [x] **Analytics UI (PostStats)** - View count og engagement
  - Ny komponent: PostStats.tsx
  - Synlig kun for innleggseiere
  - Bruker post_statistics view
- [x] **"Nye kommentarer" badge** - Realtime notifications
  - Orange badge på PostActions med count
  - Realtime via Supabase subscriptions
  - comment_read_tracking tabell
- [x] **Open Graph meta tags** - Riktig preview ved ekstern deling
  - SSR med generateMetadata() i page.tsx
  - Dynamiske OG-tags (title, description, image, URL)
  - PostDetailPageClient.tsx wrapper for client-side logikk

**Database:** 3 nye migrasjoner (post_improvements, repost_system, post_images_edit)
**Frontend:** 2 nye komponenter, 13 oppdaterte filer
**Testing:** Build ✅, 120/121 tester ✅, manuell testing ✅, E2E baseline ✅

- [x] **Final gruppe-cleanup** - Fjernet alle gjenværende gruppe-komponenter
  - Slettet: src/components/groups/* (alle filer)
  - Slettet: src/lib/groups.ts, src/lib/types/groups.ts
  - Slettet: src/app/grupper/GroupsContent.tsx
  - Oppdatert: HomeLayout.tsx, spa-utils.ts, Feed.tsx (fjernet gruppe-refs)
  - Oppdatert: Alle post-komponenter (fjernet gruppe-mentions)

#### 11. januar (tidlig) - Profile Enhancements
- [x] Profile Enhancements komplett implementering
  - Cover/banner-bilde (1200x400px) med parallax-effekt
  - Brukernavn (@handle) system med uniqueness
  - Tagline/stikkord (1 linje)
  - Sosiale lenker (JSONB array, max 10)
  - Interesser/hobbyer (TEXT array, max 20)
  - Avatar status ring (valgfri farge)
  - 5-tab profilsystem (Innlegg, Om meg, Media, Aktivitet, Innstillinger)
  - ProfileStatsCard med venner/innlegg/likes
  - Samiske organisasjoner (Sametinget, NSR, etc.)
  - Featured images-galleri (3-6 bilder)
  - ProfileOverlay modernisert med glassmorphism
  - Database: 8 nye kolonner, 4 nye tabeller, 2 views
  - Storage: profile-covers bucket med RLS
  - Bugfix: Fjernet alle created_for_group_id referanser (13 filer)

#### 10. januar - Pre-Launch Cleanup
- [x] Gruppe-funksjonalitet permanent fjernet (skal bygges på nytt)
- [x] Samfunn midlertidig skjult (reversibelt via is_hidden flag)
- [x] 8 database-tabeller fjernet (alle triggers, funksjoner, RLS policies)
- [x] ~200 linjer gruppe-kode fjernet fra 14+ komponenter
- [x] Komplett dokumentasjon arkivert i docs/archive/groups-system-backup/
- [x] Git tag: v1.0-pre-group-deletion

#### 8. januar
- [x] Gallery System komplett implementering
  - Advanced gallery viewer (masonry + single mode)
  - Image-level engagement (comments + likes)
  - Polymorfisk backend (media + post_images)
  - Dark theme konsistens
  - Security audit og fixes
- [x] CVE-GALLERY-001 fikset (unauthorized comment deletion)
- [x] Gallery code quality improvements
  - useEffect dependencies
  - Type safety (User types)
  - Dark theme konsistens
- [x] Post-Composer Testing fullført
  - Video upload, polls, scheduled posts, reactions, archive
  - Alle 5 kritiske funksjoner verifisert

### Desember 2025
- [x] Sapmi-transformasjon (alle 9 faser) - 17. des
- [x] Universelt søk (8 kategorier) - 13. des
- [x] Admin-panel med moderering - des
- [x] @mention-system (7 entitetstyper) - 18. des
- [x] Galleri/Album-system - 18. des
- [x] GeographyTab refaktorering - 17. des
- [x] Media Service implementering - 19. des
- [x] Geography Image Management - 22. des
- [x] Multi-image feed bug fix - 22. des
- [x] Post-Composer implementering - 19. des
- [x] SPA Fase 1 (kalender) - 16. des
- [x] Sikkerhetsfix (privacy leak) - 14. des
- [x] Changelog-system - 16. des
- [x] Brukeraktivitetslogging - 16. des

---

**Sist oppdatert:** 2026-01-13
**Oppdatert av:** DOKUMENTERER-agent (Samfunn skjult fra UI - pre-launch cleanup)
