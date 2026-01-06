# CHEATSHEET.md - Hurtigreferanse

> Raske kommandoer og vanlige oppgaver for samiske.no  
> Sist oppdatert: 2025-12-26

---

## 🚀 Utviklingskommandoer

```bash
# Start lokal server
npm run dev

# Bygg produksjon
npm run build

# Linting
npm run lint

# TypeScript sjekk
npx tsc --noEmit

# Tester
npm run test              # Unit + component tests
npm run test:ui           # Med UI
npm run test:coverage     # Med coverage
npm run test:e2e          # E2E tester
```

---

## 🔑 Slash-kommandoer (Claude Code)

| Kommando | Beskrivelse |
|----------|-------------|
| `/analyze` | Full kodeanalyse (alle kategorier) |
| `/analyze code` | Kun kodekvalitet |
| `/analyze security` | Kun sikkerhet |
| `/analyze ux` | Kun UX/tilgjengelighet |
| `/analyze content` | Kun innleggsstruktur |
| `/security-review` | Sikkerhetsgjennomgang |
| `/pre-deploy` | Sjekkliste før push |
| `/code-quality` | Kodekvalitetsanalyse |
| `/gdpr` | GDPR-arbeid |
| `/deep-security-audit` | Full sikkerhetsanalyse |

---

## 📁 Viktige filer

| Fil | Formål |
|-----|--------|
| `CLAUDE.md` | AI-instruksjoner (root) |
| `docs/PROJECT.md` | Prosjektoversikt |
| `docs/STATUS.md` | Nåværende status |
| `docs/BACKLOG.md` | Oppgaveliste |
| `src/lib/supabase/client.ts` | Supabase browser-klient |
| `src/lib/supabase/server.ts` | Supabase server-klient |
| `src/lib/media/mediaService.ts` | Media Service |
| `src/components/layout/HomeLayout.tsx` | Hoved-layout |

---

## 🗄️ Database

### Supabase CLI (ikke brukt - bruk Dashboard)
```sql
-- Kjør migrasjoner via: Supabase Dashboard > SQL Editor
-- IKKE via kommandolinje

-- Sjekk RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Sjekk tabeller
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Vanlige queries
```sql
-- Antall brukere
SELECT COUNT(*) FROM profiles;

-- Aktive brukere (siste 24t)
SELECT COUNT(*) FROM profiles 
WHERE last_active > NOW() - INTERVAL '24 hours';

-- Antall innlegg
SELECT COUNT(*) FROM posts;

-- Innlegg per type
SELECT type, COUNT(*) FROM posts GROUP BY type;
```

---

## 🖼️ Media Service

```typescript
// Upload enkelt bilde
import { MediaService } from '@/lib/media'

const media = await MediaService.upload(file, {
  entityType: 'post',
  entityId: postId,
  userId: user.id,
})

// Upload flere bilder
const mediaList = await MediaService.uploadMultiple(files, {
  entityType: 'post',
  entityId: postId,
  userId: user.id,
})

// Hent URL med størrelse
const url = MediaService.getUrl(storagePath, 'medium') // small, medium, large

// Slett
await MediaService.delete(mediaId, userId)
```

### Entity types
| Type | Maks bilder | Komprimering |
|------|-------------|--------------|
| `post` | 30 | 200KB, 1920px |
| `profile_avatar` | 1 | 100KB, 400x400px |
| `profile_cover` | 1 | 200KB, 1920px |
| `geography_*` | 100 | 300KB, 1920px |
| `group_avatar` | 1 | 100KB, 400x400px |
| `bug_report` | 5 | 500KB |

---

## 🔍 Søk

```typescript
// Bruk UnifiedSearchBar komponent
import { UnifiedSearchBar } from '@/components/search/UnifiedSearchBar'

// Eller søkefunksjoner direkte
import { searchUsers, searchPosts, searchEvents } from '@/lib/search/searchQueries'

const users = await searchUsers('query', 10, 0) // query, limit, offset
```

### Kategorier
`brukere`, `innlegg`, `arrangementer`, `kommentarer`, `geografi`, `samfunn`, `tjenester`, `produkter`

---

## 🗺️ SPA-navigasjon

```typescript
// URL → Panel mapping
import { getPanelFromPathname } from '@/lib/navigation/spa-utils'

const { type, params } = getPanelFromPathname('/samfunn/samisk-kultur')
// type: 'community-page', params: { slug: 'samisk-kultur' }

// CustomEvent for panel-bytte
window.dispatchEvent(
  new CustomEvent('set-active-panel', {
    detail: { type: 'calendar' }
  })
)
```

---

## 🔐 Autentisering

```typescript
// Client-side
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()

// Server-side
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

// Sjekk admin
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

const isAdmin = profile?.role === 'admin'
```

---

## 📝 Git workflow

```bash
# Commit-format
git commit -m "type(scope): beskrivelse"

# Typer: feat, fix, docs, style, refactor, test, chore

# Eksempler
git commit -m "feat(gallery): add image upload support"
git commit -m "fix(feed): resolve pagination bug"
git commit -m "docs(readme): update installation steps"
```

---

## 🐛 Debugging

```bash
# Drep prosess på port 3000
lsof -ti:3000 | xargs kill -9

# Sjekk Next.js build
npm run build

# Sjekk TypeScript
npx tsc --noEmit

# Logg miljøvariabler (forsiktig!)
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```

### Vanlige feil

| Feil | Løsning |
|------|---------|
| "Unable to acquire lock" | `lsof -ti:3000 \| xargs kill -9` |
| "Hydration mismatch" | Bruk `suppressHydrationWarning` eller client-only |
| "RLS policy error" | Sjekk at bruker er autentisert |
| "File too large" | Sjekk `app_settings.media_max_file_size_mb` |

---

## 🔗 Dashboards

| Tjeneste | URL |
|----------|-----|
| Supabase | [supabase.com/dashboard](https://supabase.com/dashboard) |
| Vercel | [vercel.com/dashboard](https://vercel.com/dashboard) |
| Bunny.net | [bunny.net](https://bunny.net) |
| GitHub | [github.com](https://github.com) |

---

## 📊 Admin-tilgang

```sql
-- Sett admin-rolle
UPDATE profiles SET role = 'admin' WHERE id = 'bruker-uuid';

-- Sjekk admin-brukere
SELECT id, full_name, role FROM profiles WHERE role = 'admin';
```

Admin-panel: `samiske.no/admin`

---

**Sist oppdatert:** 2025-12-26  
**Oppdatert av:** Claude (migrering) 
