# Komponent Changelog

> **Sist oppdatert:** 2025-12-13 (Fase 2 fullfort)

Kronologisk logg over alle komponent-endringer i Sapmi-transformasjonen.

---

## Nye komponenter

### [2025-12-13] GeographyBreadcrumb.tsx

**Type:** NY
**Fase:** 2
**Sti:** `/src/components/geography/GeographyBreadcrumb.tsx`

**Beskrivelse:**
Brødsmulenavigasjon for geografihierarkiet. Viser Sapmi > Norge > Kommune > Sted.

**Avhengigheter:**
- Lucide React ikoner (Globe, Map, Building2, MapPin, ChevronRight)
- Next.js Link

**Breaking changes:** Nei

---

### [2025-12-13] GeographyCard.tsx

**Type:** NY
**Fase:** 2
**Sti:** `/src/components/geography/GeographyCard.tsx`

**Beskrivelse:**
Kort for a vise geografiske enheter (land, sprakområde, kommune, sted) med ikon og lenke.

**Avhengigheter:**
- shadcn/ui Card
- Lucide React ikoner
- Next.js Link

**Breaking changes:** Nei

---

### [2025-12-13] GeographySelector.tsx

**Type:** NY
**Fase:** 2
**Sti:** `/src/components/geography/GeographySelector.tsx`

**Beskrivelse:**
Dropdown-velger for a velge kommune og sted. To-trinns prosess: velg kommune forst, deretter valgfritt sted.

**Avhengigheter:**
- shadcn/ui Command, Popover, Button
- Lucide React ikoner
- Supabase client

**Breaking changes:** Nei

---

### [2025-12-13] StarPlaceButton.tsx

**Type:** NY
**Fase:** 2
**Sti:** `/src/components/geography/StarPlaceButton.tsx`

**Beskrivelse:**
Knapp for a stjernemerke kommuner og steder. Lagrer i user_starred_municipalities / user_starred_places.

**Avhengigheter:**
- shadcn/ui Button
- Lucide React Star
- sonner toast
- geography lib functions

**Breaking changes:** Nei

---

### [2025-12-13] AddStarredLocationModal.tsx

**Type:** NY
**Fase:** 2
**Sti:** `/src/components/geography/AddStarredLocationModal.tsx`

**Beskrivelse:**
Modal-dialog for a legge til nye stjernemerkede steder. Bruker GeographySelector for a velge kommune/sted.

**Avhengigheter:**
- shadcn/ui Dialog, Button
- GeographySelector komponent
- geography lib functions (starMunicipality, starPlace)
- sonner toast

**Breaking changes:** Nei

---

## Nye konfigurasjonsfiler

### [2025-12-13] sidebar.ts

**Type:** NY
**Fase:** 2
**Sti:** `/src/lib/config/sidebar.ts`

**Beskrivelse:**
Sentral konfigurasjonsfil for sidebar. Gjor det enkelt a endre lenker, tekster og design uten a grave i komponentkoden.

**Innhold:**
- `geographyUrls` - URL-byggere for geografiske sider
- `locationIcons` - Mapping mellom lokasjonstyper og Lucide-ikoner
- `sidebarConfig` - Innstillinger (default antall synlige steder, localStorage-nokler, labels)
- `buildLocationUrl()` - Hjelpefunksjon for a bygge URL

**Avhengigheter:**
- Lucide React ikoner

**Breaking changes:** Nei

---

## Modifiserte komponenter

### [2025-12-13] Sidebar.tsx (v2)

**Type:** MODIFISERT
**Fase:** 2
**Sti:** `/src/components/layout/Sidebar.tsx`

**Beskrivelse:**
Fullstendig omstrukturert geografiseksjonen. Byttet fra statiske lenker til dynamisk visning av brukerens stjernemerkede steder.

**Endringer:**
- Erstattet statiske "Sapmi/Norge/Nordsamisk" lenker
- Ny "Utforsk Sapmi" lenke (alltid synlig)
- "Mine steder" seksjon kun for innloggede brukere
- Dynamisk lasting av stjernemerkede kommuner/steder
- "Legg til sted" knapp som apner AddStarredLocationModal
- "Se alle" lenke hvis flere enn maxVisibleLocations
- Konfigurerbart antall synlige steder (default: 5, lagres i localStorage)
- Bruker sentral konfigurasjon fra `/src/lib/config/sidebar.ts`

**Avhengigheter:**
- AddStarredLocationModal komponent
- `/src/lib/config/sidebar.ts` konfigurasjon
- Supabase client

**Breaking changes:** Nei

---

## Mal for endringer

```markdown
### [DATO] KomponentNavn.tsx

**Type:** NY / MODIFISERT / SLETTET
**Fase:** X
**Sti:** /src/components/...

**Beskrivelse:**
Hva komponenten gjor / hva som ble endret

**Avhengigheter:**
- Komponent A
- Komponent B

**Breaking changes:** Ja/Nei
```
