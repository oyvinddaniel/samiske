# Prosess A-Å - AI-assistert utviklingsprosess

> Komplett system for å bygge features med AI-assistanse fra idé til produksjon.

---

## 🚀 Start her

**Ny til Prosess A-Å?** Les `START-HER.md` først.

**Klar til å bygge?** Bruk quick-prompts i `agenter/QUICK-START-PROMPTS.md`.

---

## Hva er Prosess A-Å?

Et strukturert system med:
- **7 faser** (Idé → Krav → Design → MVP → Utvikling → Testing → Publisering)
- **21 AI-agenter** (6 basis + 7 prosess + 8 ekspert)
- **Sikkerhet innbakt** i hver fase (ikke påklistret på slutten)

---

## For samiske.no (post-launch)

Siden samiske.no allerede er live, bruker vi primært:

### Daglig arbeid (90% av tiden)
```
1. 🎯 PLANLEGGER-agent → Lag PRD
2. 🔨 BYGGER-agent → Implementer (UI → Funksjon → Sikkerhet)
3. 🔍 REVIEWER-agent → Code review
4. 🛡️ SIKKERHETS-agent → Security audit
5. 📋 DOKUMENTERER-agent → Oppdater docs
```

### Større features
```
Aktiver ITERASJONS-agent (Fase 5).
Agent orchestrerer resten.
```

### Bug-fixing
```
Aktiver DEBUGGER-agent.
Debug [beskriv problem].
```

---

## Mappestruktur

```
process/
├── START-HER.md                 ← Les dette først
├── FILSTRUKTUR-GUIDE.md         ← Hvor filer skal ligge
├── PROGRESS-TRACKER.md          ← Template for å tracke fremdrift
├── DEMO-PROSJEKT.md             ← Eksempel end-to-end
│
├── faser/                       ← 7 fase-dokumenter
│   ├── Fase 1 - Idé, Visjon og Risikovurdering.md
│   ├── Fase 2 - Kravspesifikasjon inkl. Sikkerhetskrav.md
│   ├── Fase 3 - Teknisk Design og Trusselmodellering.md
│   ├── Fase 4 - MVP Prototype (med Sikker Koding).md
│   ├── Fase 5 - Utvikling, Iterasjon & Kontinuerlig Validering.md
│   ├── Fase 6 - Testing, Sikkerhet & Kvalitetssikring.md
│   └── Fase 7 - Publisering, Overvåking & Vedlikehold.md
│
├── agenter/                     ← Agent-instruksjoner
│   ├── AGENTS-OVERSIKT.md       ← Oversikt over alle 21 agenter
│   ├── QUICK-START-PROMPTS.md   ← Kopier-klare prompts
│   ├── AGENT-MAPPING-PER-FASE.md← Hvilke agenter i hvilken fase
│   │
│   ├── basis/                   ← 6 basis-agenter (daglig bruk)
│   │   ├── PLANLEGGER-agent-v2.md
│   │   ├── BYGGER-agent-v2.md
│   │   ├── REVIEWER-agent-v2.md
│   │   ├── SIKKERHETS-agent-v2.md
│   │   ├── DEBUGGER-agent-v2.md
│   │   └── DOKUMENTERER-agent-v2.md
│   │
│   ├── prosess/                 ← 7 prosess-agenter (én per fase)
│   │   ├── OPPSTART-agent.md
│   │   ├── KRAV-agent.md
│   │   ├── ARKITEKTUR-agent.md
│   │   ├── MVP-agent.md
│   │   ├── ITERASJONS-agent.md
│   │   ├── KVALITETSSIKRINGS-agent.md
│   │   └── PUBLISERINGS-agent.md
│   │
│   └── ekspert/                 ← 8 ekspert-agenter (spesialiserte)
│       ├── WIREFRAME-ekspert.md
│       ├── TRUSSELMODELLERINGS-ekspert.md
│       ├── OWASP-ekspert.md
│       ├── HEMMELIGHETSSJEKK-ekspert.md
│       ├── GDPR-ekspert.md
│       ├── BRUKERTEST-ekspert.md
│       ├── TILGJENGELIGHETS-ekspert.md
│       └── YTELSE-ekspert.md
│
└── templates/                   ← PRD-templates (kommer snart)
    ├── _TEMPLATE-SIMPLE.md
    └── _TEMPLATE-DATA.md
```

---

## Quick reference

### Scenario 1: Ny enkel feature
```
Aktiver PLANLEGGER-agent.
Jeg vil bygge [feature].
Lag PRD.

→ Implementer med BYGGER-agent
→ Review med REVIEWER-agent
→ Deploy
```

### Scenario 2: Større feature med design-behov
```
Aktiver ITERASJONS-agent.
Les docs/prd/mvp-definition.md og implementer [feature].

→ Agent orchestrerer PLANLEGGER, BYGGER, REVIEWER, etc.
```

### Scenario 3: Bug-fix
```
Aktiver DEBUGGER-agent.
Debug [problem].

→ Root cause analysis
→ Implementer fix
→ Regression test
```

### Scenario 4: Security audit før deploy
```
Aktiver SIKKERHETS-agent.
Gjennomfør security audit før deploy av [feature].

→ Kaller OWASP-ekspert, HEMMELIGHETSSJEKK-ekspert
→ Rapporterer funn
```

---

## Viktige prinsipper

1. **Sikkerhet først** - Innbakt i hver fase, ikke påklistret på slutten
2. **3-stage bygging** - UI → Funksjonalitet → Sikkerhet (alltid i denne rekkefølgen)
3. **Proactive testing** - Test kontinuerlig, ikke bare på slutten
4. **Living documentation** - Docs oppdateres sammen med kode

---

## Neste steg

1. **Første gang?** Les `START-HER.md`
2. **Klar til å bygge?** Åpne `agenter/QUICK-START-PROMPTS.md`
3. **Trenger PRD-template?** Se `templates/` (kommer snart)
4. **Vil forstå fasene?** Les `faser/Fase X - ...md`

---

**Integrert i samiske.no:** 2026-01-06
**Versjon:** 1.0
**Basert på:** Prosess A-Å by [din organisasjon]
