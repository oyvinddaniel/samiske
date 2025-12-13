# Aktiv Oppgave

> **Sist oppdatert:** 2025-12-13

---

## Nåværende oppgave

**Opprett database-migrasjon for geografi-tabeller**

### Beskrivelse
Opprette SQL-migrasjon som definerer alle geografiske tabeller med korrekte relasjoner, constraints og RLS policies.

### Status
IN_PROGRESS

### Filer som endres
- `supabase/migrations/20241213_phase1_geography.sql` (OPPRETT)

### Checklist
- [ ] Opprett `regions` tabell
- [ ] Opprett `countries` tabell med FK til regions
- [ ] Opprett `language_areas` tabell med FK til countries
- [ ] Opprett `municipalities` tabell med FK til language_areas og countries
- [ ] Opprett `places` tabell med FK til municipalities
- [ ] Opprett `user_starred_places` tabell
- [ ] Opprett `user_starred_municipalities` tabell
- [ ] Utvid `profiles` med geografiske kolonner
- [ ] Utvid `posts` med geografiske kolonner
- [ ] Definer RLS policies for alle tabeller
- [ ] Opprett indekser for ytelse

### Test
```sql
-- Verifiser at tabellene eksisterer
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE '%region%' OR table_name LIKE '%countr%';

-- Test RLS (som anon bruker)
SELECT * FROM regions; -- Skal fungere
SELECT * FROM user_starred_places; -- Skal returnere tom (krever auth)
```

---

## Neste oppgave
Opprett seed-data for geografi
