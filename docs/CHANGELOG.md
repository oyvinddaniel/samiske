# CHANGELOG.md - Prosjekthistorikk

> Kronologisk logg over alle betydelige endringer
> Sist oppdatert: 2026-01-11

---

## Format

```
## [YYYY-MM-DD] - Kort beskrivelse

### Lagt til
- Nye features

### Endret
- Endringer i eksisterende funksjonalitet

### Fikset
- Bug fixes

### Fjernet
- Fjernet funksjonalitet

### Sikkerhet
- Sikkerhetsoppdateringer
```

---

## [2026-01-11 kveld] - Profile Hotfixes (Kritisk statistikk-fix + design)

### 🔧 CRITICAL: Profile Statistics Fix

**Problem:** Brukere fikk helt feil statistikk (f.eks. 15.232 likes når de bare hadde noen få). Dette var fake data som ble generert pga. SQL-bug.

**Root cause:** `profile_stats` view brukte flere LEFT JOINs (posts, comments, friendships) som skapte Cartesian product. Hvis en bruker hadde 10 venner og 5 posts med 3 likes hver, ble likes talt som 10 × 5 × 3 = 150 i stedet for 15.

### Fikset
- **KRITISK SQL-bug:** `profile_stats` view multipliserte likes feil
  - Opprettet `supabase/migrations/20260111_fix_profile_stats_view.sql`
  - Droppet gammel view med komplekse JOINs
  - Opprettet ny view med separate subqueries:
    - `post_stats` subquery (teller posts)
    - `comment_stats` subquery (teller kommentarer)
    - `friend_stats` subquery (teller venner)
    - `engagement_stats` subquery (teller likes og comments received)
  - Bruker `COUNT(DISTINCT id)` for å unngå duplikater
  - Ingen kryssprodukt-multiplisering mellom datasett
  - **Resultat:** Statistikk viser nå reelle tall

- **Design-fix #1:** Dårlig kontrast på profilnavn over banner
  - Problem: Profilnavn viste i overgangen mellom banner og hvit bakgrunn
  - Løsning i `src/components/profile/ProfileHeader.tsx`:
    - Linje 271: Gradient overlay `bg-gradient-to-b from-transparent to-black/40`
    - Linje 296: Navn `text-white sm:text-gray-900 drop-shadow-lg sm:drop-shadow-none`
    - Linje 304: Username `text-white/90 sm:text-gray-500 drop-shadow-md sm:drop-shadow-none`
    - Linje 311: Tagline `text-white/80 sm:text-gray-700 drop-shadow-md sm:drop-shadow-none`
  - Responsive design: Hvit tekst på mobil (over banner), grå tekst på desktop (under banner)

- **Design-fix #2:** Whitespace over banner
  - Problem: Hvit space mellom toppen av profil-kortet og banner-bildet
  - Løsning: Linje 258 i `ProfileHeader.tsx` - endret `<Card className="mb-6 overflow-hidden">` til `<Card className="mb-6 overflow-hidden p-0">`
  - Banner når nå hele veien til toppen av kortet
  - CardContent beholder egen padding for innhold nedenfor

### Testing
- ✅ Build kompilerer uten feil
- ✅ Statistikk viser reelle tall (bekreftet av bruker: "success")
- ✅ Design-fixes testet med forskjellige banner-bilder og farger
- ✅ Responsivt design fungerer på mobil og desktop

### Tekniske detaljer
- **Database-migrasjoner:** 1 ny fil (20260111_fix_profile_stats_view.sql)
- **Frontend-endringer:** 1 fil (ProfileHeader.tsx, 5 linjer endret)
- **Alvorlighet:** KRITISK (fake data i produksjon)
- **Tid til fix:** ~1 time (fra bug-report til deploy)

### Dokumentasjon
- STATUS.md oppdatert med hotfix-seksjon
- BACKLOG.md oppdatert med fullførte hotfixes
- CHANGELOG.md oppdatert (denne filen)

---

## [2026-01-11 sen kveld] - E2E Test Framework for Post System 2.0

