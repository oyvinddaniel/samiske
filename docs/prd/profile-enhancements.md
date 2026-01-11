# PRD: Profile Enhancements

> **Status:** ✅ Implementert og i produksjon
> **Dato implementert:** 2026-01-10 til 2026-01-11
> **Versjon:** 1.0
> **Score:** 8.6/10 ⭐⭐⭐⭐

---

## 📋 Oversikt

Omfattende forbedringer av brukerprofiler i samiske.no, inkludert 13 store features som moderniserer profilopplevelsen og legger til viktig funksjonalitet som brukernavn, cover-bilder, sosiale lenker, interesser, og samiske organisasjoner.

---

## 🎯 Målsetting

### Primære mål
1. Modernisere profildesign med cover-bilder og glassmorphism
2. Legge til brukernavn-system (@handles) for enklere tagging
3. Gi brukere mulighet til å uttrykke identitet (interesser, sosiale lenker)
4. Koble brukere til samiske organisasjoner
5. Vise aktivitetsstatistikk på profiler

### Suksesskriterier
- ✅ Alle eksisterende brukere får automatisk generert brukernavn
- ✅ Cover-bilder kan lastes opp og vises responsivt
- ✅ Profiler viser rik informasjon (stats, organisasjoner, interesser)
- ✅ 5-tab system for organisert profilinnhold
- ✅ Moderne, responsivt design på mobil og desktop

---

## 🏗️ Teknisk arkitektur

### Database (Supabase PostgreSQL)

#### Nye kolonner i `profiles`:
- `username` TEXT UNIQUE NOT NULL - Brukernavn med validering
- `tagline` TEXT - Kort stikkord/bio (100 tegn)
- `cover_image_url` TEXT - URL til cover-bilde (1200x400px)
- `avatar_status_color` TEXT - Hex code for status ring
- `social_links` JSONB DEFAULT '[]' - Array av sosiale lenker
- `interests` TEXT[] DEFAULT ARRAY[] - Array av interesser
- `username_changed_at` TIMESTAMPTZ - Sist endret timestamp
- `username_change_count` INT DEFAULT 0 - Antall endringer

#### Nye tabeller:

**`reserved_usernames`**
```sql
- username TEXT PRIMARY KEY
- reason TEXT
- created_at TIMESTAMPTZ
```

**`sami_organizations`**
```sql
- id UUID PRIMARY KEY
- name TEXT NOT NULL UNIQUE
- name_sami TEXT
- type TEXT (political, cultural, youth)
- description TEXT
- website TEXT
- sort_order INT
```

**`user_sami_organizations`** (junction table)
```sql
- user_id UUID REFERENCES profiles
- organization_id UUID REFERENCES sami_organizations
- role TEXT
- since_year INT
- is_public BOOLEAN DEFAULT true
- PRIMARY KEY (user_id, organization_id)
```

**`user_featured_images`**
```sql
- id UUID PRIMARY KEY
- user_id UUID REFERENCES profiles
- media_id UUID REFERENCES media
- caption TEXT
- sort_order INT
- UNIQUE(user_id, media_id)
```

#### Views:

**`profile_stats`**
- total_posts, posts_last_30_days
- total_comments
- friend_count
- total_likes_received, total_comments_received
- last_post_at, last_comment_at
- member_since

**`user_top_posts`**
- Top 5 innlegg per bruker
- Rangert etter engagement_score (likes × 1 + comments × 2)

#### Storage:
- **Bucket:** `profile-covers`
- **Max size:** 5MB
- **Formats:** JPEG, PNG, WebP, AVIF
- **RLS policies:** User kan kun CRUD sine egne covers

#### Validering:
- Username: 3-30 tegn, alphanumerisk + underscore
- Social links: Max 10, JSONB validation
- Interests: Max 20, hver max 50 tegn
- Reserved usernames: admin, moderator, support, etc.

#### Triggers:
- `check_username_not_reserved` - Forhindrer reserverte usernames
- `username_change_tracker` - Sporer username-endringer

---

### Frontend (Next.js 15 + TypeScript)

#### Nye komponenter:

**ProfileHeader.tsx** (403 linjer)
- Cover-bilde (192px høyde, gradient fallback)
- Avatar med status ring overlay
- Username (@handle)
- Tagline (italic med quotes)
- Bio
- Sosiale lenker (viser 3, "+X mer")
- Geografi (current + home location)
- Friend action buttons
- Settings button (kun egen profil)

