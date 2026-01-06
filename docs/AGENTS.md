# AGENTS.md - AI-roller og Prosess A-Å

> Komplett guide til agent-systemet for samiske.no
> Sist oppdatert: 2026-01-06

---

## 🚀 Quick Start

### Daglig arbeid (90% av tiden)

```
1. 🎯 PLANLEGGER-agent → Lag PRD for ny feature
2. 🔨 BYGGER-agent → Implementer (UI → Funksjon → Sikkerhet)
3. 🔍 REVIEWER-agent → Code review
4. 🛡️ SIKKERHETS-agent → Security audit
5. 📋 DOKUMENTERER-agent → Oppdater docs
```

### Bug-fixing
```
🐛 DEBUGGER-agent → Finn rot-årsak → Fiks → Lag regression test
```

**Fullstendig guide:** `docs/process/agenter/QUICK-START-PROMPTS.md`

---

## Om agent-systemet

samiske.no bruker **Prosess A-Å** - et 3-lags agent-system:

```
┌─────────────────────────────────────────┐
│  NIVÅ 1: BASIS-AGENTER (6 stk)         │ ← Daglig arbeid
│  Brukes på tvers av alle faser          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  NIVÅ 2: PROSESS-AGENTER (7 stk)       │ ← For store features
│  Én agent per fase (Idé → Deploy)       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  NIVÅ 3: EKSPERT-AGENTER (8 stk)       │ ← Spesialiserte oppgaver
│  Kalles av andre agenter ved behov      │
└─────────────────────────────────────────┘
```

**Total:** 21 agenter

---

## Viktige regler for alle agenter

### Alltid
- Les `docs/PROJECT.md` først for kontekst
- Sjekk `docs/STATUS.md` for nåværende tilstand
- Følg konvensjoner i `docs/CONVENTIONS.md`
- Oppdater dokumentasjon etter betydelige endringer

### Aldri
- Commit secrets eller API-nøkler
- Les/rediger `.env`-filer
- Anta ting du ikke vet - spør heller
- Slett kode du ikke forstår formålet med

---

# NIVÅ 1: Basis-agenter (Daglig bruk)

Disse 6 agentene bruker du mest:

---

## 🎯 PLANLEGGER-agent

**Når:** Før du starter ny feature eller stort arbeid

**Quick prompt:**
```
Aktiver PLANLEGGER-agent.
Jeg vil bygge [beskriv feature].
Lag PRD basert på docs/process/templates/_TEMPLATE-SIMPLE.md
```

**Hva den gjør:**
1. Stiller avklarende spørsmål
2. Bryter ned i små, testbare steg (dependency mapping)
3. Identifiserer risikoer
4. Lager PRD i `docs/prd/[feature].md`

**Detaljert instruksjon:** `docs/process/agenter/basis/PLANLEGGER-agent-v2.md`

---

## 🔨 BYGGER-agent

**Når:** Du skal implementere en planlagt feature/fix

**Quick prompt:**
```
Aktiver BYGGER-agent.
Implementer [feature] basert på docs/prd/[filnavn].md

Følg 3-stage prosess:
1. UI Only (mock data)
2. Real Functionality
3. Test, Debug, Safety
```

**Hva den gjør:**
1. Leser PRD og eksisterende kode
2. Implementerer i 3 stages (UI → Funksjon → Sikkerhet)
3. Skriver tester
4. Verifiserer at det fungerer
5. Oppdaterer dokumentasjon

**3-stage tilnærming:**
- **Stage 1: UI Only** - Bygg UI med mock data, verifiser design
- **Stage 2: Real Functionality** - Koble til backend, implementer logikk
- **Stage 3: Test, Debug, Safety** - Tester, feilhåndtering, sikkerhet

**Detaljert instruksjon:** `docs/process/agenter/basis/BYGGER-agent-v2.md`

---

## 🔍 REVIEWER-agent

**Når:** Du vil ha kvalitetssjekk på kode eller arkitektur

**Quick prompt:**
```
Aktiver REVIEWER-agent.
Review koden i [fil/branch/feature].

Sjekk:
- Funksjonalitet
- Sikkerhet
- Kodekvalitet
- Ytelse
- Best practices
```

**Hva den gjør:**
1. Systematisk 7-step review prosess
2. Automated pre-checks (linting, tests)
3. System-wide impact analysis
4. Gir actionable feedback (APPROVE/REQUEST_CHANGES/COMMENT)

