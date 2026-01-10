# Gruppe-system Arkiv
## Full backup før permanent sletting

> **Arkivert:** 2026-01-10
> **Årsak:** Permanent sletting før offentlig lansering av samiske.no
> **Formål:** Dokumentasjon for fremtidig gjenoppbygging
> **Status:** Komplett backup av alle gruppe-relaterte systemer

---

## 📁 INNHOLD

### Dokumentasjon

| Fil | Hva | Detaljer |
|-----|-----|----------|
| `DATABASE_SCHEMA.md` | Komplett database-struktur | 7 tabeller + posts-kolonne, alle foreign keys, indekser, constraints |
| `RLS_POLICIES.md` | Row Level Security policies | Alle SELECT/INSERT/UPDATE/DELETE policies for sikkerhet |
| `TRIGGERS_FUNCTIONS.md` | Triggers og lagrede funksjoner | 5 triggers, 9 RPC-funksjoner med implementasjonsdetaljer |
| `INTEGRATION_POINTS.md` | Frontend-integrasjoner | Hver enkelt komponent som bruker grupper (linjenummer og kode) |

### Migrasjoner (11 filer)

| Fil | Formål |
|-----|--------|
| `20241213_phase4_groups.sql` | Oppretter alle tabeller, RLS, grunnleggende triggers/funksjoner |
| `20241213_exclude_group_posts.sql` | Ekskluderer gruppe-innlegg fra geografiske feeds |
| `20241214_fix_group_posts_rls.sql` | Kompleks RLS for posts-tabell med gruppe-logikk |
| `20241214_fix_group_posts_trigger.sql` | Auto-populate triggers for group_posts/community_posts |
| `20241214_fix_group_community_conflict.sql` | Validerer at post ikke har både gruppe og samfunn |
| `20241214_fix_create_group_params.sql` | Parameter-fixes for create_group RPC |
| `20241214_fix_create_group_overload.sql` | RPC overload fixes |
| `20241215_group_admin_features.sql` | Legger til welcome_message, notification_preferences |
| `20241215_fix_group_privacy_leak.sql` | Sikrer gruppe-innlegg aldri vises utenfor gruppen |
| `20241215_fix_group_privacy_leak_v2.sql` | Ytterligere privacy-fixes |
| `20241216_group_geography_extended.sql` | Utvider group_places med language_area_id og is_sapmi |

### Frontend-kode

| Mappe/Fil | Innhold |
|-----------|---------|
| `components-groups/` | Alle 14 gruppe-komponenter (CreateGroupModal, GroupCard, GroupFeedView, etc.) |
| `app-grupper/` | Grupper-sider (page.tsx, GroupsContent.tsx) |
| `groups.ts` | Backend hjelpefunksjoner (20+ funksjoner) |
| `lib-types/` | TypeScript type-definisjoner (groups.ts med alle interfaces) |

---

## 🔄 GJENOPPBYGGING

For å gjenoppbygge gruppe-systemet fra scratch:

### 1. Database (60 min)

```bash
cd supabase/migrations

# Kjør migrasjonene i DENNE rekkefølgen:
psql -f 20241213_phase4_groups.sql
psql -f 20241213_exclude_group_posts.sql
psql -f 20241214_fix_group_posts_rls.sql
psql -f 20241214_fix_group_posts_trigger.sql
psql -f 20241214_fix_group_community_conflict.sql
psql -f 20241214_fix_create_group_params.sql
psql -f 20241214_fix_create_group_overload.sql
psql -f 20241215_group_admin_features.sql
psql -f 20241215_fix_group_privacy_leak.sql
psql -f 20241215_fix_group_privacy_leak_v2.sql
psql -f 20241216_group_geography_extended.sql
```

**Verifiser:**
```sql
-- Skal returnere 7 tabeller
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'group%';

-- Skal returnere 5 triggers
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%group%';

-- Skal returnere 9 funksjoner
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%group%';
```

### 2. Backend (30 min)

```bash
# Kopier tilbake backend-filer
cp docs/archive/groups-system-backup/groups.ts src/lib/
cp -r docs/archive/groups-system-backup/lib-types/groups.ts src/lib/types/
```

### 3. Frontend (60 min)

```bash
# Kopier tilbake komponenter
cp -r docs/archive/groups-system-backup/components-groups/* src/components/groups/
cp -r docs/archive/groups-system-backup/app-grupper/* src/app/grupper/
```

**Reverser endringer i eksisterende filer:**

Følg `INTEGRATION_POINTS.md` og reverser alle endringer i:
- `Sidebar.tsx`
- `MobileNav.tsx`
- `RightSidebar.tsx`
- `HomeLayout.tsx`
- `Feed.tsx`
- `PostCard.tsx`
- `CreatePostSheet.tsx`
- `CalendarView.tsx`
- `MentionTextarea.tsx`

### 4. Testing (90 min)

```bash
# Build test
npm run build

# Lokal test
npm run dev
```

**Test i denne rekkefølgen:**
1. Opprette gruppe (åpen)
2. Opprette gruppe (lukket)
3. Opprette gruppe (skjult)
4. Bli medlem av åpen gruppe
5. Søke om medlemskap i lukket gruppe
6. Bli invitert til skjult gruppe
7. Poste i gruppe
8. Se gruppe-feed
9. Redigere gruppe (som admin)
10. Slette gruppe (som admin)