### Lagt til
- **E2E automatisert test** (`tests/e2e/post-system-v2.spec.ts`)
  - Playwright-basert test med synlig browser (--headed)
  - Tester komplett brukerflyt:
    - Innlogging (håndterer både innlogget og utlogget state)
    - Post-opprettelse med tekst
    - 3-prikk meny-interaksjon
    - Kommentar-funksjonalitet
  - Screenshot-capture for visuell verifisering:
    - `test-results/01-homepage.png`
    - `test-results/02-logged-in.png`
    - `test-results/03-post-composer.png`
    - `test-results/04-post-published.png`
    - `test-results/05-more-menu.png`
    - `test-results/06-comment-added.png`
  - Kjøretid: ~21.5 sekunder
  - Status: ✅ 1 passed

### Tekniske detaljer
- **Test-fil:** `tests/e2e/post-system-v2.spec.ts` (177 linjer)
- **Kjørekommando:** `npx playwright test tests/e2e/post-system-v2.spec.ts --headed --project=chromium`
- **Dependencies installert:** Playwright Chromium browser (159.6 MB)
- **Console logging:** Detaljert logging av hver teststeg

### Notater
- Baseline E2E-test opprettet for framtidig regression-testing
- Trenger justering av selectors for robusthet
- Manuell testing fortsatt anbefalt for komplekse interaksjoner
- Test-framework klar for utvidelse med flere test-scenarier

---

## [2026-01-11] - Post System 2.0 + Profile Enhancements + Final Group Cleanup

### 🎯 MAJOR: Post System 2.0 (8 avanserte funksjoner)
Komplett implementering av moderne post-funksjonalitet med database-migrasjoner, frontend-komponenter og full testing.

### 🎯 MAJOR: Profile Enhancements System (13 forbedringer)
Komplett redesign av brukerprofilsystemet med moderne visuelle elementer, sosiale funksjoner, samisk-spesifikke felt, og omfattende database-utvidelser.

### Lagt til
- **Soft delete med restore**
  - `posts.deleted_at` timestamp-kolonne
  - RLS policies for filtrering av slettede innlegg
  - "Gjenopprett fra arkiv"-funksjon i meny
  - Filter for å vise/skjule slettede innlegg
- **Edit tracking**
  - `posts.edited_at`, `posts.edit_count` kolonner
  - "Redigert"-badge på PostCard med timestamp
  - Hover tooltip med antall redigeringer
- **Kommentar-redigering UI**
  - Inline-redigering i NestedComments.tsx
  - "(redigert)"-indikator på kommentarer
  - Lagre/avbryt-knapper
- **Bilderedigering (drag-and-drop)**
  - EditPostImagesDialog.tsx (ny komponent, 450+ linjer)
  - Drag-and-drop reordering med visuell feedback
  - Slett bilder fra eksisterende innlegg
  - Database-funksjoner: `update_post_images_order()`, `delete_post_image()`
- **Repost/reshare-system**
  - Ny `reposts` tabell med RLS policies
  - "Repost til feed"-menyitem
  - Attribution til original poster
  - `user_has_reposted` flagg i post-queries
- **Analytics UI (PostStats)**
  - PostStats.tsx komponent (visuell engagement-card)
  - View count, likes, comments, shares
  - Synlig kun for innleggseiere
  - Bruker `post_statistics` view fra database
- **"Nye kommentarer" badge**
  - Orange badge på PostActions med count
  - Realtime oppdatering via Supabase subscriptions
  - `comment_read_tracking` tabell for tracking
  - Logikk i usePostCard.ts hook
- **Open Graph meta tags**
  - Server-side rendering (SSR) på innlegg-detaljsider
  - `generateMetadata()` funksjon i page.tsx
  - Dynamiske OG-tags (title, description, image, URL)
  - Riktig preview på Twitter, Facebook, Discord
  - PostDetailPageClient.tsx wrapper for client-side logikk