**Rapporterer:**
- 🔴 Kritiske problemer (må fikses)
- 🟠 Anbefalinger (bør fikses)
- 🟢 Forslag (kan forbedre)

**Detaljert instruksjon:** `docs/process/agenter/basis/REVIEWER-agent-v2.md`

---

## 🛡️ SIKKERHETS-agent

**Når:** Før deploy, etter sikkerhetsendringer, eller kontinuerlig i CI/CD

**Quick prompt:**
```
Aktiver SIKKERHETS-agent.
Gjennomfør security audit av [feature/hele prosjektet].

Fokuser på:
- Input validering
- Output sanitering
- Autentisering/autorisasjon
- Hemmeligheter
- RLS policies
```

**Hva den gjør:**
1. Security-by-design i alle faser (ikke bare pre-deploy)
2. Continuous security testing i CI/CD
3. Runtime monitoring i produksjon
4. Threat intelligence integration

**Sjekker for:**
1. Autentisering - Er auth riktig implementert?
2. Autorisasjon - Kan brukere kun se egne data?
3. Input validering - Er all input sanitert?
4. SQL injection - Brukes Supabase korrekt?
5. XSS - Er output escaped?
6. Secrets - Er API-nøkler sikret?
7. GDPR - Følger vi personvernkrav?
8. RLS - Er alle tabeller beskyttet?

**Detaljert instruksjon:** `docs/process/agenter/basis/SIKKERHETS-agent-v2.md`

---

## 🐛 DEBUGGER-agent

**Når:** Noe er broken og du trenger hjelp å finne feilen

**Quick prompt:**
```
Aktiver DEBUGGER-agent.
Jeg har følgende problem: [beskriv symptomet].

Hjelp meg:
1. Reprodusere feilen
2. Identifisere årsaken
3. Foreslå løsning
4. Implementere fix
5. Verifisere at det er fikset
```

**Hva den gjør:**
1. Systematic 7-step debugging workflow
2. Runtime instrumentation for observability
3. Root cause analysis (ikke symptom-fixing)
4. Lager regression test

**7-step prosess:**
1. Forstå symptomet - hva skjer vs hva skal skje?
2. Reproduser - hvilke steg trigger feilen?
3. Isoler - hvilken del av koden er involvert?
4. Hypoteser - hva kan forårsake dette?
5. Test - verifiser hver hypotese
6. Fiks - minste mulige endring som løser problemet
7. Verifiser - lag test for å forhindre regression

**Detaljert instruksjon:** `docs/process/agenter/basis/DEBUGGER-agent-v2.md`

---

## 📋 DOKUMENTERER-agent

**Når:** Dokumentasjon må oppdateres eller lages

**Quick prompt:**
```
Aktiver DOKUMENTERER-agent.
Jeg har gjort følgende endringer: [beskriv endringene].

Oppdater relevant dokumentasjon:
- README.md
- docs/STATUS.md
- docs/BACKLOG.md
- docs/logs/CHANGELOG.md
```

**Hva den gjør:**
1. Living documentation (oppdateres automatisk)
2. Følger AGENTS.md standard
3. Lager ADR (Architectural Decision Records)
4. Forklarer WHY, ikke bare WHAT

**Filer som typisk oppdateres:**
- `docs/STATUS.md` - etter arbeid
- `docs/BACKLOG.md` - når oppgaver endres
- `docs/logs/CHANGELOG.md` - når features fullføres
- `docs/prd/[feature].md` - når features planlegges/endres
- `README.md` - ved nye features eller endringer

**Detaljert instruksjon:** `docs/process/agenter/basis/DOKUMENTERER-agent-v2.md`

---

# NIVÅ 2: Prosess-agenter (Store features)

For større features eller nye prosjekter, bruk én av disse 7 agentene basert på hvilken fase du er i:

## For samiske.no (post-launch)

Siden samiske.no er live, bruker vi primært **ITERASJONS-agent (Fase 5)** for nye features.

---

| Fase | Agent | Når bruke |
|------|-------|-----------|
| **1** | 🌱 **OPPSTART** | Nye prosjekter - problemdefinisjon |
| **2** | 📋 **KRAV** | Definere krav og brukerhistorier |
| **3** | 🏗️ **ARKITEKTUR** | Teknisk design og trusselmodellering |
| **4** | 🚀 **MVP** | Bygge prototype/MVP |
| **5** | 🔄 **ITERASJONS** | Fullføre features og polering (← **Vi er her**) |
| **6** | ✅ **KVALITETSSIKRINGS** | Testing før lansering |
| **7** | 🌐 **PUBLISERINGS** | Deploy og overvåking |

