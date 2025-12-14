# Kodekvalitetsanalyse

Du skal analysere kodekvaliteten i samiske.no-prosjektet.

## Steg 1: Les arkitektur
Les først `agent_docs/architecture.md` for å forstå strukturen.

## Steg 2: Analyser disse områdene

### 1. Komponentstørrelse
Finn alle `.tsx`-filer og sjekk linjetall:
- Over 300 linjer = BØR splittes
- Over 500 linjer = MÅ splittes

### 2. Feilhåndtering
Søk etter Supabase-queries uten feilhåndtering:
```typescript
// FEIL - mangler error-sjekk
const { data } = await supabase.from('posts').select('*')

// RIKTIG
const { data, error } = await supabase.from('posts').select('*')
if (error) { ... }
```

### 3. N+1 Query-problemer
Se etter løkker som gjør database-kall:
```typescript
// FEIL - N+1
for (const post of posts) {
  const { data } = await supabase.from('profiles').select('*').eq('id', post.user_id)
}
```

### 4. TypeScript-kvalitet
Finn bruk av `any`:
- Er det nødvendig?
- Kan det erstattes med spesifikk type?

### 5. Subscription Cleanup
Sjekk at alle Supabase Realtime-subscriptions har cleanup:
```typescript
// RIKTIG
useEffect(() => {
  const subscription = supabase.channel('x').subscribe()
  return () => subscription.unsubscribe()  // CLEANUP
}, [])
```

### 6. Duplisert kode
Se etter lignende kodeblokker som kan ekstraheres til:
- Utility-funksjoner
- Custom hooks
- Delte komponenter

## Steg 3: Generer rapport

```markdown
# Kodekvalitetsrapport - samiske.no
Dato: [dato]

## Score: X/10

## Sammendrag
- Komponenter sjekket: X
- Store komponenter (>300 linjer): X
- Queries uten feilhåndtering: X
- N+1 problemer: X
- Bruk av `any`: X

## Funn

### Komponentstørrelse
| Fil | Linjer | Status |
|-----|--------|--------|
| ... | ... | ... |

### Manglende feilhåndtering
- [fil:linje] - beskrivelse

### N+1 Queries
- [fil:linje] - beskrivelse

### TypeScript
- [fil:linje] - unødvendig `any`

## Prioriterte forbedringer
1. [høyest prioritet]
2. [nest høyest]
3. ...

## Positive funn
- [ting som er bra]
```

## Score-kriterier

| Score | Beskrivelse |
|-------|-------------|
| 10/10 | Perfekt - ingen funn |
| 8-9/10 | Svært bra - mindre forbedringer |
| 6-7/10 | Bra - noen problemer |
| 4-5/10 | Middels - flere problemer |
| 1-3/10 | Dårlig - krever omfattende refaktorering |