**ProfileOverlay.tsx** (442 linjer)
- Hover card med glassmorphism design
- Cover-bilde (128px høyde)
- Avatar med status ring
- Quick stats (3-column grid)
- Interesser (viser 5)
- Sosiale lenker (ikoner)
- Swipe-down-to-close på mobil
- Escape key shortcut

**ProfileCoverUpload.tsx** (147 linjer)
- Cover upload med preview
- Delete cover funksjon
- Loading states
- Hover overlay for edit
- Responsive høyder (200px/300px/400px)

**ProfileTabs.tsx**
- 5-tab system:
  1. 📝 Innlegg - Brukerens posts
  2. 👤 Om meg - ProfileAboutTab
  3. 🖼️ Media - ProfileMediaTab
  4. 📊 Aktivitet - ProfileActivityTab
  5. ⚙️ Innstillinger - AccountSettings

**ProfileAboutTab.tsx** (164 linjer)
- Brukerinformasjon card
- ProfileStatsCard
- SamiOrganizations
- ProfileFeaturedImages

**ProfileStatsCard.tsx** (131 linjer)
- 2x2 grid med stats
- Fargede ikoner (blue, green, purple, red)
- Total posts, venner, kommentarer, likes
- "Medlem siden" dato

**SocialLinksEditor.tsx**
- Add/remove lenker
- Type selector (Instagram, Facebook, LinkedIn, etc.)
- URL + label input
- Edit/view mode toggle
- Custom icons per type

**InterestsTagEditor.tsx**
- Tag input med add/remove
- Max 20 interesser
- Validation

**InlineEditField.tsx**
- Inline editing for enkle felter
- Save/cancel buttons

**ProfileFeaturedImages.tsx**
- Grid layout for 3-6 featured images
- Link til media-biblioteket

**SamiOrganizations.tsx**
- Visning av organisasjonsmedlemskap
- Role og since_year
- Public/private toggle

**ProfileMediaTab.tsx**
- Media-galleri (implementering eksisterer)

**ProfileActivityTab.tsx**
- Aktivitetshistorikk

**AccountSettings.tsx** (oppdatert)
- Alle nye felter kan redigeres
- Cover upload
- Avatar upload
- Username, tagline
- Social links editor
- Interests editor
- Avatar status color picker

---

## 🎨 Design

### Design-prinsipper:
- **Moderne:** Glassmorphism, gradients, shadows
- **Rent:** Whitespace, tydelig hierarki
- **Responsivt:** Mobile-first approach
- **Accessibility:** Aria-labels, keyboard navigation

### Farger:
- **Cover fallback:** Gradient blue-500 → purple-600
- **Avatar ring:** Default blue-100, custom via hex code
- **Stats cards:** Gradient backgrounds (blue, green, red)
- **Links:** blue-600 hover:blue-800
- **Glassmorphism:** bg-white/95 backdrop-blur-xl

### Typography:
- **Full name:** text-2xl font-bold
- **Username:** text-sm text-gray-500
- **Tagline:** text-sm italic + quotes
- **Bio:** text-sm whitespace-pre-line

### Spacing:
- **Cover-avatar overlap:** -40px (desktop), -64px (overlay)
- **Padding:** pt-4, px-4 standard
- **Gaps:** gap-2, gap-4 for spacing

### Responsive breakpoints:
- **Mobile:** Default styles
- **Tablet:** sm: (640px)
- **Desktop:** md: (768px), lg: (1024px)

---

## 📊 Implementerte features (13/13)

### 1. ✅ Brukernavn-system (@handle)
**Status:** Fullført
**Database:** `username` TEXT UNIQUE NOT NULL
**Frontend:** Vises under full name i ProfileHeader
**Features:**
- Unique constraint
- Validering (3-30 tegn, alphanumerisk + underscore)
- Reserved usernames (admin, moderator, etc.)
- Automatisk generering for eksisterende brukere
- Change tracking

### 2. ✅ Cover-bilde (Banner)
**Status:** Fullført
**Database:** `cover_image_url` TEXT, `profile-covers` bucket
**Frontend:** ProfileHeader, ProfileCoverUpload
**Features:**
- 1200x400px anbefalt størrelse
- Responsive høyder (200px/300px/400px)
- Gradient fallback
- Upload med preview
- Delete funksjon
- 5MB max, 4 formater

