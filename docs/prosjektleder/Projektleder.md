# Projektleder: Multi-Agent Orchestration for samiske.no

> **AI Project Manager & Multi-Agent Orchestration System**
> Sist oppdatert: 2026-01-08

---

## 🎯 Hva er dette?

Dette dokumentet beskriver hvordan samiske.no bruker **Multi-Agent Orchestration** med Claude Code for å akselerere utviklingen dramatisk. I stedet for at én AI jobber sekvensielt, spawner vi multiple spesialiserte agenter som jobber parallelt.

## Arkitektur: Tre Konsepter

### 1. **CLAUDE.md** - Persistent Project Instructions
- Lastes automatisk ved start av hver chat-sesjon
- Alltid tilgjengelig kontekst
- Inneholder: Prosjektregler, tech stack, sikkerhetsprinsipper

### 2. **Skills** - Auto-Triggering Workflows
- Markdown-filer i `.claude/commands/`
- Claude oppdager og bruker automatisk basert på kontekst
- Eksempel: `/security-review`, `/pre-deploy`, `/gdpr`

### 3. **Subagents** - Parallelle AI-Instanser
- Hver subagent får **egen 200k token context**
- Kjører **parallelt** (ikke sekvensielt!)
- Returnerer kun destillerte resultater til main agent
- Defineres i `.claude/agents/[navn]/index.md`

---

## 🚀 Hvordan Parallell Orkestrering Fungerer

### Tradisjonell Tilnærming (Sekvensielt)
```
1. Design backend API → 2 timer
2. Implementer backend → 3 timer
3. Design frontend UI → 2 timer
4. Implementer frontend → 3 timer
5. Skriv tests → 2 timer
6. Skriv dokumentasjon → 1 time
────────────────────────────────
Total: 13 timer
```

### Multi-Agent Tilnærming (Parallelt)
```
Main Claude spawner 4 subagents samtidig:

┌─ BACKEND-AGENT ─────────────┐
│ 1. Design API (2t)          │
│ 2. Implementer (3t)         │ } 5 timer
└─────────────────────────────┘

┌─ FRONTEND-AGENT ────────────┐
│ 1. Design UI (2t)           │
│ 2. Implementer (3t)         │ } 5 timer
└─────────────────────────────┘

┌─ QA-AGENT ──────────────────┐
│ Skriv integration tests     │ } 2 timer
└─────────────────────────────┘

┌─ DOCS-AGENT ────────────────┐
│ Skriv README & API docs     │ } 1 time
└─────────────────────────────┘

────────────────────────────────
Total: 5 timer (lengste task)
────────────────────────────────
Speedup: 62% reduksjon i tid!
```

---

## 🏗️ samiske.no Agent-System

### 21 Agenter i 3 Nivåer

#### NIVÅ 1: BASIS-AGENTER (6) - Daglige Verktøy
Brukes i 90% av arbeidet:

| Agent | Formål | Spawnes av |
|-------|--------|------------|
| **PLANLEGGER** | Lager PRD med task breakdown og dependency mapping | Main Claude eller ITERASJONS |
| **BYGGER** | Implementerer kode (5-stage prosess: UI → Funksjon → Tests → Security → Verification) | Main Claude eller ITERASJONS |
| **REVIEWER** | Code review (7-step systematisk prosess) | Main Claude eller ITERASJONS |
| **SIKKERHETS** | Security audit, OWASP Top 10, secrets scanning | Main Claude eller KVALITETSSIKRINGS |
| **DEBUGGER** | Root cause analysis, bug-fixing | Main Claude |
| **DOKUMENTERER** | Oppdaterer docs, AGENTS.md, ADR | Main Claude eller ITERASJONS |

#### NIVÅ 2: PROSESS-AGENTER (7) - Orchestrators
Koordinerer hele faser:

| Agent | Fase | Formål | Når bruke |
|-------|------|--------|-----------|
| **OPPSTART** | 1 | Idé, visjon, risikovurdering | Nye prosjekter |
| **KRAV** | 2 | Kravspesifikasjon, wireframes | Etter oppstart |
| **ARKITEKTUR** | 3 | Teknisk design, trusselmodellering | Tech stack-valg |
| **MVP** | 4 | Bygg prototype sikker koding | Første versjon |
| **ITERASJONS** | 5 | **Fullføre features, polering** | **Post-launch (samiske.no nå!)** |
| **KVALITETSSIKRINGS** | 6 | Testing, sikkerhet, kvalitet | Før større releases |
| **PUBLISERINGS** | 7 | Deploy, monitoring, vedlikehold | Lansering |

#### NIVÅ 3: EKSPERT-AGENTER (8) - Spesialister
Kalles når spesialkompetanse trengs:

