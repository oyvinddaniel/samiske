# Database-veiledning for samiske.no

## Tabelloversikt

### Kjernetabeller
| Tabell | Beskrivelse | RLS |
|--------|-------------|-----|
| `profiles` | Brukerprofiler | Ja |
| `posts` | Innlegg og arrangementer | Ja |
| `comments` | Kommentarer på innlegg | Ja |
| `likes` | Likes på innlegg | Ja |
| `comment_likes` | Likes på kommentarer | Ja |

### Sosiale funksjoner
| Tabell | Beskrivelse | RLS |
|--------|-------------|-----|
| `friendships` | Venneforespørsler | Ja |
| `messages` | Direktemeldinger | Ja |
| `conversations` | Samtaler | Ja |
| `conversation_participants` | Samtale-deltakere | Ja |

### System
| Tabell | Beskrivelse | RLS |
|--------|-------------|-----|
| `feedback` | Brukertilbakemeldinger | Ja |
| `email_queue` | E-postkø | Ja |
| `email_subscribers` | E-postabonnenter | Ja |
| `bookmarks` | Bokmerker | Ja |

---

## RLS Policy-mønster

### Standard policy for brukereide data
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

---

## Vanlige query-mønstre

### Hent innlegg med relatert data (unngå N+1)
```typescript
const { data } = await supabase
  .from('posts')
  .select(`
    *,
    profiles:user_id (id, full_name, avatar_url),
    comments (count),
    likes (count)
  `)
  .order('created_at', { ascending: false })
  .limit(20)
```

### Batch-fetch brukerdata
```typescript
// FEIL - N+1 queries
for (const post of posts) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', post.user_id)
    .single()
}

// RIKTIG - Én query
const userIds = [...new Set(posts.map(p => p.user_id))]
const { data: profiles } = await supabase
  .from('profiles')
  .select('*')
  .in('id', userIds)
```

---

## Migrasjoner

### Fil-plassering
```
supabase/migrations/
├── 20241211_initial_schema.sql
├── 20241212_add_bookmarks.sql
└── 20241213_*.sql
```

### Navnekonvensjon
`YYYYMMDD_beskrivelse.sql`

### Kjøre migrasjoner
```bash
# Mot produksjon (krever passord)
PGPASSWORD="xxx" psql "postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres" -f migrasjoner.sql
```

---

## Supabase Realtime

### Abonnere på endringer
```typescript
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

// VIKTIG: Cleanup
return () => {
  subscription.unsubscribe()
}
```

---

## Ytelsestips

1. **Indekser** - Legg til på kolonner brukt i WHERE/ORDER BY
2. **Limit** - Alltid begrens resultater
3. **Select** - Hent kun nødvendige kolonner
4. **Joins** - Bruk Supabase sin select-syntaks for relatert data
5. **Count** - Bruk `.select('*', { count: 'exact', head: true })` for telling

---

## Backup og gjenoppretting

Supabase har automatisk backup. Ved behov:
1. Gå til Supabase Dashboard > Database > Backups
2. Last ned ønsket backup
3. Gjenopprett via `psql`