**PROFILE ENHANCEMENTS:**
- **Cover/banner-bilde system**
  - 1200x400px cover images med gradient fallback
  - Next.js Image-integrasjon med Supabase Storage
  - `profile-covers` storage bucket med RLS policies
  - Automatisk sletting av gammel cover ved ny opplasting
- **Brukernavn (@handle) system**
  - Unik `username` kolonne for SEO-vennlige URLs
  - Reserved usernames-validering (admin, api, system, etc.)
  - Rate limiting: Max 3 username-endringer totalt, 30 dager mellom
  - Auto-generering av usernames for eksisterende brukere
- **Tagline** - Kort stikkord/motto (1 linje, ~50 tegn)
- **Sosiale lenker**
  - JSONB array for Instagram, Facebook, nettside, etc.
  - Max 10 lenker per bruker
  - URL-validering (HTTPS-only)
- **Interesser/hobbyer**
  - TEXT array for tags (max 20, max 50 tegn hver)
  - GIN index for effektivt søk
  - Forslag til samisk-relaterte interesser
- **Avatar status ring** - Valgfri farge rundt profilbilde (`avatar_status_color`)
- **5-tab profilsystem** - Innlegg, Om meg, Media, Aktivitet, Innstillinger
- **ProfileStatsCard**
  - Aggregert statistikk fra `profile_stats` view
  - Venner, innlegg, kommentarer, likes
- **Samiske organisasjoner**
  - Medlemskap i Sametinget, NSR, etc.
  - `sami_organizations` og `user_sami_organizations` tabeller
- **Featured images-galleri**
  - 3-6 utvalgte bilder på profil
  - `user_featured_images` tabell med sortering
- **ProfileOverlay modernisert**
  - Glassmorphism-design med backdrop blur
  - Cover image og quick stats

### Database-migrasjoner (6 nye filer totalt)
1. **20260110_post_improvements.sql**
   - `posts.deleted_at TIMESTAMPTZ`
   - `posts.edited_at TIMESTAMPTZ`
   - `posts.edit_count INTEGER DEFAULT 0`
   - RLS policies oppdatert for soft delete
   - Archive-funksjoner

2. **20260110_repost_system.sql**
   - `reposts` tabell (user_id, post_id, created_at)
   - RLS policies (brukere kan reposte andres offentlige innlegg)
   - `user_has_reposted` i post-queries
   - Unique constraint på (user_id, post_id)

3. **20260110_post_images_edit.sql**
   - `update_post_images_order(post_id UUID, image_ids UUID[])` funksjon
   - `delete_post_image(image_id UUID)` funksjon
   - Authorization checks (kun eier kan redigere)
   - Cascade delete av metadata

4. **20260110_profile_enhancements.sql** (Profile system)
   - 8 nye kolonner i `profiles`: `username`, `tagline`, `cover_image_url`, `avatar_status_color`, `social_links`, `interests`, `username_changed_at`, `username_change_count`
   - 4 nye tabeller: `reserved_usernames`, `sami_organizations`, `user_sami_organizations`, `user_featured_images`
   - 2 views: `profile_stats` (aggregert statistikk), `user_top_posts` (top 5 posts)
   - Valideringsfunksjoner: `validate_username()`, `validate_social_links()`, `validate_interests()`
   - Triggers for username-endringer og reserved usernames
   - Storage bucket: `profile-covers` med RLS policies

5. **20260111_username_migration.sql**
   - Genererte usernames for eksisterende brukere basert på `full_name`

6. **20260110_fix_profile_covers_storage.sql**
   - RLS policy-fixes for profile-covers bucket

### Endret
- **src/components/posts/types.ts**
  - Lagt til: `deleted_at`, `edited_at`, `edit_count`, `user_has_reposted`
- **src/hooks/usePostCard.ts**
  - Nye handlers: `handleSoftDelete`, `handleRestore`, `handleRepost`
  - Kommentar-badge logikk med realtime updates
- **src/components/posts/PostCard.tsx**
  - "Redigert"-badge med timestamp
  - Repost/restore menyitems
  - Soft delete-filter
- **src/components/posts/PostActions.tsx**
  - "Nye kommentarer"-badge med count
  - Orange fargetema for notifikasjoner
