# Gruppe-system Triggers og Funksjoner
## Database-logikk og automation

> **Arkivert:** 2026-01-10
> **Kilde:** Alle gruppe-migrasjoner

---

## TRIGGERS

### 1. trigger_update_group_post_count

**Tabell:** `group_posts`
**Event:** AFTER INSERT OR DELETE
**Formål:** Oppdaterer `groups.post_count` automatisk

**Implementasjon:**
```sql
CREATE OR REPLACE FUNCTION update_group_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE groups
    SET post_count = post_count + 1
    WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE groups
    SET post_count = post_count - 1
    WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

**Når kjøres:**
- INSERT i group_posts → post_count++
- DELETE fra group_posts → post_count--

---

### 2. trigger_cleanup_group_posts

**Tabell:** `posts`
**Event:** BEFORE DELETE ON groups
**Formål:** Setter `posts.created_for_group_id` til NULL når gruppe slettes

**Implementasjon:**
```sql
CREATE OR REPLACE FUNCTION cleanup_group_posts()
RETURNS TRIGGER AS $$
BEGIN
  -- Sett created_for_group_id til NULL for alle innlegg i gruppen
  UPDATE posts
  SET created_for_group_id = NULL
  WHERE created_for_group_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;
```

**Hvorfor:**
- Innlegg bevares (ikke slettet)
- Mister bare gruppe-tilhørighet
- Blir "orphan" posts

**Alternativ:**
Hvis dere vil slette innleggene i stedet:
```sql
DELETE FROM posts WHERE created_for_group_id = OLD.id;
```

---

### 3. trigger_update_group_member_count

**Tabell:** `group_members`
**Event:** AFTER INSERT OR UPDATE OR DELETE
**Formål:** Oppdaterer `groups.member_count` automatisk

**Implementasjon:**
```sql
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'approved' THEN
      UPDATE groups
      SET member_count = member_count + 1
      WHERE id = NEW.group_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Status endret fra pending til approved
    IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
      UPDATE groups
      SET member_count = member_count + 1
      WHERE id = NEW.group_id;
    -- Status endret fra approved til noe annet
    ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
      UPDATE groups
      SET member_count = member_count - 1
      WHERE id = NEW.group_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'approved' THEN
      UPDATE groups
      SET member_count = member_count - 1
      WHERE id = OLD.group_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

**Logikk:**
- Kun approved medlemmer telles
- Pending/rejected påvirker ikke telleren

---

### 4. trigger_auto_populate_group_posts

**Tabell:** `posts`
**Event:** AFTER INSERT
**Formål:** Auto-legger til i `group_posts` hvis `created_for_group_id` er satt

**Implementasjon:**
```sql
CREATE OR REPLACE FUNCTION auto_populate_group_posts()
RETURNS TRIGGER AS $$
BEGIN
  -- Hvis innlegget er opprettet for en gruppe
  IF NEW.created_for_group_id IS NOT NULL THEN
    INSERT INTO group_posts (group_id, post_id)
    VALUES (NEW.created_for_group_id, NEW.id)
    ON CONFLICT (group_id, post_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Fordel:**
- Automatisk synkronisering
- Frontend trenger ikke å håndtere dette manuelt

---

### 5. trigger_validate_post_group_community

**Tabell:** `posts`
**Event:** BEFORE INSERT OR UPDATE
**Formål:** Sikrer at innlegg IKKE har BÅDE gruppe og samfunn

**Implementasjon:**
```sql
CREATE OR REPLACE FUNCTION validate_post_group_community()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_for_group_id IS NOT NULL
     AND NEW.created_for_community_id IS NOT NULL THEN
    RAISE EXCEPTION 'Post cannot belong to both a group and a community';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Hvorfor:**
- Business logic: Ett innlegg kan kun tilhøre én kontekst
- Forhindrer data-inkonsistens

---

## LAGREDE FUNKSJONER (RPC)

### 1. create_group()

**Signatur:**
```sql
CREATE OR REPLACE FUNCTION create_group(
  name_param TEXT,
  slug_param TEXT,
  description_param TEXT DEFAULT NULL,
  group_type_param TEXT DEFAULT 'open'
) RETURNS UUID
```

**Formål:** Oppretter gruppe + setter oppretteren som admin

**Logikk:**
1. INSERT i `groups` tabell
2. INSERT i `group_members` med role='admin', status='approved'
3. Returnerer gruppe UUID

**Brukes av:** Frontend `createGroup()` funksjon

---

### 2. join_group()

**Signatur:**
```sql
CREATE OR REPLACE FUNCTION join_group(
  group_id_param UUID
) RETURNS TEXT
```

**Formål:** Håndterer joining basert på group_type