### 3. ✅ Avatar status ring
**Status:** Fullført (med bug i ProfileOverlay)
**Database:** `avatar_status_color` TEXT
**Frontend:** ProfileHeader (inline style), ProfileOverlay (bug)
**Features:**
- Custom hex color
- Box-shadow for ring effect
- Default blue-100

**⚠️ Kjent bug:** ProfileOverlay bruker dynamic Tailwind class som ikke fungerer

### 4. ✅ Tagline
**Status:** Fullført
**Database:** `tagline` TEXT
**Frontend:** ProfileHeader, ProfileAboutTab
**Features:**
- Kort 1-linje bio (max 100 tegn)
- Italic styling med quotes
- Vises under username

### 5. ✅ Sosiale lenker
**Status:** Fullført
**Database:** `social_links` JSONB
**Frontend:** SocialLinksEditor, ProfileHeader, ProfileAboutTab
**Features:**
- Max 10 lenker
- Structure: {type, url, label}
- Custom icons (Instagram, Facebook, LinkedIn, etc.)
- Viser 3 på header, "+X mer" indikator
- External link attributes

### 6. ✅ Interesser/Hobbyer
**Status:** Fullført
**Database:** `interests` TEXT[]
**Frontend:** InterestsTagEditor, ProfileAboutTab
**Features:**
- Max 20 interesser, hver max 50 tegn
- GIN index for search
- Badge components med blue color
- Viser 5 i overlay, "+X flere"

### 7. ✅ Samiske organisasjoner
**Status:** Fullført
**Database:** `sami_organizations`, `user_sami_organizations`
**Frontend:** SamiOrganizations
**Features:**
- 8 pre-seeded organisasjoner
- Junction table med role, since_year
- Public/private toggle
- RLS policies

### 8. ✅ Featured Images Gallery
**Status:** Fullført
**Database:** `user_featured_images`
**Frontend:** ProfileFeaturedImages
**Features:**
- 3-6 utvalgte bilder
- Link til media-biblioteket
- Sort order
- RLS policies

### 9. ✅ Profile Statistics View
**Status:** Fullført
**Database:** `profile_stats` view
**Frontend:** ProfileStatsCard
**Features:**
- Total posts, venner, kommentarer, likes
- Posts siste 30 dager
- Last activity timestamps
- 2x2 grid layout med fargede ikoner

### 10. ✅ User Top Posts View
**Status:** Database OK, frontend mangler integrering
**Database:** `user_top_posts` view
**Frontend:** Ikke integrert enda
**Features:**
- Top 5 innlegg per bruker
- Engagement score (likes × 1 + comments × 2)
- ROW_NUMBER() for ranking

**⚠️ TODO:** Integrer i ProfileActivityTab

### 11. ✅ Username Change Tracking
**Status:** Fullført
**Database:** `username_changed_at`, `username_change_count`, trigger
**Frontend:** Backend-only (ikke eksponert)
**Features:**
- Automatisk tracking via trigger
- For rate limiting senere
- Admin oversight

### 12. ✅ Profile Enhancement Storage
**Status:** Fullført
**Database:** `profile-covers` bucket med RLS
**Frontend:** ProfileCoverUpload
**Features:**
- 5MB limit
- 4 mime types (JPEG, PNG, WebP, AVIF)
- Folder structure: userId/filename
- RLS policies for CRUD

### 13. ✅ 5-tab profilsystem
**Status:** Fullført
**Frontend:** ProfileTabs
**Features:**
- Tab 1: Innlegg (FileText icon)
- Tab 2: Om meg (User icon)
- Tab 3: Media (Image icon)
- Tab 4: Aktivitet (TrendingUp icon)
- Tab 5: Innstillinger (Settings icon, kun egen profil)

---

## 🔒 Sikkerhet

### RLS Policies:
✅ `profiles` - Alle kan lese, kun egen kan oppdatere
✅ `reserved_usernames` - Read-only
✅ `sami_organizations` - Read-only
✅ `user_sami_organizations` - User kan CRUD sine egne
✅ `user_featured_images` - User kan CRUD sine egne
✅ Storage `profile-covers` - User kan CRUD sine egne

