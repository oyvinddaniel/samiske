# API Security Rules

## API-spesifikke sikkerhetsregler basert pa OWASP API Security Top 10

---

## 1. Rate Limiting

### Beskrivelse
Manglende begrensning pa API-kall muliggjor DoS og brute force.

### Kritiske endepunkter som MА ha rate limiting

| Endepunkt | Limit | Vindu |
|-----------|-------|-------|
| Login | 5 | 15 min |
| Registrering | 3 | 1 time |
| Passord-reset | 3 | 1 time |
| Kontosletting | 3 | 24 timer |
| Post-opprettelse | 30 | 1 time |
| Kommentarer | 60 | 1 time |
| Sok | 100 | 1 time |
| Eksport | 5 | 24 timer |

### Implementasjon

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export const rateLimiters = {
  login: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    prefix: 'ratelimit:login'
  }),
  register: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    prefix: 'ratelimit:register'
  }),
  post: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 h'),
    prefix: 'ratelimit:post'
  })
}

// Bruk i API route
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success, remaining, reset } = await rateLimiters.post.limit(ip)

  if (!success) {
    return new Response('For mange forsok', {
      status: 429,
      headers: {
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
        'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString()
      }
    })
  }

  // Fortsett...
}
```

### Grep-sok

```bash
grep -rn "rateLimit\|Ratelimit" src/
grep -rn "429" src/
grep -rn "Retry-After" src/
ls src/app/api/  # Liste alle API-ruter
```

---

## 2. Input Validation

### Beskrivelse
All brukerinput ma valideres for type, lengde og format.

### Standard validering med Zod

```typescript
import { z } from 'zod'

// Post schema
const postSchema = z.object({
  title: z.string()
    .min(1, 'Tittel er pakrevd')
    .max(100, 'Maks 100 tegn')
    .trim()
    .refine(s => !/<script/i.test(s), 'Ugyldig innhold'),

  content: z.string()
    .min(1, 'Innhold er pakrevd')
    .max(5000, 'Maks 5000 tegn')
    .trim(),

  category: z.enum(['kultur', 'nyheter', 'sport', 'annet']),

  tags: z.array(z.string().max(30))
    .max(10, 'Maks 10 tags')
    .optional(),

  is_public: z.boolean().default(true)
})

// Kommentar schema
const commentSchema = z.object({
  post_id: z.string().uuid('Ugyldig post-ID'),
  content: z.string()
    .min(1, 'Innhold er pakrevd')
    .max(1000, 'Maks 1000 tegn')
    .trim()
})

// Profil schema
const profileSchema = z.object({
  username: z.string()
    .min(3, 'Minst 3 tegn')
    .max(30, 'Maks 30 tegn')
    .regex(/^[a-z0-9_]+$/, 'Kun sma bokstaver, tall og underscore'),

  full_name: z.string()
    .max(100, 'Maks 100 tegn')
    .trim()
    .optional(),

  bio: z.string()
    .max(500, 'Maks 500 tegn')
    .trim()
    .optional(),

  website: z.string()
    .url('Ugyldig URL')
    .optional()
    .or(z.literal(''))
})
```

### I API route

```typescript
export async function POST(request: Request) {
  const body = await request.json()

  const result = postSchema.safeParse(body)
  if (!result.success) {
    return Response.json({
      error: 'Validering feilet',
      details: result.error.flatten()
    }, { status: 400 })
  }

  const validatedData = result.data
  // Fortsett med sikker data...
}
```

### Grep-sok

```bash
grep -rn "z\.object\|z\.string" src/
grep -rn "safeParse\|parse" src/
grep -rn "request\.json()" src/app/api/
```

---

## 3. Authentication on All Endpoints

### Beskrivelse
Alle API-ruter ma verifisere autentisering.

### Standard pattern

```typescript
// src/lib/auth.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function getAuthUser() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

// src/app/api/posts/route.ts
import { getAuthUser } from '@/lib/auth'

export async function POST(request: Request) {
  // 1. Autentisering
  const user = await getAuthUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // 2. Rate limiting
  // ...

  // 3. Input validering
  // ...

  // 4. Autorisasjon (om nodvendig)
  // ...

  // 5. Business logic
  // ...
}
```

### Grep-sok

```bash
# Finn API routes uten auth check
grep -L "getAuthUser\|getSession\|getUser" src/app/api/**/*.ts

# Finn routes som burde ha auth
grep -rln "POST\|PUT\|DELETE\|PATCH" src/app/api/
```

---

## 4. Authorization Checks

### Beskrivelse
Verifiser at brukeren har tilgang til ressursen de opererer pa.

### Pattern

```typescript
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Hent ressursen
  const { data: post, error } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', params.id)
    .single()

  if (error || !post) {
    return new Response('Not Found', { status: 404 })
  }

  // Sjekk eierskap
  if (post.user_id !== user.id) {
    // Sjekk om admin
    const isAdmin = await checkIsAdmin(user.id)
    if (!isAdmin) {
      return new Response('Forbidden', { status: 403 })
    }
  }

  // Slett
  await supabase.from('posts').delete().eq('id', params.id)
  return new Response(null, { status: 204 })
}
```

---

## 5. CORS Configuration

### Beskrivelse
Cross-Origin Resource Sharing ma konfigureres riktig.

### Sarbar konfig

```typescript
// SARBAR - Tillater alt
app.use(cors({ origin: '*' }))