**Logikk:**
```sql
-- Hent group_type
SELECT group_type FROM groups WHERE id = group_id_param;

IF group_type = 'open' THEN
  -- Auto-godkjenn
  INSERT INTO group_members (group_id, user_id, status)
  VALUES (group_id_param, auth.uid(), 'approved');
  RETURN 'approved';
ELSIF group_type = 'closed' THEN
  -- Pending godkjenning
  INSERT INTO group_members (group_id, user_id, status)
  VALUES (group_id_param, auth.uid(), 'pending');
  RETURN 'pending';
ELSE -- hidden
  -- Ikke tillatt (må inviteres)
  RETURN 'not_allowed';
END IF;
```

**Returverdier:**
- `'approved'` - Umiddelbart medlem (åpen gruppe)
- `'pending'` - Venter godkjenning (lukket gruppe)
- `'not_allowed'` - Kan ikke bli med (skjult gruppe)

---

### 3. approve_member()

**Signatur:**
```sql
CREATE OR REPLACE FUNCTION approve_member(
  group_id_param UUID,
  user_id_param UUID
) RETURNS BOOLEAN
```

**Formål:** Godkjenner pending medlem (kun admins/moderatorer)

**Logikk:**
1. Verifiser at kaller er admin/moderator
2. UPDATE `group_members` SET status='approved', approved_by=auth.uid(), approved_at=NOW()
3. Returner TRUE hvis success

---

### 4. get_user_groups()

**Signatur:**
```sql
CREATE OR REPLACE FUNCTION get_user_groups(
  user_id_param UUID
) RETURNS TABLE(...)
```

**Formål:** Henter alle grupper en bruker er medlem av

**Returner:**
- gruppe-info + brukerens rolle/status

---

### 5. delete_group()

**Signatur:**
```sql
CREATE OR REPLACE FUNCTION delete_group(
  group_id_param UUID
) RETURNS BOOLEAN
```

**Formål:** Sletter gruppe (kun admins)

**Logikk:**
1. Verifiser at kaller er admin
2. DELETE FROM groups WHERE id = group_id_param
3. CASCADE delete håndterer resten
4. Trigger setter posts.created_for_group_id til NULL

---

### 6. remove_group_member()

**Signatur:**
```sql
CREATE OR REPLACE FUNCTION remove_group_member(
  group_id_param UUID,
  user_id_param UUID
) RETURNS BOOLEAN
```

**Formål:** Fjerner medlem fra gruppe

**Logikk:**
- Kun admins kan fjerne andre
- Alle kan fjerne seg selv

---

### 7. transfer_group_ownership()

**Signatur:**
```sql
CREATE OR REPLACE FUNCTION transfer_group_ownership(
  group_id_param UUID,
  new_admin_id UUID
) RETURNS BOOLEAN
```

**Formål:** Overfører admin-rolle til nytt medlem

**Logikk:**
1. Verifiser at kaller er current admin
2. UPDATE current admin til role='member'
3. UPDATE new admin til role='admin'

---

### 8. get_group_statistics()

**Signatur:**
```sql
CREATE OR REPLACE FUNCTION get_group_statistics(
  group_id_param UUID
) RETURNS JSON
```

**Formål:** Henter detaljert statistikk for gruppe

**Returner:**
```json
{
  "member_count": 42,
  "post_count": 128,
  "pending_members": 3,
  "active_this_week": 15
}
```

---

### 9. update_group()

**Signatur:**
```sql
CREATE OR REPLACE FUNCTION update_group(
  group_id_param UUID,
  name_param TEXT,
  slug_param TEXT,
  description_param TEXT,
  group_type_param TEXT,
  welcome_message_param TEXT
) RETURNS BOOLEAN
```

**Formål:** Oppdaterer gruppe-info (kun admins)

**Logikk:**
1. Verifiser at kaller er admin
2. UPDATE groups SET ...
3. Returner TRUE hvis success

---

## TRIGGER EXECUTION ORDER

Ved sletting av gruppe:
```
1. trigger_cleanup_group_posts (BEFORE DELETE)
   → Setter posts.created_for_group_id til NULL

2. DELETE FROM groups WHERE id = X
   → Cascade sletter:
     - group_members
     - group_posts
     - group_invites
     - group_places
     - group_welcome_seen
     - group_notification_preferences

3. trigger_update_group_member_count (AFTER DELETE)
   → Ikke relevant (gruppe er slettet)
```

Ved oppretting av post i gruppe:
```
1. INSERT INTO posts (..., created_for_group_id = Y)

2. trigger_auto_populate_group_posts (AFTER INSERT)
   → INSERT INTO group_posts (group_id, post_id)

3. trigger_update_group_post_count (AFTER INSERT på group_posts)
   → UPDATE groups SET post_count = post_count + 1
```

---

## GJENOPPBYGGING

For å gjenoppbygge triggers og funksjoner:

1. Kjør alle migrasjoner i rekkefølge
2. Verifiser at alle triggers eksisterer:
   ```sql
   SELECT trigger_name, event_object_table, action_timing, event_manipulation
   FROM information_schema.triggers
   WHERE trigger_schema = 'public'
   AND trigger_name LIKE '%group%';
   ```

3. Test hver funksjon manuelt

---

**Arkivert:** 2026-01-10
**Av:** Claude
**Kilde:** 11 migrasjoner