### Validering:
✅ Username format (regex)
✅ Reserved usernames (trigger)
✅ Social links structure (JSONB validation)
✅ Interests max limits (check constraint)
✅ File upload (accept attribute, 5MB limit)

### Best practices:
✅ External links: `rel="noopener noreferrer"`
✅ Authorization checks (showEditButton)
✅ SQL injection protection (parametrized queries)
✅ XSS protection (React auto-escaping)

---

## 📱 Responsivt design

### Mobile (< 640px):
- Cover: 200px høyde
- Avatar: 96px (w-24)
- Layout: flex-col (vertikal)
- ProfileOverlay: Full-bredde minus 2rem
- Swipe-down-to-close funksjonalitet

### Tablet (640px - 1024px):
- Cover: 300px høyde
- Layout: sm:flex-row (horisontal)
- ProfileOverlay: max-w-lg

### Desktop (> 1024px):
- Cover: 400px høyde
- Layout: Horisontal med høyrejusterte actions
- ProfileOverlay: Posisjonert ved siden av sidebar (left-[22.5rem])

---

## 🧪 Testing

### Build verification:
✅ `npm run build` kompilerer uten feil
✅ TypeScript: Ingen type errors
✅ Alle routes genereres

### Database migrations:
✅ `20260110_profile_enhancements.sql` kjørt
✅ `20260110_fix_profile_covers_storage.sql` kjørt
✅ `20260111_username_migration.sql` kjørt
✅ Alle eksisterende brukere har fått usernames

### Manuell testing (utført):
✅ Cover upload fungerer
✅ Avatar status ring vises (ProfileHeader)
✅ Username vises
✅ Tagline vises
✅ Sosiale lenker fungerer
✅ Interesser vises
✅ Stats card vises
✅ 5-tab system fungerer

### Kjente bugs:
⚠️ Avatar status ring fungerer ikke i ProfileOverlay (dynamic Tailwind class)
⚠️ Top posts view ikke integrert i frontend

---

## 🐛 Identifiserte problemer

### 🔴 Kritisk (MÅ fikses)
**Ingen kritiske bugs**

### 🟠 Høy prioritet (Bør fikses snart)

**1. Avatar status ring bug i ProfileOverlay**
- **Fil:** `ProfileOverlay.tsx:315-317`
- **Problem:** Bruker `ring-[${color}]` som ikke fungerer med dynamic Tailwind
- **Fix:** Bruk inline style med box-shadow (som i ProfileHeader)
- **Estimat:** 15 minutter

**2. Top Posts View ikke integrert**
- **Database:** `user_top_posts` view eksisterer
- **Frontend:** Ikke brukt noe sted
- **Fix:** Integrer i ProfileActivityTab som "Mest populære innlegg"
- **Estimat:** 1 time

### 🟡 Medium prioritet

**3. Cover upload mangler drag-and-drop**
- **Fil:** `ProfileCoverUpload.tsx`
- **Nåværende:** Click to upload
- **Forbedring:** Legg til drag-and-drop zone
- **Estimat:** 2 timer

**4. Social links viser kun 3**
- **Fil:** `ProfileHeader.tsx:313-333`
- **Nåværende:** Viser 3, "+X mer" uten handling
- **Forbedring:** Modal/dropdown for å vise alle lenker
- **Estimat:** 1 time

**5. Interests viser kun 5**
- **Fil:** `ProfileOverlay.tsx:373-392`
- **Nåværende:** Viser 5, "+X flere" uten handling
- **Forbedring:** Modal/dropdown for å vise alle
- **Estimat:** 1 time

### 🟢 Lav prioritet (Nice to have)

**6. Cover image parallax effect**
- **Status:** Ikke implementert
- **Forbedring:** CSS parallax on scroll
- **Estimat:** 2 timer

**7. Username history tracking UI**
- **Database:** Har tracking-felter
- **Frontend:** Ikke eksponert
- **Forbedring:** Vis i admin-panel
- **Estimat:** 30 minutter

**8. Visual color picker**
- **Fil:** `AccountSettings.tsx`
- **Nåværende:** Text input for hex code
- **Forbedring:** Visual color picker component
- **Estimat:** 1 time

---

## ✨ Styrker

