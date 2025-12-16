# Deep Security Audit

Du skal utfore en OMFATTENDE sikkerhetsrevisjon av samiske.no-applikasjonen.

## Instruksjoner

Les forst agent-instruksjonene i:
- `.claude/agents/deep-security-audit/index.md`

Les deretter alle regelfilene:
- `.claude/agents/deep-security-audit/rules/01-access-control.md`
- `.claude/agents/deep-security-audit/rules/02-injection.md`
- `.claude/agents/deep-security-audit/rules/03-authentication.md`
- `.claude/agents/deep-security-audit/rules/04-data-exposure.md`
- `.claude/agents/deep-security-audit/rules/05-api-security.md`

## Analyserekkefølge

### Fase 1: Kontekst (5 min)
1. Les `CLAUDE.md` for prosjektoversikt
2. Les `agent_docs/security.md` for eksisterende retningslinjer
3. Les `agent_docs/database.md` for skjema-oversikt

### Fase 2: Database-sikkerhet (15 min)
1. Analyser ALLE migrasjonsfiler i `supabase/migrations/`
2. Kartlegg RLS policies for hver tabell
3. Identifiser tabeller UTEN RLS
4. Finn overly permissive policies (USING true, WITH CHECK true)

### Fase 3: API-sikkerhet (15 min)
1. List alle API-ruter i `src/app/api/`
2. For hver rute, sjekk:
   - Autentisering
   - Autorisasjon
   - Input validering
   - Rate limiting
3. Identifiser IDOR/BOLA-sarbarheter

### Fase 4: Frontend-sikkerhet (10 min)
1. Sok etter `dangerouslySetInnerHTML`
2. Sok etter hardkodede secrets
3. Sjekk for SERVICE_ROLE i frontend-kode
4. Verifiser at sensitiv data ikke logges

### Fase 5: Autentisering (10 min)
1. Analyser auth-flyter
2. Sjekk passord-policy
3. Verifiser session-handtering
4. Se etter brute force-beskyttelse

### Fase 6: Rapport
Generer en fullstendig rapport med:
- Sammendrag med alvorlighetsmatrise
- Detaljerte funn med bevis
- Konkrete losningsforslag
- Prioritert handlingsplan

## Viktig

- Ver GRUNDIG - dette er en produksjonsapp
- ALLE funn ma ha filsti og linjenummer
- Gi KONKRETE kodeeksempler for fixes
- Prioriter etter CVSS-score
- Tenk som en angriper - hva ville DU utnyttet?

## Start na

Begynn med Fase 1 og arbeid deg systematisk gjennom alle fasene.
