# Sikkerhetsgjennomgang

Du skal utføre en GRUNDIG sikkerhetsgjennomgang av samiske.no-prosjektet.

## Steg 1: Les kontekst
Les først `agent_docs/security.md` for å forstå sikkerhetsreglene.

## Steg 2: Sjekk disse filene systematisk

### Kritisk prioritet (OWASP A01: Broken Access Control)
1. **RLS Policies** - `supabase/schema.sql` og `supabase/migrations/*.sql`
   - Har ALLE tabeller RLS aktivert?
   - Krever policies `auth.uid()` der det er nødvendig?
   - Er det noen `WITH CHECK (true)` som ikke burde være der?

2. **API-ruter** - `src/app/api/**/*.ts`
   - Sjekkes autentisering før sensitive operasjoner?
   - Valideres input (type, lengde, format)?
   - Kan brukere få tilgang til andres data?

### Høy prioritet (Secrets og konfigurasjon)
3. **Secrets-søk** - Søk i hele kodebasen etter:
   - `sk_` (Stripe-nøkler)
   - `sb_secret` eller `service_role` (Supabase)
   - `password`, `secret`, `key` (hardkodede verdier)
   - Sjekk at `.env.local` IKKE er committet

4. **Miljøvariabler** - `next.config.ts`
   - Er det noen secrets i `NEXT_PUBLIC_*` variabler?

### Medium prioritet (Input-validering)
5. **Skjemaer** - `src/app/ny/page.tsx`, `src/components/**/*(Form|Input)*.tsx`
   - Valideres alle input-felt?
   - Er det lengdebegrensninger?
   - Escapes brukerinput før visning (XSS)?

## Steg 3: Rapporter funn

For hvert funn, rapporter:
- **Fil:** Hvilken fil
- **Linje:** Omtrentlig linje
- **Alvorlighet:** KRITISK / HØY / MEDIUM / LAV
- **Problem:** Hva er feil
- **Løsning:** Konkret fix

## Steg 4: Gi sikkerhetsscore

Basert på funnene, gi en score fra 1-10:
- 10: Ingen sårbarheter funnet
- 8-9: Mindre mangler (a11y, logging)
- 6-7: Noen RLS-hull eller validering mangler
- 4-5: Kritiske policies mangler
- 1-3: Alvorlige sikkerhetshull

## Output-format

```markdown
# Sikkerhetsrapport - samiske.no
Dato: [dato]

## Sammendrag
- Filer sjekket: X
- Kritiske funn: X
- Høy prioritet: X
- Medium prioritet: X
- Lav prioritet: X

## Sikkerhetsscore: X/10

## Funn

### KRITISK
[liste over kritiske funn]

### HØY
[liste over høy-prioritet funn]

### MEDIUM
[liste over medium-prioritet funn]

## Anbefalinger
[prioritert liste over tiltak]
```
