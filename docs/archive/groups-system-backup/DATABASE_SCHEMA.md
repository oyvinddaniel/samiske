# Gruppe-system Database Schema
## Arkivert 2026-01-10

> **Kilde:** Ekstrahert fra `20241213_phase4_groups.sql` og relaterte migrasjoner
> **Formål:** Dokumentasjon for gjenoppbygging av gruppe-funksjonalitet

---

## OVERSIKT

Gruppe-systemet består av **7 dedikerte tabeller** + 1 kolonne i `posts`-tabellen.

**Hovedfunksjonalitet:**
- Åpne, lukkede og skjulte grupper
- Medlemskap med roller (member, moderator, admin)
- Gruppe-innlegg
- Invitasjonssystem
- Geografisk tilknytning
- Notifikasjonsinnstillinger per bruker per gruppe

---

## TABELLER

### 1. groups (hovedtabell)

**Formål:** Hovedtabell for alle grupper

**Kolonner:**
- `id` (UUID, PK) - Auto-generert
- `name` (TEXT, NOT NULL) - Gruppe-navn
- `slug` (TEXT, NOT NULL, UNIQUE) - URL-vennlig slug
- `description` (TEXT, nullable) - Beskrivelse
- `image_url` (TEXT, nullable) - Avatar/logo
- `group_type` (TEXT, NOT NULL, DEFAULT 'open') - Gruppetype:
  - `'open'` - Alle kan se og bli med
  - `'closed'` - Alle ser, kun godkjente medlemmer
  - `'hidden'` - Kun medlemmer vet om den
- `municipality_id` (UUID, nullable) - FK → municipalities(id) ON DELETE SET NULL
- `place_id` (UUID, nullable) - FK → places(id) ON DELETE SET NULL
- `created_by` (UUID, nullable) - FK → profiles(id) ON DELETE SET NULL
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- `updated_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- `member_count` (INT, DEFAULT 0) - Denormalisert for ytelse
- `post_count` (INT, DEFAULT 0) - Denormalisert for ytelse
- `welcome_message` (TEXT, nullable) - Lagt til i 20241215_group_admin_features.sql

**Indekser:**
- `idx_groups_slug` ON slug
- `idx_groups_type` ON group_type
- `idx_groups_municipality` ON municipality_id
- `idx_groups_created_by` ON created_by

**CHECK constraints:**
- `group_type IN ('open', 'closed', 'hidden')`

---

### 2. group_members (CASCADE DELETE)

**Formål:** Medlemskap i grupper med roller og status

**Kolonner:**
- `id` (UUID, PK)
- `group_id` (UUID, NOT NULL) - FK → groups(id) ON DELETE CASCADE
- `user_id` (UUID, NOT NULL) - FK → profiles(id) ON DELETE CASCADE
- `role` (TEXT, NOT NULL, DEFAULT 'member') - Rolle:
  - `'member'` - Vanlig medlem
  - `'moderator'` - Moderator
  - `'admin'` - Administrator
- `status` (TEXT, NOT NULL, DEFAULT 'approved') - Status:
  - `'pending'` - Venter godkjenning (lukkede grupper)
  - `'approved'` - Godkjent medlem
  - `'rejected'` - Avvist
- `joined_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- `approved_by` (UUID, nullable) - FK → profiles(id) ON DELETE SET NULL
- `approved_at` (TIMESTAMP WITH TIME ZONE, nullable)

**Indekser:**
- `idx_group_members_group` ON group_id
- `idx_group_members_user` ON user_id
- `idx_group_members_status` ON status
- `idx_group_members_role` ON role

**UNIQUE constraint:**
- `(group_id, user_id)` - Én bruker kan kun være medlem én gang

**CHECK constraints:**
- `role IN ('member', 'moderator', 'admin')`
- `status IN ('pending', 'approved', 'rejected')`

---

### 3. group_posts (CASCADE DELETE)

**Formål:** Junction-tabell mellom groups og posts

