# Authentication Security Rules

## OWASP A07: Identification and Authentication Failures

Authentication mechanisms can be broken to allow attackers to compromise passwords, keys, or session tokens.

---

## 1. Brute Force Protection

### Beskrivelse
Manglende beskyttelse mot gjentatte innloggingsforsok.

### Sarbare monstre

```typescript
// SARBAR - Ingen rate limiting
app.post('/api/auth/login', async (req) => {
  const { email, password } = req.body
  const user = await authenticate(email, password)
  // Angriper kan prove millioner av passord
})
```

### Sikre monstre

```typescript
// SIKKERT - Med rate limiting
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 forsok per 15 min
  analytics: true
})

app.post('/api/auth/login', async (req) => {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const { success, remaining } = await ratelimit.limit(`login_${ip}`)

  if (!success) {
    return new Response('For mange forsok. Prov igjen senere.', {
      status: 429,
      headers: { 'Retry-After': '900' }
    })
  }

  // Fortsett med autentisering
})
```

### Grep-sok

```bash
grep -rn "rateLimit\|Ratelimit" src/
grep -rn "signInWithPassword" src/
grep -rn "/auth/login\|/api/login" src/
```

---

## 2. Password Policy

### Beskrivelse
Svake passord tillates.

### Sarbare monstre

```typescript
// SARBAR - Ingen passord-validering
const registerUser = async (email: string, password: string) => {
  await supabase.auth.signUp({ email, password })
  // password = "123" er OK?
}
```

### Sikre monstre

```typescript
// SIKKERT - Passord-policy
const passwordSchema = z.string()
  .min(8, 'Minimum 8 tegn')
  .max(128, 'Maksimum 128 tegn')
  .regex(/[A-Z]/, 'Ma ha minst en stor bokstav')
  .regex(/[a-z]/, 'Ma ha minst en liten bokstav')
  .regex(/[0-9]/, 'Ma ha minst ett tall')
  .regex(/[^A-Za-z0-9]/, 'Ma ha minst ett spesialtegn')

const registerUser = async (email: string, password: string) => {
  const result = passwordSchema.safeParse(password)
  if (!result.success) {
    throw new Error(result.error.issues[0].message)
  }

  // Sjekk mot kjente lekket passord (optional)
  const isCompromised = await checkPwnedPasswords(password)
  if (isCompromised) {
    throw new Error('Dette passordet er kjent fra datalekkasjer')
  }

  await supabase.auth.signUp({ email, password })
}
```

---

## 3. Session Management

### Beskrivelse
Usikker handtering av sessions/tokens.

### Sarbare monstre

```typescript
// SARBAR - Token i URL
window.location = `/dashboard?token=${authToken}`

// SARBAR - Ingen session timeout
const session = await getSession()
// Session varer evig?

// SARBAR - Ingen session invalidering
const logout = () => {
  localStorage.removeItem('token')
  // Token er fortsatt gyldig pa server!
}
```

### Sikre monstre

```typescript
// SIKKERT - Token kun i cookies/headers
// Supabase handterer dette automatisk med HttpOnly cookies

// SIKKERT - Session timeout
const SESSION_TIMEOUT = 7 * 24 * 60 * 60 * 1000 // 7 dager
const session = await supabase.auth.getSession()
if (session?.expires_at && session.expires_at < Date.now()) {
  await supabase.auth.signOut()
}

// SIKKERT - Server-side invalidering
const logout = async () => {
  await supabase.auth.signOut({ scope: 'global' }) // Invaliderer alle sessions
}
```

### Grep-sok

```bash
grep -rn "token.*=" src/ | grep -v node_modules
grep -rn "localStorage\|sessionStorage" src/
grep -rn "signOut" src/
```

---

## 4. Account Enumeration

### Beskrivelse
Angriper kan finne ut hvilke e-poster som er registrert.

### Sarbare monstre

```typescript
// SARBAR - Forskjellige feilmeldinger
const login = async (email: string, password: string) => {
  const user = await getUserByEmail(email)
  if (!user) {
    return { error: 'Bruker finnes ikke' }  // Avslorer at e-post ikke eksisterer
  }
  if (!verifyPassword(password, user.password)) {
    return { error: 'Feil passord' }  // Avslorer at e-post eksisterer
  }
}

// SARBAR - Registrering avslorer
const register = async (email: string) => {
  const exists = await checkEmailExists(email)
  if (exists) {
    return { error: 'E-posten er allerede registrert' }
  }
}
```

### Sikre monstre

