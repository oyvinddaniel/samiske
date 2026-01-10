# Integrasjonspunkter for Gruppe-system
## Hvor grupper integreres i kodebasen

> **Arkivert:** 2026-01-10
> **Kilde:** Kodeanalyse av samiske.no codebase

---

## OVERSIKT

Dette dokumentet kartlegger ALLE steder hvor gruppe-funksjonalitet er integrert i frontend-kodebasen. Bruk dette som sjekkliste ved gjenoppbygging.

---

## NAVIGASJONSKOMPONENTER

### 1. Sidebar.tsx (Desktop)

**Fil:** `src/components/layout/Sidebar.tsx`

| Linjenr | Hva | Beskrivelse |
|---------|-----|-------------|
| 46 | Type | `activePanel?: ... 'group' \| 'groups'` |
| 679-697 | Grupper-knapp | `Users` ikon + "Grupper" tekst, trigger `open-groups-panel` event |

**Event listeners:**
- `open-groups-panel` - Åpner grupper-liste panel

**Implementasjon:**
```tsx
<button
  onClick={() => window.dispatchEvent(new CustomEvent('open-groups-panel'))}
  className={...}
>
  <Users className="w-4 h-4" />
  Grupper
</button>
```

---

### 2. MobileNav.tsx (Mobil hamburger-meny)

**Fil:** `src/components/layout/MobileNav.tsx`

| Linjenr | Hva | Beskrivelse |
|---------|-----|-------------|
| 563-584 | Grupper-knapp | Mobil versjon, samme funksjonalitet som Sidebar |

**Implementasjon:**
```tsx
<button
  onClick={() => {
    setIsOpen(false)
    window.dispatchEvent(new CustomEvent('open-groups-panel'))
  }}
>
  <Users className="w-4 h-4" />
  Grupper
</button>
```

---

### 3. RightSidebar.tsx (Høyre info-panel)

**Fil:** `src/components/layout/RightSidebar.tsx`

| Linjenr | Hva | Beskrivelse |
|---------|-----|-------------|
| 77 | State | `const [openGroups, setOpenGroups] = useState<OpenGroup[]>([])` |
| 310-319 | Fetch | `fetchOpenGroups()` - Henter de 5 nyeste åpne gruppene |
| 389 | Realtime | `.on(...table: 'groups', ...)` - Lytter til nye grupper |
| 542-586 | Widget | "De 5 nyeste gruppene (åpne)" - Card med liste |

**Widget viser:**
- Gruppe avatar/icon
- Gruppe navn
- Medlem-count
- Opprettet dato
- Link til `/grupper/${group.slug}`

**Database query:**
```typescript
.from('groups')
.select('id, name, slug, image_url, group_type, member_count, created_at')
.eq('group_type', 'open')
.order('created_at', { ascending: false })
.limit(5)
```

---

### 4. HomeLayout.tsx (Main layout orchestrator)

**Fil:** `src/components/layout/HomeLayout.tsx`

**Imports (linjer 12, 19):**
```typescript
import { GroupFeedView } from '@/components/groups/GroupFeedView'
import { GroupsContent } from '@/app/grupper/GroupsContent'
```

**State (linje 50):**
```typescript
const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
```

**Type definition (linje 30):**
```typescript
type ActivePanel = ... | 'group' | 'groups'
```

**Event handlers (linjer 192-197, 256-260):**
- `handleOpenGroupPanel(groupId)` - Åpner gruppe-detalj
- `handleOpenGroupsPanel()` - Åpner grupper-liste

**Event listeners (linjer 267, 277, 285, 295):**
```typescript
window.addEventListener('open-group-panel', ...)
window.addEventListener('open-groups-panel', ...)
```

**Rendering (linjer 345-349, 406):**
```tsx
{activePanel === 'group' && selectedGroupId && (
  <GroupFeedView groupId={selectedGroupId} />
)}

{activePanel === 'groups' && <GroupsContent />}
```

**URL restoration (linjer 102-104):**
```typescript
case 'group':
  const groupMatch = pathname.match(/\/grupper\/([^\/]+)/)
  if (groupMatch) setSelectedGroupId(groupMatch[1])
```

