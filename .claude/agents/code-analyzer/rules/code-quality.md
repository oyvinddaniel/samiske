# Kodekvalitetsregler for samiske.no

Dette dokumentet definerer kodekvalitetsstandarder og vanlige problemer å se etter.

## 1. TypeScript Best Practices

### ❌ Unngå `any`
```typescript
// DÅRLIG
function processData(data: any) {
  return data.value
}

// BRA
interface DataType {
  value: string
}
function processData(data: DataType) {
  return data.value
}
```

**Søk etter:**
- `: any` i function parameters
- `: any[]` i arrays
- `as any` type assertions

**Grep kommando:**
```bash
grep -r ": any" src/
grep -r "as any" src/
```

---

## 2. Komponentstørrelse

### ❌ For store komponenter (>300 linjer)
Komponenter over 300 linjer blir vanskelige å vedlikeholde og teste.

**Søk etter:**
- Filer i `src/components/` med >300 linjer
- Komponenter med multiple responsibilities

**Løsning:**
- Splitt i mindre sub-komponenter
- Ekstraher util functions
- Bruk composition patterns

---

## 3. Error Handling

### ❌ Manglende feilhåndtering på Supabase queries

```typescript
// DÅRLIG
const { data } = await supabase
  .from('posts')
  .select('*')

// BRA
const { data, error } = await supabase
  .from('posts')
  .select('*')

if (error) {
  console.error('Database error:', error)
  toast.error('Kunne ikke laste innlegg')
  return
}
```

**Søk etter:**
- `supabase.from(` uten `error` destructuring
- Async operations uten try/catch
- Database calls uten user feedback på feil

**Grep kommandoer:**
```bash
# Finn Supabase queries
grep -r "supabase.from" src/

# Sjekk om de har error handling
grep -A 5 "supabase.from" src/ | grep "error"
```

---

## 4. N+1 Query Problemer

### ❌ Multiple database calls i loops

```typescript
// DÅRLIG - N+1 problem
const posts = await supabase.from('posts').select('*')
for (const post of posts.data) {
  const author = await supabase
    .from('profiles')
    .select('*')
    .eq('id', post.user_id)
}

// BRA - Batch fetch
const posts = await supabase
  .from('posts')
  .select(`
    *,
    profiles:user_id (*)
  `)
```

**Søk etter:**
- `await` inne i loops
- Multiple separate queries som kan joinses
- `.map()` med async calls

---

## 5. Memory Leaks

### ❌ Manglende cleanup i useEffect

```typescript
// DÅRLIG
useEffect(() => {
  const subscription = supabase
    .channel('posts')
    .on('INSERT', handleInsert)
    .subscribe()
}, [])

// BRA
useEffect(() => {
  const subscription = supabase
    .channel('posts')
    .on('INSERT', handleInsert)
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}, [])
```

**Søk etter:**
- `useEffect` med subscriptions uten return cleanup
- Event listeners uten removeEventListener
- Timers (setTimeout/setInterval) uten cleanup

**Grep kommandoer:**
```bash
grep -A 10 "useEffect" src/ | grep -L "return"
grep -r ".subscribe()" src/
grep -r "addEventListener" src/
```

---

## 6. Duplisert Kode

### ❌ Repetitiv logikk

```typescript
// DÅRLIG
const formatDate1 = (date) => new Date(date).toLocaleDateString()
const formatDate2 = (date) => new Date(date).toLocaleDateString()

// BRA - En utility function
// src/lib/utils.ts
export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('no-NO')
```

**Søk etter:**
- Identiske eller nesten identiske funksjoner
- Repeterte formatting patterns
- Kopiert validation logic

---

## 7. Komplekse Funksjoner

### ❌ Funksjoner over 50 linjer

**Søk etter:**
- Funksjoner med >50 linjer
- Funksjoner med >5 parameters
- Dyp nesting (>3 nivåer)

**Løsning:**
- Splitt i mindre funksjoner
- Bruk early returns
- Ekstraher helper functions

---

## 8. React Best Practices

### ❌ Unødvendige re-renders

```typescript
// DÅRLIG - Ny funksjon hver render
<Button onClick={() => handleClick(id)} />

// BRA - Memoized callback
const handleButtonClick = useCallback(() => {
  handleClick(id)
}, [id])

<Button onClick={handleButtonClick} />
```

### ❌ Manglende dependency arrays

```typescript
// DÅRLIG
useEffect(() => {
  fetchData(userId)
}, []) // userId should be in deps

// BRA
useEffect(() => {
  fetchData(userId)
}, [userId])
```

**Søk etter:**
- `useEffect` med manglende dependencies
- Inline functions i JSX som kan memoizes
- Unødvendig state (kan beregnes)

---

## 9. Import Organization

### ❌ Uorganiserte imports

```typescript
// DÅRLIG
import { Button } from './Button'
import React from 'react'
import { supabase } from '@/lib/supabase'
import './styles.css'

// BRA
// External libraries
import React from 'react'

// Internal utilities
import { supabase } from '@/lib/supabase'

// Components
import { Button } from './Button'

// Styles
import './styles.css'
```

---

## 10. Console Logs

### ❌ console.log i produksjon

```typescript
// DÅRLIG
console.log('User data:', user)

// BRA (kun i development)
if (process.env.NODE_ENV === 'development') {
  console.log('User data:', user)
}
```

**Grep kommando:**
```bash
grep -r "console.log" src/
grep -r "console.error" src/
```

---

## Sjekkliste for Kodegjennomgang

Når du analyserer kode, sjekk:

- [ ] TypeScript typer er spesifikke (ikke `any`)
- [ ] Komponenter under 300 linjer
- [ ] All error handling er på plass
- [ ] Ingen N+1 queries
- [ ] useEffect har cleanup functions
- [ ] Ingen duplisert kode
- [ ] Funksjoner under 50 linjer
- [ ] Dependencies i useEffect er korrekte
- [ ] Imports er organiserte
- [ ] Ingen console.logs i produksjon

---

## Prioritering

**🔴 KRITISK:**
- Manglende error handling (kan krasje app)
- Memory leaks (performance degradation)
- N+1 queries (database overload)

**🟡 ADVARSEL:**
- Komponenter >300 linjer (maintainability)
- Komplekse funksjoner (readability)
- Manglende types (type safety)

**🟢 FORSLAG:**
- Duplisert kode (DRY principle)
- Console logs (clean code)
- Import organization (code style)
