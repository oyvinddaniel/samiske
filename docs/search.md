# PRD: Universelt søk

> **Status:** ✅ Fullført  
> **Opprettet:** 13. desember 2025  
> **Sist oppdatert:** 2025-12-26

---

## Oversikt

**Hva:** Omfattende søkesystem med 8 kategorier, caching og tastaturnavigasjon

**Hvorfor:** Brukere trenger å finne innhold raskt på tvers av hele plattformen

**For hvem:** Alle brukere

---

## Kategorier (8)

1. **Brukere** - profiles
2. **Innlegg** - posts (type='standard')
3. **Arrangementer** - posts (type='event')
4. **Kommentarer** - comments
5. **Geografi** - language_areas, municipalities, places
6. **Samfunn** - communities
7. **Tjenester** - services
8. **Produkter** - products

---

## Arkitektur

### Mappestruktur
```
src/lib/search/
├── searchConstants.ts    # Konfigurasjon
├── searchCache.ts        # In-memory cache
└── searchQueries.ts      # Søkefunksjoner

src/components/search/
├── UnifiedSearchBar.tsx  # Hovedkomponent
├── SearchCategoryFilter.tsx
├── SearchResultsList.tsx
├── SearchResultItem.tsx
└── GeographySearchResult.tsx
```

### Konfigurasjon
```typescript
SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 1,
  DEBOUNCE_DELAY: 300,
  DEFAULT_LIMIT: 6,
  LOAD_MORE_SIZE: 12,
  CACHE_TTL: 5 * 60 * 1000,  // 5 min
}
```

---

## Features

### Implementert
- [x] Søk i 8 kategorier
- [x] Caching med 5 min TTL
- [x] Debouncing (300ms)
- [x] Tastaturnavigasjon (Cmd+K, piltaster, Enter, Escape)
- [x] Forhåndspopulerte resultater
- [x] "Vis flere" pagination
- [x] Stjernemerking av geografi
- [x] Full-text search indekser

### Keyboard shortcuts
- `Cmd+K` / `Ctrl+K` - Åpne søk
- `↑` / `↓` - Naviger resultater
- `Enter` - Velg resultat
- `Escape` - Lukk søk
- `Tab` - Bytt kategori

---

## Database

### Indekser
```sql
CREATE INDEX idx_services_name ON services 
  USING gin(to_tsvector('norwegian', name));
CREATE INDEX idx_services_description ON services 
  USING gin(to_tsvector('norwegian', description));
CREATE INDEX idx_products_name ON products 
  USING gin(to_tsvector('norwegian', name));
CREATE INDEX idx_products_description ON products 
  USING gin(to_tsvector('norwegian', description));
```

### RLS
- SELECT: Alle kan se aktive (is_active = true)
- INSERT/UPDATE/DELETE: Kun community admins

---

## Bruk

```typescript
import { UnifiedSearchBar } from '@/components/search/UnifiedSearchBar'

// I header
<UnifiedSearchBar />

// Eller søkefunksjoner direkte
import { searchUsers, searchPosts } from '@/lib/search/searchQueries'

const users = await searchUsers('query', 10, 0)
```

---

## Fremtidige forbedringer

- [ ] Fuzzy search (typo-toleranse)
- [ ] Søkeforslag (autocomplete)
- [ ] Søkehistorikk per bruker
- [ ] Infinite scroll
- [ ] Filtre per kategori
- [ ] Voice search

---

**Fullført:** 13. desember 2025
