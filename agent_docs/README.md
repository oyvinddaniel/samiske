# Agent Documentation

Denne mappen inneholder detaljert dokumentasjon som AI-agenten leser ved behov.

## Filer

| Fil | Beskrivelse | Les når |
|-----|-------------|---------|
| `security.md` | Sikkerhetsregler og OWASP | Sikkerhetsarbeid, RLS, API-ruter |
| `database.md` | Database-struktur og queries | Database-endringer, migrations |
| `architecture.md` | Systemarkitektur | Nye features, refaktorering |
| `status.md` | Nåværende prosjektstatus | Oversikt, hva som er gjort |

## Hvordan dette fungerer

1. **CLAUDE.md** (52 linjer) - Kort, alltid i kontekst
2. **agent_docs/** - Detaljert, leses ved behov
3. **Slash-kommandoer** - Spesialiserte oppgaver
4. **Custom agents** - Spesialiserte AI-agenter for analyse
5. **Hooks** - Automatiske sjekker

## Custom Agents

### Code Analyzer Agent

**Plassering:** `.claude/agents/code-analyzer/`

**Formål:** Systematisk analyse av kodebasen for:
- **Kodekvalitet** - TypeScript-bruk, komponentstørrelse, error handling
- **Sikkerhet** - RLS policies, input validation, XSS/SQL injection
- **UX/Tilgjengelighet** - ARIA labels, keyboard nav, kontrast, responsivitet
- **Innleggsstruktur** - Post creation, validering, moderering

**Bruk:** Kjør `/analyze` for å starte agenten

**Output:** Detaljert rapport med:
- Issues kategorisert etter alvorlighet (🔴 KRITISK, 🟡 ADVARSEL, 🟢 FORSLAG)
- File:line referanser
- Kodesnutter som viser problemet
- Konkrete fix-forslag
- Prioriterte handlingsplaner

**Regler:**
- `rules/code-quality.md` - Kodekvalitetsregler
- `rules/security.md` - Sikkerhetsregler
- `rules/ux-patterns.md` - UX-mønstre
- `rules/post-structure.md` - Innleggsstruktur

## Slash-kommandoer

Bruk disse i Claude Code:

- `/analyze [category]` - **NY!** Kjør code-analyzer agent for systematisk kodeanalyse
  - `/analyze` - Full analyse (code + security + UX + content)
  - `/analyze code` - Kun kodekvalitet
  - `/analyze security` - Kun sikkerhet
  - `/analyze ux` - Kun UX/tilgjengelighet
  - `/analyze content` - Kun innleggsstruktur
- `/security-review` - Full sikkerhetsgjennomgang
- `/pre-deploy` - Sjekkliste før push
- `/code-quality` - Kodekvalitetsanalyse
- `/gdpr` - GDPR-arbeid

## Hooks (automatiske)

Konfigurert i `.claude/settings.json`:

### PreToolUse
- **Secret-scanning før commit** - Blokkerer commit hvis secrets finnes
- **Advarsel ved sikkerhetskritisk kode** - Påminnelse ved API/Supabase-endringer
- **Blokkerer .env-tilgang** - Forhindrer lesing/redigering av .env-filer

### PostToolUse
- **Linting etter redigering** - Kjører ESLint automatisk

### Stop
- **Build-påminnelse** - Minner om å kjøre build før deploy

## Best practices for AI-assistert utvikling

1. **Bruk slash-kommandoer** for spesialiserte oppgaver
2. **Les agent_docs/** ved komplekse endringer
3. **Stol på hooks** for automatiske sjekker
4. **Spør ved usikkerhet** - Bruker er ikke-koder