1. **Database design:** Eksemplarisk! Validering, triggers, views, indexes
2. **RLS policies:** Omfattende og korrekt
3. **Component struktur:** Godt modularisert
4. **Glassmorphism design:** Moderne og vakkert
5. **Type safety:** TypeScript interfaces godt definert
6. **Loading states:** Skeleton loaders på alle komponenter
7. **Error handling:** Toast notifications konsekvent
8. **Accessibility:** Aria-labels på viktige elementer
9. **Performance:** GIN indexes, views for pre-aggregering
10. **Build:** Kompilerer uten feil

---

## 📊 Samlet vurdering

| Kategori | Score | Kommentar |
|----------|-------|-----------|
| **Database design** | 10/10 | Perfekt struktur og validering |
| **Frontend implementering** | 8.5/10 | Svært godt, noen små mangler |
| **Design/UX** | 9/10 | Moderne glassmorphism, flott |
| **Responsivt design** | 9/10 | Fungerer godt mobil og desktop |
| **Sikkerhet** | 9/10 | RLS policies og validering OK |
| **Performance** | 8/10 | Godt, men kan optimaliseres |
| **Code quality** | 8.5/10 | Rent, men litt duplisering |
| **Testing** | 7/10 | Builds OK, mangler unit tests |

**Total score:** **8.6/10** ⭐⭐⭐⭐

---

## 📋 Neste steg

### Umiddelbare forbedringer (1-2 timer):
- [ ] Fikse avatar status ring i ProfileOverlay
- [ ] Integrer user_top_posts view i ProfileActivityTab
- [ ] Legg til klikk-handling for "+X mer" lenker

### Kortsiktige forbedringer (1 dag):
- [ ] Drag-and-drop for cover upload
- [ ] Visual color picker for avatar status ring
- [ ] "Se alle interesser" modal

### Langsiktige forbedringer (1 uke+):
- [ ] Parallax effect på cover image
- [ ] Username history i admin-panel
- [ ] Drag-and-drop reorder for featured images
- [ ] Optimalisere ProfileOverlay queries (single query med joins)

---

## 💬 Konklusjon

Profilsystemet er **profesjonelt implementert** med:
- ✅ Alle 13 features fullført
- ✅ Moderne, vakkert design
- ✅ Solid database-arkitektur
- ✅ God sikkerhet

**Små forbedringer** trengs:
- Fikse avatar ring bug i ProfileOverlay
- Integrer top posts view
- Legg til drag-and-drop

**Anbefaling:** Kan deployes til produksjon **nå**, med små bugs fikset i neste patch.

---

## 🔧 HOTFIXES (2026-01-11 kveld)

### Fix #1: Fake statistikk i profile_stats view ⚠️ KRITISK
**Problem:** Brukere fikk feil statistikk (f.eks. 15.232 likes når de bare hadde noen få)
**Root cause:** SQL view multipliserte likes pga. dårlige JOINs
**Løsning:** Ny migrering `20260111_fix_profile_stats_view.sql`
- Separate subqueries for hver statistikk
- COUNT(DISTINCT) for å unngå duplikater
- Riktig telling uten multiplikasjon

**Filer:** `supabase/migrations/20260111_fix_profile_stats_view.sql`
**Status:** ✅ Deployet og verifisert

### Fix #2: Dårlig kontrast på profilnavn over banner
**Problem:** Profilnavn viste i overgangen mellom banner og hvit bakgrunn - dårlig lesbarhet
**Løsning:**
- Gradient overlay på bunnen av banner: `bg-gradient-to-b from-transparent to-black/40`
- Hvit tekst på mobil med drop-shadow: `text-white drop-shadow-lg`
- Responsivt: Grå tekst på desktop: `sm:text-gray-900`
- Fungerer med alle banner-farger (lys/mørk)

**Filer:** `src/components/profile/ProfileHeader.tsx`
**Status:** ✅ Testet med forskjellige banner-bilder

### Fix #3: Whitespace over banner
**Problem:** Hvit space mellom toppen av profil-kortet og banneret
**Løsning:** Lagt til `p-0` på Card-komponenten
**Filer:** `src/components/profile/ProfileHeader.tsx`
**Status:** ✅ Banner går nå helt til kanten

---

**Dokumentert av:** AI Code Review
**Dato:** 2026-01-11
**Versjon:** 1.1 (oppdatert med hotfixes)