| Agent | Ekspertise | Kalles av |
|-------|------------|-----------|
| **WIREFRAME** | UI-skisser, design mockups | KRAV-agent |
| **TRUSSELMODELLERING** | STRIDE-analyse, threat modeling | ARKITEKTUR-agent |
| **OWASP** | OWASP Top 10 security checks | KVALITETSSIKRINGS-agent |
| **HEMMELIGHETSSJEKK** | Secrets scanning, PII detection | SIKKERHETS-agent |
| **GDPR** | GDPR compliance, privacy audit | KVALITETSSIKRINGS-agent |
| **BRUKERTEST** | User testing, feedback | ITERASJONS-agent |
| **TILGJENGELIGHETS** | WCAG compliance, a11y | KVALITETSSIKRINGS-agent |
| **YTELSE** | Performance optimization | ITERASJONS-agent |

---

## 💡 Prosess A-Å Agenter: Hva De Egentlig Er

**De er INSTRUKSJONER** (ikke kode), implementert på 3 måter:

### Måte 1: Prompt-based (Manual)
```
Du: "Aktiver PLANLEGGER-agent. Jeg vil bygge login-funksjon."
Claude: [leser Prosess/Agenter/basis/PLANLEGGER-agent-v2.md og følger instruksjoner]
```
✅ Fungerer nå, ingen setup
❌ Må skrive lang prompt hver gang

### Måte 2: Skills (Enklest)
```
.claude/commands/plan.md → PLANLEGGER-agent
.claude/commands/build.md → BYGGER-agent

Du: /plan "Add login feature"
Claude: [auto-loader skill, lager PRD]
```
✅ Kort kommando (`/plan`)
❌ Kun én agent av gangen

### Måte 3: Subagents (Kraftigst - Implementert nå!)
```
.claude/agents/basis/planlegger/index.md
.claude/agents/basis/bygger/index.md

Du: "Implementer login-feature"
Main Claude:
  1. Spawner PLANLEGGER → PRD
  2. Spawner 3 BYGGER-subagents parallelt:
     ├─ Backend → Auth endpoints
     ├─ Frontend → Login UI
     └─ Testing → Integration tests
  3. Spawner REVIEWER → Code review
```
✅ Parallelt arbeid (dramatisk raskere)
✅ Egen context per agent (200k tokens)
⚠️ Høyere token-bruk (men verdt det!)

---

## 🎬 Real-World Eksempler

### Boris Cherny (Claude Code Creator)
> "5 simultane workstreams - én agent kjører test suite, en annen refaktorerer legacy modul, tredje skriver dokumentasjon"

### Developer Testimonial
> "Så 12 Claude agents rebuilde hele frontend over natten. En refaktorerte komponenter, en annen skrev tester, tredje oppdaterte docs, fjerde optimaliserte ytelse. Resultat: PR med 10,000+ linjer perfekt koordinert kode."

### samiske.no Use Case
```
Feature: "Implementer profil-redigering med bildeopplasting"

ITERASJONS-agent spawner:
├─ PLANLEGGER → PRD (15 min)
├─ BYGGER spawner parallelt:
│  ├─ Backend → API endpoints + MediaService integration (2t)
│  ├─ Frontend → ProfileSettings UI + ImageUpload (2t)
│  └─ Testing → Unit + integration tests (1t)
├─ SIKKERHETS → Security audit (30 min)
└─ REVIEWER → Code review av alt (30 min)

Total: ~2.5 timer (vs 6-8 timer sekvensielt)
```

---

## 🔧 Implementering i samiske.no

### Mappestruktur
```
.claude/
├── agents/
│   ├── basis/              # 6 daglige agenter
│   │   ├── planlegger/index.md
│   │   ├── bygger/index.md
│   │   ├── reviewer/index.md
│   │   ├── sikkerhets/index.md
│   │   ├── debugger/index.md
│   │   └── dokumenterer/index.md
│   ├── prosess/            # 7 fase-orchestrators
│   │   ├── oppstart/index.md
│   │   ├── krav/index.md
│   │   ├── arkitektur/index.md
│   │   ├── mvp/index.md
│   │   ├── iterasjons/index.md      ← KEY ORCHESTRATOR
│   │   ├── kvalitetssikrings/index.md
│   │   └── publiserings/index.md
│   └── ekspert/            # 8 spesialister
│       ├── wireframe/index.md
│       ├── trusselmodellering/index.md
│       ├── owasp/index.md
│       ├── hemmelighetssjekk/index.md
│       ├── gdpr/index.md
│       ├── brukertest/index.md
│       ├── tilgjengelighet/index.md
│       └── ytelse/index.md
└── mcp-servers/
    └── supabase/           # MCP-tilkobling for DB access
        └── config.json
```

### Subagent Format
```markdown
# [AGENT-NAVN] v[VERSION]

**[Tagline]**

## Configuration
- Type: Subagent
- Purpose: [Hva agenten gjør]
- Context: Dedicated 200k tokens
- Tools: [Hvilke tools agenten har tilgang til]
- Skills: [Hvilke skills agenten kan kalle]

## Role
[Persona/rolle beskrivelse]

## Process
[Steg-for-steg prosess fra Prosess A-Å docs]

## Output
[Hva agenten leverer]

## Guardrails
NEVER: [Hva agenten aldri skal gjøre]
ALWAYS: [Hva agenten alltid skal gjøre]
```

