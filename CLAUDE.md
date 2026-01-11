# CLAUDE.md - samiske.no

> Sosialt nettverk for samer | LIVE i produksjon | Ekte brukere
> Sist oppdatert: 2026-01-08

---

## 🚀 Start her

**Ved ny chat-sesjon, les i denne rekkefølgen:**
1. `docs/PROJECT.md` - Full prosjektoversikt
2. `docs/STATUS.md` - Nåværende tilstand og pågående arbeid
3. **🌟 `docs/prosjektleder/BRUKER-GUIDE.md`** - Slik bruker du AI-agentene (enkelt forklart)
4. Relevant PRD i `docs/prd/` for spesifikke features
5. `docs/process/START-HER.md` - Prosess A-Å for nye features (anbefalt)

---

## Om samiske.no

**Status:** Live i produksjon med aktive brukere
**URL:** https://samiske.no
**Fase:** Post-launch (Vedlikehold & Videreutvikling)

**Pågående arbeid:**

| Prosjekt | Status | Dokumentasjon |
|----------|--------|---------------|
| Media Service | Testing (2/7 manuell) | `docs/prd/media-service.md` |
| SPA-konvertering | Fase 1/6 fullført | `docs/prd/spa-conversion.md` |
| Post-Composer | 75% testet | `docs/STATUS.md` |

---

## Stack

- **Frontend:** Next.js 15 + TypeScript + Tailwind + shadcn/ui
- **Backend:** Supabase (Postgres + Auth + Realtime + Storage)
- **Hosting:** Vercel (samiske.no)
- **Video:** Bunny.net Stream

---

## Kommandoer

```bash
npm run dev      # Start lokal server
npm run build    # Bygg for produksjon (KJØR ALLTID FØR PUSH)
npm run lint     # ESLint
npm run test     # Kjør tester
```

---

## Kritiske regler

### SIKKERHET (UFRAVIKELIG)
- ❌ ALDRI commit secrets (søk: `sk_`, `key`, `password`, `secret`)
- ❌ ALDRI bruk Service Role Key i frontend
- ❌ ALDRI les/rediger `.env`-filer
- ✅ ALLE tabeller MÅ ha RLS policies
- ✅ ALLTID valider brukerinput

**Full sikkerhetsveiledning:** `docs/SECURITY.md`

### KODESTANDARD
- Norsk i UI, engelsk i kode
- Feilhåndtering på ALLE Supabase-queries med toast
- Komponenter maks 300 linjer - splitt ved behov
- UNNGÅ `any` - bruk spesifikke typer
- Lucide icons, ingen emojis i UI

**Full kodeguide:** `docs/CONVENTIONS.md`

---

## Prosess A-Å: Slik bygger vi nye features

samiske.no følger nå **Prosess A-Å** - et komplett system for AI-assistert utvikling.

### Når du skal bygge ny funksjonalitet:

```
1. 🎯 PLANLEGGER-agent → Lager PRD
2. 🔨 BYGGER-agent → Implementerer (3 stages: UI → Funksjon → Sikkerhet)
3. 🔍 REVIEWER-agent → Code review
4. 🛡️ SIKKERHETS-agent → Security audit
5. 📋 DOKUMENTERER-agent → Oppdaterer docs
```

**Quick start:**
```
Aktiver PLANLEGGER-agent.
Jeg vil bygge [beskriv feature].
Lag PRD basert på docs/process/templates/_TEMPLATE-SIMPLE.md
```

**Dokumentasjon:** `docs/process/START-HER.md`

---

## De 6 basis-agentene (90% av arbeidet)

Disse agentene bruker du daglig:

| Agent | Når bruke | Quick prompt |
|-------|-----------|--------------|
| 🎯 **PLANLEGGER** | Før ny feature | `Aktiver PLANLEGGER-agent. Jeg vil bygge [feature].` |
| 🔨 **BYGGER** | Implementere kode | `Aktiver BYGGER-agent. Implementer [PRD-filnavn].` |
| 🔍 **REVIEWER** | Kvalitetssjekk | `Aktiver REVIEWER-agent. Review [fil/branch].` |
| 🛡️ **SIKKERHETS** | Før deploy | `Aktiver SIKKERHETS-agent. Sikkerhetsvurder [feature].` |
| 🐛 **DEBUGGER** | Finne/fikse feil | `Aktiver DEBUGGER-agent. Debug [beskriv problem].` |
| 📋 **DOKUMENTERER** | Oppdatere docs | `Aktiver DOKUMENTERER-agent. Oppdater docs for [endring].` |

**Fullstendig guide:** `docs/process/agenter/QUICK-START-PROMPTS.md`

---

## De 7 prosess-agentene (for nye prosjekter/store features)

Når du starter et større prosjekt eller feature:

| Fase | Agent | Når |
|------|-------|-----|
| **1** | 🌱 **OPPSTART** | Nye prosjekter - problemdefinisjon |
| **2** | 📋 **KRAV** | Definere krav og brukerhistorier |
| **3** | 🏗️ **ARKITEKTUR** | Teknisk design og trusselmodellering |
| **4** | 🚀 **MVP** | Bygge prototype/MVP |
| **5** | 🔄 **ITERASJONS** | Fullføre features og polering |
| **6** | ✅ **KVALITETSSIKRINGS** | Testing før lansering |
| **7** | 🌐 **PUBLISERINGS** | Deploy og overvåking |

**For samiske.no:** Vi er post-launch, så bruker primært Fase 5-agenten (ITERASJONS) for nye features.

---

## Dokumentasjonsstruktur

```
docs/
├── PROJECT.md              ← Les først (prosjektoversikt)
├── STATUS.md               ← Nåværende status
├── BACKLOG.md              ← Alle oppgaver
├── CHEATSHEET.md           ← Hurtigreferanse
├── CONVENTIONS.md          ← Kodestandarder
├── SECURITY.md             ← Sikkerhetsregler
├── SETUP.md                ← Oppsett og deployment
│
├── prosjektleder/          ← Multi-agent orchestration
│   ├── Projektleder.md     ← Teknisk dokumentasjon (fullstendig)
│   ├── AGENTER-KATALOG.md  ← Alle 21 agenter beskrevet
│   └── BRUKER-GUIDE.md     ← Enkel guide for ikke-kodere ⭐
│
├── prd/                    ← Feature-spesifikasjoner (PRDs)
│   ├── _TEMPLATE.md
│   ├── media-service.md
│   └── spa-conversion.md
│
├── process/                ← Prosess A-Å dokumentasjon
│   ├── START-HER.md        ← Quick guide til prosessen
│   ├── faser/              ← 7 fase-dokumenter
│   ├── agenter/            ← Agent-instruksjoner
│   └── templates/          ← PRD-templates
│
└── logs/                   ← Changelog og beslutninger
    ├── CHANGELOG.md
    └── decisions/
```

---

## Slash-kommandoer

| Kommando | Beskrivelse |
|----------|-------------|
| `/analyze` | Full kodeanalyse (kjører code-quality agent) |
| `/security-review` | Sikkerhetsgjennomgang (kjører security-review agent) |
| `/pre-deploy` | Sjekkliste før push (kjører pre-deploy agent) |
| `/deep-security-audit` | Full sikkerhetsanalyse (kjører deep-security-audit agent) |
| `/gdpr` | GDPR-vurdering (kjører gdpr agent) |

---

## Mappestruktur (kode)

```
src/
├── app/           # Next.js App Router
├── components/    # React-komponenter
├── lib/           # Hjelpefunksjoner
└── hooks/         # Custom hooks

supabase/          # Schema og migrasjoner
docs/              # Dokumentasjon
```

---

## Når du skal bygge noe nytt

### Scenario 1: Enkel feature (1-2 dager)
```
1. Aktiver PLANLEGGER-agent → Lag PRD
2. Aktiver BYGGER-agent → Implementer
3. Aktiver REVIEWER-agent → Code review
4. Deploy til staging → Test → Produksjon
```

### Scenario 2: Større feature (1-2 uker)
```
1. Les docs/process/START-HER.md
2. Aktiver ITERASJONS-agent (Fase 5)
3. Agent orchestrerer resten (PLANLEGGER, BYGGER, REVIEWER, etc.)
```

### Scenario 3: Bug-fix
```
Aktiver DEBUGGER-agent.
Jeg har følgende problem: [beskriv bug].
```

---

## Etter betydelige endringer

Oppdater disse filene:
1. `docs/STATUS.md` - Hva som ble gjort
2. `docs/BACKLOG.md` - Oppgavestatus
3. `docs/logs/CHANGELOG.md` - Historikk

---

## Ved usikkerhet

Spør brukeren. Prosjekteier er ikke-koder - forklar enkelt.

---

## Nyttige lenker

### Multi-Agent System
- **🌟 Enkel guide (ikke-kodere):** `docs/prosjektleder/BRUKER-GUIDE.md` ← START HER!
- **Agent-katalog (alle 21 agenter):** `docs/prosjektleder/AGENTER-KATALOG.md`
- **Teknisk dokumentasjon:** `docs/prosjektleder/Projektleder.md`

### Prosess A-Å
- **Full prosess-guide:** `docs/process/START-HER.md`
- **Agent-oversikt:** `docs/process/agenter/AGENTS-OVERSIKT.md`
- **Quick prompts:** `docs/process/agenter/QUICK-START-PROMPTS.md`
- **PRD-templates:** `docs/process/templates/`

### Prosjekt
- **Conventions:** `docs/CONVENTIONS.md`
- **Sikkerhet:** `docs/SECURITY.md`

---

**Sist oppdatert:** 2026-01-08
**Prosess A-Å integrert:** 2026-01-06
**Multi-agent system:** 2026-01-08 (21 subagents implementert)
**Prosjektstatus:** Live i produksjon, aktiv videreutvikling