---

## GRUPPER-SIDER (RUTER)

### 1. /grupper/page.tsx

**Fil:** `src/app/grupper/page.tsx`

**Hva:** Landing page for `/grupper`

**Rendererer:** `<GroupsContent />`

---

### 2. /grupper/GroupsContent.tsx

**Fil:** `src/app/grupper/GroupsContent.tsx`

**Funksjonalitet:**
- Tab 1: Utforsk grupper (alle åpne/lukkede)
- Tab 2: Mine grupper
- Tab 3: Gruppe-detalj view
- Tab 4: Gruppe-innlegg feed

**Database queries:**
```typescript
// Alle grupper
.from('groups')
.select('*, creator:created_by(*)')
.order('created_at', { ascending: false })

// Mine grupper
.from('group_members')
.select('*, group:groups(*)')
.eq('user_id', currentUserId)
.eq('status', 'approved')
```

**Komponenter brukt:**
- `GroupCard` - Viser gruppe-kort
- `GroupFeedView` - Gruppe-detalj
- `CreateGroupModal` - Opprette ny gruppe

---

### 3. /grupper/[slug]/page.tsx

**Status:** Filen eksisterer IKKE i nåværende struktur

**Men:** Referert til via `<Link href={`/grupper/${group.slug}`}>` i flere komponenter

**Ved gjenoppbygging:** Lag denne ruten for dynamisk gruppe-visning

---

## POST-KOMPONENTER (GRUPPE-INTEGRASJONER)

### 1. PostCard.tsx

**Fil:** `src/components/posts/PostCard.tsx`

| Linjenr | Hva | Beskrivelse |
|---------|-----|-------------|
| 187 | Ikon | `{postData.posted_from_type === 'group' && <Users />}` |
| 190 | Tekst | Viser gruppe-navn hvis `posted_from_type === 'group'` |

**Implementasjon:**
```tsx
{postData.posted_from_type === 'group' && (
  <>
    <Users className="w-3 h-3" />
    <span>{postData.posted_from_name}</span>
  </>
)}
```

**Formål:** Viser kontekst-indikator i post-header

---

### 2. CreatePostSheet.tsx

**Fil:** `src/components/posts/CreatePostSheet.tsx`

| Linjenr | Hva | Beskrivelse |
|---------|-----|-------------|
| 37 | Prop | `groupId?: string \| null` |
| 41 | Prop | I funksjons-signatur |
| 236 | Form field | `created_for_group_id: groupId \| \| null` |
| 289 | Mention data | `p_group_id: mention.id` |

**Brukes når:**
- Oppretter innlegg FRA en gruppe-side
- `groupId` prop sendes ned fra `GroupFeedView`

---

### 3. Feed.tsx (OMFATTENDE)

**Fil:** `src/components/feed/Feed.tsx`

**Props (linjer 29-30):**
```typescript
groupId?: string
groupIds?: string[]
```

**Post type (linje 91, 94-99):**
```typescript
created_for_group_id?: string | null
group?: { ... } | null
```

**Query logikk (linjer 347-451):**
~100 linjer med kompleks filtrering:
```typescript
// Ekskluder gruppe-posts fra geo-feed
.is('created_for_group_id', null)

// ELLER hent gruppe-posts for spesifikke grupper
if (groupId) {
  query = query.eq('created_for_group_id', groupId)
}

if (groupIds && groupIds.length > 0) {
  query = query.in('created_for_group_id', groupIds)
}
```

**SELECT fields (linjer 288-293):**
```typescript
group:groups(
  id,
  name,
  slug,
  image_url
)
```

**Post data (linjer 794-797, 841):**
```typescript
const groupData = post.group
if (groupData && post.created_for_group_id) {
  // Set posted_from metadata
}
```

**PostComposerInline (linje 908):**
```typescript
<PostComposerInline groupId={groupId || null} />
```

---

### 4. CalendarView.tsx

**Fil:** `src/components/calendar/CalendarView.tsx`