---

## 🔗 MCP-Tilkobling til Supabase

### Hvorfor MCP?
**Model Context Protocol (MCP)** standardiserer kommunikasjon mellom Claude og eksterne systemer.

**For samiske.no gir dette:**
- Claude kan kjøre SQL-queries direkte mot Supabase
- Lese database schema automatisk
- Kjøre migrasjoner
- Generere testdata
- Inspisere RLS policies

### Konfigurasjon
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
      }
    }
  }
}
```

**VIKTIG SIKKERHET:**
- Service Role Key brukes KUN av MCP server (server-side)
- Aldri commit secrets til git
- Kun for development/admin-operasjoner
- RLS policies fortsatt aktive for app

---

## 📊 Bruksscenarier for samiske.no

### Scenario 1: Ny Feature (Medium)
```
Oppgave: "Legg til hashtag-søk"

Workflow:
1. Du → "Implementer hashtag-søk feature"
2. Main Claude spawner ITERASJONS-agent
3. ITERASJONS orchestrerer:
   - PLANLEGGER → PRD
   - BYGGER (parallelt):
     * Backend → hashtags table + search API
     * Frontend → search UI + results
     * Testing → integration tests
   - SIKKERHETS → SQL injection check
   - REVIEWER → code review
4. Output → PR klar for merge

Tid: 2-3 timer (vs 6-8 timer sekvensielt)
```

### Scenario 2: Bug Fix
```
Oppgave: "Feed viser ikke nye innlegg etter refresh"

Workflow:
1. Du → "Debug: Feed ikke oppdaterer"
2. Main Claude spawner DEBUGGER-agent
3. DEBUGGER:
   - Root cause analysis
   - Identifiserer cache-invalidation issue
   - Foreslår fix
4. BYGGER implementerer fix
5. REVIEWER godkjenner

Tid: 30-60 min
```

### Scenario 3: Pre-Deploy Check
```
Oppgave: "Sjekk at alt er klart for release"

Workflow:
1. Du → "Kjør pre-deploy checks"
2. Main Claude spawner KVALITETSSIKRINGS-agent
3. KVALITETSSIKRINGS spawner parallelt:
   - OWASP-ekspert → Security scan
   - HEMMELIGHETSSJEKK-ekspert → Secrets scan
   - TILGJENGELIGHETS-ekspert → a11y audit
   - GDPR-ekspert → Privacy compliance
4. Output → Rapport med findings

Tid: 15-20 min (vs 2+ timer manuelt)
```

---

## 🎯 Best Practices

### 1. Når Bruke Parallell Orkestrering?

**✅ BRA for:**
- Features med separate backend + frontend components
- Refaktorering av multiple moduler
- Testing på tvers av lag (unit + integration + e2e)
- Dokumentasjon + kode samtidig

**❌ IKKE BRA for:**
- Små fixes (< 50 LOC)
- Eksperimentell kode hvor retning er uklar
- Tasks med ukjente dependencies

### 2. Token Management

**Kostnad per subagent:**
- Én subagent = ~200k tokens = $0.60 (input) + $3.00 (output) = **~$3.60**
- 5 parallelle subagents = **~$18**

**Men:**
- Tid spart = 60-70%
- Færre iterasjoner (bedre kvalitet første gang)
- Mindre context-switching for deg

**Anbefaling:** Parallell orkestrering for features > 2 timer estimat

### 3. Debugging Multi-Agent Issues

**Hvis noe går galt:**

1. **Les agent-logs:** Hver agent logger decisions i comments
2. **Isoler agenten:** Test subagent alene først
3. **Sjekk dependencies:** Verifiser at PLANLEGGER identifiserte alle avhengigheter
4. **Reduser parallellitet:** Kjør sekvensielt for debugging

---

## 🚀 Kom I Gang

### For Nye Features
```
"Implementer [feature]"
→ ITERASJONS-agent orchestrerer alt automatisk
```

### For Bug Fixes
```
"Debug: [problem beskrivelse]"
→ DEBUGGER-agent finner rot-årsak
```

### For Pre-Deploy
```
"Kjør pre-deploy checks"
→ KVALITETSSIKRINGS-agent kjører alle audits
```

---

## 📚 Kilder & Ressurser

- [Claude Code Subagents Documentation](https://code.claude.com/docs/en/sub-agents)
- [Multi-Agent Orchestration Guide](https://zachwills.net/how-to-use-claude-code-subagents-to-parallelize-development/)
- [Claude Flow - Agent Orchestration Platform](https://github.com/ruvnet/claude-flow)
- [Model Context Protocol (MCP)](https://github.com/steipete/claude-code-mcp)
- [Building Agents with Claude SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)

---

**Sist oppdatert:** 2026-01-08
**Implementert av:** Claude Sonnet 4.5
**Status:** 21 subagents aktive + MCP Supabase tilkobling