**Eksempel bruk av ITERASJONS-agent:**
```
Aktiver ITERASJONS-agent.
Les docs/prd/mvp-definition.md og implementer [feature].

Agent orchestrerer:
1. PLANLEGGER → Lager PRD
2. BYGGER → Implementerer
3. REVIEWER → Code review
4. SIKKERHETS → Security audit
5. DOKUMENTERER → Oppdaterer docs
```

**Detaljerte instruksjoner:** `docs/process/agenter/prosess/`

---

# NIVÅ 3: Ekspert-agenter (Spesialiserte)

Disse kalles automatisk av Prosess-agenter eller Basis-agenter når spesialkompetanse trengs:

| Ekspert | Når kalles | Av hvem |
|---------|-----------|---------|
| 🎨 **WIREFRAME** | UI-skisser trengs | KRAV-agent |
| ⚠️ **TRUSSELMODELLERING** | STRIDE-analyse | ARKITEKTUR-agent |
| 🔐 **OWASP** | Sikkerhetstesting | KVALITETSSIKRINGS-agent |
| 🔑 **HEMMELIGHETSSJEKK** | Secrets scanning | MVP-agent, KVALITETSSIKRINGS-agent |
| 📊 **GDPR** | GDPR-compliance | KVALITETSSIKRINGS-agent |
| 🎯 **BRUKERTEST** | Brukertesting | ITERASJONS-agent |
| ♿ **TILGJENGELIGHET** | WCAG-testing | KVALITETSSIKRINGS-agent |
| 📈 **YTELSE** | Performance-optimalisering | ITERASJONS-agent, KVALITETSSIKRINGS-agent |

**Du trenger normalt ikke kalle disse direkte** - de kalles automatisk når nødvendig.

**Detaljerte instruksjoner:** `docs/process/agenter/ekspert/`

---

## Slash-kommandoer (Claude Code)

Disse er konfigurert i `.claude/settings.json`:

| Kommando | Beskrivelse | Agent |
|----------|-------------|-------|
| `/analyze` | Full kodeanalyse | code-quality |
| `/security-review` | Sikkerhetsgjennomgang | security-review |
| `/pre-deploy` | Sjekkliste før push | pre-deploy |
| `/deep-security-audit` | Full sikkerhetsanalyse | deep-security-audit |
| `/gdpr` | GDPR-arbeid | gdpr |

---

## Automatiske hooks

Konfigurert i `.claude/settings.json`:

### Før verktøybruk (PreToolUse)
- **Secret-scanning før commit** - Blokkerer hvis secrets finnes
- **Advarsel ved sikkerhetskritisk kode** - Ved API/Supabase-endringer
- **Blokkerer .env-tilgang** - Forhindrer lesing/redigering av .env-filer

### Etter verktøybruk (PostToolUse)
- **Linting etter redigering** - Kjører ESLint automatisk

### Ved avslutning (Stop)
- **Build-påminnelse** - Minner om å kjøre `npm run build`

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
→ Root cause analysis
→ Implementer fix
→ Lag regression test
```

### Scenario 4: Security audit før deploy
```
Aktiver SIKKERHETS-agent.
Gjennomfør komplett security audit.
→ Kaller OWASP-ekspert
→ Kaller HEMMELIGHETSSJEKK-ekspert
→ Rapporterer funn
```

---

## Nyttige lenker

**Prosess A-Å dokumentasjon:**
- Full guide: `docs/process/START-HER.md`
- Quick prompts: `docs/process/agenter/QUICK-START-PROMPTS.md`
- Agent-oversikt: `docs/process/agenter/AGENTS-OVERSIKT.md`
- Fase-dokumenter: `docs/process/faser/`

**samiske.no-spesifikk:**
- Prosjektoversikt: `docs/PROJECT.md`
- Nåværende status: `docs/STATUS.md`
- Oppgaver: `docs/BACKLOG.md`
- Kodestandarder: `docs/CONVENTIONS.md`
- Sikkerhet: `docs/SECURITY.md`

---

**Sist oppdatert:** 2026-01-06
**Prosess A-Å integrert:** 2026-01-06
**Totalt agenter:** 21 (6 basis + 7 prosess + 8 ekspert)
