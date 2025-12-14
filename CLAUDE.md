# CLAUDE.md - samiske.no

> Sosialt nettverk for samer | LIVE i produksjon | Ekte brukere

## Stack
- **Frontend:** Next.js 15 + TypeScript + Tailwind + Shadcn/ui
- **Backend:** Supabase (Postgres + Auth + Realtime)
- **Hosting:** Vercel (samiske.no)
- **Search:** Custom 8-category search with caching (se agent_docs/search.md)

## Kommandoer
```bash
npm run dev      # Start lokal server
npm run build    # Bygg for produksjon (KJØR ALLTID FØR PUSH)
npm run lint     # ESLint
```

## Kritiske regler

### SIKKERHET (UFRAVIKELIG)
- ALDRI commit secrets (søk: `sk_`, `key`, `password`, `secret`)
- ALDRI bruk Service Role Key i frontend
- ALLE tabeller MÅ ha RLS policies
- ALLTID valider brukerinput (se `agent_docs/security.md`)

### KODESTANDARD
- Norsk i UI, engelsk i kode
- Feilhåndtering på ALLE Supabase-queries med toast
- Komponenter maks 300 linjer - splitt ved behov
- UNNGÅ `any` - bruk spesifikke typer

## Mappestruktur
```
src/app/           # Sider og API-ruter
src/components/    # React-komponenter
src/lib/           # Hjelpefunksjoner
supabase/          # Schema og migrasjoner
agent_docs/        # Detaljert dokumentasjon for AI
```

## Før du koder
1. Les relevante filer i `agent_docs/` for kontekst
2. Ved sikkerhetsendringer: Les `agent_docs/security.md`
3. Ved database-endringer: Les `agent_docs/database.md`
4. Ved søkefunksjonalitet: Les `agent_docs/search.md`

## Slash-kommandoer
- `/analyze [category]` - Systematisk kodeanalyse (code/security/ux/content/all)
- `/security-review` - Full sikkerhetsgjennomgang
- `/pre-deploy` - Sjekkliste før push til produksjon
- `/code-quality` - Kodekvalitetsanalyse
- `/gdpr` - GDPR-relatert arbeid

## Ved usikkerhet
Spør brukeren. Prosjekteier er ikke-koder - forklar enkelt.