- **src/components/posts/CommentSection.tsx**
  - "(redigert)"-indikator på kommentarer
- **src/components/posts/NestedComments.tsx**
  - Kommentar-redigering UI (inline editing)
- **src/components/posts/EditPostDialog.tsx**
  - "Rediger bilder"-knapp som åpner EditPostImagesDialog
- **src/app/innlegg/[id]/page.tsx**
  - Konvertert til SSR med generateMetadata()
  - Open Graph tags genereres dynamisk

**PROFILE ENHANCEMENTS:**
- **src/components/profile/ProfileHeader.tsx** - Komplett redesign:
  - Cover image (1200x400px) med gradient fallback
  - Større avatar (96x96px → 120x120px) med status ring
  - Username (@handle) visning
  - Tagline (italic quote)
  - Sosiale lenker (første 3 + count)
  - Modernisert layout med cover image overlap
- **next.config.ts**
  - Lagt til Supabase Storage hostname for Next.js Image
  - `remotePatterns` konfigurasjon for cover images
- **ProfileAboutTab, ProfileMediaTab, ProfileActivityTab**
  - Integrert med nye database-felt (eksisterende komponenter oppdatert)
- **ProfileTabs**
  - Reorganisert til 5 tabs: Innlegg, Om meg, Media, Aktivitet, Innstillinger

### Fjernet (Gruppe-cleanup fortsetter)
- **Frontend-komponenter:**
  - `src/components/groups/*` (alle filer i mappen)
  - `src/app/grupper/GroupsContent.tsx`
- **Backend-filer:**
  - `src/lib/groups.ts` (20+ funksjoner)
  - `src/lib/types/groups.ts` (alle TypeScript interfaces)
- **Gruppe-referanser i eksisterende kode:**
  - `src/components/layout/HomeLayout.tsx` - fjernet gruppe-panels
  - `src/lib/navigation/spa-utils.ts` - fjernet gruppe-routes
  - `src/components/feed/Feed.tsx` - forenklet gruppe-filtering
  - `src/lib/types/index.ts` - fjernet gruppe-exports
  - Alle post-komponenter - fjernet gruppe-mentions

### Fikset
- **KRITISK BUG:** Fjernet alle `created_for_group_id` referanser fra 13 filer (ettervirkninger fra gruppe-fjerning 10. jan):
  - Feed.tsx (4 lokasjoner - filter, queries)
  - ProfileTabs.tsx (query filter)
  - UserProfileTabs.tsx (sikkerhetsjekk)
  - AllMyPosts.tsx (FilterType, interface, query, UI-knapp)
  - searchQueries.ts (event search filter)
  - types.ts (PostWithRelations type)
  - posts.ts (fjernet `countPinnedPostsInGroup` funksjon)
  - CalendarView.tsx (2 queries)
  - RightSidebar.tsx (upcoming events query)
  - InlineCreatePost.tsx (post data)
  - usePostComposer.ts (insert data)
  - BookmarksPanel.tsx (type mapping)
  - ny/page.tsx (post creation)
- **Next.js Image-feil:** Lagt til Supabase hostname i `next.config.ts` for cover images
- Build-feil relatert til gruppe-fjerning (TypeScript errors)
- RLS policies for soft-deleted posts

### Testing
- ✅ Build kompilerer uten feil (`npm run build`)
- ✅ 120/121 tester består (1 test-fil har pre-eksisterende feil)
- ✅ Lokal testing: Alle 8 funksjoner verifisert manuelt
- ✅ Database-migrasjoner kjørt (`npx supabase db push`)
- ✅ SSR Open Graph tags testet (metadata synlig i page source)

### Tekniske detaljer

**Post System 2.0:**
- **Nye komponenter:** 2 (EditPostImagesDialog, PostDetailPageClient)
- **Oppdaterte komponenter:** 8 filer
- **Database-kolonner lagt til:** 3 (deleted_at, edited_at, edit_count)
- **Database-tabeller lagt til:** 1 (reposts)
- **Database-funksjoner lagt til:** 2 (update_post_images_order, delete_post_image)

