# Prosjektstatus - samiske.no

> Sist oppdatert: 2025-12-18

## Nåværende status

**LIVE på samiske.no** med ekte brukere

### Scores
- **Sikkerhet:** 8/10
- **Kodekvalitet:** 7/10

---

## Pågående arbeid

### @mention/tagging av brukere (18. desember 2025) - FULLFØRT
- **Status:** Live i produksjon
- [x] MentionTextarea komponent med autocomplete
- [x] Bruker-søk når man skriver @
- [x] Tastaturnavigasjon (piltaster, Enter, Tab)
- [x] Mentions vises som klikkbare lenker
- [x] Varsling til nevnte brukere
- [x] Støtte i innlegg og kommentarer

### Galleri/Album-system for bilder (18. desember 2025) - INTEGRERT
- **Status:** Integrert i PostCard, live i produksjon
- [x] 7 preview-stiler for feed (demo på `/demo/gallery-styles`)
- [x] Masonry viewer med sidebar (desktop)
- [x] Fullskjerm med swipe-navigasjon (mobil)
- [x] Loop-navigasjon (første ↔ siste bilde)
- [x] Swipe ned for å lukke
- [x] ImageGallery.tsx komponent opprettet
- [x] Integrert i PostCard
- [ ] Database-støtte for flere bilder per innlegg (fremtidig)

### GeographyTab refaktorering (17. desember 2025) - FULLFØRT
Splittet admin-panelet fra 1175 linjer til 8 separate filer.
- **Status:** Fullført og verifisert
- **Resultat:** 91% reduksjon (1175 → 109 linjer)

### SPA-konvertering (startet 16. desember 2025)
Konverterer appen til Single Page Application for bedre brukeropplevelse.
- **Status:** Fase 1 av 6 fullført
- **Detaljer:** Se `agent_docs/spa-conversion.md`
- [x] Fase 1: Kalender fungerer som SPA
- [ ] Fase 2: Bokmerker, grupper, innlegg
- [ ] Fase 3: Profiler, gruppe-detalj, geografi
- [ ] Fase 4: Samfunn, geografi-hierarki
- [ ] Fase 5: Polering og UX
- [ ] Fase 6: Testing

---

## Fullførte funksjoner

### Kjernefunksjonalitet
- [x] Hovedfeed med kronologisk visning
- [x] Innlegg (standard og arrangement)
- [x] Bildeopplasting med komprimering
- [x] Kategorifiltrering
- [x] Offentlig/privat synlighet
- [x] Popup-visning av innlegg
- [x] Redigering av egne innlegg
- [x] Sletting av egne innlegg

### Brukerinteraksjon
- [x] Kommentarer med sanntidsoppdatering
- [x] Like på innlegg og kommentarer
- [x] Dele innlegg (Web Share API)
- [x] Bokmerke innlegg
- [x] Søkefunksjon (Cmd+K)
- [x] @mention/tagging av brukere (nytt 18. des)

### Søkesystem (8 kategorier) - FULLFØRT
- [x] Søk i brukere, innlegg, arrangementer, kommentarer
- [x] Søk i geografi, samfunn, tjenester, produkter
- [x] Caching med 5 min TTL
- [x] Tastaturnavigasjon
- **Detaljer:** Se `agent_docs/search.md`

### Sosiale funksjoner
- [x] Vennefunksjon med forespørsler
- [x] Direktemeldinger mellom venner
- [x] Brukerprofiler

### System
- [x] Varslingssystem (bjelle-ikon)
- [x] E-postvarsling til admin
- [x] Feedback-system
- [x] Admin-panel med moderering
- [x] Onboarding for nye brukere
- [x] Mine steder (lokasjoner)
- [x] Changelog-system (nytt 16. des)
- [x] Brukeraktivitetslogging (nytt 16. des)

### Sikkerhet (løst)
- [x] RLS policies på alle tabeller
- [x] Service Role Key rotert
- [x] Passordbekreftelse på kontosletting
- [x] Input-validering med lengdegrenser
- [x] N+1 query fikset
- [x] Kritisk privacy leak fikset (14. des) - se `docs/SECURITY-INCIDENT-2025-12-14.md`
- [x] Rate limiting på sensitive API-ruter

### Sapmi-transformasjon (fullført 13. des)
- [x] Fase 1-8: Geografi, grupper, samfunn, vennesirkler, feed-redesign, RSVP
- [x] Fase 9: Universelt søk (8 kategorier)
- **Detaljer:** Se `docs/sapmi/MASTER-PLAN.md`

---

## Gjenstående oppgaver

### Lav prioritet
- [ ] E-postbekreftelse (når spam blir problem)
- [ ] PWA offline-støtte
- [ ] VAPID secrets for push-varsler (må konfigureres i Supabase)

---

## Kjente begrensninger

1. Auto-confirm brukere (dokumentert risiko)
2. Ingen gruppechat ennå

---

## Viktige beslutninger

Se `docs/DECISIONS.md` for full logg. Nøkkelbeslutninger:

1. **Tech stack:** Next.js 15 + Supabase + Vercel
2. **Autentisering:** Supabase Auth med auto-confirm
3. **RLS:** Alle tabeller har policies
4. **UI-språk:** Kun norsk
5. **Farger:** Samiske flaggfarger som aksenter
6. **SPA:** Pathname-basert navigasjon (ikke query params)