```typescript
// SIKKERT - Generisk feilmelding
const login = async (email: string, password: string) => {
  const user = await getUserByEmail(email)
  const isValid = user && await verifyPassword(password, user.password)

  if (!isValid) {
    // Konstant-tid respons for a unnga timing attacks
    await sleep(randomInt(100, 300))
    return { error: 'Ugyldig e-post eller passord' }
  }
}

// SIKKERT - Samme respons uansett
const register = async (email: string) => {
  const exists = await checkEmailExists(email)
  if (exists) {
    // Send "verification" email som sier "du er allerede registrert"
    await sendAlreadyRegisteredEmail(email)
  } else {
    await createUser(email)
    await sendVerificationEmail(email)
  }

  // Samme respons til bruker
  return { message: 'Sjekk e-posten din for verifisering' }
}
```

---

## 5. Password Reset

### Beskrivelse
Svakheter i glemt passord-flyten.

### Sarbare monstre

```typescript
// SARBAR - Forutsigbare tokens
const token = `reset_${email}_${Date.now()}`

// SARBAR - Token uten utlop
await db.passwordResets.insert({ email, token })
// Tokens lever evig?

// SARBAR - Token gjenbruk
const resetPassword = async (token: string, newPassword: string) => {
  const reset = await db.passwordResets.findByToken(token)
  await updatePassword(reset.email, newPassword)
  // Token slettes ikke - kan brukes igjen!
}
```

### Sikre monstre

```typescript
// SIKKERT - Kryptografisk sikker token
import crypto from 'crypto'

const token = crypto.randomBytes(32).toString('hex')
const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

// Lagre kun hashen
await db.passwordResets.insert({
  email,
  tokenHash,
  expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 time
})

// Send klartekst-token til bruker
await sendPasswordResetEmail(email, token)

// Ved reset
const resetPassword = async (token: string, newPassword: string) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const reset = await db.passwordResets.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() }
  })

  if (!reset) {
    throw new Error('Ugyldig eller utlopt token')
  }

  await updatePassword(reset.email, newPassword)
  await db.passwordResets.delete({ tokenHash })  // Engangsbruk
  await invalidateAllSessions(reset.email)  // Logg ut alle enheter
}
```

---

## 6. OAuth/Social Login

### Beskrivelse
Svakheter i tredjeparts-autentisering.

### Sjekkliste

- [ ] State parameter brukes (CSRF-beskyttelse)
- [ ] Redirect URI er whitelist-et
- [ ] Token-utveksling skjer server-side
- [ ] Email fra provider verifiseres
- [ ] Account linking er sikkert

### Grep-sok

```bash
grep -rn "signInWithOAuth\|OAuth" src/
grep -rn "redirect_uri\|callback" src/
grep -rn "provider" src/
```

---

## 7. Multi-Factor Authentication

### Beskrivelse
Manglende eller svak MFA.

### Anbefalinger

```typescript
// Supabase MFA
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
  friendlyName: 'Min telefon'
})

// Krev MFA for sensitive operasjoner
const deleteAccount = async () => {
  const session = await supabase.auth.getSession()

  // Sjekk MFA-status
  const { data: factors } = await supabase.auth.mfa.listFactors()
  if (factors.totp.length > 0) {
    // Krev MFA-verifisering
    const assuranceLevel = session.data.session?.aal
    if (assuranceLevel !== 'aal2') {
      throw new Error('MFA-verifisering pakrevd')
    }
  }

  // Fortsett med sletting
}
```

---

## 8. Credential Storage

### Beskrivelse
Usikker lagring av credentials.

### Sarbare monstre

```typescript
// SARBAR - Klartekst passord
await db.users.insert({
  email,
  password  // Lagret som klartekst!
})

// SARBAR - Svak hashing
const hash = md5(password)  // MD5 er knekt
const hash = sha1(password)  // SHA1 er knekt
```

### Sikre monstre

```typescript
// SIKKERT - bcrypt (Supabase bruker dette)
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 12  // Minimum 10
const hash = await bcrypt.hash(password, SALT_ROUNDS)

// Eller Argon2 (enda bedre)
import argon2 from 'argon2'

const hash = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4
})
```

---

## Sikkerhetsjekkliste

- [ ] Rate limiting pa login (5/15min)
- [ ] Rate limiting pa passord-reset (3/time)
- [ ] Passord minimum 8 tegn + kompleksitet
- [ ] Generiske feilmeldinger (ingen enumeration)
- [ ] Sikre reset-tokens (krypto, 1t utlop, engangs)
- [ ] Session timeout (7 dager maks)
- [ ] Logout invaliderer server-side
- [ ] MFA tilgjengelig for brukere
- [ ] Ingen passord i logger
- [ ] HTTPS only

---

## Prioritering

| Problem | Alvorlighet | CVSS |
|---------|-------------|------|
| Ingen rate limiting | HOY | 7.5 |
| Svake passord tillatt | MEDIUM | 5.3 |
| Account enumeration | MEDIUM | 5.3 |
| Ingen session timeout | MEDIUM | 4.8 |
| Manglende MFA | LAV | 3.0 |
