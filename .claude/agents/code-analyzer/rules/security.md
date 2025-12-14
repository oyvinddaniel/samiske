# Sikkerhetsregler for samiske.no

Kritiske sikkerhetsprinsipper basert på OWASP Top 10 og Supabase best practices.

## 1. Row Level Security (RLS)

### ❌ Manglende eller ufullstendige RLS policies

**Alle tabeller MÅ ha RLS aktivert og policies:**

```sql
-- DÅRLIG - Ingen RLS
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  content TEXT
);

-- BRA - RLS aktivert med policies
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  content TEXT,
  user_id UUID REFERENCES profiles(id)
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all posts"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);
```

**Sjekk:**
- Alle tabeller har `ENABLE ROW LEVEL SECURITY`
- SELECT policies for read access
- INSERT/UPDATE/DELETE policies med auth checks
- Ingen policies med bare `USING (true)` på sensitive operations

**Grep kommandoer:**
```bash
grep -r "CREATE TABLE" supabase/migrations/
grep -r "ENABLE ROW LEVEL SECURITY" supabase/migrations/
grep -r "CREATE POLICY" supabase/migrations/
```

---

## 2. Input Validation

### ❌ Manglende eller svak input validering

```typescript
// DÅRLIG - Ingen validering
const createPost = async (title: string, content: string) => {
  await supabase.from('posts').insert({ title, content })
}

// BRA - Validering
const createPost = async (title: string, content: string) => {
  // Length validation
  if (!title || title.length > 100) {
    throw new Error('Tittel må være mellom 1 og 100 tegn')
  }

  if (!content || content.length > 5000) {
    throw new Error('Innhold må være mellom 1 og 5000 tegn')
  }

  // Sanitize
  const cleanTitle = title.trim()
  const cleanContent = content.trim()

  await supabase.from('posts').insert({
    title: cleanTitle,
    content: cleanContent
  })
}
```

**Sjekk for:**
- Length limits (title: 100, content: 5000)
- Required fields validation
- Type validation
- Sanitization (trim, escape)

**Grep kommandoer:**
```bash
grep -r "\.insert(" src/
grep -r "\.update(" src/
grep -r "\.length >" src/  # Look for length checks
```

---

## 3. XSS (Cross-Site Scripting)

### ❌ Farlige HTML-injeksjoner

```typescript
// DÅRLIG - XSS vulnerability
<div dangerouslySetInnerHTML={{ __html: userContent }} />
<div innerHTML={userContent} />

// BRA - Safe rendering
<div>{userContent}</div>  // React auto-escapes

// Eller med sanitizer
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(userContent)
}} />
```

**Søk etter:**
- `dangerouslySetInnerHTML` uten sanitization
- `innerHTML` direkte bruk
- User input i HTML attributes uten escaping

**Grep kommandoer:**
```bash
grep -r "dangerouslySetInnerHTML" src/
grep -r "innerHTML" src/
```

---

## 4. SQL Injection

### ❌ String interpolation i queries

```typescript
// DÅRLIG - SQL injection risk
const userId = getUserInput()
await supabase.from('users').select(`* where id = '${userId}'`)

// BRA - Parameterized queries (Supabase default)
const userId = getUserInput()
await supabase
  .from('users')
  .select('*')
  .eq('id', userId)  // Safe - parameterized
```

**Søk etter:**
- Template literals i `.select()`, `.from()`
- String concatenation i queries
- User input direkte i SQL

**Grep kommandoer:**
```bash
grep -r '\${' src/ | grep -i select
grep -r 'where.*+.*' src/
```

---

## 5. Authentication & Authorization

### ❌ Usikre auth flows

```typescript
// DÅRLIG - Service Role Key i frontend
const supabase = createClient(url, SERVICE_ROLE_KEY)

// BRA - Anon key i frontend
const supabase = createClient(url, ANON_KEY)

// DÅRLIG - Ingen auth check
const deleteAccount = async () => {
  await supabase.auth.admin.deleteUser(userId)
}

// BRA - Auth + password confirmation
const deleteAccount = async (password: string) => {
  // Verify password
  const { error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password
  })

  if (error) throw new Error('Feil passord')

  // Then delete via API route (not direct)
  await fetch('/api/delete-account', { method: 'POST' })
}
```

**Sjekk:**
- Kun ANON key i frontend
- SERVICE_ROLE_KEY kun i API routes
- Password confirmation for critical operations
- Session validation før sensitive actions

