# CHANGELOG.md - Prosjekthistorikk

> Kronologisk logg over alle betydelige endringer  
> Sist oppdatert: 2025-12-26

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

**Sist oppdatert:** 2025-12-26  
**Oppdatert av:** Claude (migrering)
