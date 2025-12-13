# Database Changelog

> **Sist oppdatert:** 2025-12-13

Kronologisk logg over alle database-endringer i Sapmi-transformasjonen.

---

## Migrasjoner

### 20241213_phase1_geography.sql
**Status:** FULLFORT (2025-12-13)
**Fase:** 1
**Beskrivelse:** Geografi-tabeller og utvidelser

**Nye tabeller:**
- `regions`
- `countries`
- `language_areas`
- `municipalities`
- `places`
- `user_starred_places`
- `user_starred_municipalities`

**Utvidede tabeller:**
- `profiles` (+4 kolonner)
- `posts` (+3 kolonner)

**RLS policies:** Ja

---

## Seed-data

### geography.sql
**Status:** FULLFORT (2025-12-13)
**Beskrivelse:** Grunnleggende geografisk data

**Innhold:**
- 1 region (Sapmi)
- 4 land (Norge, Sverige, Finland, Russland)
- 7 språkområder
- Utvalgte kommuner
- Utvalgte steder

---

## Rollback-filer

| Migrasjon | Rollback-fil |
|-----------|--------------|
| 20241213_phase1_geography.sql | rollback_phase1_geography.sql |
