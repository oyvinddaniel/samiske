# Aktiv Fase: 3 - Innleggsbobling

> **Status:** FULLFORT
> **Startet:** 2025-12-13
> **Fullfort:** 2025-12-13
> **Forrige fase:** Fase 2 (fullfort 2025-12-13)
> **Risiko:** MEDIUM

---

## Mal

Implementere logikk for at innlegg "bobler opp" i geografihierarkiet, slik at innlegg fra et sted ogsa vises i kommunen, sprakområdet, landet og hele Sapmi.

---

## Boblingslogikk

```
Innlegg postet i Drag (sted)
    |
    v vises ogsa i
Hamaroy kommune
    |
    v vises ogsa i
Lulesamisk område + Norge
    |
    v vises ogsa i
Hele Sapmi
```

---

## Fullforte oppgaver

- [x] Opprett database-funksjon `get_posts_for_geography` (migrasjonsfil klar)
- [x] Migrer eksisterende innlegg til Trondheim (i migrasjonsfilen)
- [x] Modifiser Feed.tsx for geografisk filtrering
- [x] Legg til "Postet fra [sted]" indikator pa PostCard
- [x] Oppdater alle geografiske sider til a bruke Feed med filter

## Ventende oppgaver

- [x] ~~Kjor migrering~~ (kjort via psql 2025-12-13)

---

## Migrasjonsfil

Filen `supabase/migrations/20241213_phase3_bubbling.sql` ma kjores manuelt:

1. Ga til [Supabase Dashboard](https://supabase.com/dashboard)
2. Velg prosjektet
3. Ga til SQL Editor
4. Lim inn innholdet fra migrasjonsfilen
5. Kjor SQL

**Innhold:**
- `get_posts_for_geography()` - RPC-funksjon for a hente innlegg med bobling
- `count_posts_for_geography()` - Hjelpefunksjon for telling
- Migrering av eksisterende innlegg til Trondheim
- Indekser for ytelse

---

## Filer endret

| Fil | Endring |
|-----|---------|
| `supabase/migrations/20241213_phase3_bubbling.sql` | NY - Boblingslogikk |
| `src/components/feed/Feed.tsx` | Geografisk filtrering via RPC |
| `src/components/posts/PostCard.tsx` | "Postet fra [sted]" indikator |
| `src/components/posts/types.ts` | Lagt til posted_from_name/type |
| `src/app/sapmi/page.tsx` | Bruker Feed med geography={type:'sapmi'} |
| `src/app/sapmi/[countryCode]/page.tsx` | Bruker Feed med geography={type:'country'} |
| `src/app/sapmi/sprak/[code]/page.tsx` | Bruker Feed med geography={type:'language_area'} |
| `src/app/sapmi/[countryCode]/[municipalitySlug]/page.tsx` | Bruker Feed med geography={type:'municipality'} |
| `src/app/sapmi/.../[placeSlug]/page.tsx` | Bruker Feed med geography={type:'place'} |

---

## Hvordan det fungerer

### Feed.tsx

Feed-komponenten aksepterer na en `geography` prop:

```typescript
interface GeographyFilter {
  type: 'sapmi' | 'country' | 'language_area' | 'municipality' | 'place'
  id?: string  // UUID, undefined for 'sapmi'
}

<Feed geography={{ type: 'municipality', id: municipalityId }} />
```

### RPC-funksjon

Nar RPC-funksjonen er tilgjengelig, brukes den for geografisk filtrering med bobling. Hvis funksjonen ikke finnes (migrering ikke kjort), faller Feed tilbake til standard query.

### PostCard

Viser "Postet fra [sted]" hvis:
- `posted_from_name` er satt
- `posted_from_type` er 'place' eller 'municipality' (ikke 'sapmi')

---

## Neste fase

Etter at migreringen er kjort og testet:

**Fase 4: Grupper** - Implementere gruppetyper (apen/lukket/skjult)
