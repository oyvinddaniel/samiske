# BACKLOG.md - Oppgaveliste

> Alt som skal bygges, fikses eller vurderes.  
> Sist oppdatert: 2025-12-26

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
- [ ] Group avatar - manuell testing
- [ ] Geography suggestions - manuell testing
- [ ] Migrere eksisterende bilder til ny `media` tabell
- [ ] Bunny.net video setup (fullføre)
- [ ] Slette legacy komponent (`ny/page.tsx`)

### SPA-konvertering 🟠
- [ ] **Fase 2:** Bokmerker (`/bokmerker`)
- [ ] **Fase 2:** Grupper liste (`/grupper`)
- [ ] **Fase 2:** Innlegg detalj (`/innlegg/[id]`)
- [ ] **Fase 3:** Brukerprofiler (`/bruker/[username]`)
- [ ] **Fase 3:** Gruppe-detalj (`/grupper/[slug]`)
- [ ] **Fase 3:** Geografi enkelt-nivå
- [ ] **Fase 4:** Samfunn (`/samfunn/[slug]`)
- [ ] **Fase 4:** Geografi hierarki (4 nivåer)
- [ ] **Fase 5:** Polering og UX
- [ ] **Fase 6:** Omfattende testing

### Post-Composer Testing 🟡
- [ ] Video upload og transcoding
- [ ] Polls (opprettelse og voting)
- [ ] Planlagte innlegg (scheduled posts)
- [ ] Emoji-picker i toolbar
- [ ] Arkivering av innlegg

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

### Advanced Gallery System
- [ ] Database-migrering (`20241225_media_social_features.sql`)
- [ ] Gallery-visning i feed
- [ ] Album-funksjonalitet

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
- [ ] Reactions (mer enn bare like)
- [ ] Stories/ephemeral content
- [ ] Live streaming

### Integrasjoner
- [ ] Kalender-sync (Google/Apple)
- [ ] Social sharing cards (OG images)

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
- [ ] E2E tester for kritiske flyter

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

**Sist oppdatert:** 2025-12-26  
**Oppdatert av:** Claude (migrering)