**Profile Enhancements:**
- **Oppdaterte komponenter:** 1 hovedfil (ProfileHeader.tsx) + 13 bugfix-filer
- **Database-kolonner lagt til:** 8 (username, tagline, cover_image_url, avatar_status_color, social_links, interests, username_changed_at, username_change_count)
- **Database-tabeller lagt til:** 4 (reserved_usernames, sami_organizations, user_sami_organizations, user_featured_images)
- **Database-views lagt til:** 2 (profile_stats, user_top_posts)
- **Storage buckets lagt til:** 1 (profile-covers)

**Totalt:**
- **Linjer kode endret:** ~2000+ linjer (post system + profile enhancements + gruppe-cleanup)

### Dokumentasjon
- STATUS.md oppdatert med detaljert beskrivelse av alle funksjoner (Post System 2.0 + Profile Enhancements)
- CHANGELOG.md oppdatert (denne filen)
- BACKLOG.md oppdatert (post-forbedringer og profile enhancements markert som fullført)

---

## [2026-01-10] - Pre-Launch Cleanup: Group Removal

### 🚨 BREAKING CHANGES
- **Gruppe-funksjonalitet permanent fjernet** - All kode og data slettet
- Samfunn midlertidig skjult via `is_hidden` flag (reversibelt)
- Grupper skal bygges på nytt senere fra arkivert dokumentasjon

### Fjernet
- **8 database-tabeller:**
  - `groups`, `group_members`, `group_posts`
  - `group_places`, `group_invites`, `group_welcome_seen`
  - `group_notification_preferences`, `group_event_permissions`
- **Kolonner:** `posts.created_for_group_id`
- **Triggers:** 5 triggers (post count, member count, cleanup, validation)
- **RPC-funksjoner:** 9 lagrede funksjoner (create_group, join_group, etc.)
- **Backend-filer:**
  - `src/lib/groups.ts` (20+ funksjoner)
  - `src/lib/types/groups.ts` (alle interfaces)
  - `src/app/grupper/` (hele mappen)
  - `src/components/groups/` (14 komponenter)
- **Frontend-kode:** ~200 linjer gruppe-logikk fjernet fra 14+ komponenter
- **@mention:** Grupper fjernet fra mention-system
- **Søk:** Grupper ikke lenger søkbare

### Endret
- **Menynavn:** "Bokmerker" → "Lagret" (Sidebar + MobileNav)
- **Navigasjon:** Fjernet "Grupper"-knapp fra Sidebar og MobileNav
- **RightSidebar:** Fjernet "Nyeste grupper" widget
- **Feed.tsx:** Omfattende cleanup (~100 linjer gruppe-filtrering fjernet)
- **PostCard.tsx:** Fjernet gruppe-kontekst indikator
- **CreatePostSheet.tsx:** Fjernet groupId parameter
- **CalendarView.tsx:** Fjernet gruppe-event filtrering
- **MentionTextarea.tsx:** Fjernet gruppe-søk, lagt til samfunn-filter

### Lagt til
- **`communities.is_hidden`** - Boolean flag for midlertidig skjuling
- **Index:** `idx_communities_is_hidden` på communities-tabellen
- **Filter:** `.eq('is_hidden', false)` i søk og queries

### Database-migrasjoner (5 SQL-filer)
1. `20260110_add_communities_is_hidden.sql` - Lagt til `is_hidden` flag
2. `20260110_delete_group_posts.sql` - Slettet alle gruppe-innlegg permanent
3. `20260110_drop_group_functions.sql` - Fjernet 5 triggers + 9 RPC-funksjoner
4. `20260110_drop_group_tables.sql` - Fjernet 8 tabeller (med CASCADE)
5. `20260110_drop_posts_group_column.sql` - Fjernet kolonne + oppdatert RLS policies

### Fikset
- **RLS policies:** Oppdatert community_posts policies (fjernet gruppe-referanser)
- **Feed.tsx syntax errors:** Fikset indentation og manglende closing brace
- **Demo-filer:** Pre-eksisterende TypeScript-feil (timestamp rendering)

