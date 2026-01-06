# Agent-system for Prosess A-Å

**Et komplett sett med AI-agenter tilpasset hver fase av utviklingsprosessen**

---

## Hva er dette?

Dette er et tre-lags agent-system som guider deg gjennom hele utviklingsprosessen fra idé til produksjon. Hver agent er spesialisert på sin oppgave og samarbeider med andre agenter når det trengs.

---

## Agent-arkitekturen

```
┌─────────────────────────────────────────┐
│  NIVÅ 1: BASIS-AGENTER (6 stk)         │ ← Bygge & vedlikeholde kode
│  Brukes på tvers av alle faser          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  NIVÅ 2: PROSESS-AGENTER (7 stk)       │ ← Guide gjennom hver fase
│  Én agent per fase i Prosess A-Å        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  NIVÅ 3: EKSPERT-AGENTER (8 stk)       │ ← Spesialiserte oppgaver
│  Kalles av Prosess-agenter ved behov    │
└─────────────────────────────────────────┘
```

---

## Totalt 21 agenter

### **NIVÅ 1: Basis-agenter (6)**
Disse bygger og vedlikeholder kode, fungerer på tvers av alle faser:
- 🎯 **PLANLEGGER-agent** - Lager PRD, bryter ned oppgaver
- 🔨 **BYGGER-agent** - Implementerer kode basert på PRD
- 🔍 **REVIEWER-agent** - Code review og kvalitetssjekk
- 🛡️ **SIKKERHETS-agent** - Security audit før deploy
- 🐛 **DEBUGGER-agent** - Finner og fikser bugs
- 📋 **DOKUMENTERER-agent** - Oppdaterer dokumentasjon

### **NIVÅ 2: Prosess-agenter (7)**
Disse guider deg gjennom hver fase:
- 🌱 **OPPSTART-agent** (Fase 1) - Problemdefinisjon, risikovurdering
- 📋 **KRAV-agent** (Fase 2) - Brukerhistorier, kravspec
- 🏗️ **ARKITEKTUR-agent** (Fase 3) - Tech stack, trusselmodellering
- 🚀 **MVP-agent** (Fase 4) - Setter opp prosjekt, bygger prototype
- 🔄 **ITERASJONS-agent** (Fase 5) - Fullføre features, polering
- ✅ **KVALITETSSIKRINGS-agent** (Fase 6) - Testing og sikkerhetssjekk
- 🌐 **PUBLISERINGS-agent** (Fase 7) - Deploy og overvåking

### **NIVÅ 3: Ekspert-agenter (8)**
Disse kalles av Prosess-agenter når spesialkompetanse trengs:
- 🎨 **WIREFRAME-ekspert** - Lager wireframes og UI-skisser
- ⚠️ **TRUSSELMODELLERINGS-ekspert** - STRIDE-analyse
- 🔐 **OWASP-ekspert** - OWASP Top 10 sikkerhetstest
- 🔑 **HEMMELIGHETSSJEKK-ekspert** - Secrets scanning
- 📊 **GDPR-ekspert** - GDPR-compliance vurdering
- 🎯 **BRUKERTEST-ekspert** - Planlegger og analyserer brukertesting
- ♿ **TILGJENGELIGHETS-ekspert** - WCAG-testing
- 📈 **YTELSE-ekspert** - Performance-optimalisering

---

## Hvordan bruke agent-systemet

### **1. Identifiser hvilken fase du er i**

Se på Prosess A-Å:
- Fase 1: Idé, Visjon & Risikovurdering
- Fase 2: Kravspesifikasjon
- Fase 3: Teknisk Design
- Fase 4: MVP/Prototype
- Fase 5: Utvikling & Iterasjon
- Fase 6: Testing & Kvalitetssikring
- Fase 7: Publisering & Vedlikehold

### **2. Aktiver Prosess-agenten for fasen**

```
Aktiver [FASE]-agent.
[Beskriv oppgaven/kontekst]
```

Eksempel:
```
Aktiver ARKITEKTUR-agent.
Les docs/kravdokument.md og hjelp meg designe teknisk løsning.
```

### **3. Prosess-agenten koordinerer resten**

Prosess-agenten vil:
- Guide deg gjennom aktivitetene i fasen
- Kalle Basis-agenter når kode skal bygges/reviewes
- Kalle Ekspert-agenter når spesialkompetanse trengs
- Sørge for at alle leveranser blir laget