// SARBAR - Reflekterer origin
app.use(cors({
  origin: (origin, callback) => {
    callback(null, origin)  // Tillater alle origins!
  }
}))
```

### Sikker konfig

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://samiske.no'  // Kun produksjonsdomene
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          }
        ]
      }
    ]
  }
}
```

---

## 6. Security Headers

### Beskrivelse
HTTP security headers beskytter mot diverse angrep.

### Nodvendige headers

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
  }
]

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://*.supabase.co;
  font-src 'self';
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  frame-ancestors 'none';
`
```

### Grep-sok

```bash
grep -rn "headers" next.config.
grep -rn "Content-Security-Policy" .
grep -rn "X-Frame-Options" .
```

---

## 7. Mass Assignment Protection

### Beskrivelse
Hindre at brukere setter felt de ikke skal ha tilgang til.

### Sarbar

```typescript
// SARBAR - Tar imot alt fra request
export async function PUT(request: Request) {
  const body = await request.json()
  await supabase.from('users').update(body).eq('id', userId)
  // body kan inneholde { role: 'admin' }!
}
```

### Sikkert

```typescript
// SIKKERT - Whitelist felt
export async function PUT(request: Request) {
  const body = await request.json()

  // Kun tillatte felt
  const allowedFields = ['full_name', 'bio', 'avatar_url']
  const updateData = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowedFields.includes(key))
  )

  await supabase.from('profiles').update(updateData).eq('id', userId)
}

// Eller med Zod
const updateProfileSchema = z.object({
  full_name: z.string().optional(),
  bio: z.string().optional(),
  avatar_url: z.string().url().optional()
}).strict()  // Avvis ekstra felt
```

---

## 8. Pagination and Resource Limits

### Beskrivelse
Begrens mengden data som kan hentes.

### Pattern

```typescript
const MAX_LIMIT = 100
const DEFAULT_LIMIT = 20

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const limit = Math.min(
    parseInt(searchParams.get('limit') || DEFAULT_LIMIT.toString()),
    MAX_LIMIT
  )
  const offset = Math.max(
    parseInt(searchParams.get('offset') || '0'),
    0
  )

  const { data, count } = await supabase
    .from('posts')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false })

  return Response.json({
    data,
    pagination: {
      total: count,
      limit,
      offset,
      hasMore: offset + limit < count
    }
  })
}
```

---

## 9. Error Handling

### Beskrivelse
Feilhandtering skal ikke lekke sensitiv info.

### Pattern

```typescript
export async function POST(request: Request) {
  try {
    // Business logic
    const result = await doSomething()
    return Response.json(result)

  } catch (error) {
    // Logg full feil server-side
    console.error('API Error:', {
      endpoint: request.url,
      error: error.message,
      stack: error.stack
    })

    // Returner generisk feil til klient
    if (error instanceof ValidationError) {
      return Response.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (error instanceof AuthError) {
      return Response.json(
        { error: 'Autentisering feilet' },
        { status: 401 }
      )
    }

    // Generisk feil
    return Response.json(
      { error: 'En feil oppstod. Prov igjen senere.' },
      { status: 500 }
    )
  }
}
```

---

## 10. Request Timeout

### Beskrivelse
Sett timeout pa lange operasjoner.

### Pattern

```typescript
// Vercel-konfig
// vercel.json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 10  // 10 sekunder max
    }
  }
}

// I kode
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 5000)

try {
  const response = await fetch(externalApi, {
    signal: controller.signal
  })
} finally {
  clearTimeout(timeout)
}
```

---

## API Security Checklist

For HVER API-rute, verifiser:

- [ ] Autentisering (401 for uautentiserte)
- [ ] Autorisasjon (403 for uautoriserte)
- [ ] Input validering (400 for ugyldig input)
- [ ] Rate limiting (429 ved overbruk)
- [ ] Pagination/limits
- [ ] Error handling uten lekkasje
- [ ] Logging for audit
- [ ] CORS korrekt konfigurert
- [ ] Security headers

---

## Prioritering

| Problem | Alvorlighet | CVSS |
|---------|-------------|------|
| Ingen autentisering | KRITISK | 9.8 |
| Ingen autorisasjon | KRITISK | 8.6 |
| Mass assignment | HOY | 7.5 |
| Manglende rate limiting | HOY | 7.1 |
| Ingen input validering | HOY | 7.5 |
| Feil CORS | MEDIUM | 5.3 |
| Manglende headers | MEDIUM | 4.3 |
