# Data Exposure Security Rules

## OWASP A02: Cryptographic Failures & Sensitive Data Exposure

Protection of data in transit and at rest from unauthorized access.

---

## 1. Hardcoded Secrets

### Beskrivelse
API-nokler, passord eller tokens direkte i kildekoden.

### Sarbare monstre

```typescript
// SARBAR - Hardkodede nokler
const STRIPE_KEY = 'sk_live_51234567890abcdef'
const DB_PASSWORD = 'supersecret123'
const JWT_SECRET = 'my-secret-key'

// SARBAR - I konfigurasjonsfiler
// config.ts
export const config = {
  supabase: {
    serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
}
```

### Sikre monstre

```typescript
// SIKKERT - Miljovariabler
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY
const DB_PASSWORD = process.env.DATABASE_PASSWORD

// Valider at de finnes
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY must be set')
}

// .env.local (ALDRI commit!)
STRIPE_SECRET_KEY=sk_live_...
DATABASE_PASSWORD=...
```

### Grep-sok

```bash
# API-nokler
grep -rn "sk_live\|sk_test" src/
grep -rn "pk_live\|pk_test" src/
grep -rn "eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*" src/

# Passord og secrets
grep -rn "password\s*=\s*['\"]" src/
grep -rn "secret\s*=\s*['\"]" src/
grep -rn "apiKey\s*=\s*['\"]" src/
grep -rn "api_key\s*=\s*['\"]" src/
grep -rn "token\s*=\s*['\"]" src/

# Supabase spesifikt
grep -rn "service_role" src/
grep -rn "SERVICE_ROLE" src/
grep -rn "supabase.*key" src/
```

---

## 2. Service Role Key Exposure

### Beskrivelse
Supabase service role key tilgjengelig i frontend.

### Sarbare monstre

```typescript
// SARBAR - Service key i frontend
// src/lib/supabase.ts (CLIENT SIDE!)
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // ALDRI!
)

// SARBAR - I NEXT_PUBLIC variabel
// .env.local
NEXT_PUBLIC_SUPABASE_SERVICE_KEY=eyJ...  // Eksponert til klient!
```

### Sikre monstre

```typescript
// SIKKERT - Kun anon key i frontend
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  // OK
)

// SIKKERT - Service key kun i API routes
// src/app/api/admin/route.ts
import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // OK - server-side only
  { auth: { persistSession: false } }
)
```

### Grep-sok

```bash
# Finn SERVICE_ROLE i feil filer
grep -rn "SERVICE_ROLE" src/lib/
grep -rn "SERVICE_ROLE" src/components/
grep -rn "SERVICE_ROLE" src/app/page.tsx
grep -rn "SERVICE_ROLE" src/app/\(.*\)/page.tsx

# Sjekk at den KUN er i api/
grep -rln "SERVICE_ROLE" src/ | grep -v "api/"
```

---

## 3. Sensitive Data in Logs

### Beskrivelse
Logging av passord, tokens eller personlig info.

### Sarbare monstre

```typescript
// SARBAR - Logger alt
console.log('User login:', { email, password })
console.log('Auth response:', authData)  // Inneholder token
console.log('User data:', user)  // Inneholder e-post, etc.

// SARBAR - Error logging med data
try {
  await login(credentials)
} catch (error) {
  console.error('Login failed:', credentials)  // Logger passord!
}
```

### Sikre monstre

```typescript
// SIKKERT - Logger kun ikke-sensitiv info
console.log('User login attempt:', { userId: user.id })
console.log('Auth response received')  // Ingen detaljer
console.log('User loaded:', { id: user.id, role: user.role })

// SIKKERT - Filtrert error logging
try {
  await login(credentials)
} catch (error) {
  console.error('Login failed for user:', credentials.email)
  // Aldri logg passord eller tokens
}

// SIKKERT - Sanitized logging
const sanitize = (obj: any) => {
  const sensitive = ['password', 'token', 'secret', 'key', 'email']
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) =>
      sensitive.some(s => k.toLowerCase().includes(s))
        ? [k, '[REDACTED]']
        : [k, v]
    )
  )
}

console.log('Request:', sanitize(requestBody))
```

### Grep-sok

```bash
grep -rn "console.log.*password" src/
grep -rn "console.log.*token" src/
grep -rn "console.log.*email" src/
grep -rn "console.log.*user" src/
grep -rn "console.error.*credential" src/
```

---

## 4. Sensitive Data in URLs

### Beskrivelse
Tokens, passord eller sensitiv info i URL-parametere.

### Sarbare monstre

```typescript
// SARBAR - Token i URL
const shareUrl = `${baseUrl}/share?token=${authToken}`
window.location = `/reset-password?token=${resetToken}`

// SARBAR - Sensitiv data i query params
<Link href={`/user?email=${user.email}&phone=${user.phone}`}>
```

### Sikre monstre

```typescript
// SIKKERT - Token i POST body
const shareContent = async () => {
  await fetch('/api/share', {
    method: 'POST',
    body: JSON.stringify({ token: authToken })
  })
}

// SIKKERT - Kun ID i URL
<Link href={`/user/${user.id}`}>

// Reset-token er OK i URL (engangsbruk, kort levetid)
// Men bor redirectes umiddelbart til POST-form
```

---

## 5. PII (Personally Identifiable Information)

### Beskrivelse
Feil handtering av personlig informasjon.

### Sjekkliste

- [ ] E-poster kryptert i database (eller hashes for oppslag)
- [ ] Telefonnumre beskyttet
- [ ] Adresser ikke eksponert i API
- [ ] Fodselsdatoer beskyttet
- [ ] IP-adresser ikke logget permanent
- [ ] Lokasjon kun tilgjengelig for eier

