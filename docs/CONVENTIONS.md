# CONVENTIONS.md - Kodekonvensjoner

> AI: Følg disse reglene når du skriver kode for samiske.no.  
> Sist oppdatert: 2025-12-26

---

## Språk

| Kontekst | Språk |
|----------|-------|
| **UI-tekster** | Norsk |
| **Kode** | Engelsk |
| **Kommentarer** | Engelsk |
| **Dokumentasjon** | Norsk |
| **Git commits** | Engelsk |

---

## Navngivning

| Type | Konvensjon | Eksempel |
|------|------------|----------|
| Komponenter | PascalCase | `UserProfile.tsx` |
| Funksjoner | camelCase | `getUserData()` |
| Variabler | camelCase | `userData` |
| Konstanter | UPPER_SNAKE | `MAX_FILE_SIZE` |
| Filer (komponenter) | PascalCase | `PostCard.tsx` |
| Filer (utilities) | camelCase | `formatDate.ts` |
| Database-tabeller | snake_case, flertall | `user_profiles` |
| Database-kolonner | snake_case | `created_at` |

---

## Mappestruktur

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes
│   └── [route]/page.tsx    # Page components
├── components/
│   ├── ui/                 # shadcn/ui (ikke rediger)
│   ├── layout/             # Layout-komponenter
│   ├── [feature]/          # Feature-spesifikke komponenter
│   └── shared/             # Gjenbrukbare komponenter
├── lib/
│   ├── supabase/           # Supabase clients
│   ├── [feature]/          # Feature-spesifikk logikk
│   └── utils.ts            # Generelle hjelpefunksjoner
└── hooks/                  # Custom React hooks
```

---

## Komponentstruktur

```typescript
// 1. Imports (gruppert)
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types'

// 2. Types/Interfaces
interface Props {
  userId: string
  onSave?: () => void
}

// 3. Component
export function UserCard({ userId, onSave }: Props) {
  // 3a. Hooks først
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  // 3b. Effects
  useEffect(() => {
    // ...
  }, [userId])
  
  // 3c. Handlers
  const handleSave = async () => {
    // ...
  }
  
  // 3d. Early returns
  if (loading) return <Skeleton />
  if (!user) return null
  
  // 3e. Render
  return (
    <div>
      {/* ... */}
    </div>
  )
}
```

---

## Supabase-mønstre

### Client-side
```typescript
import { createClient } from '@/lib/supabase/client'

export function MyComponent() {
  const supabase = useMemo(() => createClient(), [])
  
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
      // ...
    }
    fetchData()
  }, [supabase])
}
```

### Server-side
```typescript
import { createClient } from '@/lib/supabase/server'

export async function getData() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('posts')
    .select('*')
  return data
}
```

### Unngå N+1 queries
```typescript
// ❌ FEIL - N+1 queries
for (const post of posts) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', post.user_id)
    .single()
}

// ✅ RIKTIG - Én query
const userIds = [...new Set(posts.map(p => p.user_id))]
const { data: profiles } = await supabase
  .from('profiles')
  .select('*')
  .in('id', userIds)

// ✅ RIKTIG - Join i én query
const { data } = await supabase
  .from('posts')
  .select(`
    *,
    profiles:user_id (id, full_name, avatar_url),
    comments (count),
    likes (count)
  `)
```

---

## RLS Policy-mønstre

### Standard for brukereide data
```sql
-- Les egne + offentlige
CREATE POLICY "read_policy" ON tabellnavn
FOR SELECT USING (
  auth.uid() = user_id
  OR is_public = true
);

-- Skriv kun egne
CREATE POLICY "write_policy" ON tabellnavn
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Oppdater kun egne
CREATE POLICY "update_policy" ON tabellnavn
FOR UPDATE USING (auth.uid() = user_id);

-- Slett kun egne
CREATE POLICY "delete_policy" ON tabellnavn
FOR DELETE USING (auth.uid() = user_id);
```

### Alltid sjekk i kode også
```typescript
// ❌ FEIL - Stoler bare på RLS
await supabase.from('posts').delete().eq('id', postId)

// ✅ RIKTIG - Dobbel sjekk
await supabase
  .from('posts')
  .delete()
  .eq('id', postId)
  .eq('user_id', userId)
