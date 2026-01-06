# PRD: SPA-konvertering

> **Status:** Under utvikling - Fase 1/6 fullført  
> **Opprettet:** 16. desember 2025  
> **Sist oppdatert:** 2025-12-26

---

## Oversikt

**Hva:** Konvertere samiske.no til Single Page Application med pathname-basert navigasjon

**Hvorfor:**
- App-følelse som Facebook/Twitter
- Raskere navigasjon uten page reloads
- Konsistent layout med alltid synlig navbar/menyer
- URL-oppdatering for delbarhet og SEO

**For hvem:** Alle brukere

---

## Hovedmål

1. **App-følelse** - Ingen white screen ved navigasjon
2. **Raskere navigasjon** - Client-side routing
3. **Konsistent layout** - Navbar og menyer alltid synlige
4. **URL-oppdatering** - Deling-vennlige URL-er
5. **SEO bevart** - Server-side rendering ved initial load

---

## Arkitektur

### Beslutning: Pathname over query params

**Før:**
```
/?panel=community-page&slug=samisk-kultur&tab=produkter
```

**Etter:**
```
/samfunn/samisk-kultur?tab=produkter
```

### Hovedelementer

1. **Link interceptor** (`useLinkInterceptor.ts`)
   - Fanger klikk på `<a>` tags
   - Konverterer til client-side navigasjon

2. **Pathname parser** (`spa-utils.ts`)
   - `getPanelFromPathname()` → {type, params}

3. **HomeLayout** (utvidet)
   - Renderer innhold basert på pathname
   - Bevarer eksisterende CustomEvent-system

---

## URL → Panel mapping

| URL | Panel Type | Fase |
|-----|------------|------|
| `/` | feed | ✅ |
| `/kalender` | calendar | ✅ Fase 1 |
| `/bokmerker` | bookmarks | Fase 2 |
| `/grupper` | groups | Fase 2 |
| `/innlegg/[id]` | post | Fase 2 |
| `/bruker/[username]` | profile | Fase 3 |
| `/grupper/[slug]` | group | Fase 3 |
| `/sapmi` | geography | Fase 3 |
| `/samfunn/[slug]` | community-page | Fase 4 |
| `/sapmi/[country]/[muni]/[place]` | location | Fase 4 |

---

## Implementeringsplan

### Fase 1: Fundament ✅ FERDIG
- [x] `spa-utils.ts` (177 linjer)
- [x] `useLinkInterceptor.ts` (67 linjer)
- [x] HomeLayout utvidet
- [x] Kalender som SPA

### Fase 2: Enkelt innhold ⏳
- [ ] Bokmerker
- [ ] Grupper liste
- [ ] Innlegg detalj

### Fase 3: Medium kompleksitet
- [ ] Brukerprofiler
- [ ] Gruppe-detalj
- [ ] Geografi enkelt-nivå

### Fase 4: Komplekst innhold
- [ ] Samfunn (520 linjer)
- [ ] Geografi hierarki (4 nivåer)

### Fase 5: Polering
- [ ] Prefetching på hover
- [ ] Loading states
- [ ] Error boundaries

### Fase 6: Testing
- [ ] Browser-kompatibilitet
- [ ] Mobile testing
- [ ] Tilgjengelighet

---

## Filer

**Opprettet:**
- `src/lib/navigation/spa-utils.ts`
- `src/lib/navigation/useLinkInterceptor.ts`

**Modifisert:**
- `src/components/layout/HomeLayout.tsx`
- `src/app/kalender/page.tsx`

---

## Dataflyt

```
Bruker klikker link
    ↓
useLinkInterceptor() fanger klikk
    ↓
router.push(url) → pathname endres
    ↓
HomeLayout detecter pathname-endring
    ↓
getPanelFromPathname() → {type, params}
    ↓
Render panel-komponent i feed area
```

---

## Risikoer

| Risiko | Mitigering |
|--------|------------|
| SEO-tap | Behold page.tsx for SSR |
| Brutte lenker | Grundig testing |
| Performance | Code splitting, lazy loading |

---

## Rollback

```bash
# Git tag før start
git checkout v1.0-pre-spa-conversion

# Eller feature flag
const SPA_ENABLED = false
```

---

**Estimert total tid:** 6 uker  
**Neste:** Fase 2 - Bokmerker, grupper, innlegg