### Sikkerhet
- Alle gruppe-innlegg slettet permanent (med verifisering)
- RLS policies oppdatert for å ikke referere slettet kolonne
- Samfunn skjult via reversibel `is_hidden` flag

### Dokumentasjon og Backup
- **Git tag:** `v1.0-pre-group-deletion` (sikkerhetskopi)
- **Arkiv:** `docs/archive/groups-system-backup/` (komplett dokumentasjon)
  - Database-schema (8 tabeller, RLS policies)
  - Triggers og funksjoner (5 triggers, 9 RPC)
  - 11 migrasjoner
  - 14 komponenter
  - Alle hjelpefunksjoner
  - README for gjenoppbygging

### Testing
- ✅ Build kompilerer uten feil (kjerneapp)
- ✅ TypeScript-feil fikset
- ✅ Alle gruppe-referanser fjernet
- ✅ Søk: Samfunn ikke synlige
- ✅ Feed: Innlegg vises korrekt
- ✅ "Lagret" fungerer

### Tekniske detaljer
- **Linjer kode fjernet:** ~200 linjer gruppe-logikk
- **Komponenter slettet:** 14
- **Filer modifisert:** 14+ frontend-komponenter
- **Build status:** ✅ Ingen feil (kjerneapp)

### Gjenoppbygging
Se `docs/archive/groups-system-backup/README.md` for komplett guide når gruppe-systemet skal bygges på nytt.

---

## [2026-01-08] - Gallery System Production Ready

### Added
- Advanced gallery system med 6 komponenter
- Retrospektiv PRD (`docs/prd/gallery-system.md`)
- Polymorfisk engagement-system (media_comments, media_likes)
- Image-level comments og likes
- Caption support (title, caption, alt_text)
- AdvancedGalleryViewer (orchestrator)
- GalleryImageSidebar (geography-bilder)
- PostGallerySidebar (post-bilder)
- MobileSingleImageView (mobil feed card)
- MobileSingleBottomSheet
- MobileMasonryHeader

### Fixed
- **CRITICAL:** CVE-GALLERY-001 - Unauthorized comment deletion
- Dark theme konsistens (PostGallerySidebar, MobileSingleBottomSheet)
- Mock-data erstattet med real backend (MobileSingleImageView)
- useEffect dependencies (stale closures) - 4 lokasjoner
- Type safety: `any` → `User | null`

### Security
- Authorization checks på deleteMediaComment
- Full security audit gjennomført (Score: 9/10)
- Code quality review gjennomført (Score: 8/10)

### Documentation
- PRD: `docs/prd/gallery-system.md`
- 6 komponenter dokumentert
- Database-migrasjoner dokumentert
- Security audit rapport
- Code review rapport

---

## [2025-12-26] - Dokumentasjonsmigrering

### Endret
- Migrert all dokumentasjon til nytt 12-fil system
- Konsolidert 29 filer til strukturert format

### Lagt til
- `docs/PROJECT.md` - Hovedinngangspunkt
- `docs/STATUS.md` - Sanntidsstatus
- `docs/BACKLOG.md` - Oppgaveliste
- `docs/CHEATSHEET.md` - Hurtigreferanse
- `docs/guides/AGENTS.md` - AI-roller
- `docs/guides/CONVENTIONS.md` - Kodestandarder
- `docs/guides/SETUP.md` - Oppsettguide
- `docs/prd/_TEMPLATE.md` - PRD-mal
- `docs/security/SECURITY.md` - Sikkerhetsguide
- `docs/decisions/DECISIONS.md` - Arkitekturbeslutninger
- `docs/logs/CHANGELOG.md` - Denne filen
- `docs/README.md` - Dokumentasjonsoversikt

---

## [2025-12-22] - Geography Image Management

### Lagt til
- `GeographyImagesManagementDialog.tsx` (484 linjer)
- Bulk editing system for geography images
- Ownership-based permissions (egne vs andres bilder)
- Database migration `20241221_geography_image_suggestions.sql`
- Admin panel integration (`SuggestionsTab.tsx`)