**Kolonner:**
- `id` (UUID, PK)
- `group_id` (UUID, NOT NULL) - FK → groups(id) ON DELETE CASCADE
- `post_id` (UUID, NOT NULL) - FK → posts(id) ON DELETE CASCADE
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

**Indekser:**
- `idx_group_posts_group` ON group_id
- `idx_group_posts_post` ON post_id

**UNIQUE constraint:**
- `(group_id, post_id)` - Ett innlegg kan kun være i én gruppe én gang

---

### 4. group_invites (CASCADE DELETE)

**Formål:** Invitasjoner til grupper (lukkede/skjulte)

**Kolonner:**
- `id` (UUID, PK)
- `group_id` (UUID, NOT NULL) - FK → groups(id) ON DELETE CASCADE
- `invited_user_id` (UUID, NOT NULL) - FK → profiles(id) ON DELETE CASCADE
- `invited_by` (UUID, NOT NULL) - FK → profiles(id) ON DELETE CASCADE
- `status` (TEXT, NOT NULL, DEFAULT 'pending') - Status:
  - `'pending'` - Venter svar
  - `'accepted'` - Akseptert
  - `'declined'` - Avslått
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- `responded_at` (TIMESTAMP WITH TIME ZONE, nullable)

**Indekser:**
- `idx_group_invites_group` ON group_id
- `idx_group_invites_user` ON invited_user_id
- `idx_group_invites_status` ON status

**UNIQUE constraint:**
- `(group_id, invited_user_id)` - Én bruker kan kun inviteres én gang per gruppe

**CHECK constraints:**
- `status IN ('pending', 'accepted', 'declined')`

---

### 5. group_places (CASCADE DELETE)

**Formål:** Geografisk tilknytning for grupper (ONE per gruppe)

**Kolonne:**
- `id` (UUID, PK)
- `group_id` (UUID, NOT NULL) - FK → groups(id) ON DELETE CASCADE
- `place_id` (UUID, nullable) - FK → places(id)
- `municipality_id` (UUID, nullable) - FK → municipalities(id)
- `language_area_id` (UUID, nullable) - FK → language_areas(id)
- `is_sapmi` (BOOLEAN, nullable) - TRUE hvis Sápmi-nivå
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

**Indekser:**
- `idx_group_places_group` ON group_id
- `idx_group_places_place` ON place_id
- `idx_group_places_municipality` ON municipality_id
- `idx_group_places_language_area` ON language_area_id

**UNIQUE constraint:**
- `group_id` - Kun ÉN geografisk tilknytning per gruppe

**CHECK constraint:**
- Kun ÉN av (place_id, municipality_id, language_area_id, is_sapmi) kan være satt

---

### 6. group_welcome_seen (CASCADE DELETE)

**Formål:** Sporing av hvem som har sett velkomstmelding

**Kolonner:**
- `id` (UUID, PK)
- `group_id` (UUID, NOT NULL) - FK → groups(id) ON DELETE CASCADE
- `user_id` (UUID, NOT NULL) - FK → profiles(id) ON DELETE CASCADE
- `seen_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

**Indekser:**
- `idx_group_welcome_seen_group` ON group_id
- `idx_group_welcome_seen_user` ON user_id

**UNIQUE constraint:**
- `(group_id, user_id)` - Hver bruker registreres kun én gang

---

### 7. group_notification_preferences (CASCADE DELETE)

**Formål:** Notifikasjonsinnstillinger per bruker per gruppe

**Kolonner:**
- `id` (UUID, PK)
- `group_id` (UUID, NOT NULL) - FK → groups(id) ON DELETE CASCADE
- `user_id` (UUID, NOT NULL) - FK → profiles(id) ON DELETE CASCADE
- `notify_new_posts` (BOOLEAN, DEFAULT TRUE)
- `notify_events` (BOOLEAN, DEFAULT TRUE)
- `notify_comments_own_posts` (BOOLEAN, DEFAULT TRUE)
- `notify_mentions` (BOOLEAN, DEFAULT TRUE)
- `notification_frequency` (TEXT, DEFAULT 'immediately') - 'immediately', 'daily', 'weekly'
- `created_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- `updated_at` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())

