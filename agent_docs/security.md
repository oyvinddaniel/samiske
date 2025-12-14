# Sikkerhetsveiledning for samiske.no

## OWASP Top 10:2025 - Relevante for dette prosjektet

### A01: Broken Access Control (KRITISK)
**Risiko:** Brukere får tilgang til andres data
**Sjekkliste:**
- [ ] Alle RLS policies krever `auth.uid()` for brukerdata
- [ ] API-ruter sjekker at bruker eier ressursen
- [ ] Ingen direkte objekt-referanser (IDOR)

**Eksempel - FEIL:**
```typescript
// Enhver kan slette hvem som helst!
await supabase.from('posts').delete().eq('id', postId)
```

**Eksempel - RIKTIG:**
```typescript
// Kun egen bruker kan slette
await supabase.from('posts').delete().eq('id', postId).eq('user_id', userId)
```

### A02: Security Misconfiguration
**Risiko:** Feilkonfigurert Supabase/Next.js
**Sjekkliste:**
- [ ] RLS er aktivert på ALLE tabeller
- [ ] Service Role Key kun på server-side
- [ ] Ingen debug-modus i produksjon
- [ ] CORS konfigurert korrekt

### A03: Injection
**Risiko:** SQL injection, XSS
**Sjekkliste:**
- [ ] Bruk alltid parameteriserte queries (Supabase gjør dette automatisk)
- [ ] Sanitize brukerinput før visning
- [ ] Valider input-typer og lengder

**Input-validering - Gjeldende grenser:**
- Tittel: maks 100 tegn
- Innhold: maks 5000 tegn
- Sted: maks 200 tegn
- Brukernavn: maks 50 tegn

### A07: Authentication Failures
**Risiko:** Svak autentisering
**Sjekkliste:**
- [ ] Supabase Auth håndterer passord-hashing
- [ ] Session-tokens har riktig utløpstid
- [ ] Passordbekreftelse på destruktive handlinger

---

## Supabase-spesifikke sikkerhetsfeller

### RLS Policy-mønstre

**FARLIG - Åpner for alle:**
```sql
CREATE POLICY "allow_all" ON posts FOR ALL USING (true);
```

**TRYGT - Krever autentisering:**
```sql
CREATE POLICY "users_own_posts" ON posts
FOR ALL USING (auth.uid() = user_id);
```

**TRYGT - Offentlig lesing, privat skriving:**
```sql
CREATE POLICY "public_read" ON posts FOR SELECT USING (is_public = true);
CREATE POLICY "owner_write" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Service Role Key
- ALDRI i frontend-kode
- ALDRI i miljøvariabler som starter med `NEXT_PUBLIC_`
- KUN i API-ruter på server-side
- Roter nøkkelen hvis eksponert

---

## Next.js 15 sikkerhetshensyn

### CVE-2025-29927 (Mars 2025)
**Problem:** Middleware-bypass via header
**Status:** Fikset i 15.2.3+
**Handling:** Hold Next.js oppdatert

### Server Components
- Ikke eksponer secrets i Server Functions
- Bruk environment variables, ikke hardkodede verdier
- Vær forsiktig med hva som serialiseres til klienten

---

## Filer å sjekke ved sikkerhetsreview

### Høy prioritet
1. `supabase/schema.sql` - RLS policies
2. `supabase/migrations/*.sql` - Nye policies
3. `src/app/api/**/*.ts` - Alle API-ruter
4. `.env.local` - Secrets (ALDRI commit)

### Medium prioritet
5. `src/lib/supabase/*.ts` - Klient-oppsett
6. `src/components/**/*(Form|Input|Editor)*.tsx` - Brukerinput
7. `src/app/**/page.tsx` - Server-side data fetching

---

## Ved sikkerhetshendelse

1. **STOPP** - Ikke panikk
2. **VURDER** - Hvor alvorlig er det?
3. **ISOLER** - Ta ned tjenesten om nødvendig
4. **ROTER** - Bytt kompromitterte nøkler
5. **FIKS** - Løs problemet
6. **DOKUMENTER** - Logg hva som skjedde
7. **LÆR** - Oppdater rutiner

---

## Sikkerhetsscore-kriterier

| Score | Beskrivelse |
|-------|-------------|
| 10/10 | Ingen kjente sårbarheter, full test-dekning |
| 8-9/10 | Mindre mangler (a11y, rate limiting) |
| 6-7/10 | Noen RLS-hull eller manglende validering |
| 4-5/10 | Kritiske policies mangler |
| 1-3/10 | Åpne endepunkter, eksponerte secrets |

**Nåværende score:** 8/10 (per 2025-12-13)