### Fikset
- Multi-image feed bug i `Feed.tsx` og `HashtagPageContent.tsx`
- Posts med flere bilder vistes som single image

---

## [2025-12-19] - Post-Composer & Media Service

### Lagt til
- Post-Composer med 23 funksjoner
- Video UX redesign (`VideoUploadCard.tsx`, `VideoDragDropZone.tsx`)
- Cron jobs for planlagte innlegg og draft cleanup
- Poll-visning i feed
- Emoji-picker i toolbar
- Video progress tracking
- Arkivering UI

### Endret
- Media Service implementert (154 automatiserte tester)
- 7/11 komponenter migrert til ny Media Service

---

## [2025-12-18] - @mention og Galleri

### Lagt til
- @mention/tagging-system med 7 entitetstyper
- `MentionTextarea` komponent med autocomplete
- Tastaturnavigasjon (piltaster, Enter, Tab, Escape)
- Varsling til nevnte brukere
- Galleri/Album-system med 7 preview-stiler
- `ImageGallery.tsx` integrert i PostCard
- Masonry viewer (desktop) og fullskjerm swipe (mobil)

---

## [2025-12-17] - GeographyTab & Sapmi fullført

### Endret
- GeographyTab refaktorert fra 1175 → 109 linjer (91% reduksjon)
- Admin-panel splittet til 8 separate filer

### Fullført
- Sapmi-transformasjon alle 9 faser

---

## [2025-12-16] - SPA-konvertering start

### Lagt til
- `src/lib/navigation/spa-utils.ts` (177 linjer)
- `src/lib/navigation/useLinkInterceptor.ts` (67 linjer)
- Pathname-basert navigasjon
- Changelog-system
- Brukeraktivitetslogging

### Endret
- `HomeLayout.tsx` utvidet for SPA
- `/kalender` fungerer nå som SPA (Fase 1 fullført)

---

## [2025-12-14] - Sikkerhetsfix

### Sikkerhet
- **KRITISK:** Privacy leak fikset - brukere kunne se andres private data
- RLS policies oppdatert
- Rate limiting lagt til på sensitive API-ruter
- Sikkerhetsscore: 6.3 → 9.2

---

## [2025-12-13] - Universelt søk & Sapmi fase 9

### Lagt til
- Universelt søk med 8 kategorier
- Caching med 5 min TTL
- Tastaturnavigasjon (Cmd+K)
- `UnifiedSearchBar` komponent
- Søk i: brukere, innlegg, arrangementer, kommentarer, geografi, samfunn, tjenester, produkter

### Fullført
- Sapmi fase 9: Universal Search

---

## [2025-12-13] - Sapmi fase 1-8

### Lagt til
- Geografisk hierarki (Sápmi → Land → Språkområder → Kommuner → Steder)
- 7 nye database-tabeller for geografi
- Content bubbling (innhold bobler opp i hierarkiet)
- 3 gruppetyper
- Communities/organisasjoner
- Vennesirkler
- Feed redesign
- Events med RSVP
- Stjernemerking av steder

### Database
- Migration: `20241213_phase1_geography.sql`
- Seed data for geografi

---

## [Tidligere] - Grunnfunksjonalitet

### Lagt til
- Hovedfeed med kronologisk visning
- Innlegg (standard og arrangement)
- Bildeopplasting med komprimering
- Kategorifiltrering
- Kommentarer med sanntidsoppdatering
- Like på innlegg og kommentarer
- Dele innlegg (Web Share API)
- Bokmerke innlegg
- Vennefunksjon med forespørsler
- Direktemeldinger
- Brukerprofiler
- Varslingssystem
- Admin-panel
- Onboarding
- Mine steder

---

## Kommende

Se `docs/BACKLOG.md` for planlagte endringer.

---

**Sist oppdatert:** 2026-01-11 (kveld)
**Oppdatert av:** DOKUMENTERER-agent (Profile Hotfixes: fake statistikk fix + design-forbedringer)