### GDPR-krav

```typescript
// Eksporter brukerdata
const exportUserData = async (userId: string) => {
  const [profile, posts, comments, likes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('posts').select('*').eq('user_id', userId),
    supabase.from('comments').select('*').eq('user_id', userId),
    supabase.from('likes').select('*').eq('user_id', userId)
  ])

  return {
    profile: profile.data,
    posts: posts.data,
    comments: comments.data,
    likes: likes.data,
    exportedAt: new Date().toISOString()
  }
}

// Slett brukerdata
const deleteUserData = async (userId: string) => {
  // Soft delete eller hard delete avhengig av policy
  await supabase.from('profiles').update({
    deleted_at: new Date().toISOString(),
    email: '[deleted]',
    full_name: '[deleted]',
    avatar_url: null
  }).eq('id', userId)

  // Eller hard delete
  await supabase.from('profiles').delete().eq('id', userId)
}
```

---

## 6. API Response Data Leakage

### Beskrivelse
APIer returnerer mer data enn nodvendig.

### Sarbare monstre

```typescript
// SARBAR - Returnerer alt
app.get('/api/users/:id', async (req) => {
  const user = await db.users.findById(req.params.id)
  return user  // Inkluderer password_hash, email, etc.
})

// SARBAR - Supabase select *
const { data } = await supabase
  .from('profiles')
  .select('*')  // Returnerer alt!
```

### Sikre monstre

```typescript
// SIKKERT - Eksplisitte felt
app.get('/api/users/:id', async (req) => {
  const user = await db.users.findById(req.params.id, {
    select: ['id', 'username', 'avatar_url', 'bio']
  })
  return user
})

// SIKKERT - Velg kun nodvendige felt
const { data } = await supabase
  .from('profiles')
  .select('id, username, avatar_url, bio')

// SIKKERT - Forskjellige views for forskjellige brukere
const getProfile = async (profileId: string, requesterId: string) => {
  const isOwner = profileId === requesterId

  if (isOwner) {
    return supabase.from('profiles')
      .select('id, email, username, avatar_url, bio, created_at')
      .eq('id', profileId)
      .single()
  } else {
    return supabase.from('profiles')
      .select('id, username, avatar_url, bio')
      .eq('id', profileId)
      .single()
  }
}
```

---

## 7. Error Message Information Disclosure

### Beskrivelse
Feilmeldinger avslorer intern info.

### Sarbare monstre

```typescript
// SARBAR - Stack trace til klient
app.use((error, req, res, next) => {
  res.status(500).json({
    error: error.message,
    stack: error.stack,  // Avslorer kodestruktur!
    query: req.query     // Avslorer input
  })
})

// SARBAR - Database-feil til klient
const createUser = async (data) => {
  try {
    await db.users.insert(data)
  } catch (error) {
    throw error  // "duplicate key value violates unique constraint..."
  }
}
```

### Sikre monstre

```typescript
// SIKKERT - Generiske feilmeldinger
app.use((error, req, res, next) => {
  // Logg full feil server-side
  console.error('Error:', error)

  // Send generisk melding til klient
  res.status(500).json({
    error: 'En feil oppstod. Prov igjen senere.',
    requestId: req.id  // For support-henvendelser
  })
})

// SIKKERT - Oversett database-feil
const createUser = async (data) => {
  try {
    await db.users.insert(data)
  } catch (error) {
    if (error.code === '23505') {  // Unique violation
      throw new Error('En bruker med denne e-posten finnes allerede')
    }
    throw new Error('Kunne ikke opprette bruker')
  }
}
```

---

## 8. File Upload Security

### Beskrivelse
Usikker filopplasting kan eksponere data.

### Sjekkliste

- [ ] Kun tillatte filtyper (whitelist)
- [ ] Maksimal filstorrelse
- [ ] Filnavn saniteres
- [ ] Filer lagres utenfor webroot
- [ ] Ingen executable filer tillatt
- [ ] Storage bucket har riktige policies

### Sikker implementasjon

```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024  // 5MB

const uploadImage = async (file: File, userId: string) => {
  // Valider type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Kun JPG, PNG og WebP er tillatt')
  }

  // Valider storrelse
  if (file.size > MAX_SIZE) {
    throw new Error('Maksimal filstorrelse er 5MB')
  }

  // Generer sikker filsti
  const ext = file.type.split('/')[1]
  const filename = `${userId}/${crypto.randomUUID()}.${ext}`

  // Last opp
  const { error } = await supabase.storage
    .from('avatars')
    .upload(filename, file, {
      contentType: file.type,
      upsert: false  // Ikke overskriv
    })

  if (error) throw error
  return filename
}
```

---

## Sikkerhetsjekkliste

- [ ] Ingen hardkodede secrets i kode
- [ ] SERVICE_ROLE kun i API routes
- [ ] Ingen sensitiv data i logger
- [ ] Ingen tokens i URLer
- [ ] API returnerer kun nodvendig data
- [ ] Feilmeldinger er generiske
- [ ] Filopplasting er validert
- [ ] HTTPS everywhere
- [ ] .env.local i .gitignore

---

## Prioritering

| Problem | Alvorlighet | CVSS |
|---------|-------------|------|
| Hardkodede secrets | KRITISK | 9.8 |
| SERVICE_ROLE i frontend | KRITISK | 10.0 |
| Passord i logger | HOY | 7.5 |
| API data leakage | HOY | 7.1 |
| Stack traces til klient | MEDIUM | 5.3 |
| PII eksponering | MEDIUM | 6.5 |