### **4. Du bekrefter og godkjenner underveis**

Agentene foreslår og utfører - du tar beslutninger og godkjenner.

---

## Quick Reference: Hvilken agent skal jeg bruke?

| Jeg skal... | Aktiver denne agenten |
|-------------|----------------------|
| Starte nytt prosjekt | 🌱 OPPSTART-agent |
| Definere krav og funksjoner | 📋 KRAV-agent |
| Designe arkitektur og sikkerhet | 🏗️ ARKITEKTUR-agent |
| Bygge MVP | 🚀 MVP-agent |
| Fullføre og polere features | 🔄 ITERASJONS-agent |
| Teste før lansering | ✅ KVALITETSSIKRINGS-agent |
| Publisere til produksjon | 🌐 PUBLISERINGS-agent |
| Fikse en bug (når som helst) | 🐛 DEBUGGER-agent |
| Oppdatere docs (når som helst) | 📋 DOKUMENTERER-agent |

---

## Mappestruktur

```
Agenter/
├── AGENTS-OVERSIKT.md                 ← Du er her
├── NIVÅ-1-BASIS-AGENTER.md           ← Detaljerte instruksjoner
├── NIVÅ-2-PROSESS-AGENTER.md         ← Detaljerte instruksjoner
├── NIVÅ-3-EKSPERT-AGENTER.md         ← Detaljerte instruksjoner
├── AGENT-MAPPING-PER-FASE.md         ← Tabeller: Hvilke agenter i hvilken fase
└── QUICK-START-PROMPTS.md            ← Kopier-klare prompts
```

---

## Arbeidsflyt-eksempel

### **Scenario: Du er i Fase 3 og skal designe arkitektur**

**Steg 1: Aktiver Prosess-agent**
```
Aktiver ARKITEKTUR-agent.
Les docs/kravdokument.md og hjelp meg designe teknisk løsning.
```

**Steg 2: Agenten guider deg gjennom fasen**
```
ARKITEKTUR-agent:
"Jeg har lest kravdokumentet. La meg guide deg gjennom Fase 3.

STEG 1: Tech Stack-valg
Basert på kravene anbefaler jeg:
- Frontend: Next.js
- Backend: Supabase
- Hosting: Vercel

Er dette OK?"
```

**Steg 3: Agenten kaller Ekspert-agent ved behov**
```
ARKITEKTUR-agent:
"STEG 4: Trusselmodellering
For dette kaller jeg TRUSSELMODELLERINGS-ekspert."

[TRUSSELMODELLERINGS-ekspert aktiveres]
"Jeg skal gjennomføre STRIDE-analyse..."
```

**Steg 4: Leveranser blir laget**
```
ARKITEKTUR-agent:
"FERDIG MED FASE 3.

Leveranser:
✅ docs/teknisk-spec.md
✅ docs/security/trusselmodell.md
✅ docs/arkitektur-diagram.png

Neste steg: Aktiver MVP-agent for Fase 4."
```

---

## Fordeler med dette systemet

✅ **Strukturert** - Følger Prosess A-Å steg-for-steg
✅ **Automatisert koordinering** - Prosess-agenter kaller andre agenter
✅ **Skalerbar** - Enkelt å legge til nye ekspert-agenter
✅ **Sikkerhet innbakt** - Sikkerhets-agenter i hver fase
✅ **Komplett dokumentasjon** - Dokumenterer-agent holder alt oppdatert
✅ **Gjenbrukbar** - Basis-agenter fungerer i alle prosjekter

---

## Neste steg

1. Les [NIVÅ-1-BASIS-AGENTER.md](NIVÅ-1-BASIS-AGENTER.md) for basis-agentene
2. Les [NIVÅ-2-PROSESS-AGENTER.md](NIVÅ-2-PROSESS-AGENTER.md) for prosess-agentene
3. Les [NIVÅ-3-EKSPERT-AGENTER.md](NIVÅ-3-EKSPERT-AGENTER.md) for ekspert-agentene
4. Se [AGENT-MAPPING-PER-FASE.md](AGENT-MAPPING-PER-FASE.md) for oversikt per fase
5. Bruk [QUICK-START-PROMPTS.md](QUICK-START-PROMPTS.md) for kopier-klare prompts

---

**Lykke til med ditt prosjekt! 🚀**