**Props (linjer 263, 269):**
```typescript
groupId?: string
groupName?: string
```

**Query logikk (linjer 374-381):**
```typescript
if (groupId) {
  query = query.eq('created_for_group_id', groupId)
} else {
  // Ekskluder gruppe-events fra global kalender
  query = query.is('created_for_group_id', null)
}
```

**Heading (linjer 618-621):**
```tsx
{groupName && <h2>Kalender for {groupName}</h2>}
```

---

## @MENTIONS SYSTEM

### 1. MentionTextarea.tsx

**Fil:** `src/components/mentions/MentionTextarea.tsx`

**Type definition (linje 11):**
```typescript
export type MentionType = 'user' | 'community' | 'place' | 'municipality' | 'language_area' | 'group'
```

**Ikoner (linje 48):**
```typescript
TYPE_ICONS = {
  ...
  group: Users,  // Orange
}
```

**Labels (linje 52):**
```typescript
TYPE_LABELS = {
  ...
  group: 'Grupper',
}
```

**Enabled types (linje 71):**
```typescript
enabledTypes = ['user', 'community', 'place', 'municipality', 'language_area', 'group']
```

**Søkefunksjon (linjer 256-281):**
```typescript
// Search groups
if (enabledTypes.includes('group')) {
  searches.push(
    (async () => {
      let query = supabase
        .from('groups')
        .select('id, name, avatar_url')

      if (hasQuery) {
        query = query.ilike('name', `%${mentionQuery}%`)
      }

      const { data } = await query.limit(3)
      // ... render results
    })()
  )
}
```

**Rendering:**
```tsx
<Users className="w-4 h-4 text-orange-500" />
<span className="font-medium">{result.name}</span>
<span className="text-xs text-gray-400">Gruppe</span>
```

---

## SØK OG FILTRERING

### 1. searchQueries.ts

**Fil:** `src/lib/search/searchQueries.ts`

**Status:** Grupper er IKKE søkbare via hovedsøk

**INGEN `searchGroups()` funksjon implementert**

**Grupper er IKKE med i `searchAll()` (linje 531-563)**

**Kategorier (searchConstants.ts):**
```typescript
SEARCHABLE_CATEGORIES = [
  'brukere',
  'innlegg',
  'arrangementer',
  'kommentarer',
  'geografi',
  'samfunn',  // ← Samfunn JA
  'tjenester',
  'produkter'
  // ← Grupper NEI
]
```

---

## GRUPPE-KOMPONENTER (14 filer)

**Plassering:** `src/components/groups/`

1. **CreateGroupModal.tsx** - Modal for opprette ny gruppe
2. **GroupCard.tsx** - Gruppe-kort (vises i lister)
3. **GroupFeedView.tsx** - Gruppe-detalj view med feed/kalender
4. **EditGroupDialog.tsx** - Dialog for redigere gruppe-info
5. **GroupSettingsDialog.tsx** - Dialog for gruppe-instillinger
6. **GroupHeader.tsx** - Gruppe header-component
7. **GroupStatsTab.tsx** - Stats-tab i gruppe
8. **GroupNotificationSettings.tsx** - Notifikasjons-instillinger
9. **WelcomeMessageModal.tsx** - Velkomst-melding for nye medlem
10. **MembersManagementTab.tsx** - Admin-panel for medlem-administrasjon
11. **DeleteGroupDialog.tsx** - Dialog for slette gruppe
12. **TransferOwnershipDialog.tsx** - Dialog for overføre gruppe-eierskap
13. **JoinGroupButton.tsx** - Knapp for bli medlem av gruppe
14. (flere...)

---

## LIB-FILER (BACKEND HJELPEFUNKSJONER)

### 1. groups.ts

**Fil:** `src/lib/groups.ts`

**Funksjoner:** 20+ hjelpefunksjoner

