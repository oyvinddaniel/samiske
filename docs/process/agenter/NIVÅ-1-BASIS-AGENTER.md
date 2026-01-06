# NIVÅ 1: Basis-agenter v2.0

**6 agenter som bygger og vedlikeholder kode på tvers av alle faser**

Disse agentene brukes når som helst i utviklingsprosessen. De er generiske og fungerer uavhengig av hvilken fase du er i.

---

## Oversikt

Basis-agenter er fundamentet i agent-systemet. De utfører kjerneoppgavene i all programvareutvikling: planlegge, bygge, reviewe, sikre, debugge og dokumentere.

**NYTT I V2.0:**
- ✅ **Observability logging** - Alle beslutninger logges for debugging
- ✅ **Golden tasks** - Test scenarioer for å validere agent-oppførsel
- ✅ **Guardrails** - NEVER/ALWAYS regler for å unngå feil
- ✅ **Metrics tracking** - KPIer for å måle forbedring
- ✅ **Systematiske workflows** - Steg-for-steg prosesser basert på research

---

## De 6 Basis-agentene

### 🎯 [PLANLEGGER-agent v2.0](basis/PLANLEGGER-agent-v2.md)

**Dependency-Aware Planning med Task Decomposition**

- Lager PRD med strukturert task breakdown
- Dependency mapping og critical path analysis
- Atomic task decomposition (< 500 LOC per task)
- Success criteria og "definition of done" per task

**Når brukes:**
- Før du starter en ny feature
- Når du trenger å bryte ned en stor oppgave
- Når du trenger en PRD (Product Requirements Document)

**Aktivering:**
```
Aktiver PLANLEGGER-agent.
Jeg vil [BESKRIV FEATURE/OPPGAVE].
```

---

### 🔨 [BYGGER-agent v2.0](basis/BYGGER-agent-v2.md)

**Self-Correcting Implementation med Runtime Verification**

- 5-stage implementeringsprosess (UI → Functionality → Tests → Security → Verification)
- Runtime verification loops (run code, observe behavior, self-correct)
- System-wide context awareness (leser AGENTS.md)
- Automated security scanning (SAST)

**Når brukes:**
- Når du skal implementere kode basert på PRD
- Når du skal bygge nye features
- Når du skal refaktorere eksisterende kode

**Aktivering:**
```
Aktiver BYGGER-agent.
Implementer [TASK] fra PRD.
```

---

### 🔍 [REVIEWER-agent v2.0](basis/REVIEWER-agent-v2.md)

**Agentic Code Review med 7-Step Workflow**

- Systematisk 7-step review prosess
- Automated pre-checks før review
- System-wide impact analysis
- Actionable review decisions (APPROVE, REQUEST_CHANGES, COMMENT)

**Når brukes:**
- Etter kode er implementert
- Før PR merges til main
- Når du trenger kvalitetssjekk

**Aktivering:**
```
Aktiver REVIEWER-agent.
Review koden i [BRANCH/PR/FILE].
```

---

### 🛡️ [SIKKERHETS-agent v2.0](basis/SIKKERHETS-agent-v2.md)

**Proactive Security Engineering gjennom alle 7 faser**

- Security-by-design i alle faser (ikke bare pre-deploy)
- Continuous security testing i CI/CD
- Runtime monitoring i produksjon
- Threat intelligence integration

**Når brukes:**
- I ALLE faser av utviklingen (ikke bare før deploy)
- Når du setter opp CI/CD pipeline
- Når du deployer til produksjon

**Aktivering:**
```
Aktiver SIKKERHETS-agent.
Sikkerhetsvurder [FASE/FEATURE/DEPLOY].
```

---

### 🐛 [DEBUGGER-agent v2.0](basis/DEBUGGER-agent-v2.md)

**Systematic Root Cause Analysis med 7-Step Process**

- 7-step debugging workflow
- Runtime instrumentation for observability
- Root cause analysis (ikke symptom-fixing)
- Regression prevention med tests

**Når brukes:**
- Når du har en bug som skal fikses
- Når du trenger å forstå hvorfor noe feiler
- Når du vil forhindre at bugs kommer tilbake

**Aktivering:**
```
Aktiver DEBUGGER-agent.
Debug [BESKRIV PROBLEM/BUG].
```

---

### 📋 [DOKUMENTERER-agent v2.0](basis/DOKUMENTERER-agent-v2.md)

**Living Documentation med Automated CI/CD**

- Living documentation (oppdateres automatisk)
- AGENTS.md standard for AI-tools
- ADR (Architectural Decision Records)
- Explains WHY, not just WHAT

**Når brukes:**
- Når nye features er implementert
- Når arkitektur endres
- Når viktige beslutninger tas

**Aktivering:**
```
Aktiver DOKUMENTERER-agent.
Oppdater dokumentasjon for [FEATURE/ENDRING].
```

---

## Hvordan bruke Basis-agentene

### 1. Identifiser hvilken agent du trenger

| Jeg skal... | Bruk denne agenten |
|-------------|-------------------|
| Planlegge en feature | 🎯 PLANLEGGER-agent |
| Implementere kode | 🔨 BYGGER-agent |
| Reviewe kode | 🔍 REVIEWER-agent |
| Sikkerhetsvurdere | 🛡️ SIKKERHETS-agent |
| Fikse en bug | 🐛 DEBUGGER-agent |
| Oppdatere docs | 📋 DOKUMENTERER-agent |

### 2. Aktiver agenten

```
Aktiver [AGENT-NAVN].
[Beskriv oppgaven/kontekst]
```

**Eksempel:**
```
Aktiver PLANLEGGER-agent.
Jeg vil legge til brukerautentisering med email og passord.
```

