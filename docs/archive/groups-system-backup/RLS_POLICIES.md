# Gruppe-system RLS Policies
## Row Level Security dokumentasjon

> **Arkivert:** 2026-01-10
> **Kilde:** `20241213_phase4_groups.sql` + påfølgende security-fixes

---

## OVERSIKT

Alle gruppe-tabeller har Row Level Security (RLS) aktivert for å sikre:
- Åpne grupper: Synlige for alle
- Lukkede grupper: Synlige for alle, men kun medlemmer ser innhold
- Skjulte grupper: Kun medlemmer vet at de eksisterer

---

## GROUPS TABELL

### SELECT Policy: "Users can view open and closed groups"

```sql
CREATE POLICY "Users can view open and closed groups" ON groups
  FOR SELECT USING (
    group_type IN ('open', 'closed')
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.status = 'approved'
    )
  );
```

**Logikk:**
- Åpne + lukkede grupper: Alle kan se
- Skjulte grupper: Kun approved medlemmer

### INSERT Policy: "Authenticated users can create groups"

```sql
CREATE POLICY "Authenticated users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

**Logikk:**
- Alle autentiserte brukere kan opprette grupper
- RPC-funksjon `create_group()` håndterer automatisk admin-medlemskap

### UPDATE Policy: "Group admins can update groups"

```sql
CREATE POLICY "Group admins can update groups" ON groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
      AND group_members.status = 'approved'
    )
  );
```

**Logikk:**
- Kun approved admins kan oppdatere gruppe-info
- Moderatorer kan IKKE oppdatere gruppe-info

### DELETE Policy: "Group admins can delete groups"

```sql
CREATE POLICY "Group admins can delete groups" ON groups
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
      AND group_members.status = 'approved'
    )
  );
```

**Logikk:**
- Kun approved admins kan slette grupper
- CASCADE delete fjerner automatisk alle relaterte rader

---

## GROUP_MEMBERS TABELL

### SELECT Policy: "Users can view group members based on group type"

```sql
CREATE POLICY "Users can view group members based on group type" ON group_members
  FOR SELECT USING (
    -- Åpne grupper: Alle kan se medlemmer
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND groups.group_type = 'open'
    )
    OR
    -- Lukkede/skjulte: Kun medlemmer kan se medlemsliste
    EXISTS (
      SELECT 1 FROM group_members gm2
      WHERE gm2.group_id = group_members.group_id
      AND gm2.user_id = auth.uid()
      AND gm2.status = 'approved'
    )
    OR
    -- Brukeren kan alltid se sitt eget medlemskap
    user_id = auth.uid()
  );
```

**Logikk:**
- Åpne grupper: Medlemsliste synlig for alle
- Lukkede/skjulte: Kun medlemmer ser medlemsliste
- Du ser alltid ditt eget medlemskap

### INSERT Policy: "Users can join groups or request membership"

```sql
CREATE POLICY "Users can join groups or request membership" ON group_members
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );
```

**Logikk:**
- Autentiserte brukere kan bli medlem
- Kan kun legge til seg selv (ikke andre)
- RPC-funksjon `join_group()` håndterer åpen/lukket/skjult logikk

### UPDATE Policy: "Admins and moderators can manage members"

```sql
CREATE POLICY "Admins and moderators can manage members" ON group_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members gm2
      WHERE gm2.group_id = group_members.group_id
      AND gm2.user_id = auth.uid()
      AND gm2.role IN ('admin', 'moderator')
      AND gm2.status = 'approved'
    )
  );
```

**Logikk:**
- Admins og moderatorer kan endre medlemsstatus
- Brukes for å godkjenne/avslå pending medlemmer

### DELETE Policy: "Users can remove themselves or admins can remove others"

```sql
CREATE POLICY "Users can remove themselves or admins can remove others" ON group_members
  FOR DELETE USING (
    -- Brukeren kan forlate gruppen selv
    user_id = auth.uid()
    OR
    -- Admins kan fjerne andre medlemmer
    EXISTS (
      SELECT 1 FROM group_members gm2
      WHERE gm2.group_id = group_members.group_id
      AND gm2.user_id = auth.uid()
      AND gm2.role = 'admin'
      AND gm2.status = 'approved'
    )
  );
```

**Logikk:**
- Alle kan forlate gruppe selv
- Kun admins kan fjerne andre

---

## GROUP_POSTS TABELL

### SELECT Policy: "Only group members can view group posts"

```sql
CREATE POLICY "Only group members can view group posts" ON group_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_posts.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.status = 'approved'
    )
  );
