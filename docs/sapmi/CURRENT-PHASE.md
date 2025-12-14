# Aktiv Fase: 9 - Universelt sok

> **Status:** PENDING
> **Forrige fase:** Fase 8 (fullfort 2025-12-13)
> **Risiko:** LAV

---

## Mal

Implementere universelt sok pa tvers av alle innholdstyper:
- Sok i innlegg, brukere, grupper, samfunn, steder
- Samlet sokegrensesnitt
- Resultater gruppert etter type

---

## Oppgaver

- [ ] Opprett universal_search database-funksjon
- [ ] Utvid SearchModal med alle sokbare typer
- [ ] Legg til full-text search indexes
- [ ] Test sok pa alle innholdstyper

---

## Sokbare entiteter

| Type | Tabell | Sokefelter |
|------|--------|------------|
| Innlegg | `posts` | title, content |
| Brukere | `profiles` | username, full_name |
| Grupper | `groups` | name, description |
| Samfunn | `communities` | name, description |
| Kommuner | `municipalities` | name |
| Steder | `places` | name |

---

## Filer som skal endres

| Fil | Endring |
|-----|---------|
| `src/components/search/SearchModal.tsx` | Utvid med alle typer |
| `supabase/migrations/` | Ny migrasjon for search |

---

## Forrige fase (Fase 8) - FULLFORT

### Implementert
- [x] Database-migrasjon: `20241213_phase8_rsvp.sql`
- [x] TypeScript-typer: `src/lib/types/events.ts`
- [x] Lib-funksjoner: `src/lib/events.ts`
- [x] Komponenter: RSVPButton, RSVPList
- [x] PostCard oppdatert med RSVP-knapper for events
- [x] PostDialogContent oppdatert med RSVP

### RPC-funksjoner opprettet
- `set_event_rsvp(post_id, status)`
- `remove_event_rsvp(post_id)`
- `get_user_rsvp_status(post_id)`
- `get_event_rsvp_counts(post_id)`
- `get_event_rsvp_users(post_id, status, limit, offset)`
