# SECURITY.md - Sikkerhetsveiledning

> Sikkerhetsregler og sjekklister for samiske.no  
> Sist oppdatert: 2025-12-26

---

## Sikkerhetsscore

| Metrikk | Score | Dato |
|---------|-------|------|
| **Nåværende** | 8/10 | 14. des 2025 |

### Score-kriterier

| Score | Beskrivelse |
|-------|-------------|
| 10/10 | Ingen kjente sårbarheter, full test-dekning |
| 8-9/10 | Mindre mangler (a11y, rate limiting på noen ruter) |
| 6-7/10 | Noen RLS-hull eller manglende validering |
| 4-5/10 | Kritiske policies mangler |
| 1-3/10 | Åpne endepunkter, eksponerte secrets |

---

## OWASP Top 10:2025 - Relevante for samiske.no

### A01: Broken Access Control (KRITISK)

**Risiko:** Brukere får tilgang til andres data

**Sjekkliste:**
- [x] Alle RLS policies krever `auth.uid()` for brukerdata
- [x] API-ruter sjekker at bruker eier ressursen
- [x] Ingen direkte objekt-referanser (IDOR)

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

---

### A02: Security Misconfiguration

**Risiko:** Feilkonfigurert Supabase/Next.js

**Sjekkliste:**
- [x] RLS er aktivert på ALLE tabeller
- [x] Service Role Key kun på server-side
- [x] Ingen debug-modus i produksjon
- [x] CORS konfigurert korrekt

---

### A03: Injection

**Risiko:** SQL injection, XSS

**Sjekkliste:**
- [x] Bruk alltid parameteriserte queries (Supabase gjør dette)
- [x] Sanitize brukerinput før visning
- [x] Valider input-typer og lengder

**Input-validering grenser:**

| Felt | Maks tegn |
|------|-----------|
| Tittel | 100 |
| Innhold | 5000 |
| Sted | 200 |
| Brukernavn | 50 |
| Bio | 500 |

---

### A07: Authentication Failures

**Risiko:** Svak autentisering

**Sjekkliste:**
- [x] Supabase Auth håndterer passord-hashing
- [x] Session-tokens har riktig utløpstid
- [x] Passordbekreftelse på destruktive handlinger

---

## Supabase-spesifikke sikkerhetsfeller

### RLS Policy-mønstre

**⚠️ FARLIG - Åpner for alle:**
```sql
CREATE POLICY "allow_all" ON posts FOR ALL USING (true);
```

**✅ TRYGT - Krever autentisering:**
```sql
CREATE POLICY "users_own_posts" ON posts
FOR ALL USING (auth.uid() = user_id);
```

**✅ TRYGT - Offentlig lesing, privat skriving:**
```sql
CREATE POLICY "public_read" ON posts FOR SELECT USING (is_public = true);
CREATE POLICY "owner_write" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Service Role Key

⚠️ **ALDRI:**
- I frontend-kode
- I miljøvariabler som starter med `NEXT_PUBLIC_`
- I client-side komponenter

✅ **KUN:**
- I API-ruter på server-side
- I Server Components (forsiktig)

**Ved eksponering:** Roter nøkkelen UMIDDELBART i Supabase Dashboard.

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

## GDPR Compliance

### Brukerdata

| Handling | Implementert |
|----------|--------------|
| Data export | ✅ MediaService.exportUserMedia() |
| Data sletting | ✅ Soft delete + anonymisering |
| Samtykke | ⏳ Må verifiseres |

### Media Service GDPR

```typescript
// Ved brukersletting
// - uploaded_by settes til NULL (fjerner eierskap)
// - original_uploader_id BEHOLDES (copyright)
// - deleted_at settes
// - Audit log entry opprettes

await MediaService.deleteUserMedia(userId)
```

### Audit Log

- Retention: 3 år
- Inneholder: Hvem, hva, når, fra hvor
- Automatisk cleanup etter 3 år

---

## Tidligere sikkerhetshendelser

### 14. des 2025 - Privacy Leak
**Problem:** Brukere kunne se andres private data  
**Løsning:** RLS policy oppdatert  
**Status:** ✅ Løst  
**Detaljer:** Se `docs/security/incident-2025-12-14.md`

---

## Rate Limiting

| Endepunkt | Limit | Implementert |
|-----------|-------|--------------|
| `/api/delete-account` | 1/min | ✅ |
| Login | 5/min | ✅ (Supabase) |
| Registrering | 3/time | ✅ (Supabase) |
| Opplasting | 10/min | ⏳ |

---

## Sikkerhetssjekkliste før deploy

- [ ] `npm run build` - Ingen feil
- [ ] Ingen secrets i koden (søk etter API keys)
- [ ] RLS aktivert på nye tabeller
- [ ] Input validering på nye felt
- [ ] Error messages avslører ikke sensitiv info
- [ ] Nye API-ruter har auth-sjekk

---

## Ved sikkerhetshendelse

### 1. STOPP
Ikke panikk. Vurder alvorlighetsgrad.

### 2. VURDER
- Hvor alvorlig er det?
- Er data kompromittert?
- Er det aktiv utnyttelse?

### 3. ISOLER
- Ta ned tjenesten om nødvendig
- Blokker kompromitterte kontoer

### 4. ROTER
- Bytt kompromitterte nøkler
- Ugyldiggjør aktive sessions

### 5. FIKS
- Implementer løsning
- Test grundig

### 6. DOKUMENTER
- Logg hva som skjedde
- Opprett fil i `docs/security/incident-YYYY-MM-DD.md`

### 7. LÆR
- Oppdater sjekklister
- Forbedre rutiner

---

## Kontaktinfo

Ved kritiske sikkerhetsproblemer:
- Varsle prosjekteier umiddelbart
- Dokumenter alt
- Ikke del detaljer offentlig før fikset

---

**Sist oppdatert:** 2025-12-26  
**Oppdatert av:** Claude (migrering)
