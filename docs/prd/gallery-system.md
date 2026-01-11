# PRD: Gallery System (Retrospektiv)

> **Status:** Implementert - Krever feilretting og testing
> **Opprettet:** 2026-01-08
> **Sist oppdatert:** 2026-01-08
> **Type:** Retrospektiv dokumentasjon av eksisterende system

---

## Oversikt

**Hva:** Avansert bildeviser-system for samiske.no med to visningsmodier (masonry og single), image-level engagement, og full responsivitet.

**Hvorfor:**
- Behov for profesjonell gallerivisning av flere bilder
- Ønske om image-level engagement (likes og kommentarer per bilde) i tillegg til post-level
- Krav om optimal mobil- og desktop-opplevelse
- Støtte for både post-bilder og geografi-bilder

**For hvem:**
- Brukere som ser på innlegg med flere bilder
- Brukere som utforsker geografi-bilder
- Fotografer og innholdsskapere som deler bildeserier

---

## Hva ble bygget

### 6 hovedkomponenter

1. **AdvancedGalleryViewer.tsx** - Hovedorkestrator
   - Håndterer to modi: masonry og single
   - Keyboard navigation (arrow keys, ESC)
   - Loop navigation (siste → første)
   - Context-aware rendering (post vs geography)

2. **GalleryImageSidebar.tsx** - For geography-bilder
   - Mørk design (#18181B)
   - Uploader-profil med avatar
   - Caption og metadata
   - Kommentarer og likes (media-table backend)
   - Instagram/Threads-inspirert styling

3. **PostGallerySidebar.tsx** - For post-bilder
   - To modi: Masonry (post-kontekst) og Single (image-level engagement)
   - Desktop: Fast left sidebar (w-96)
   - Mobile: Floating button + Bottom sheet
   - Post-kontekst: Forfatter, tittel, innhold, geografi
   - Image-level: Kommentarer og likes per bilde

4. **MobileSingleImageView.tsx** - Mobil feed card
   - Fullscreen scrollable feed card design
   - Pinch-to-zoom (1x-4x) og double-tap zoom
   - Post-forfatter header
   - Image engagement (likes, comments)
   - Comment input + threaded comments
   - **PROBLEM: Bruker mock-data i stedet for backend**

5. **MobileMasonryHeader.tsx** - Sticky header i masonry (mobil)
   - Max 40vh høyde med internal scroll
   - Expandable post-tekst ("Les mer")
   - Comment preview (2 første, load 5 at a time)
   - Per-comment expansion for lange kommentarer
   - Geography card integration

6. **MobileSingleBottomSheet.tsx** - Bottom sheet for single image
   - Per-image engagement data
   - 5-minutters cache (TTL)
   - Optimistic UI for likes
   - Comment input og list
   - Auto-updates når bilde endres

### Database-migrasjoner

**20260106_post_image_engagement.sql** - Polymorfisk engagement
```sql
-- Utvid media_comments og media_likes til å støtte både:
-- - media_id (geografi-bilder fra media-tabellen)
-- - post_image_id (post-bilder fra post_images-tabellen)

ALTER TABLE media_comments
ADD COLUMN post_image_id UUID REFERENCES post_images(id);

ALTER TABLE media_likes
ADD COLUMN post_image_id UUID REFERENCES post_images(id);

-- Constraint: Må ha ENTEN media_id ELLER post_image_id
CHECK (
  (media_id IS NOT NULL AND post_image_id IS NULL) OR
  (media_id IS NULL AND post_image_id IS NOT NULL)
)
```

**Helper functions:**
- `get_post_image_comment_count(post_image_id)`
- `get_post_image_like_count(post_image_id)`
- `has_user_liked_post_image(post_image_id, user_id)`
- `get_post_images_engagement(post_image_ids[], user_id)` - Batch-query

**20260106_post_images_captions.sql** - Caption-støtte
```sql
ALTER TABLE post_images
ADD COLUMN title TEXT,
ADD COLUMN caption TEXT,
ADD COLUMN alt_text TEXT;
```

### TypeScript Types

**src/lib/types/gallery.ts**
```typescript
interface GalleryImage {
  id: string
  storage_path?: string  // For media-tabellen
  url?: string           // For post_images-tabellen
  post_image_id?: string // For engagement-queries
  thumbnail_url?: string | null
  caption?: string | null
  alt_text?: string | null
  width?: number | null
  height?: number | null
  sort_order: number

  // Uploader
  uploader?: {
    id: string
    full_name: string
    avatar_url?: string | null
  }

  // IMAGE-level engagement
  comment_count?: number
  like_count?: number
  has_liked?: boolean
}

interface GalleryContext {
  type: 'geography' | 'post' | 'profile' | 'community' | 'group' | 'event'
  entity_id: string
  entity_name?: string

  // Post-spesifikk kontekst
  post_data?: {
    id: string
    title: string
    content: string
    user: { id, full_name, avatar_url }
    created_at: string

    // POST-level engagement (forskjellig fra image-level)
    like_count: number
    comment_count: number
    user_has_liked?: boolean

    // Geografisk kontekst
    geography?: {
      type: 'municipality' | 'place' | 'language_area'
      id: string
      name: string
      description?: string | null
    }
  }
}

type GalleryViewMode = 'masonry' | 'single'
```

---

## Funksjonelle krav (implementert)

### Visnings-modi

#### Masonry Mode
- [x] 3-kolonne CSS columns layout
- [x] Vertical scroll (ikke horisontal)
- [x] Hover-overlay med engagement badges
- [x] Click-to-expand til single mode
- [x] Post-kontekst i sidebar (for post-type)
- [x] Header med teller og close-knapp

#### Single Image Mode
- [x] Fullscreen med large image
- [x] Context-aware sidebar (post vs geography)
- [x] Navigation arrows (prev/next)
- [x] Loop navigation
- [x] Image counter (3/10)
- [x] Close button
- [x] ESC → Back to masonry
- [x] Arrow keys → Navigate

### Engagement System

#### Image-level (per bilde)
- [x] Likes (heart icon)
- [x] Comments med avatar
- [x] Comment count
- [x] Like count
- [x] User has_liked status
- [x] Realtime add comment
- [x] Optimistic UI for likes

#### Post-level (hele innlegget)
- [x] Vises i masonry mode sidebar
- [x] Separate counts
- [x] Geography card integration
- [x] Post comments preview

### Responsivitet

#### Desktop (≥768px)
- [x] Fixed left sidebar (w-96)
- [x] Large image area (flex-1)
- [x] Keyboard shortcuts
- [x] Hover effects

#### Mobile (<768px)
- [x] Fullscreen layouts
- [x] Touch-friendly UI
- [x] Pinch-to-zoom (1x-4x)
- [x] Double-tap zoom
- [x] Floating action button
- [x] Bottom sheet for context
- [x] Sticky header i masonry
- [x] Max 40vh scroll area

### Context Types

- [x] `post` - Post-bilder med full post-kontekst
- [x] `geography` - Geografi-bilder (municipality, place, language_area)
- [x] `profile` - Profilbilder (ikke fullt implementert)
- [x] `community` - Community-bilder (ikke fullt implementert)
- [x] `group` - Gruppebilder (ikke fullt implementert)
- [x] `event` - Event-bilder (ikke fullt implementert)

---

## Teknisk løsning

### Arkitektur

```
src/components/gallery/
├── AdvancedGalleryViewer.tsx        # Main orchestrator
├── GalleryImageSidebar.tsx          # Geography sidebar (desktop)
├── PostGallerySidebar.tsx           # Post sidebar (desktop + mobile)
├── MobileSingleImageView.tsx        # Mobile feed card
├── MobileMasonryHeader.tsx          # Mobile masonry header
└── MobileSingleBottomSheet.tsx      # Mobile bottom sheet

src/lib/
├── types/gallery.ts                 # TypeScript types
├── mediaComments.ts                 # Engagement API
└── media/mediaUrls.ts               # URL generation

supabase/migrations/
├── 20260106_post_image_engagement.sql
└── 20260106_post_images_captions.sql
```

### Helper Functions (mediaComments.ts)

**Polymorfisk design:**
```typescript
type ImageType = 'media' | 'post_image'

// Comments
getMediaComments(imageId, imageType)
addMediaComment(imageId, content, imageType)
deleteMediaComment(commentId)
getMediaCommentCount(imageId, imageType)

// Likes
toggleMediaLike(imageId, imageType)
getMediaLikeCount(imageId, imageType)
hasUserLikedMedia(imageId, imageType)

// Batch queries
getMediaWithSocialData(mediaIds)
```

### State Management

**AdvancedGalleryViewer:**
- `viewMode`: 'masonry' | 'single'
- `currentIndex`: number
- Body scroll lock

**Engagement components:**
- `comments`: MediaComment[]
- `likeCount`: number
- `hasLiked`: boolean
- `isSubmitting`: boolean
- `isLiking`: boolean
- `currentUser`: User | null

**Mobile pinch-zoom:**
- `scale`: 1-4
- `translateX/Y`: number
- `initialDistance`: number
- `initialScale`: number

---

## Design/UX

### Design-prinsipper

1. **Dark theme first** (#18181B bakgrunn)
   - Subtle transparency (white/[0.08])
   - Vibrant action colors (rose-500, blue-500)
   - Adequate spacing
   - Clean visual hierarchy

2. **Instagram/Threads-inspirert**
   - Rounded avatars med ring
   - Pill-shaped engagement badges
   - Smooth hover transitions
   - Modern typography

3. **Responsivitet**
   - Desktop: Sidebar + large image
   - Mobile: Feed card design
   - Touch-optimized controls
   - Adaptive layouts

### Brukerflyt

#### Desktop - Post Gallery
1. Bruker klikker "Se alle bilder" på post
2. `AdvancedGalleryViewer` åpner i masonry mode
3. Left sidebar viser post-kontekst (forfatter, tittel, innhold, post-level engagement)
4. Masonry grid viser alle bilder i 3 kolonner
5. Bruker klikker på et bilde
6. Single mode åpner med stort bilde + image-level sidebar
7. Sidebar bytter til image-specific comments/likes
8. Arrow keys navigerer mellom bilder
9. ESC → Tilbake til masonry
10. ESC igjen → Lukk viewer

#### Mobile - Post Gallery
1. Bruker klikker "Se alle bilder"
2. Fullscreen masonry med sticky header
3. Header viser post-kontekst (expandable)
4. Comment preview (2 første, load 5 at a time)
5. Bruker klikker på bilde
6. `MobileSingleImageView` åpner (feed card)
7. Pinch-to-zoom og double-tap funksjonalitet
8. Scroll ned for comments
9. Swipe/arrows for neste bilde
10. Back button → Masonry

---

## Kjente problemer

### 1. Inkonsistent styling (PostGallerySidebar)

**Problem:**
PostGallerySidebar bruker conditional rendering basert på `isMobile`:
```typescript
// Desktop: Sort bakgrunn (#18181B)
className={isMobile ? "text-gray-900" : "text-white"}
className={isMobile ? "bg-gray-50" : "bg-white/[0.05]"}

// Mobile: Grå bakgrunn
className={isMobile ? "bg-gray-100" : "bg-white/[0.08]"}
```

**Konsekvens:**
- Samme komponent ser helt forskjellig ut på desktop vs mobile
- Vanskelig å vedlikeholde
- Brudd på single responsibility principle

**Løsning:**
- Split til to separate komponenter: `DesktopPostSidebar` og `MobilePostSidebar`
- ELLER: Bruk consistent design system på tvers av plattformer

### 2. Mock-data i MobileSingleImageView

**Problem:**
MobileSingleImageView bruker hardkodet mock-data for kommentarer:
```typescript
const mockComments = [
  { id: 1, user: 'John Doe', text: 'Utrolig vakkert! 😍', likes: 5 },
  { id: 2, user: 'Mari Hansen', text: 'Hvor er dette fotografert?', likes: 2 },
]
```

**Konsekvens:**
- Brukere ser fake kommentarer
- Ingen persistens
- Fungerer ikke i produksjon

**Løsning:**
- Integrer med `mediaComments.ts` API
- Bruk samme engagement-loading som `PostGallerySidebar` Single mode
- Implementer cache for performance

### 3. Desktop vs Mobile conditional i AdvancedGalleryViewer

**Problem:**
Bruker runtime `isMobile` detection:
```typescript
const [isMobile, setIsMobile] = useState(false)

useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth < 768)
  checkMobile()
  window.addEventListener('resize', checkMobile)
  return () => window.removeEventListener('resize', checkMobile)
}, [])

if (isMobile && context.type === 'post') {
  return <MobileSingleImageView ... />
}
```

**Konsekvens:**
- Flash of wrong content on load
- Extra re-renders
- Ikke SSR-vennlig

**Løsning:**
- Bruk CSS media queries for layout
- ELLER: Use Tailwind responsive classes (`hidden md:block`)
- ELLER: Server-side device detection

---

## Testing-status

### Automatisert testing
- [ ] Unit tests (ingen implementert)
- [ ] Integration tests (ingen implementert)
- [ ] E2E tests (ingen implementert)

### Manuell testing

#### Desktop
- [ ] Post gallery - masonry mode
- [ ] Post gallery - single mode
- [ ] Geography gallery
- [ ] Keyboard navigation
- [ ] Image loading states
- [ ] Comment submission
- [ ] Like toggle
- [ ] Error states

#### Mobile
- [ ] Masonry header scroll
- [ ] Pinch-to-zoom
- [ ] Double-tap zoom
- [ ] Bottom sheet
- [ ] Comment input
- [ ] Touch navigation

### Edge cases å teste
- [ ] Gallery med 1 bilde
- [ ] Gallery med 100+ bilder
- [ ] Bilder med forskjellige aspect ratios
- [ ] Bilder som feiler å laste
- [ ] Kommentarer under loading
- [ ] Offline mode
- [ ] Slow network
- [ ] Concurrent likes/unlikes

---

## Akseptansekriterier

### Funksjonelle
- [ ] Bruker kan se alle bilder i masonry layout
- [ ] Bruker kan klikke på bilde for fullskjerm
- [ ] Bruker kan navigere med arrow keys (desktop)
- [ ] Bruker kan zoome med pinch (mobile)
- [ ] Bruker kan like individuelle bilder
- [ ] Bruker kan kommentere på individuelle bilder
- [ ] Kommentarer persisterer i database
- [ ] Engagement counts er korrekte
- [ ] Loop navigation fungerer (siste → første)

### Tekniske
- [ ] Ingen console errors
- [ ] Images lazy loads
- [ ] Comments fetches kun en gang
- [ ] Optimistic UI for likes
- [ ] RLS policies er korrekte
- [ ] No memory leaks (cleanup useEffect)
- [ ] Ingen mock-data i produksjon

### UX/Design
- [ ] Smooth transitions mellom modi
- [ ] Loading states er synlige
- [ ] Error messages er forståelige
- [ ] Touch targets er store nok (mobile)
- [ ] Keyboard navigation er intuitivt
- [ ] Design er konsistent på tvers av plattformer

---

## Neste steg

### Kritisk (må fikses før produksjon)
1. **Erstatt mock-data i MobileSingleImageView**
   - Integrer med `mediaComments.ts`
   - Test med ekte data
   - Implementer error handling

2. **Fiks styling-inkonsistens i PostGallerySidebar**
   - Velg én design approach
   - Refactor conditional rendering
   - Test på både desktop og mobile

3. **Implementer proper mobile detection**
   - Fjern useState + useEffect pattern
   - Bruk CSS media queries eller Tailwind
   - Test SSR compatibility

### Viktig (bør gjøres)
4. **Legg til automated tests**
   - Unit tests for engagement functions
   - Integration tests for component interactions
   - E2E tests for critical flows

5. **Performance optimisering**
   - Implement image lazy loading
   - Add skeleton loaders
   - Cache engagement data
   - Optimize re-renders

6. **Error handling**
   - Failed image loads
   - Network errors
   - Permission errors
   - Graceful degradation

### Nice-to-have
7. **Accessibility**
   - Keyboard navigation improvements
   - Screen reader support
   - ARIA labels
   - Focus management

8. **Features**
   - Share functionality
   - Download image
   - Report image
   - Image metadata modal

---

## Sikkerhet og GDPR

### Implementert
- [x] RLS policies på media_comments
- [x] RLS policies på media_likes
- [x] User authentication required for engagement
- [x] Input validation (2000 char limit)
- [x] XSS protection (React auto-escaping)

### Vurder
- [ ] Rate limiting på comments/likes
- [ ] Image content moderation
- [ ] Copyright protection
- [ ] GDPR export for image engagement data
- [ ] User blocking functionality

---

## Referanser

### Kode
- `/src/components/gallery/` - Alle komponenter
- `/src/lib/types/gallery.ts` - TypeScript types
- `/src/lib/mediaComments.ts` - Engagement API
- `/supabase/migrations/20260106_*` - Database

### Design-inspirasjon
- Instagram Stories/Reels gallery
- Threads comment section
- Apple Photos app
- Google Photos web

### Relaterte features
- Media Service (`docs/prd/media-service.md`)
- Post system (`src/components/posts/`)
- Geography system (`src/components/geography/`)

---

**Dokumentert av:** Claude Sonnet 4.5
**Dokumentasjonsdato:** 2026-01-08
**Basert på:** Eksisterende kodebase-analyse