1. `createGroup()` - Oppretter gruppe (kaller RPC)
2. `joinGroup()` - Bli medlem (kaller RPC)
3. `leaveGroup()` - Forlat gruppe
4. `approveMember()` - Godkjenn medlem (kaller RPC)
5. `rejectMember()` - Avslå medlem
6. `removeMember()` - Fjern medlem (kaller RPC)
7. `getGroup()` - Hent enkelt gruppe
8. `getAllGroups()` - Hent alle grupper
9. `getUserGroups()` - Hent brukerens grupper (kaller RPC)
10. `deleteGroup()` - Slett gruppe (kaller RPC)
11. `updateGroup()` - Oppdater gruppe-info (kaller RPC)
12. `inviteUser()` - Inviter bruker
13. `acceptInvite()` - Aksepter invitasjon
14. `declineInvite()` - Avslå invitasjon
15. `transferOwnership()` - Overfør eierskap (kaller RPC)
16. `updateWelcomeMessage()` - Oppdater velkomstmelding
17. `markWelcomeSeen()` - Marker velkomst som sett
18. `getNotificationPreferences()` - Hent notifikasjonsinnstillinger
19. `updateNotificationPreferences()` - Oppdater notifikasjonsinnstillinger
20. `getGroupStatistics()` - Hent statistikk (kaller RPC)

---

### 2. types/groups.ts

**Fil:** `src/lib/types/groups.ts`

**TypeScript types:**
```typescript
export type GroupType = 'open' | 'closed' | 'hidden'
export type MemberRole = 'member' | 'moderator' | 'admin'
export type MemberStatus = 'pending' | 'approved' | 'rejected'

export interface Group {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  group_type: GroupType
  municipality_id?: string
  place_id?: string
  created_by?: string
  created_at: string
  updated_at: string
  member_count: number
  post_count: number
  welcome_message?: string
}

export interface GroupMember { ... }
export interface UserGroup { ... }
export interface GroupInvite { ... }
// ... flere types
```

---

## DATABASE-INTEGRASJONER

### 1. posts.created_for_group_id

**Tabell:** `posts`
**Kolonne:** `created_for_group_id` (UUID, nullable)

**Brukes til:**
- Markere innlegg som "opprettet for gruppe"
- Filtrering i feeds
- RLS policies

**Trigger:** Auto-populerer `group_posts` tabell

---

### 2. RLS Policies (posts tabell)

**Fil:** `20241214_fix_group_posts_rls.sql`

**Kompleks SELECT policy:**
```sql
-- Gruppe-innlegg vises KUN for medlemmer
-- ALDRI i offentlige feeds
-- ALDRI i geografiske feeds
```

**Implementert via:**
- Nested EXISTS queries
- `created_for_group_id IS NULL` checks
- `group_members.status = 'approved'` checks

---

## GJENOPPBYGGING SJEKKLISTE

Ved gjenoppbygging av gruppe-systemet, reverser følgende endringer:

### Frontend:
- [ ] Uncomment grupper-knapp i `Sidebar.tsx` (linje 679-697)
- [ ] Uncomment grupper-knapp i `MobileNav.tsx` (linje 563-584)
- [ ] Gjenskap `RightSidebar.tsx` widget (linje 542-586)
- [ ] Gjenskap `HomeLayout.tsx` event handlers og rendering
- [ ] Gjenskap `Feed.tsx` gruppe-filtrering (~100 linjer)
- [ ] Gjenskap `PostCard.tsx` gruppe-kontekst indikator
- [ ] Gjenskap `CreatePostSheet.tsx` groupId prop
- [ ] Gjenskap `CalendarView.tsx` gruppe-logikk
- [ ] Gjenskap `MentionTextarea.tsx` gruppe-søk

### Backend:
- [ ] Kopier tilbake `src/lib/groups.ts`
- [ ] Kopier tilbake `src/lib/types/groups.ts`
- [ ] Kopier tilbake `src/components/groups/` (alle 14 komponenter)
- [ ] Kopier tilbake `src/app/grupper/` (sider)

### Database:
- [ ] Kjør alle 11 migrasjoner i rekkefølge
- [ ] Verifiser RLS policies
- [ ] Verifiser triggers og funksjoner

---

**Arkivert:** 2026-01-10
**Av:** Claude
**Kilde:** Fullstendig kodeanalyse av samiske.no