---

## 📊 STATISTIKK

**Database:**
- 7 dedikerte tabeller
- 1 kolonne i posts-tabell
- 11 migrasjoner
- 5 triggers
- 9 lagrede funksjoner (RPC)
- 15+ RLS policies

**Frontend:**
- 14 gruppe-komponenter
- 2 sider (/grupper, /grupper/GroupsContent)
- 20+ hjelpefunksjoner i groups.ts
- 10+ TypeScript interfaces

**Integrasjoner:**
- 9 komponenter påvirket (navigasjon, feed, posts, etc.)
- @mention system
- Søk (IKKE implementert - planlagt)

---

## ⚠️ VIKTIGE NOTATER

### Sikkerhet

**KRITISK:** Gruppe-privacy er implementert via:
1. RLS policies på database-nivå
2. Trigger som sikrer innlegg aldri vises utenfor gruppe
3. Frontend-filtrering som backup

**Test alltid:**
- Skjulte grupper er VIRKELIG skjulte
- Gruppe-innlegg vises kun for medlemmer
- Pending medlemmer har ikke tilgang

### Data-integritet

**Når gruppe slettes:**
- `group_members` → CASCADE DELETE
- `group_posts` → CASCADE DELETE
- `posts.created_for_group_id` → Settes til NULL (trigger)
- Innlegg bevares men mister gruppe-tilhørighet

**Hvis dere vil slette innlegg i stedet:**
Endre `cleanup_group_posts()` trigger:
```sql
-- Erstatt:
UPDATE posts SET created_for_group_id = NULL ...

-- Med:
DELETE FROM posts WHERE created_for_group_id = OLD.id;
```

### Performance

**Denormaliserte felt:**
- `groups.member_count` - Oppdateres via trigger
- `groups.post_count` - Oppdateres via trigger

**Hvis tallene blir feil:**
```sql
-- Rekalkuler member_count
UPDATE groups g SET member_count = (
  SELECT COUNT(*) FROM group_members
  WHERE group_id = g.id AND status = 'approved'
);

-- Rekalkuler post_count
UPDATE groups g SET post_count = (
  SELECT COUNT(*) FROM group_posts
  WHERE group_id = g.id
);
```

### Geografisk tilknytning

**group_places tabell:**
- Kun ÉN geografisk tilknytning per gruppe
- CHECK constraint sikrer kun ÉN nivå er satt
- Nivåer: place, municipality, language_area, eller Sápmi

---

## 🔐 SIKKERHETSVURDERING

**Før gjenoppbygging, vurder:**

1. **Privacy:**
   - Er skjulte grupper fortsatt skjulte nok?
   - Kan gruppe-innlegg lekke via søk?

2. **Authorization:**
   - Kan ikke-medlemmer se gruppe-innhold?
   - Kan moderatorer gjøre admin-operasjoner?

3. **Data:**
   - Hva skjer med gruppe-innlegg ved sletting?
   - Skal "orphan" posts være synlige?

---

## 📞 KONTAKT OG HISTORIKK

**Arkivert av:** Claude (AI-assistent)
**Dato:** 2026-01-10
**Prosjekt:** samiske.no
**Versjon:** Pre-offentlig lansering

**Git backup:**
```bash
# Backup branch opprettet før sletting
git checkout backup/pre-group-deletion

# Tag opprettet
git tag v1.0-pre-group-deletion
```

**Database backup:**
Se `backup_grupper_YYYYMMDD_HHMMSS.sql` fil

---

## ✅ FULLFØRINGSSJEKKLISTE

Før du sier at gjenoppbyggingen er ferdig:

### Database
- [ ] Alle 7 tabeller eksisterer
- [ ] posts.created_for_group_id kolonne eksisterer
- [ ] Alle 5 triggers eksisterer
- [ ] Alle 9 funksjoner eksisterer
- [ ] RLS policies virker (test med forskjellige brukere)

### Backend
- [ ] groups.ts eksisterer med alle 20+ funksjoner
- [ ] types/groups.ts eksisterer med alle interfaces
- [ ] Build kompilerer uten errors

### Frontend
- [ ] Alle 14 komponenter eksisterer
- [ ] /grupper side fungerer
- [ ] Grupper-knapp i Sidebar
- [ ] Grupper-knapp i MobileNav
- [ ] RightSidebar viser "Nyeste grupper"
- [ ] @mention for grupper fungerer
- [ ] Feed filtrerer gruppe-innlegg korrekt

### Testing
- [ ] Opprette åpen gruppe
- [ ] Opprette lukket gruppe
- [ ] Opprette skjult gruppe
- [ ] Bli medlem
- [ ] Poste i gruppe
- [ ] Se gruppe-feed
- [ ] Redigere gruppe (admin)
- [ ] Slette gruppe (admin)
- [ ] Verifiser at skjulte grupper ikke vises for ikke-medlemmer

---

**Dette arkivet inneholder ALT som trengs for å gjenoppbygge gruppe-systemet fra scratch.**

**Estimert tid for full gjenoppbygging:** 3-4 timer (inkl. testing)

**Lykke til!** 🚀
