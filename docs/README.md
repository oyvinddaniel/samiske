# Dokumentasjon - samiske.no

> Strukturert dokumentasjonssystem for AI-assistert utvikling med Prosess A-Å
> Sist oppdatert: 2026-01-06

---

## 🚀 Start her

**For ny chat-sesjon:**
1. Les `PROJECT.md` først (full kontekst)
2. Les `STATUS.md` for nåværende tilstand
3. Les `process/START-HER.md` for prosess-veiledning
4. Les relevant fil for oppgaven

---

## Filstruktur

```
docs/
├── PROJECT.md              ← Hovedinngangspunkt - les først
├── STATUS.md               ← Nåværende tilstand og pågående arbeid
├── BACKLOG.md              ← Alle oppgaver, bugs, ideer
├── CHEATSHEET.md           ← Hurtigreferanse og kommandoer
├── AGENTS.md               ← AI-roller (21 agenter) - komplett guide
├── CONVENTIONS.md          ← Kodestandarder og mønstre
├── SECURITY.md             ← Sikkerhetsregler og sjekklister
├── SETUP.md                ← Oppsett og deployment
├── DECISIONS.md            ← Arkitekturbeslutninger
├── README.md               ← Denne filen
│
├── process/                ← Prosess A-Å (7 faser, 21 agenter)
│   ├── START-HER.md        ← Quick guide til prosessen
│   ├── FILSTRUKTUR-GUIDE.md← Hvor filer skal ligge
│   ├── PROGRESS-TRACKER.md ← Template for fremdriftstracki ng
│   ├── DEMO-PROSJEKT.md    ← Eksempel end-to-end
│   ├── README.md           ← Prosess-oversikt
│   │
│   ├── faser/              ← 7 fase-dokumenter
│   │   ├── Fase 1 - Idé, Visjon og Risikovurdering.md
│   │   ├── Fase 2 - Kravspesifikasjon inkl. Sikkerhetskrav.md
│   │   ├── Fase 3 - Teknisk Design og Trusselmodellering.md
│   │   ├── Fase 4 - MVP Prototype (med Sikker Koding).md
│   │   ├── Fase 5 - Utvikling, Iterasjon & Kontinuerlig Validering.md
│   │   ├── Fase 6 - Testing, Sikkerhet & Kvalitetssikring.md
│   │   └── Fase 7 - Publisering, Overvåking & Vedlikehold.md
│   │
│   ├── agenter/            ← Agent-instruksjoner (21 agenter)
│   │   ├── AGENTS-OVERSIKT.md      ← Oversikt over alle agenter
│   │   ├── QUICK-START-PROMPTS.md  ← Kopier-klare prompts
│   │   ├── AGENT-MAPPING-PER-FASE.md← Hvilke agenter i hvilken fase
│   │   ├── NIVÅ-1-BASIS-AGENTER.md ← 6 basis-agenter (daglig)
│   │   ├── NIVÅ-2-PROSESS-AGENTER.md← 7 prosess-agenter (store features)
│   │   ├── NIVÅ-3-EKSPERT-AGENTER.md← 8 ekspert-agenter (spesialiserte)
│   │   │
│   │   ├── basis/          ← Detaljerte instruksjoner per basis-agent
│   │   ├── prosess/        ← Detaljerte instruksjoner per prosess-agent
│   │   └── ekspert/        ← Detaljerte instruksjoner per ekspert-agent
│   │
│   └── templates/          ← PRD-templates (kommer snart)
│       ├── _TEMPLATE-SIMPLE.md
│       └── _TEMPLATE-DATA.md
│
├── prd/                    ← Feature-spesifikasjoner (PRDs)
│   ├── _TEMPLATE.md
│   ├── media-service.md
│   ├── spa-conversion.md
│   └── [feature].md
│
└── logs/                   ← Historikk
    └── CHANGELOG.md        ← Kronologisk prosjekthistorikk
```

---

## Når du leser hvilken fil

| Situasjon | Les denne filen |
|-----------|----------------|
| **Ny i prosjektet** | `PROJECT.md` |
| **Hva skjer nå?** | `STATUS.md` |
| **Hva skal gjøres?** | `BACKLOG.md` |
| **Skal bruke AI** | `AGENTS.md` eller `process/START-HER.md` |
| **Skal skrive kode** | `CONVENTIONS.md` |
| **Sette opp miljø** | `SETUP.md` |
| **Ny feature** | `process/agenter/QUICK-START-PROMPTS.md` |
| **Sikkerhetsarbeid** | `SECURITY.md` |
| **Forstå valg** | `DECISIONS.md` |
| **Hva er gjort?** | `logs/CHANGELOG.md` |
| **Rask kommando** | `CHEATSHEET.md` |

---

## AI-roller (Prosess A-Å)

### Daglig bruk (90% av tiden)

