# Rollback-prosedyrer

> **Sist oppdatert:** 2025-12-13

---

## Komplett rollback til pre-transform

Hvis alt går galt, gå tilbake til stabil versjon:

```bash
git checkout v1.0-pre-sapmi-transform
```

**Merk:** Dette ruller kun tilbake koden. Database-endringer må rulles tilbake manuelt.

---

## Fase-spesifikke rollbacks

### Fase 1: Geografi-grunnmur

**Fil:** `supabase/migrations/rollback_phase1_geography.sql`

```sql
-- Fjern utvidelser fra profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS home_municipality_id;
ALTER TABLE profiles DROP COLUMN IF EXISTS home_place_id;
ALTER TABLE profiles DROP COLUMN IF EXISTS current_municipality_id;
ALTER TABLE profiles DROP COLUMN IF EXISTS current_place_id;

-- Fjern utvidelser fra posts
ALTER TABLE posts DROP COLUMN IF EXISTS municipality_id;
ALTER TABLE posts DROP COLUMN IF EXISTS place_id;
ALTER TABLE posts DROP COLUMN IF EXISTS geography_scope;

-- Slett tabeller i riktig rekkefølge (respekter FK)
DROP TABLE IF EXISTS user_starred_municipalities CASCADE;
DROP TABLE IF EXISTS user_starred_places CASCADE;
DROP TABLE IF EXISTS places CASCADE;
DROP TABLE IF EXISTS municipalities CASCADE;
DROP TABLE IF EXISTS language_areas CASCADE;
DROP TABLE IF EXISTS countries CASCADE;
DROP TABLE IF EXISTS regions CASCADE;
```

**Kommando:**
```bash
npx supabase db reset  # ADVARSEL: Sletter all data!
# ELLER
psql $DATABASE_URL -f supabase/migrations/rollback_phase1_geography.sql
```

---

## Rekkefølge ved rollback

Ved rollback av flere faser, gjør det i OMVENDT rekkefølge:

1. Fase 9 først (hvis implementert)
2. Fase 8
3. ...
4. Fase 1 sist

---

## Sjekkliste før rollback

- [ ] Ta backup av databasen
- [ ] Informer brukere om nedetid
- [ ] Dokumenter hvorfor rollback var nødvendig
- [ ] Test rollback i staging først (hvis mulig)