```

---

## Ikoner

**Bruk:** Lucide icons  
**Ikke bruk:** Emojis i UI

```typescript
import { Heart, MessageCircle, Share } from 'lucide-react'

// ✅ RIKTIG
<Heart className="h-4 w-4" />

// ❌ FEIL
<span>❤️</span>
```

---

## Styling

**Rammeverk:** Tailwind CSS + shadcn/ui

```typescript
// ✅ RIKTIG - Tailwind classes
<div className="flex items-center gap-2 p-4 rounded-lg bg-background">

// ❌ FEIL - Inline styles
<div style={{ display: 'flex', padding: '16px' }}>

// ✅ RIKTIG - shadcn/ui komponenter
import { Button } from '@/components/ui/button'
<Button variant="outline" size="sm">

// ❌ FEIL - Custom button styling
<button className="bg-blue-500 text-white px-4 py-2">
```

---

## Input-validering

| Felt | Maks lengde |
|------|-------------|
| Tittel | 100 tegn |
| Innhold | 5000 tegn |
| Sted | 200 tegn |
| Brukernavn | 50 tegn |
| Bio | 500 tegn |

```typescript
// Alltid valider på server-side
const MAX_TITLE_LENGTH = 100

if (title.length > MAX_TITLE_LENGTH) {
  return { error: 'Tittel er for lang' }
}
```

---

## Error handling

```typescript
// ✅ RIKTIG - Håndter feil eksplisitt
const { data, error } = await supabase.from('posts').select()

if (error) {
  console.error('Error fetching posts:', error)
  toast.error('Kunne ikke hente innlegg')
  return
}

// ✅ RIKTIG - Try/catch for async
try {
  await uploadFile(file)
} catch (error) {
  console.error('Upload failed:', error)
  toast.error('Opplasting feilet')
}
```

---

## Git commits

**Format:** `type(scope): beskrivelse`

**Typer:**
- `feat`: Ny feature
- `fix`: Bug fix
- `docs`: Dokumentasjon
- `style`: Formatering (ikke CSS)
- `refactor`: Kodeendring uten funksjonsendring
- `test`: Testing
- `chore`: Vedlikehold

**Eksempler:**
```bash
git commit -m "feat(gallery): add image upload support"
git commit -m "fix(feed): resolve pagination bug"
git commit -m "docs(readme): update installation steps"
git commit -m "refactor(media): simplify upload flow"
```

---

## Kommentarer i kode

```typescript
// ✅ RIKTIG - Forklar HVORFOR
// We fetch all users in one query to avoid N+1 problem
const { data: users } = await supabase.from('profiles').select()

// ❌ FEIL - Forklar HVA (åpenbart fra koden)
// Get users from database
const { data: users } = await supabase.from('profiles').select()

// ✅ RIKTIG - TODO med kontekst
// TODO: Add pagination when user count exceeds 1000 - 2025-01-15

// ✅ RIKTIG - FIXME med beskrivelse
// FIXME: Race condition when uploading multiple files - 2025-01-15
```

---

## Media Service

**Alltid bruk MediaService for bilder:**

```typescript
import { MediaService } from '@/lib/media'

// ✅ RIKTIG
const media = await MediaService.upload(file, {
  entityType: 'post',
  entityId: postId,
  userId: user.id,
})

// ❌ FEIL - Direkte Supabase storage
const { data } = await supabase.storage
  .from('images')
  .upload(path, file)
```

---

## Realtime subscriptions

```typescript
useEffect(() => {
  const subscription = supabase
    .channel('posts')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'posts'
    }, (payload) => {
      // Håndter endring
    })
    .subscribe()

  // ✅ VIKTIG: Cleanup
  return () => {
    subscription.unsubscribe()
  }
}, [supabase])
```

---

## Sikkerhet

1. **Aldri** commit secrets
2. **Aldri** bruk Service Role Key i frontend
3. **Alltid** valider input på server-side
4. **Alltid** bruk parameteriserte queries (Supabase gjør dette)
5. **Alltid** ha RLS aktivert
6. **Alltid** dobbel-sjekk eierskap i kode

---

**Sist oppdatert:** 2025-12-26  
**Oppdatert av:** Claude (migrering)