| Agent | Når bruke | Quick prompt |
|-------|-----------|--------------|
| 🎯 **PLANLEGGER** | Før ny feature | `Aktiver PLANLEGGER-agent. Jeg vil bygge [feature].` |
| 🔨 **BYGGER** | Implementere kode | `Aktiver BYGGER-agent. Implementer [PRD-filnavn].` |
| 🔍 **REVIEWER** | Kvalitetssjekk | `Aktiver REVIEWER-agent. Review [fil/branch].` |
| 🛡️ **SIKKERHETS** | Før deploy | `Aktiver SIKKERHETS-agent. Sikkerhetsvurder [feature].` |
| 🐛 **DEBUGGER** | Finne/fikse feil | `Aktiver DEBUGGER-agent. Debug [beskriv problem].` |
| 📋 **DOKUMENTERER** | Oppdatere docs | `Aktiver DOKUMENTERER-agent. Oppdater docs for [endring].` |

### Store features (10% av tiden)

Når du bygger større features, bruk **ITERASJONS-agent (Fase 5)**:

```
Aktiver ITERASJONS-agent.
Les docs/prd/[feature].md og implementer featuren.

→ Agent orchestrerer automatisk:
  • PLANLEGGER → Lager PRD
  • BYGGER → Implementerer (UI → Funksjon → Sikkerhet)
  • REVIEWER → Code review
  • SIKKERHETS → Security audit
  • DOKUMENTERER → Oppdaterer docs
```

**Se fullstendig guide:** `AGENTS.md` eller `process/agenter/AGENTS-OVERSIKT.md`

---

## Vanlige scenarios

### Scenario 1: Ny enkel feature (1-2 dager)
```
1. Aktiver PLANLEGGER-agent → Lag PRD
2. Aktiver BYGGER-agent → Implementer (3 stages)
3. Aktiver REVIEWER-agent → Code review
4. Aktiver SIKKERHETS-agent → Security audit
5. Deploy til staging → Test → Produksjon
```

### Scenario 2: Større feature (1-2 uker)
```
Aktiver ITERASJONS-agent (Fase 5).
Agent orchestrerer resten automatisk.
```

### Scenario 3: Bug-fix
```
Aktiver DEBUGGER-agent.
Debug [beskriv problem].
```

**Se flere scenarios:** `process/agenter/QUICK-START-PROMPTS.md`

---

## Vedlikehold

### Etter hver arbeidsøkt
1. Oppdater `STATUS.md` med hva som ble gjort
2. Oppdater `BACKLOG.md` hvis oppgaver endres
3. Legg til i `logs/CHANGELOG.md` for betydelige endringer

### Ved ny feature
1. **Planlegg:** Aktiver PLANLEGGER-agent
2. **PRD:** Agent lager PRD i `prd/[feature].md`
3. **Implementer:** Aktiver BYGGER-agent
4. **Review:** Aktiver REVIEWER-agent
5. **Oppdater:** `STATUS.md` og `BACKLOG.md`

### Ved arkitekturbeslutning
1. Legg til i `DECISIONS.md`
2. Oppdater relevante filer

---

## Slash-kommandoer

| Kommando | Beskrivelse |
|----------|-------------|
| `/analyze` | Full kodeanalyse |
| `/security-review` | Sikkerhetsgjennomgang |
| `/pre-deploy` | Sjekkliste før push |
| `/deep-security-audit` | Full sikkerhetsanalyse |
| `/gdpr` | GDPR-vurdering |

**Se alle kommandoer:** `AGENTS.md`

---

## Datoformat

Alle datoer: `YYYY-MM-DD`

Eksempel: `2026-01-06`

---

## Migrasjonshistorikk

### 2026-01-06: Prosess A-Å integrert
- Lagt til `process/` med 7 faser og 21 agenter
- Oppdatert `AGENTS.md` med komplett agent-guide
- Integrert Prosess A-Å i samiske.no-workflow

### 2025-12-26: Dokumentasjonsrestrukturering
Konsoliderte 29 spredte filer:

| Tidligere | Nå |
|-----------|-----|
| `agent_docs/status.md` | `STATUS.md` |
| `agent_docs/security.md` | `SECURITY.md` |
| `agent_docs/database.md` | `CONVENTIONS.md` |
| `agent_docs/architecture.md` | `PROJECT.md` |
| `agent_docs/search.md` | `prd/search.md` |
| `agent_docs/admin.md` | `prd/admin.md` |
| `agent_docs/media-service.md` | `prd/media-service.md` |
| `agent_docs/spa-conversion.md` | `prd/spa-conversion.md` |
| `CHANGELOG.md` (root) | `logs/CHANGELOG.md` |
| `docs/sapmi/*` | Integrert i relevante filer |

---

## Nyttige lenker

**Prosess A-Å:**
- Quick guide: `process/START-HER.md`
- Agent-oversikt: `process/agenter/AGENTS-OVERSIKT.md`
- Quick prompts: `process/agenter/QUICK-START-PROMPTS.md`
- Komplett agent-guide: `AGENTS.md`

**samiske.no-spesifikk:**
- Prosjektoversikt: `PROJECT.md`
- Nåværende status: `STATUS.md`
- Alle oppgaver: `BACKLOG.md`
- Kodestandarder: `CONVENTIONS.md`
- Sikkerhet: `SECURITY.md`

---

**Sist oppdatert:** 2026-01-06
**Prosess A-Å integrert:** 2026-01-06
**Dokumentasjonssystem:** v2.0 (med Prosess A-Å)
