# MANUELL RLS POLICY SJEKK
## Etter kjøring av gruppe-sletting migrasjoner

> **VIKTIG:** Dette må gjøres MANUELT i Supabase SQL Editor
> **Tidspunkt:** Etter at alle 5 migrasjoner er kjørt
> **Estimert tid:** 15-20 minutter

---

## HVORFOR MANUELL SJEKK?

Noen RLS policies på `posts`-tabellen kan referere til `created_for_group_id` kolonnen.
Siden vi har droppet denne kolonnen, kan policies feile hvis de fortsatt refererer til den.

---

## STEG 1: SE ALLE POLICIES PÅ POSTS

Kjør i Supabase SQL Editor:

```sql
SELECT
  policyname,
  cmd,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'posts'
ORDER BY policyname;
```

---

## STEG 2: IDENTIFISER PROBLEMATISKE POLICIES

Se etter policies som inneholder:
- `created_for_group_id`
- `groups`
- `group_members`
- `group_posts`

**Eksempel på problematisk policy:**
```sql
-- Hvis du ser noe slikt:
CREATE POLICY "some_policy" ON posts
  FOR SELECT USING (
    created_for_group_id IS NULL  -- ← PROBLEM: Kolonne finnes ikke lenger
    OR user_id = auth.uid()
  );
```

---

## STEG 3: FIKSE POLICIES

### Scenario A: Policy sjekker "created_for_group_id IS NULL"

**Før (problematisk):**
```sql
CREATE POLICY "exclude_group_posts" ON posts
  FOR SELECT USING (
    created_for_group_id IS NULL
    OR user_id = auth.uid()
  );
```

**Etter (fikset):**
```sql
-- Dropp gammel policy
DROP POLICY IF EXISTS "exclude_group_posts" ON posts;

-- Opprett ny uten gruppe-sjekk
CREATE POLICY "exclude_group_posts" ON posts
  FOR SELECT USING (
    user_id = auth.uid()
    OR privacy = 'public'
  );
```

**Logikk:** Siden grupper er borte, er ALLE posts nå enten community eller standalone.

---

### Scenario B: Policy sjekker gruppe-medlemskap

**Før (problematisk):**
```sql
CREATE POLICY "view_group_posts" ON posts
  FOR SELECT USING (
    created_for_group_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = posts.created_for_group_id
      AND user_id = auth.uid()
    )
  );
```

**Etter (fikset):**
```sql
-- Dropp policy helt (ikke relevant lenger)
DROP POLICY IF EXISTS "view_group_posts" ON posts;
```

---

### Scenario C: Policy differensierer gruppe vs community

**Før (problematisk):**
```sql
CREATE POLICY "context_based_access" ON posts
  FOR SELECT USING (
    (created_for_group_id IS NULL AND created_for_community_id IS NULL)  -- Standalone
    OR created_for_community_id IS NOT NULL  -- Community
    OR (created_for_group_id IS NOT NULL AND ...)  -- Group (PROBLEM)
  );
```

**Etter (fikset):**
```sql
DROP POLICY IF EXISTS "context_based_access" ON posts;

CREATE POLICY "context_based_access" ON posts
  FOR SELECT USING (
    created_for_community_id IS NULL  -- Standalone
    OR created_for_community_id IS NOT NULL  -- Community
  );
```

---

## STEG 4: VERIFISER AT ALLE POLICIES FUNGERER

Etter fixes, test:

```sql
-- Test som anonym bruker
SET request.jwt.claims TO '{}';
SELECT COUNT(*) FROM posts;  -- Skal ikke feile

-- Test som autentisert bruker
SET request.jwt.claims TO json_build_object('sub', 'din-test-bruker-uuid')::text;
SELECT COUNT(*) FROM posts WHERE user_id = 'din-test-bruker-uuid';  -- Skal ikke feile

-- Reset
RESET request.jwt.claims;
```

---

## VANLIGE POLICIES SOM KAN PÅVIRKES

Basert på samiske.no migrasjoner:

### 1. `20241214_fix_group_posts_rls.sql`

Denne migrasjonen opprettet komplekse policies for gruppe-innlegg.
**Sannsynligvis må oppdateres eller slettes.**

Sjekk spesielt:
- `"Users can view posts based on group membership"`
- `"Posts visible in geography feeds exclude group posts"`

### 2. `20241213_exclude_group_posts.sql`

Denne migrasjonen ekskluderte gruppe-posts fra geo-feeds.
**Sannsynligvis kan forenkles (gruppe-sjekk ikke nødvendig).**

---

## FORVENTET RESULTAT

Etter manuell sjekk og fixes:

```sql
-- Skal returnere 0 policies med gruppe-referanser
SELECT COUNT(*)
FROM pg_policies
WHERE tablename = 'posts'
AND (
  qual::text LIKE '%created_for_group_id%'
  OR with_check::text LIKE '%created_for_group_id%'
  OR qual::text LIKE '%group_members%'
  OR with_check::text LIKE '%group_members%'
);
-- Forventet: 0
```

---

## HVIS DU STÅR FAST

**Alternativ 1: Slett ALLE policies og start på nytt**
```sql
-- DRASTISK, men fungerer
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'posts'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON posts', r.policyname);
  END LOOP;
END $$;

-- Deretter opprett nye, enkle policies uten gruppe-logikk
```

**Alternativ 2: Spør Claude**
```
Gi Claude output fra STEG 1, og be om hjelp med å fikse policies.
```

---

## VERIFISER AT POSTS-TABELLEN FUNGERER

Etter alle fixes:

```sql
-- Test INSERT
INSERT INTO posts (user_id, content, privacy)
VALUES (auth.uid(), 'Test post', 'public')
RETURNING id;

-- Test SELECT
SELECT * FROM posts WHERE user_id = auth.uid() LIMIT 5;

-- Test UPDATE
UPDATE posts
SET content = 'Updated test'
WHERE user_id = auth.uid()
AND id = (SELECT id FROM posts WHERE user_id = auth.uid() LIMIT 1);

-- Test DELETE
DELETE FROM posts
WHERE user_id = auth.uid()
AND content = 'Test post';
```

Alle queries skal fungere uten feil.

---

## NESTE STEG

Når RLS policies er fikset:
1. Commit endringene (hvis gjort via migrasjoner)
2. Test grundig i Supabase Dashboard
3. Gå videre til FASE 2 (Backend-kode)

---

**Estimert tid:** 15-20 minutter
**Kritikalitet:** Høy (posts-tabellen må fungere)
**Hjelp:** Spør Claude hvis du står fast
