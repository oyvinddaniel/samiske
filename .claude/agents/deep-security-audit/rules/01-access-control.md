# Access Control Security Rules

## OWASP A01: Broken Access Control

Access control enforces policy such that users cannot act outside of their intended permissions.

---

## 1. BOLA/IDOR (Broken Object Level Authorization)

### Beskrivelse
Angriper endrer objekt-ID i foresporsler for a fa tilgang til andres data.

### Sarbare monstre

```typescript
// SARBAR - Ingen eiersjekk
app.get('/api/posts/:id', async (req) => {
  const post = await db.posts.findById(req.params.id)
  return post  // Hvem som helst kan se hvilken som helst post
})

// SARBAR - Kun ID-sjekk
const deletePost = async (postId: string) => {
  await supabase.from('posts').delete().eq('id', postId)
  // Mangler: .eq('user_id', auth.uid())
}
```

### Sikre monstre

```typescript
// SIKKERT - Med eiersjekk
app.get('/api/posts/:id', async (req) => {
  const post = await db.posts.findOne({
    id: req.params.id,
    user_id: req.user.id  // Sikrer at kun eier kan se
  })
  if (!post) return 404
  return post
})

// SIKKERT - Via RLS
const deletePost = async (postId: string) => {
  // RLS policy sikrer at kun eier kan slette
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
  // RLS: USING (auth.uid() = user_id)
}
```

### Grep-sok

```bash
grep -rn "params\." src/app/api/
grep -rn "\.eq\('id'" src/
grep -rn "findById\|findOne" src/
```

---

## 2. Privilege Escalation

### Beskrivelse
Bruker far tilgang til hoyre privilegier enn tiltenkt.

### Sarbare monstre

```typescript
// SARBAR - Rolle i request body
app.post('/api/user/update', async (req) => {
  const { role } = req.body  // Angriper kan sende role: 'admin'
  await db.users.update(req.user.id, { role })
})

// SARBAR - Manglende admin-sjekk
app.delete('/api/admin/users/:id', async (req) => {
  // Ingen sjekk om req.user er admin!
  await db.users.delete(req.params.id)
})
```

### Sikre monstre

```typescript
// SIKKERT - Ignorer rolle fra request
app.post('/api/user/update', async (req) => {
  const { name, bio } = req.body  // Kun tillatte felt
  await db.users.update(req.user.id, { name, bio })
  // Rolle kan kun endres av admin via separat endpoint
})

// SIKKERT - Admin-sjekk
app.delete('/api/admin/users/:id', async (req) => {
  if (req.user.role !== 'admin') {
    return new Response('Forbidden', { status: 403 })
  }
  await db.users.delete(req.params.id)
})
```

### Grep-sok

```bash
grep -rn "role.*=.*req\." src/
grep -rn "isAdmin\|role.*admin" src/
grep -rn "/admin/" src/app/api/
```

---

## 3. RLS Policy Gaps

### Beskrivelse
Row Level Security policies som er for permissive eller mangler.

### Sarbare monstre

```sql
-- SARBAR - For permissiv
CREATE POLICY "allow_all" ON posts
FOR ALL USING (true);  -- Alle kan alt!

-- SARBAR - Manglende DELETE policy
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select" ON posts FOR SELECT USING (true);
CREATE POLICY "insert" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update" ON posts FOR UPDATE USING (auth.uid() = user_id);
-- MANGLER DELETE - betyr ingen kan slette, eller...?

-- SARBAR - Feil logikk
CREATE POLICY "users_own_data" ON profiles
FOR UPDATE USING (id = auth.uid());  -- OK
WITH CHECK (true);  -- FEIL! Kan sette hvilke som helst verdier
```

### Sikre monstre

```sql
-- SIKKERT - Eksplisitte policies
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select" ON posts FOR SELECT
USING (
  is_public = true
  OR auth.uid() = user_id
  OR auth.uid() IN (SELECT follower_id FROM follows WHERE following_id = user_id)
);

CREATE POLICY "posts_insert" ON posts FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND length(content) <= 5000
);

CREATE POLICY "posts_update" ON posts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_delete" ON posts FOR DELETE
USING (auth.uid() = user_id);
```

### SQL-sok

```bash
grep -rn "ENABLE ROW LEVEL" supabase/
grep -rn "CREATE POLICY" supabase/
grep -rn "USING (true)" supabase/
grep -rn "WITH CHECK (true)" supabase/
```

---

## 4. Horizontal Access Control

### Beskrivelse
Brukere pa samme nivahar tilgang til hverandres data.

### Sjekkliste

- [ ] Bruker A kan IKKE se bruker B sine private innlegg
- [ ] Bruker A kan IKKE se bruker B sine meldinger
- [ ] Bruker A kan IKKE endre bruker B sin profil
- [ ] Bruker A kan IKKE slette bruker B sine innlegg
- [ ] Bruker A kan IKKE se bruker B sine varsler

### Test-scenarioer

```typescript
// Test 1: Direkte ID-manipulasjon
const response = await fetch('/api/posts/other-users-post-id', {
  headers: { Authorization: `Bearer ${myToken}` }
})
// Skal returnere 403 eller 404

// Test 2: Bulk data leakage
const response = await fetch('/api/users', {
  headers: { Authorization: `Bearer ${myToken}` }
})
// Skal IKKE returnere alle brukere med sensitiv info
```

---

## 5. Vertical Access Control

### Beskrivelse
Vanlige brukere kan fa tilgang til admin-funksjoner.

### Sjekkliste

- [ ] Admin-dashboard er beskyttet
- [ ] Admin-APIer krever admin-rolle
- [ ] Moderator-funksjoner krever moderator-rolle
- [ ] Sensitive operasjoner logger hvem som gjor hva

### Grep-sok

```bash
grep -rn "admin" src/app/
grep -rn "moderator" src/
grep -rn "role\s*=\s*" src/
```

---

## 6. API Endpoint Security

### Alle API-ruter skal ha:

```typescript
export async function POST(request: Request) {
  // 1. Autentisering
  const session = await getSession()
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  // 2. Autorisasjon
  const resource = await getResource(resourceId)
  if (resource.user_id !== session.user.id) {
    return new Response('Forbidden', { status: 403 })
  }

  // 3. Input validering
  const body = await request.json()
  const validated = schema.safeParse(body)
  if (!validated.success) {
    return new Response('Bad Request', { status: 400 })
  }

  // 4. Business logic
  // ...
}
```

---

## Prioritering

| Problem | Alvorlighet | CVSS |
|---------|-------------|------|
| Manglende RLS | KRITISK | 9.8 |
| IDOR i API | KRITISK | 8.6 |
| Privilege escalation | KRITISK | 8.8 |
| Horizontal access | HOY | 7.5 |
| Manglende admin-sjekk | HOY | 7.1 |
