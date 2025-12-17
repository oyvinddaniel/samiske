# Refaktorering av GeographyTab.tsx

> **Opprettet:** 2025-12-17
> **Status:** Steg 1-6 fullført, venter på testing
> **Fil:** `src/components/admin/GeographyTab.tsx` (1175 → 109 linjer)

---

## Oversikt

GeographyTab.tsx er admin-panelet for å administrere geografiske data (land, språkområder, kommuner, steder). Filen er for stor (1175 linjer) og må splittes opp.

**God nyhet:** Arbeidet er allerede 40% ferdig! To av fem faner er ekstrahert.

---

## Nåværende status

| Komponent | Status | Linjer |
|-----------|--------|--------|
| CountriesTab.tsx | ✅ Ferdig | 35 |
| LanguageAreasTab.tsx | ✅ Ferdig | 243 |
| SuggestionsTab.tsx | ✅ Ferdig | 217 |
| MunicipalitiesTab.tsx | ✅ Ferdig | 269 |
| PlacesTab.tsx | ✅ Ferdig | 202 |
| useGeographyData.ts | ✅ Ferdig | 71 |
| types.ts | ✅ Ferdig | 62 |
| GeographyTab.tsx | ✅ Ferdig | 109 |

---

## STEG-FOR-STEG PLAN

### Steg 1: Forberedelse og backup
**Hva:** Lag backup av originalfilen
**Hvorfor:** Sikkerhetskopi hvis noe går galt
**Kommando:**
```
cp src/components/admin/GeographyTab.tsx src/components/admin/GeographyTab.tsx.backup
```
**Verifisering:** Filen `GeographyTab.tsx.backup` eksisterer
**Risiko:** Ingen

---

### Steg 2: Lag SuggestionsTab.tsx
**Hva:** Ekstraher "Forslag"-fanen til egen fil
**Kilde:** Linje 536-705 i GeographyTab.tsx
**Mål:** `src/components/admin/geography/SuggestionsTab.tsx`
**Størrelse:** ~170 linjer

**Innhold som flyttes:**
- Visning av brukerforslag
- Godkjenn/avslå-knapper
- Status-badges

**Verifisering:**
1. Filen eksisterer
2. `npm run build` gir ingen feil

---

### Steg 3: Lag MunicipalitiesTab.tsx
**Hva:** Ekstraher "Kommuner"-fanen til egen fil
**Kilde:** Linje 871-1074 i GeographyTab.tsx
**Mål:** `src/components/admin/geography/MunicipalitiesTab.tsx`
**Størrelse:** ~200 linjer

**Innhold som flyttes:**
- Liste over kommuner
- Legg til/rediger kommune
- Kobling til land

**Verifisering:**
1. Filen eksisterer
2. `npm run build` gir ingen feil

---

### Steg 4: Lag PlacesTab.tsx
**Hva:** Ekstraher "Steder"-fanen til egen fil
**Kilde:** Linje 1076-1254 i GeographyTab.tsx
**Mål:** `src/components/admin/geography/PlacesTab.tsx`
**Størrelse:** ~180 linjer

**Innhold som flyttes:**
- Liste over steder
- Legg til/rediger sted
- Kobling til kommune

**Verifisering:**
1. Filen eksisterer
2. `npm run build` gir ingen feil

---

### Steg 5: Oppdater GeographyTabNew.tsx
**Hva:** Legg til import av de nye komponentene
**Fil:** `src/components/admin/GeographyTabNew.tsx`

**Endringer:**
```tsx
// Legg til disse imports:
import { SuggestionsTab } from './geography/SuggestionsTab'
import { MunicipalitiesTab } from './geography/MunicipalitiesTab'
import { PlacesTab } from './geography/PlacesTab'
```

**Verifisering:** `npm run build` gir ingen feil

---

### Steg 6: Bytt til ny versjon
**Hva:** Erstatt gammel GeographyTab med ny versjon
**Kommandoer:**
```
mv src/components/admin/GeographyTab.tsx src/components/admin/GeographyTab.OLD.tsx
mv src/components/admin/GeographyTabNew.tsx src/components/admin/GeographyTab.tsx
```

**Verifisering:**
1. `npm run build` gir ingen feil
2. Start `npm run dev`
3. Gå til admin-panelet → Geografi
4. Test alle 5 faner fungerer

---

### Steg 7: Manuell testing
**Hva:** Test at alt fungerer i nettleseren
**Sjekkliste:**
- [ ] Forslag-fanen viser forslag
- [ ] Kan godkjenne/avslå forslag
- [ ] Språkområder-fanen fungerer
- [ ] Land-fanen fungerer
- [ ] Kommuner-fanen fungerer
- [ ] Steder-fanen fungerer
- [ ] Ingen JavaScript-feil i konsollen

---

### Steg 8: Rydding
**Hva:** Slett backup og gamle filer
**Kommandoer:**
```
rm src/components/admin/GeographyTab.tsx.backup
rm src/components/admin/GeographyTab.OLD.tsx
rm src/components/admin/GeographyTab-refactored.tsx
```

**Verifisering:** Kun de nye filene eksisterer

---

### Steg 9: Commit
**Hva:** Lagre endringene i Git
**Kommando:**
```
git add .
git commit -m "Refaktorert GeographyTab til separate komponenter"
```

---

## HVIS NOE GÅR GALT

### Tilbake til forrige steg
Hvis f.eks. steg 4 feiler:
1. Slett den nye filen som ble laget i steg 4
2. Verifiser at steg 3 fortsatt fungerer (`npm run build`)
3. Prøv steg 4 på nytt

### Full tilbakeføring
Hvis alt går galt og du vil starte på nytt:
```
# Hvis backup fortsatt finnes:
cp src/components/admin/GeographyTab.tsx.backup src/components/admin/GeographyTab.tsx

# Eller hent fra Git:
git checkout src/components/admin/GeographyTab.tsx
```

---

## RESULTAT ETTER FULLFØRING

**Før:**
```
GeographyTab.tsx (1175 linjer) ← Alt i én fil
```

**Etter:**
```
geography/
├── useGeographyData.ts      (~100 linjer) - Data-logikk
├── CountriesTab.tsx         (~35 linjer)  - Land
├── LanguageAreasTab.tsx     (~80 linjer)  - Språkområder
├── SuggestionsTab.tsx       (~170 linjer) - Forslag
├── MunicipalitiesTab.tsx    (~200 linjer) - Kommuner
└── PlacesTab.tsx            (~180 linjer) - Steder

GeographyTab.tsx             (~100 linjer) - Bare fane-navigasjon
```

**Fordeler:**
- Lettere å finne riktig kode
- Lettere å fikse bugs
- Lettere å teste endringer
- Hver fil har ett ansvarsområde

---

## PROGRESJONS-TRACKER

Oppdater denne etter hvert steg:

| Steg | Beskrivelse | Status | Dato |
|------|-------------|--------|------|
| 1 | Backup | ✅ | 2025-12-17 |
| 2 | SuggestionsTab | ✅ | 2025-12-17 |
| 3 | MunicipalitiesTab | ✅ | 2025-12-17 |
| 4 | PlacesTab | ✅ | 2025-12-17 |
| 5 | Oppdater imports | ✅ | 2025-12-17 |
| 6 | Bytt til ny versjon | ✅ | 2025-12-17 |
| 7 | Manuell testing | 🔄 | 2025-12-17 |
| 8 | Rydding | ⬜ | |
| 9 | Commit | ⬜ | |

**Symboler:** ⬜ Ikke startet | 🔄 Pågår | ✅ Ferdig | ❌ Feilet