### 3. Følg agentens prosess

Hver agent har en detaljert steg-for-steg PROSESS som du finner i agent-filen. Agenten vil guide deg gjennom:
- Innhenting av informasjon
- Utførelse av oppgaven
- Logging av beslutninger
- Leveranse av resultat

### 4. Valider med Golden Tasks

Hver agent har GOLDEN TASKS - test scenarioer med kjente korrekte outputs. Bruk disse for å validere at agenten fungerer som forventet.

### 5. Track Metrics

Hver agent har METRICS - KPIer du skal tracke over tid for å måle forbedring.

---

## Typisk arbeidsflyt med Basis-agenter

Her er en vanlig workflow når du skal bygge en ny feature:

```
1. 🎯 PLANLEGGER-agent
   → Lager PRD med task breakdown
   → Identifiserer dependencies
   → Output: docs/prd/feature-name.md

2. 🔨 BYGGER-agent (for hver task i PRD)
   → Implementerer kode
   → Kjører tests
   → Output: Kode i src/

3. 🔍 REVIEWER-agent
   → Reviewer implementert kode
   → Sjekker kvalitet og sikkerhet
   → Output: Review feedback

4. 🛡️ SIKKERHETS-agent
   → Security audit før merge
   → SAST scanning
   → Output: Security report

5. 📋 DOKUMENTERER-agent
   → Oppdaterer docs
   → Oppdaterer AGENTS.md
   → Output: Oppdatert dokumentasjon
```

Hvis det oppstår bugs underveis:
```
🐛 DEBUGGER-agent
   → Root cause analysis
   → Fixer bug
   → Lager regression test
   → Output: Bug fix + test
```

---

## Forskjellen mellom v1.0 og v2.0

### V1.0 Svakheter:
- ❌ Ingen observability - umulig å debugge agent-beslutninger
- ❌ Ingen testing framework - ingen måte å validere agent-oppførsel
- ❌ Reaktiv sikkerhet - security bare før deploy
- ❌ Mangler system-kontekst - agenter kjenner ikke prosjektstrukturen
- ❌ Symptom-fixing - debugger fikser symptomer, ikke root cause

### V2.0 Forbedringer:
- ✅ **Observability logging** - alle beslutninger logges
- ✅ **Golden tasks** - test scenarioer for validering
- ✅ **Proactive security** - security i alle faser
- ✅ **System-wide context** - agenter leser AGENTS.md
- ✅ **Root cause analysis** - debugger finner og fikser rot-årsak
- ✅ **Self-correcting loops** - agenter verifiserer og korrigerer eget arbeid
- ✅ **Metrics tracking** - måler forbedring over tid

---

## Detaljerte spesifikasjoner

For fullstendige instruksjoner til AI for hver agent, se de individuelle filene i [basis/](basis/) mappen:

- [PLANLEGGER-agent-v2.md](basis/PLANLEGGER-agent-v2.md)
- [BYGGER-agent-v2.md](basis/BYGGER-agent-v2.md)
- [REVIEWER-agent-v2.md](basis/REVIEWER-agent-v2.md)
- [SIKKERHETS-agent-v2.md](basis/SIKKERHETS-agent-v2.md)
- [DEBUGGER-agent-v2.md](basis/DEBUGGER-agent-v2.md)
- [DOKUMENTERER-agent-v2.md](basis/DOKUMENTERER-agent-v2.md)

Hver fil inneholder:
- **FORMÅL** - Hva agenten gjør
- **AKTIVERING** - Hvordan aktivere agenten
- **PROSESS** - Steg-for-steg arbeidsflyt
- **LOGGING** - Observability logging patterns
- **GUARDRAILS** - NEVER/ALWAYS regler
- **GOLDEN TASKS** - Test scenarioer
- **METRICS** - KPIer å tracke

---

## Research kilder

Disse v2.0 spesifikasjonene er basert på research fra 2026:

- [Best Practices for AI Agent Implementations 2026](https://onereach.ai/blog/best-practices-for-ai-agent-implementations/)
- [AI Agent Design Best Practices](https://hatchworks.com/blog/ai-agents/ai-agent-design-best-practices/)
- [11 Prompting Techniques for Better AI Agents](https://www.augmentcode.com/blog/how-to-build-your-agent-11-prompting-techniques-for-better-ai-agents)
- [AI Code Review Tools 2026](https://www.qodo.ai/blog/best-ai-code-review-tools-2026/)
- [State of AI in Security & Development 2026](https://www.aikido.dev/state-of-ai-security-development-2026)
- [Code Documentation Best Practices 2026](https://www.qodo.ai/blog/code-documentation-best-practices-2026/)
- [AGENTS.md Standard](https://www.builder.io/blog/agents-md)
- [IBM AI Agent Planning](https://www.ibm.com/think/topics/ai-agent-planning)

Full analyse og kontekst finnes i [AGENT-ANALYSE-OG-FORBEDRINGER.md](AGENT-ANALYSE-OG-FORBEDRINGER.md).

---

## Neste steg

1. **Les AGENTS.md template** i DOKUMENTERER-agent v2.0
2. **Test agentene** med golden tasks
3. **Implementer i ditt prosjekt**
4. **Track metrics** for å måle forbedring
5. **Gi feedback** basert på faktisk bruk

---

**Versjon:** 2.0
**Dato:** 2026-01-05
**Filstruktur:** [basis/](basis/) - Individuelle agent-filer
**Analyse:** [AGENT-ANALYSE-OG-FORBEDRINGER.md](AGENT-ANALYSE-OG-FORBEDRINGER.md)