**Grep kommandoer:**
```bash
grep -r "SERVICE_ROLE" src/app/  # Should only be in api/
grep -r "admin\." src/  # Admin methods should only be server-side
```

---

## 6. Secrets Management

### ❌ Hardcoded secrets

```typescript
// DÅRLIG
const apiKey = 'sk_live_123456789'
const password = 'mypassword123'

// BRA
const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY  // Server only
```

**Søk etter:**
- `sk_` (Stripe keys)
- `key` eller `password` med hardcoded values
- API tokens i koden
- Private keys

**Grep kommandoer:**
```bash
grep -r "sk_" src/
grep -r "password.*=.*['\"]" src/
grep -r "apiKey.*=.*['\"]" src/
grep -r "secret.*=.*['\"]" src/
```

---

## 7. CSRF Protection

### ❌ Manglende CSRF tokens

For API routes som endrer data:

```typescript
// BRA - Next.js API route med CSRF-like protection
export async function POST(request: Request) {
  // Verify origin
  const origin = request.headers.get('origin')
  if (!origin || !isAllowedOrigin(origin)) {
    return new Response('Forbidden', { status: 403 })
  }

  // Verify auth
  const session = await getSession()
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Process request
  // ...
}
```

**Sjekk:**
- Origin header validation
- Session verification på POST/PUT/DELETE
- Supabase auth checks

---

## 8. Rate Limiting

### ❌ Ingen rate limiting på sensitive endpoints

```typescript
// BRA - Med rate limiting
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  const { success } = await rateLimit(ip, {
    limit: 3,
    window: 3600  // 3 requests per hour
  })

  if (!success) {
    return new Response('Too many requests', { status: 429 })
  }

  // Process request
}
```

**Sjekk rate limits på:**
- `/api/delete-account` (3/hour)
- `/api/export-data` (5/hour)
- Login endpoints
- Post creation (spam prevention)

**Grep kommandoer:**
```bash
grep -r "export.*POST" src/app/api/
grep -r "rateLimit" src/
```

---

## 9. Sensitive Data Exposure

### ❌ Logger sensitiv data

```typescript
// DÅRLIG
console.log('User data:', user)
console.log('Password:', password)

// BRA
console.log('User ID:', user.id)  // Only non-sensitive data
// Never log passwords, tokens, emails
```

**Sensitive data inkluderer:**
- Passord
- Auth tokens
- Email addresses
- Private user data

**Grep kommandoer:**
```bash
grep -r "console.log.*password" src/
grep -r "console.log.*token" src/
grep -r "console.log.*email" src/
```

---

## 10. File Upload Security

### ❌ Usikker filopplasting

```typescript
// BRA - Med validering
const uploadImage = async (file: File) => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Ugyldig filtype')
  }

  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Fil for stor (max 5MB)')
  }

  // Upload to Supabase Storage
  const { data, error } = await supabase
    .storage
    .from('images')
    .upload(`${userId}/${uuid()}.${ext}`, file)
}
```

**Sjekk:**
- File type validation
- File size limits
- Unique filenames (prevent overwrites)
- User-specific paths

---

## Sikkerhetsjekkliste

Når du analyserer kode, verifiser:

- [ ] Alle tabeller har RLS aktivert med korrekte policies
- [ ] Input validation på all brukerinput
- [ ] Ingen `dangerouslySetInnerHTML` uten sanitization
- [ ] Ingen SQL injection risks
- [ ] SERVICE_ROLE_KEY kun i server-side kode
- [ ] Ingen hardcoded secrets
- [ ] CSRF protection på API routes
- [ ] Rate limiting på sensitive endpoints
- [ ] Ingen logging av sensitiv data
- [ ] File upload validation

---

## Prioritering

**🔴 KRITISK:**
- Manglende RLS policies (data exposure)
- Hardcoded secrets (credential leak)
- XSS vulnerabilities (account takeover)
- SQL injection (data breach)
- SERVICE_ROLE_KEY i frontend (full database access)

**🟡 ADVARSEL:**
- Manglende input validation (data corruption)
- Ingen rate limiting (spam/abuse)
- Logging av sensitive data (privacy issue)

**🟢 FORSLAG:**
- Forbedret CSRF protection
- Strengere file upload rules
- Better error messages (uten sensitive info)

---

## Referanser

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Supabase Security Best Practices: https://supabase.com/docs/guides/auth/row-level-security
- GDPR Compliance: Se `agent_docs/security.md`
