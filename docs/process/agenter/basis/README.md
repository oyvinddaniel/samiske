# Basis-agenter v2.0 - Oversikt

Denne mappen inneholder v2.0 spesifikasjonene for alle 6 basis-agenter, ekstrahert fra `/Prosess A-Å/Agenter/AGENT-ANALYSE-OG-FORBEDRINGER.md`.

## Filstruktur

```
basis/
├── PLANLEGGER-agent-v2.md    - Dependency-aware planning
├── BYGGER-agent-v2.md         - Self-correcting implementation
├── REVIEWER-agent-v2.md       - Agentic code review
├── SIKKERHETS-agent-v2.md     - Proactive security engineering
├── DEBUGGER-agent-v2.md       - Systematic root cause analysis
└── DOKUMENTERER-agent-v2.md   - Living documentation
```

## Hva er nytt i v2.0?

Alle agenter er oppgradert basert på research av best practices for AI-agenter i 2026. Hver agent-fil inkluderer:

### Standard seksjoner:
- **FORMÅL** - Hva agenten gjør
- **AKTIVERING** - Hvordan aktivere agenten
- **PROSESS** - Steg-for-steg arbeidsflyt
- **LOGGING** - Observability logging
- **GUARDRAILS** - NEVER/ALWAYS regler
- **GOLDEN TASKS** - Test scenarioer
- **METRICS** - KPIer å tracke
- **Forbedringsforslag** - Svakheter fra v1.0 som er adressert

### Kritiske forbedringer:

#### 1. PLANLEGGER-agent v2.0
- ✅ Dependency mapping og critical path analysis
- ✅ Atomic task breakdown (< 500 LOC)
- ✅ Success criteria per task
- ✅ Risk assessment

#### 2. BYGGER-agent v2.0
- ✅ Runtime verification loops
- ✅ System-wide context awareness (AGENTS.md)
- ✅ Automated security scanning (SAST)
- ✅ Code complexity metrics

#### 3. REVIEWER-agent v2.0
- ✅ 7-step agentic workflow
- ✅ Automated pre-checks
- ✅ System-wide impact analysis
- ✅ Metrics tracking

#### 4. SIKKERHETS-agent v2.0
- ✅ Security-by-design (alle 7 faser)
- ✅ Continuous security testing i CI/CD
- ✅ Runtime monitoring i produksjon
- ✅ Threat intelligence integration

#### 5. DEBUGGER-agent v2.0
- ✅ 7-step systematic debugging
- ✅ Runtime instrumentation
- ✅ Root cause analysis (ikke symptom-fixing)
- ✅ Regression prevention

#### 6. DOKUMENTERER-agent v2.0
- ✅ Living documentation (automated)
- ✅ AGENTS.md standard
- ✅ ADR (Architectural Decision Records)
- ✅ Explains WHY, not just WHAT

## Hvordan bruke disse agentene

### Steg 1: Les AGENTS.md
Før du bruker noen agent, sørg for at prosjektet har en `AGENTS.md` fil. Se DOKUMENTERER-agent v2.0 for template.

### Steg 2: Velg riktig agent
- **Planlegge feature?** → PLANLEGGER-agent
- **Implementere kode?** → BYGGER-agent
- **Review kode?** → REVIEWER-agent
- **Security audit?** → SIKKERHETS-agent
- **Debugge bug?** → DEBUGGER-agent
- **Oppdatere docs?** → DOKUMENTERER-agent

### Steg 3: Følg prosessen
Hver agent har en steg-for-steg PROSESS seksjon. Følg denne nøye.

### Steg 4: Test med golden tasks
Bruk GOLDEN TASKS seksjonen for å teste at agenten fungerer som forventet.

### Steg 5: Track metrics
Bruk METRICS seksjonen for å måle forbedring over tid.

## Research kilder

Disse v2.0 spesifikasjonene er basert på research fra:

- [Best Practices for AI Agent Implementations 2026](https://onereach.ai/blog/best-practices-for-ai-agent-implementations/)
- [AI Agent Design Best Practices](https://hatchworks.com/blog/ai-agents/ai-agent-design-best-practices/)
- [11 Prompting Techniques for Better AI Agents](https://www.augmentcode.com/blog/how-to-build-your-agent-11-prompting-techniques-for-better-ai-agents)
- [AI Code Review Tools 2026](https://www.qodo.ai/blog/best-ai-code-review-tools-2026/)
- [State of AI in Security & Development 2026](https://www.aikido.dev/state-of-ai-security-development-2026)
- [Code Documentation Best Practices 2026](https://www.qodo.ai/blog/code-documentation-best-practices-2026/)
- [AGENTS.md Standard](https://www.builder.io/blog/agents-md)
- [IBM AI Agent Planning](https://www.ibm.com/think/topics/ai-agent-planning)

## Neste steg

1. **Implementer AGENTS.md** i alle prosjekter (se DOKUMENTERER-agent v2.0)
2. **Test agentene** med golden tasks
3. **Track metrics** for å måle forbedring
4. **Iterer og forbedre** basert på faktisk bruk

## Spørsmål?

Se `/Prosess A-Å/Agenter/AGENT-ANALYSE-OG-FORBEDRINGER.md` for full analyse og kontekst bak disse forbedringene.

---

**Versjon:** 2.0
**Dato:** 2026-01-05
**Kilde:** AGENT-ANALYSE-OG-FORBEDRINGER.md