**Indekser:**
- `idx_group_notification_prefs_group` ON group_id
- `idx_group_notification_prefs_user` ON user_id

**UNIQUE constraint:**
- `(group_id, user_id)` - Én innstilling per bruker per gruppe

---

### 8. posts.created_for_group_id (kolonne i eksisterende tabell)

**Formål:** Markere innlegg som "opprettet for gruppe"

**Detaljer:**
- Kolonne: `created_for_group_id` (UUID, nullable)
- FK → groups(id) (INGEN CASCADE - se trigger)
- Trigger `trigger_cleanup_group_posts` setter til NULL ved gruppe-sletting
- Auto-populerer `group_posts`-tabell via `trigger_auto_populate_group_posts`

**VIKTIG:**
- Innlegg slettes IKKE automatisk når gruppe slettes
- `created_for_group_id` settes til NULL (innlegget bevares som "orphan")
- Dette kan endres til hard delete hvis ønskelig

---

## CASCADE DELETE HIERARCHY

```
groups (slettes)
├── group_members → CASCADE DELETE
│   └── (membership fjernes automatisk)
│
├── group_posts → CASCADE DELETE
│   └── (junction-entries slettes, posts-tabellen påvirkes IKKE)
│
├── group_invites → CASCADE DELETE
│   └── (invitasjoner slettes)
│
├── group_places → CASCADE DELETE
│   └── (geografisk tilknytning slettes)
│
├── group_welcome_seen → CASCADE DELETE
│   └── (velkomstseen slettes)
│
└── group_notification_preferences → CASCADE DELETE
    └── (notifikasjonsinnstillinger slettes)

posts.created_for_group_id → TRIGGER setter NULL (ikke CASCADE)
```

---

## MIGRASJONER SOM ETABLERTE SYSTEMET

1. `20241213_phase4_groups.sql` - Oppretter alle tabeller, indekser, RLS
2. `20241213_exclude_group_posts.sql` - Ekskluderer gruppe-innlegg fra geografiske feeds
3. `20241214_fix_group_posts_rls.sql` - Kompleks RLS for posts med gruppe-logikk
4. `20241214_fix_group_posts_trigger.sql` - Auto-populate triggers
5. `20241214_fix_group_community_conflict.sql` - Validerer ikke både gruppe og samfunn
6. `20241214_fix_create_group_params.sql` - RPC parameter-fixes
7. `20241214_fix_create_group_overload.sql` - RPC overload
8. `20241215_group_admin_features.sql` - Welcome message, notification preferences
9. `20241215_fix_group_privacy_leak.sql` - Sikrer gruppe-innlegg aldri vises utenfor
10. `20241215_fix_group_privacy_leak_v2.sql` - Ytterligere sikkerhet
11. `20241216_group_geography_extended.sql` - Utvider group_places

---

## GJENOPPBYGGING

For å gjenoppbygge gruppe-systemet:

1. **Kjør migrasjonene i rekkefølge:**
   ```bash
   # Start med grunnleggende struktur
   supabase/migrations/20241213_phase4_groups.sql

   # Deretter alle fixes i kronologisk rekkefølge
   # (se liste over)
   ```

2. **Verifiser RLS policies** (se RLS_POLICIES.md)

3. **Verifiser triggers og funksjoner** (se TRIGGERS_FUNCTIONS.md)

4. **Test grundig:**
   - Opprette gruppe (åpen/lukket/skjult)
   - Bli medlem
   - Poste i gruppe
   - Invitere brukere
   - Admin-funksjoner

---

**Arkivert:** 2026-01-10
**Av:** Claude
**Kilde:** 11 migrasjoner + kodeanalyse
