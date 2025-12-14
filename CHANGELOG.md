# Changelog - samiske.no

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2025-12-14] - KRITISK SIKKERHETSFIKS

### 🔴 CRITICAL SECURITY FIX

**Privacy leak - gruppeinnlegg og private innlegg synlige for alle**

#### Fixed
- **KRITISK:** Feed viste ALLE innlegg når `communityIds` prop manglet i `/samfunn/[slug]/page.tsx`
- **KRITISK:** Gruppeinnlegg fra lukkede/skjulte grupper viste på samfunnssider
- **KRITISK:** Private innlegg ignorerte visibility-innstillinger
- **KRITISK:** Database tillot posts å ha både `created_for_group_id` OG `created_for_community_id`
- **KRITISK:** Manglende RLS policies på posts-tabellen

#### Security
- ✅ Implementert 4-lags sikkerhet:
  1. **App-nivå (Feed.tsx):** Eksplisitt filter `.is('created_for_group_id', null)`
  2. **App-nivå (UserProfileTabs.tsx):** Visibility + vennskap + gruppefiltrering
  3. **Database constraints:** CHECK constraint + trigger validation
  4. **RLS policies:** Database-level sikkerhet på posts, community_posts, group_posts

#### Changed
- `src/app/samfunn/[slug]/page.tsx` - Lagt til `communityIds={[community.id]}` prop på Feed
- `src/components/feed/Feed.tsx` - Gruppefilter på samfunnsfeed
- `src/components/profile/UserProfileTabs.tsx` - Komplett visibility-filtrering

#### Added
- `supabase/migrations/20241214_fix_group_community_conflict.sql` - Database constraints
- `supabase/migrations/20241214_fix_group_posts_rls.sql` - RLS policies
- `docs/SECURITY-INCIDENT-2025-12-14.md` - Full incident report

#### Testing
- ✅ Verifisert med to brukerkontoer i produksjon
- ✅ Kun offentlige samfunnsinnlegg vises
- ✅ Private innlegg skjult
- ✅ Gruppeinnlegg skjult

**Git commit:** `95522a5`
**Oppdaget:** 14. desember 2025, kl. ~19:00
**Løst:** 14. desember 2025, kl. ~20:45
**Tid til løsning:** ~1 time 45 minutter

---

## [2025-12-13] - Fase 18: Push-varsler

### Added
- Database triggers for nye innlegg og kommentarer
- Cron-jobb for sending av push-varsler (hvert 2. minutt)
- Edge function for push notification sending
- Client-side subscription management
- Service worker med push event handler
- UI for aktivering/deaktivering i innstillinger

---

## [2025-12-13] - Fase 17: Rate Limiting

### Added
- In-memory rate limiter utility (`src/lib/rate-limit.ts`)
- Rate limiting på `/api/delete-account` (3 per time)
- Rate limiting på `/api/export-data` (5 per time)
- Standard HTTP rate limit headers

### Security
- Beskytter mot brute force-angrep på kritiske endpoints

---

## [2025-12-13] - Fase 16: Tilgjengelighet (a11y)

### Added
- Aria-labels på alle icon-buttons
- Focus-visible styling for keyboard navigation
- Escape-tast for å lukke modaler
- aria-hidden på dekorative elementer

### Changed
- PostCard, Header, SearchModal, NotificationBell, InstallPrompt forbedret a11y

---

## [2025-12-13] - Fase 15: Brukerinteraksjon

### Added
- Slette egne innlegg med bekreftelsesdialog
- Dele innlegg (kopier lenke / Web Share API)
- Bokmerke innlegg (database + `/bokmerker` side)
- PWA-ikoner generert (icon-192x192.png, icon-512x512.png)
- Rapportere innlegg (ReportDialog + admin-panel visning)
- PWA: Installer-app prompt (InstallPrompt komponent)

---

## [2025-12-13] - Fase 14: Brukerlokasjoner og Onboarding

### Added
- Database: `onboarding_completed` kolonne i profiles
- Backend: `setUserLocation` og `getUserLocations` funksjoner
- OnboardingWizard komponent med 3-stegs flyt
- `/onboarding` side for nye brukere
- Auth callback redirect til onboarding for nye brukere
- Innstillinger: "Mine steder" seksjon med GeographySelector
- Auto-stjerne lokasjoner ved lagring
- "Hopp over alt" knapp i onboarding

---

## [2025-12-13] - Fase 13: Unified Feed UX Redesign

### Added
- HomeLayout utvidet med group/community panels
- Grupper i sidebar: expand/collapse med brukerens grupper
- Samfunn vises i feed-området med 5 faner
- GroupFeedView komponent med header og 3 faner
- CommunityFeedView komponent med 5 faner
- Feed og CalendarView støtter filtering via groupId/communityIds
- CommunityCard med FollowButton integrert

---

## [2025-12-12] - Fase 12: Kodestruktur-forbedring

### Changed
- Splittet PostCard.tsx fra 1139 til 670 linjer
- Opprettet PostActions.tsx (~110 linjer)
- Opprettet PostComments.tsx (~230 linjer)
- Opprettet EditPostDialog.tsx (~95 linjer)
- Opprettet PostDialogContent.tsx (~250 linjer)
- Opprettet types.ts og utils.ts for delt kode

### Fixed
- Memory leaks: useMemo for supabase-klient i RightSidebar.tsx
- Verifisert cleanup i alle 9 filer med subscriptions

---

## [2025-12-12] - Fase 11: Sikkerhetsgjennomgang

### Security
- ✅ Ny `sb_secret_` nøkkel (gammel eksponert nøkkel ugyldig)
- ✅ RLS policies fikset for email_subscribers, conversations, conversation_participants
- ✅ Passordbekreftelse kreves før kontosletting
- ✅ Input-validering med maks lengder
- ✅ N+1 query fikset (31 → 4 queries)
- ✅ Toast notifications med brukervenlige feilmeldinger
- ✅ SMS fjernet fra UI

**Kodekvalitet score:** 7/10 (forbedret fra 4.5)

---

## [Earlier Phases]

See `docs/PROGRESS.md` for complete history of Phases 1-10.

---

## Versjonering

Dette prosjektet følger ikke semantisk versjonering (semver) siden det er en webapplikasjon.
Alle endringer deployes direkte til produksjon (samiske.no) via Vercel.