```

**Logikk:**
- Kun approved medlemmer kan se gruppe-posts
- Dette sikrer privacy

### INSERT Policy: "Only group members can add posts to group"

```sql
CREATE POLICY "Only group members can add posts to group" ON group_posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_posts.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.status = 'approved'
    )
  );
```

**Logikk:**
- Kun approved medlemmer kan poste i gruppe
- Auto-populate via trigger ved `created_for_group_id`

### DELETE Policy: "Post author or group admins can remove posts"

```sql
CREATE POLICY "Post author or group admins can remove posts" ON group_posts
  FOR DELETE USING (
    -- Post-eier kan fjerne sitt eget innlegg
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = group_posts.post_id
      AND posts.user_id = auth.uid()
    )
    OR
    -- Group admins kan fjerne alle innlegg
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_posts.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
      AND group_members.status = 'approved'
    )
  );
```

**Logikk:**
- Innleggseier kan slette sitt eget
- Admins kan slette alle innlegg i gruppen

---

## GROUP_INVITES TABELL

### SELECT Policy: "Users can view invites they sent or received"

```sql
CREATE POLICY "Users can view invites they sent or received" ON group_invites
  FOR SELECT USING (
    invited_user_id = auth.uid()
    OR invited_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_invites.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role IN ('admin', 'moderator')
    )
  );
```

**Logikk:**
- Du ser invitasjoner du har mottatt
- Du ser invitasjoner du har sendt
- Admins/moderatorer ser alle invitasjoner i gruppen

### INSERT Policy: "Group members can invite users"

```sql
CREATE POLICY "Group members can invite users" ON group_invites
  FOR INSERT WITH CHECK (
    auth.uid() = invited_by
    AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_invites.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.status = 'approved'
    )
  );
```

**Logikk:**
- Kun approved medlemmer kan invitere
- Må være deg selv som sender (ikke andre)

### UPDATE Policy: "Invitees can respond to their invites"

```sql
CREATE POLICY "Invitees can respond to their invites" ON group_invites
  FOR UPDATE USING (invited_user_id = auth.uid());
```

**Logikk:**
- Kun mottaker kan oppdatere status (accept/decline)

---

## GROUP_PLACES TABELL

### SELECT Policy: "Anyone can view group geography"

```sql
CREATE POLICY "Anyone can view group geography" ON group_places
  FOR SELECT USING (true);
```

**Logikk:**
- Offentlig info (ikke sensitiv)

### INSERT/UPDATE/DELETE Policies: "Only group admins"

```sql
CREATE POLICY "Only group admins can manage geography" ON group_places
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_places.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
      AND group_members.status = 'approved'
    )
  );
```

**Logikk:**
- Kun admins kan endre geografisk tilknytning

---

## GROUP_WELCOME_SEEN & GROUP_NOTIFICATION_PREFERENCES

### RLS Policies: Standard bruker-eierskap

**Logikk:**
- Brukere kan kun se/endre sine egne rows
- Standard pattern for brukerdata

---

## POSTS TABELL (GRUPPE-RELATERTE POLICIES)

### Kritisk SELECT Policy (fra 20241214_fix_group_posts_rls.sql)

```sql
-- Kompleks policy for å sikre gruppe-privacy
-- Gruppe-innlegg vises KUN for medlemmer
-- Implementert via nested EXISTS queries

-- Se migrasjonsfilen for full implementasjon
```

**Logikk:**
- posts med `created_for_group_id` vises KUN for gruppe-medlemmer
- ALDRI i offentlige feeds
- ALDRI i geografiske feeds
- Kritisk for privacy

---

## SIKKERHETSPRINSIPPER

1. **Default Deny** - Hvis ikke eksplisitt tillatt, nei
2. **Least Privilege** - Kun nødvendige tilganger
3. **Privacy First** - Skjulte grupper er VIRKELIG skjulte
4. **Medlemskap Krever Godkjenning** - `status = 'approved'` sjekkes alltid
5. **Admins Har Full Kontroll** - Men ikke over andre grupper

---

## TESTING

For å teste RLS policies:

```sql
-- Test som anonym
SET request.jwt.claims TO '{}';

-- Test som spesifikk bruker
SET request.jwt.claims TO json_build_object('sub', 'USER_UUID')::text;

-- Forsøk SELECT på groups med forskjellige group_types
SELECT * FROM groups WHERE group_type = 'hidden';
-- Skal kun returnere grupper du er medlem av
```

---

**Arkivert:** 2026-01-10
**Av:** Claude
**Kilde:** Migrasjoner + kodeanalyse
