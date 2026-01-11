# AGENTER-KATALOG
## Komplett oversikt over alle 21 Prosess A-Å agenter for samiske.no

> **Sist oppdatert:** 2026-01-08
> **Versjon:** 1.0
> **Status:** Alle 21 agenter implementert som subagents

---

## 📋 Innholdsfortegnelse

- [NIVÅ 1: BASIS-AGENTER (6 stk)](#nivå-1-basis-agenter)
  - [PLANLEGGER](#1-planlegger-agent)
  - [BYGGER](#2-bygger-agent)
  - [REVIEWER](#3-reviewer-agent)
  - [SIKKERHETS](#4-sikkerhets-agent)
  - [DEBUGGER](#5-debugger-agent)
  - [DOKUMENTERER](#6-dokumenterer-agent)
- [NIVÅ 2: PROSESS-AGENTER (7 stk)](#nivå-2-prosess-agenter)
  - [OPPSTART](#7-oppstart-agent)
  - [KRAV](#8-krav-agent)
  - [ARKITEKTUR](#9-arkitektur-agent)
  - [MVP](#10-mvp-agent)
  - [ITERASJONS](#11-iterasjons-agent)
  - [KVALITETSSIKRINGS](#12-kvalitetssikrings-agent)
  - [PUBLISERINGS](#13-publiserings-agent)
- [NIVÅ 3: EKSPERT-AGENTER (8 stk)](#nivå-3-ekspert-agenter)
  - [WIREFRAME](#14-wireframe-ekspert)
  - [TRUSSELMODELLERING](#15-trusselmodellerings-ekspert)
  - [OWASP](#16-owasp-ekspert)
  - [HEMMELIGHETSSJEKK](#17-hemmelighetssjekk-ekspert)
  - [GDPR](#18-gdpr-ekspert)
  - [BRUKERTEST](#19-brukertest-ekspert)
  - [TILGJENGELIGHET](#20-tilgjengelighets-ekspert)
  - [YTELSE](#21-ytelse-ekspert)

---

## NIVÅ 1: BASIS-AGENTER

Disse 6 agentene brukes i **90% av alt daglig arbeid**. De er kjernen i utviklingsprosessen.

---

### 1. 🎯 PLANLEGGER-agent

**Navn:** PLANLEGGER-agent v3.0

**Hva den brukes til:**
- Lage PRD (Product Requirements Document) for nye features
- Bryte ned komplekse oppgaver i implementerbare tasks
- Kartlegge avhengigheter mellom tasks
- Identifisere risiko og edge cases
- Definere success criteria før koding starter

**Fordeler:**
- ✅ Strukturert planning reduserer «glemte» edge cases
- ✅ Dependency mapping forhindrer blokkere
- ✅ Task breakdown gir realistic estimater
- ✅ Success criteria sikrer at alle krav oppfylles
- ✅ Reduserer re-work (tenk før du koder)

**Ulemper:**
- ⚠️ Kan ta 15-30 min ekstra tid før koding starter
- ⚠️ Kan føles overkill for svært små tasks (1-2 linjer endring)
- ⚠️ Krever at bruker svarer på oppklarende spørsmål

**Hvor den ligger:**
`.claude/agents/basis/planlegger/index.md`

**Aktivering:**
🔵 **MANUELL** - Du må be Claude om å aktivere den:
```
Aktiver PLANLEGGER-agent.
Jeg vil bygge [beskriv feature].
Lag PRD i docs/prd/[feature-navn].md
```

**Viktig å vite:**
- Følger 9-step prosess fra Information Sufficiency Check til Human-in-the-Loop Approval
- Lager PRD i `docs/prd/` som andre agenter refererer til
- Stiller oppklarende spørsmål hvis noe er uklart (NEVER assume)
- Bruker AskUserQuestion tool for å få input
- Output: PRD-fil klar for BYGGER-agent

---

### 2. 🔨 BYGGER-agent

**Navn:** BYGGER-agent v2.1

**Hva den brukes til:**
- Implementere features basert på PRD
- Følge 5-stage prosess: UI → Funksjon → Tests → Security → Verification
- Self-correcting: Tester seg selv i sandbox før den sier «ferdig»
- Skrive sikker kode med RLS policies fra starten
- Integrere med Supabase backend og Next.js frontend

**Fordeler:**
- ✅ Systematisk: Bygger UI først med mock data, deretter real functionality
- ✅ Self-correcting: Kjører kode i sandbox og fixer feil automatisk
- ✅ Security-first: SAST scanning og PII detection innebygd
- ✅ Test coverage: Skriver tester før debugging
- ✅ 3 autonomy levels: Kan be om godkjenning eller kjøre fullt autonomt

**Ulemper:**
- ⚠️ Kan ta lengre tid enn «quick and dirty» koding
- ⚠️ Sandbox testing krever at miljø er satt opp
- ⚠️ Kan bli «stuck» hvis avhengigheter mangler (trenger PLANLEGGER-output)

**Hvor den ligger:**
`.claude/agents/basis/bygger/index.md`

**Aktivering:**
🔵 **MANUELL** - Du må be Claude om å aktivere den:
```
Aktiver BYGGER-agent.
Implementer docs/prd/[feature-navn].md
Bruk autonomy level: [supervised/balanced/autonomous]
```

**Viktig å vite:**
- Krever at PRD eksisterer (fra PLANLEGGER)
- Følger samiske.no sine code conventions (norsk UI, engelsk kode)
- Max 300 linjer per komponent - splitter automatisk hvis nødvendig
- Bruker shadcn/ui komponenter og Lucide icons
- Stage 4 kjører SAST (secrets, PII, SQL injection detection)
- Stage 5 kjører kode i sandbox og self-corrects
- Output: Implementert kode klar for REVIEWER

---

### 3. 🔍 REVIEWER-agent

**Navn:** REVIEWER-agent v2.0

**Hva den brukes til:**
- Systematisk code review med 7-step prosess
- Verifisere at koden følger conventions
- Sjekke sikkerhet (RLS policies, input validation)
- Identifisere bugs og edge cases
- Vurdere complexity og maintainability

**Fordeler:**
- ✅ Objektiv review (ingen «git gud» attitude)
- ✅ 7-step prosess fanger issues som blir oversett
- ✅ Gir konkrete anbefalinger (ikke bare «fix this»)
- ✅ Vurderer risk level og breaking changes
- ✅ Lærer av feedback (continuous improvement mindset)

**Ulemper:**
- ⚠️ Kan finne «issues» som ikke er kritiske (bikeshedding)
- ⚠️ Krever at du leser rapporten og vurderer hva som er viktig
- ⚠️ Kan be om endringer som ikke er nødvendige for MVP

**Hvor den ligger:**
`.claude/agents/basis/reviewer/index.md`

**Aktivering:**
🟢 **KAN VÆRE AUTOMATISK** - Claude kan aktivere den selv etter BYGGER er ferdig, ELLER du kan be om det:
```
Aktiver REVIEWER-agent.
Review [fil/branch/PR].
```

**Viktig å vite:**
- Følger 7-step review: Context → Complexity → Security → Performance → Testing → Conventions → Final Assessment
- Gir beslutning: APPROVE / REQUEST_CHANGES / COMMENT
- Vurderer Risk Level: Low/Medium/High
- Identifiserer Breaking Changes: Yes/No
- Alltid konstruktiv feedback (aldri nedlatende)
- Output: Review-rapport med prioriterte anbefalinger

---

### 4. 🛡️ SIKKERHETS-agent

**Navn:** SIKKERHETS-agent v2.0

**Hva den brukes til:**
- Proaktiv sikkerhetsvurdering i ALLE faser (ikke bare til slutt)
- Verifisere RLS policies i Supabase
- Sjekke for OWASP Top 10 vulnerabilities
- Scanne for secrets og PII i kode
- Validere input og output i alle endpoints

**Fordeler:**
- ✅ Proaktiv: Fanger sikkerhetshull FØR de kommer i produksjon
- ✅ OWASP-compliant: Sjekker alle Top 10 kategorier
- ✅ Automatisk scanning: Secrets, PII, SQL injection, XSS
- ✅ RLS policy verification: Tester at policies er korrekte
- ✅ Gir konkrete fikser (ikke bare «dette er usikkert»)

**Ulemper:**
- ⚠️ Kan være «paranoid» og flagge false positives
- ⚠️ Krever at du har basic security-forståelse for å vurdere findings
- ⚠️ Kan forsinke deployment hvis mange issues finnes

**Hvor den ligger:**
`.claude/agents/basis/sikkerhets/index.md`

**Aktivering:**
🟢 **KAN VÆRE AUTOMATISK** - Claude kan aktivere den selv under BYGGER Stage 4, ELLER du kan be om det:
```
Aktiver SIKKERHETS-agent.
Sikkerhetsvurder [feature/fil/hele prosjektet].
```

**Viktig å vite:**
- Kjører i 3 faser: Pre-implementation, During implementation, Post-implementation
- Bruker automated tools: grep, rg, custom scripts
- Sjekker OWASP Top 10 (A01-A10)
- Verifiserer at `.env` ikke er committed
- Tester RLS policies i Supabase
- Output: Security audit rapport med P1/P2/P3 prioritert liste

---

### 5. 🐛 DEBUGGER-agent

**Navn:** DEBUGGER-agent v2.0

**Hva den brukes til:**
- Systematisk root cause analysis når noe er broken
- Følge 7-step debugging workflow
- Identifisere rot-årsak (ikke bare symptomer)
- Foreslå permanente fikser (ikke band-aids)
- Forhindre regression med tests

**Fordeler:**
- ✅ Systematisk: Følger 7-step prosess (ingen guessing)
- ✅ Root cause focus: Fikser årsak, ikke symptom
- ✅ 5 Whys analysis: Finner den VIRKELIGE årsaken
- ✅ Hypothesis-driven: Tester teorier før endringer
- ✅ Regression prevention: Skriver tester etter fix

**Ulemper:**
- ⚠️ Kan ta lengre tid enn «quick fix»
- ⚠️ Krever at du gir detaljert beskrivelse av problemet
- ⚠️ Kan finne dypere issues som krever større refactoring

**Hvor den ligger:**
`.claude/agents/basis/debugger/index.md`

**Aktivering:**
🔵 **MANUELL** - Du må be Claude om å aktivere den:
```
Aktiver DEBUGGER-agent.
Jeg har følgende problem: [beskriv bug detaljert].
```

**Viktig å vite:**
- Følger 7-step workflow: Gather info → Reproduce → Isolate → Hypothesize → Test fix → Verify → Prevent regression
- Bruker 5 Whys method for root cause analysis
- Alltid skriver test som fanger regression
- Dokumenterer fix i comments og CHANGELOG
- Output: Fix implementert + test + dokumentasjon

---

### 6. 📋 DOKUMENTERER-agent

**Navn:** DOKUMENTERER-agent v2.0

**Hva den brukes til:**
- Oppdatere living documentation etter endringer
- Skrive ADRs (Architecture Decision Records)
- Holde STATUS.md, BACKLOG.md, CHANGELOG.md oppdatert
- Dokumentere «WHY» (ikke bare «WHAT»)
- Migrere/konsolidere dokumentasjon

**Fordeler:**
- ✅ Living docs: Dokumentasjon er alltid synkronisert med kode
- ✅ WHY-fokus: Forklarer beslutninger, ikke bare fakta
- ✅ ADR-støtte: Dokumenterer arkitektur-beslutninger
- ✅ Automatisk: Oppdaterer riktige filer basert på type endring
- ✅ Conventions-aware: Følger samiske.no sin dokumentasjonsstruktur

**Ulemper:**
- ⚠️ Kan lage verbose dokumentasjon hvis ikke styrt
- ⚠️ Krever at du reviewer docs og approver før commit
- ⚠️ Kan oppdatere feil fil hvis context er uklar

**Hvor den ligger:**
`.claude/agents/basis/dokumenterer/index.md`

**Aktivering:**
🟢 **KAN VÆRE AUTOMATISK** - Claude kan aktivere den selv etter store endringer, ELLER du kan be om det:
```
Aktiver DOKUMENTERER-agent.
Oppdater dokumentasjon for [endring/feature].
```

**Viktig å vite:**
- Oppdaterer `docs/STATUS.md` når features fullføres
- Oppdaterer `docs/BACKLOG.md` når oppgaver endres
- Oppdaterer `docs/logs/CHANGELOG.md` etter deployment
- Lager ADRs i `docs/logs/decisions/` for store beslutninger
- Dokumenterer i Markdown med konsistent formattering
- Output: Oppdaterte dokumentasjonsfiler

---

## NIVÅ 2: PROSESS-AGENTER

Disse 7 agentene er **orchestrators** som koordinerer BASIS-agenter i de 7 fasene av Prosess A-Å.

**For samiske.no (post-launch):**
- Fase 1-4 brukes sjelden (allerede gjennomført)
- **Fase 5 (ITERASJONS)** brukes hyppig for nye features
- **Fase 6 (KVALITETSSIKRINGS)** brukes før større releases
- Fase 7 brukes ved deployment

---

### 7. 🌱 OPPSTART-agent

**Navn:** OPPSTART-agent (Fase 1: Problemdefinisjon)

**Hva den brukes til:**
- Starte nye prosjekter fra scratch
- Definere problem og målgruppe
- Identifisere stakeholders
- Lage initial vision document

**Fordeler:**
- ✅ Strukturert oppstart av nye prosjekter
- ✅ Sikrer at problem er godt forstått før løsning
- ✅ Stakeholder mapping

**Ulemper:**
- ⚠️ Ikke relevant for samiske.no (allerede startet)
- ⚠️ Overkill for små features

**Hvor den ligger:**
`.claude/agents/prosess/oppstart/index.md`

**Aktivering:**
🔵 **MANUELL** - Sjelden brukt for samiske.no:
```
Aktiver OPPSTART-agent.
Jeg vil starte nytt prosjekt: [beskrivelse].
```

**Viktig å vite:**
- Brukes kun for helt nye prosjekter
- samiske.no er allerede past denne fasen
- Output: Vision document + stakeholder map

---

### 8. 📋 KRAV-agent

**Navn:** KRAV-agent (Fase 2: Kravspesifikasjon)

**Hva den brukes til:**
- Definere funksjonelle og ikke-funksjonelle krav
- Lage user stories med acceptance criteria
- Prioritere krav (MoSCoW method)

**Fordeler:**
- ✅ Strukturert kravdefinisjon
- ✅ User stories med clear acceptance criteria

**Ulemper:**
- ⚠️ Overlapper med PLANLEGGER for samiske.no
- ⚠️ Mer formelt enn nødvendig for små features

**Hvor den ligger:**
`.claude/agents/prosess/krav/index.md`

**Aktivering:**
🔵 **MANUELL** - Sjelden brukt, bruk PLANLEGGER i stedet:
```
Aktiver KRAV-agent.
Definer krav for [prosjekt].
```

**Viktig å vite:**
- For samiske.no: Bruk PLANLEGGER-agent i stedet
- Denne er mer formell og enterprise-orientert
- Output: Kravdokument med user stories

---

### 9. 🏗️ ARKITEKTUR-agent

**Navn:** ARKITEKTUR-agent (Fase 3: Teknisk Design)

**Hva den brukes til:**
- Designe teknisk arkitektur
- Velge tech stack
- Lage system diagrams
- STRIDE threat modeling

**Fordeler:**
- ✅ Systematisk arkitekturdesign
- ✅ Threat modeling før implementering

**Ulemper:**
- ⚠️ Ikke relevant for samiske.no (tech stack bestemt)
- ⚠️ Kan være overkill for små features

**Hvor den ligger:**
`.claude/agents/prosess/arkitektur/index.md`

**Aktivering:**
🔵 **MANUELL** - Sjelden brukt for samiske.no:
```
Aktiver ARKITEKTUR-agent.
Design arkitektur for [system/feature].
```

**Viktig å vite:**
- samiske.no bruker Next.js 15 + Supabase (allerede bestemt)
- Kan brukes for større nye moduler
- Output: Architecture Decision Record (ADR)

---

### 10. 🚀 MVP-agent

**Navn:** MVP-agent (Fase 4: MVP-bygging)

**Hva den brukes til:**
- Bygge Minimum Viable Product
- Fokusere på core features
- Få noe ut i produksjon raskt

**Fordeler:**
- ✅ Fokus på essentials
- ✅ Rask time-to-market

**Ulemper:**
- ⚠️ Ikke relevant for samiske.no (allerede live)
- ⚠️ Overlapper med BYGGER

**Hvor den ligger:**
`.claude/agents/prosess/mvp/index.md`

**Aktivering:**
🔵 **MANUELL** - Sjelden brukt for samiske.no:
```
Aktiver MVP-agent.
Bygg MVP for [feature].
```

**Viktig å vite:**
- samiske.no er past MVP-fase
- Bruk BYGGER-agent i stedet for nye features
- Output: MVP prototype

---

### 11. 🔄 ITERASJONS-agent ⭐

**Navn:** ITERASJONS-agent (Fase 5: Fullføring & Polering)

**Hva den brukes til:**
- **HOVEDORCHESTRATOR for samiske.no!**
- Koordinere implementering av nye features post-launch
- Spawne BASIS-agenter parallelt for backend + frontend
- Håndtere flere tasks i sekvens eller parallell
- Sikre fullstendighet (ingen glemte edge cases)

**Fordeler:**
- ✅ **Parallell orchestration:** Backend + Frontend samtidig (spare 60-70% tid)
- ✅ Automatisk spawning av riktige agenter (PLANLEGGER, BYGGER, REVIEWER, etc.)
- ✅ Håndterer komplekse multi-step features
- ✅ Sikrer kvalitet gjennom hele prosessen
- ✅ Best fit for samiske.no (post-launch iterasjon)

**Ulemper:**
- ⚠️ Kan være overkill for tiny tasks (1-2 linjer)
- ⚠️ Bruker mer tokens (flere agenter i parallell)
- ⚠️ Krever at du gir god initial beskrivelse

**Hvor den ligger:**
`.claude/agents/prosess/iterasjons/index.md`

**Aktivering:**
🔵 **MANUELL** - Men anbefales for alle større features:
```
Aktiver ITERASJONS-agent.
Jeg vil bygge [beskriv feature].
Bruk parallell orchestration for backend + frontend.
```

**Viktig å vite:**
- **VIKTIGSTE orchestrator for samiske.no!**
- Kan spawne flere BYGGER-agenter parallelt:
  - BYGGER (Backend) → API endpoints
  - BYGGER (Frontend) → UI components
  - BYGGER (Testing) → Integration tests
- Spawner SIKKERHETS og REVIEWER automatisk
- Kan spawne BRUKERTEST-ekspert og YTELSE-ekspert hvis nødvendig
- Output: Fullstendig implementert og reviewet feature

**Eksempel på parallell orchestration:**
```
Du: "Implementer profilredigering"
Claude: [spawner ITERASJONS-agent]
→ ITERASJONS spawner:
  ├─ PLANLEGGER → Lager PRD (5 min)
  ├─ BYGGER (Backend) → API endpoints (parallell)
  ├─ BYGGER (Frontend) → UI components (parallell)
  ├─ BYGGER (Testing) → Tests (parallell)
  └─ REVIEWER → Code review (etter bygger)
→ Total tid: 2-3 timer (vs 8-10 timer sekvensielt)
```

---

### 12. ✅ KVALITETSSIKRINGS-agent ⭐

**Navn:** KVALITETSSIKRINGS-agent (Fase 6: Pre-Release Testing)

**Hva den brukes til:**
- Fullstendig testing før større releases
- Spawne 5 ekspert-agenter parallelt (OWASP, HEMMELIGHETSSJEKK, TILGJENGELIGHET, GDPR, BRUKERTEST)
- Verifisere compliance (OWASP, GDPR, WCAG)
- E2E testing av alle kritiske user flows

**Fordeler:**
- ✅ **Parallell ekspert-analyse:** 5 agenter kjører samtidig
- ✅ Comprehensive testing (sikkerhet, tilgjengelighet, privacy, UX)
- ✅ Compliance-rapport klar for stakeholders
- ✅ Fanger issues før produksjon

**Ulemper:**
- ⚠️ Tar 1-2 timer å kjøre full audit
- ⚠️ Kan finne mange issues som må fikses
- ⚠️ Bruker mange tokens (5 agenter parallelt)

**Hvor den ligger:**
`.claude/agents/prosess/kvalitetssikrings/index.md`

**Aktivering:**
🔵 **MANUELL** - Kjør før større releases:
```
Aktiver KVALITETSSIKRINGS-agent.
Kjør full pre-release audit.
```

**Viktig å vite:**
- **VIKTIG før større releases til produksjon!**
- Spawner 5 eksperter parallelt:
  1. OWASP-ekspert → OWASP Top 10 audit
  2. HEMMELIGHETSSJEKK-ekspert → Secrets scanning
  3. TILGJENGELIGHETS-ekspert → WCAG 2.1 AA compliance
  4. GDPR-ekspert → Privacy compliance
  5. BRUKERTEST-ekspert → User acceptance testing
- Output: Compliance-rapport + prioritert fix-liste

**Eksempel:**
```
Du: "Vi skal deploye stor feature-release i morgen"
Claude: [spawner KVALITETSSIKRINGS-agent]
→ KVALITETSSIKRINGS spawner parallelt:
  ├─ OWASP → Finner 0 kritiske issues ✅
  ├─ HEMMELIGHETSSJEKK → Finner 1 leaked API key ❌
  ├─ TILGJENGELIGHET → Finner 3 WCAG violations ⚠️
  ├─ GDPR → Finner 0 compliance issues ✅
  └─ BRUKERTEST → 2 UX-issues funnet ⚠️
→ Rapport: Fix API key (P1), vurder UX-fixes (P2)
```

---

### 13. 🌐 PUBLISERINGS-agent

**Navn:** PUBLISERINGS-agent (Fase 7: Deploy & Monitoring)

**Hva den brukes til:**
- Koordinere deployment til produksjon
- Verifisere pre-deploy checklist
- Sette opp monitoring og alerts
- Post-deploy smoke testing

**Fordeler:**
- ✅ Strukturert deployment-prosess
- ✅ Pre-deploy checklist forhindrer mistakes
- ✅ Post-deploy verification

**Ulemper:**
- ⚠️ Deployment til samiske.no er allerede automatisert (Vercel)
- ⚠️ Kan være overkill for små deployments

**Hvor den ligger:**
`.claude/agents/prosess/publiserings/index.md`

**Aktivering:**
🔵 **MANUELL** - Sjelden brukt (Vercel auto-deployer):
```
Aktiver PUBLISERINGS-agent.
Klargjør deployment til produksjon.
```

**Viktig å vite:**
- samiske.no deployer automatisk via Vercel når du pusher til main
- Kan brukes for å verifisere at alt er klart før push
- Output: Pre-deploy checklist + monitoring setup

---

## NIVÅ 3: EKSPERT-AGENTER

Disse 8 agentene er **spesialister** som kalles på av BASIS- eller PROSESS-agenter når spesifikk ekspertise trengs.

---

### 14. 🎨 WIREFRAME-ekspert

**Navn:** WIREFRAME-ekspert

**Hva den brukes til:**
- Lage wireframes og UI-skisser
- Designe user flows
- Velge shadcn/ui komponenter

**Fordeler:**
- ✅ Visualiserer UI før koding
- ✅ ASCII wireframes eller beskrivelser

**Ulemper:**
- ⚠️ Sjelden brukt for samiske.no (design system etablert)
- ⚠️ Kan være overkill når design allerede finnes

**Hvor den ligger:**
`.claude/agents/ekspert/wireframe/index.md`

**Aktivering:**
🟡 **AUTOMATISK** - Kalles av BYGGER eller ITERASJONS hvis nødvendig, ELLER manuelt:
```
Aktiver WIREFRAME-ekspert.
Design UI for [feature].
```

**Viktig å vite:**
- samiske.no har etablert design system (Tailwind + shadcn/ui)
- Brukes sjelden siden de fleste patterns allerede eksisterer
- Output: ASCII wireframe + komponent-liste

---

### 15. 🛡️ TRUSSELMODELLERINGS-ekspert

**Navn:** TRUSSELMODELLERINGS-ekspert

**Hva den brukes til:**
- STRIDE threat modeling av nye features
- Identifisere trusler i 6 kategorier (Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation of Privilege)
- Foreslå mitigations

**Fordeler:**
- ✅ Systematisk threat modeling
- ✅ Identifiserer trusler før implementering

**Ulemper:**
- ⚠️ Kan være overkill for små features
- ⚠️ Krever security-forståelse for å vurdere mitigations

**Hvor den ligger:**
`.claude/agents/ekspert/trusselmodellering/index.md`

**Aktivering:**
🟡 **AUTOMATISK** - Kalles av SIKKERHETS eller KVALITETSSIKRINGS, ELLER manuelt:
```
Aktiver TRUSSELMODELLERINGS-ekspert.
STRIDE-analyser [feature/komponent].
```

**Viktig å vite:**
- Bruker STRIDE framework
- Vurderer residual risk etter mitigations
- Output: Threat model rapport med risk levels

---

### 16. 🔐 OWASP-ekspert

**Navn:** OWASP-ekspert

**Hva den brukes til:**
- Fullstendig OWASP Top 10 security audit
- Sjekke A01-A10 compliance
- Identifisere vulnerabilities
- Foreslå konkrete fikser

**Fordeler:**
- ✅ Systematisk OWASP Top 10 gjennomgang
- ✅ Industry-standard security testing
- ✅ Konkrete fikser for hvert issue

**Ulemper:**
- ⚠️ Tar tid å kjøre full audit (30+ min)
- ⚠️ Kan finne mange issues (overveldende)

**Hvor den ligger:**
`.claude/agents/ekspert/owasp/index.md`

**Aktivering:**
🟡 **AUTOMATISK** - Kalles av KVALITETSSIKRINGS, ELLER manuelt:
```
Aktiver OWASP-ekspert.
Kjør OWASP Top 10 audit på [scope].
```

**Viktig å vite:**
- Sjekker alle 10 OWASP kategorier:
  - A01: Broken Access Control
  - A02: Cryptographic Failures
  - A03: Injection
  - A04: Insecure Design
  - A05: Security Misconfiguration
  - A06: Vulnerable Components
  - A07: Authentication Failures
  - A08: Software/Data Integrity
  - A09: Security Logging Failures
  - A10: Server-Side Request Forgery
- Output: OWASP audit rapport med P1/P2/P3 findings

---

### 17. 🔑 HEMMELIGHETSSJEKK-ekspert

**Navn:** HEMMELIGHETSSJEKK-ekspert

**Hva den brukes til:**
- Scanne for leaked secrets (API keys, tokens, passwords)
- Finne PII (personally identifiable information) i kode
- Verifisere at `.env` ikke er committed
- Sjekke hardcoded credentials

**Fordeler:**
- ✅ Automatisk scanning (grep, rg)
- ✅ Rask (< 1 minutt)
- ✅ Fanger secrets før de committes

**Ulemper:**
- ⚠️ Kan gi false positives (kommentarer, eksempler)
- ⚠️ Krever at du manuelt verifiserer findings

**Hvor den ligger:**
`.claude/agents/ekspert/hemmelighetssjekk/index.md`

**Aktivering:**
🟡 **AUTOMATISK** - Kalles av SIKKERHETS, KVALITETSSIKRINGS, eller pre-commit hook, ELLER manuelt:
```
Aktiver HEMMELIGHETSSJEKK-ekspert.
Scan for secrets i [scope].
```

**Viktig å vite:**
- Bruker regex patterns for vanlige secrets:
  - `sk_live_`, `sb_secret_`, `API_KEY`, `password`, etc.
- Sjekker `.env` ikke er i git
- Sjekker at Service Role Key ikke brukes i frontend
- Output: Secrets audit rapport med P1/P2/P3 findings

---

### 18. 📜 GDPR-ekspert

**Navn:** GDPR-ekspert

**Hva den brukes til:**
- Verifisere GDPR-compliance
- Sjekke de 6 GDPR-prinsippene
- Verifisere brukerrettigheter (export, delete, rectify)
- Sjekke data retention policies

**Fordeler:**
- ✅ Systematisk GDPR-gjennomgang
- ✅ Verifiserer user rights er implementert
- ✅ Privacy-first mindset

**Ulemper:**
- ⚠️ Krever juridisk forståelse for edge cases
- ⚠️ Compliance er komplekst (ikke alt kan automatiseres)

**Hvor den ligger:**
`.claude/agents/ekspert/gdpr/index.md`

**Aktivering:**
🟡 **AUTOMATISK** - Kalles av KVALITETSSIKRINGS, ELLER manuelt:
```
Aktiver GDPR-ekspert.
Vurder GDPR-compliance for [feature/system].
```

**Viktig å vite:**
- Sjekker 6 GDPR-prinsipper:
  1. Lawfulness, fairness, transparency
  2. Purpose limitation
  3. Data minimization
  4. Accuracy
  5. Storage limitation
  6. Integrity and confidentiality
- Sjekker 5 brukerrettigheter:
  1. Right to access (data export)
  2. Right to rectification (data edit)
  3. Right to erasure (data delete)
  4. Right to restriction
  5. Right to data portability
- Output: GDPR audit rapport med compliance status

---

### 19. 👥 BRUKERTEST-ekspert

**Navn:** BRUKERTEST-ekspert

**Hva den brukes til:**
- Planlegge brukertesting
- Lage test scenarios og tasks
- Analysere user feedback
- Identifisere UX-issues

**Fordeler:**
- ✅ Strukturert brukertest-planning
- ✅ Think-aloud protocol
- ✅ Fanger UX-issues før de blir widespread

**Ulemper:**
- ⚠️ Krever at du faktisk kjører tester med reelle brukere
- ⚠️ Kan finne mange issues (prioritering nødvendig)

**Hvor den ligger:**
`.claude/agents/ekspert/brukertest/index.md`

**Aktivering:**
🟡 **AUTOMATISK** - Kalles av KVALITETSSIKRINGS, ELLER manuelt:
```
Aktiver BRUKERTEST-ekspert.
Planlegg brukertest for [feature].
```

**Viktig å vite:**
- Anbefaler 5-7 testpersoner (nok for 85% av issues)
- Bruker think-aloud protocol
- Lager test scenarios med success criteria
- Analyserer patterns (hvor mange hadde samme problem?)
- Output: User testing plan + observation template

---

### 20. ♿ TILGJENGELIGHETS-ekspert

**Navn:** TILGJENGELIGHETS-ekspert

**Hva den brukes til:**
- Verifisere WCAG 2.1 Level AA compliance
- Sjekke keyboard navigation
- Verifisere screen reader compatibility
- Teste color contrast
- Sjekke semantic HTML

**Fordeler:**
- ✅ Systematisk WCAG-gjennomgang
- ✅ Sikrer inkluderende design
- ✅ Følger 4 prinsipper: Perceivable, Operable, Understandable, Robust

**Ulemper:**
- ⚠️ Krever at du tester manuelt med screen readers
- ⚠️ Kan finne mange issues (prioritering nødvendig)

**Hvor den ligger:**
`.claude/agents/ekspert/tilgjengelighet/index.md`

**Aktivering:**
🟡 **AUTOMATISK** - Kalles av KVALITETSSIKRINGS, ELLER manuelt:
```
Aktiver TILGJENGELIGHETS-ekspert.
Vurder WCAG-compliance for [feature/side].
```

**Viktig å vite:**
- Sjekker WCAG 2.1 Level AA (target for samiske.no)
- Verifiserer:
  - Keyboard navigation (Tab, Enter, Escape, Arrow keys)
  - Screen reader support (ARIA labels, semantic HTML)
  - Color contrast (minimum 4.5:1 for normal text)
  - Focus indicators
  - Alt text for images
- Output: Accessibility audit rapport med WCAG violations

---

### 21. ⚡ YTELSE-ekspert

**Navn:** YTELSE-ekspert

**Hva den brukes til:**
- Performance optimization
- Lighthouse audit
- Core Web Vitals måling (LCP, FID, CLS)
- Identifisere bottlenecks (images, JS bundle, database)
- Foreslå optimaliseringer

**Fordeler:**
- ✅ Systematisk performance-analyse
- ✅ Følger Core Web Vitals targets
- ✅ Konkrete optimaliseringer (ikke bare «make it faster»)
- ✅ Before/after metrics

**Ulemper:**
- ⚠️ Krever at du kjører Lighthouse lokalt
- ⚠️ Optimaliseringer kan være tidkrevende
- ⚠️ Kan finne mange issues (prioritering nødvendig)

**Hvor den ligger:**
`.claude/agents/ekspert/ytelse/index.md`

**Aktivering:**
🟡 **AUTOMATISK** - Kalles av KVALITETSSIKRINGS eller ITERASJONS hvis performance-issues, ELLER manuelt:
```
Aktiver YTELSE-ekspert.
Optimaliser performance for [side/feature].
```

**Viktig å vite:**
- Følger 5-step prosess:
  1. Establish Baseline (Lighthouse audit)
  2. Identify Bottlenecks (images, JS, database, rendering)
  3. Optimize (konkrete fikser)
  4. Measure Again (verifiser forbedring)
  5. Monitor (setup continuous monitoring)
- Targets:
  - LCP (Largest Contentful Paint): < 2.5s
  - FID (First Input Delay): < 100ms
  - CLS (Cumulative Layout Shift): < 0.1
  - Performance Score: > 90/100
- Output: Performance optimization rapport med before/after metrics

---

## 📊 Oppsummering: Når bruker du hvilken agent?

### Daglig arbeid (90% av tiden)

| Situasjon | Agent | Aktivering |
|-----------|-------|------------|
| Skal bygge ny feature | **PLANLEGGER** → **BYGGER** → **REVIEWER** | Manuell |
| Noe er broken | **DEBUGGER** | Manuell |
| Review før merge | **REVIEWER** | Manuell/Auto |
| Sikkerhetsvurdering | **SIKKERHETS** | Manuell/Auto |
| Oppdatere docs | **DOKUMENTERER** | Manuell/Auto |

### Større features (10% av tiden)

| Situasjon | Agent | Aktivering |
|-----------|-------|------------|
| Implementere stor feature | **ITERASJONS** (orchestrator) | Manuell |
| Før stor release | **KVALITETSSIKRINGS** (orchestrator) | Manuell |

### Spesifikke behov (etter behov)

| Situasjon | Agent | Aktivering |
|-----------|-------|------------|
| OWASP audit | **OWASP-ekspert** | Auto (via KVALITETSSIKRINGS) |
| Secrets scanning | **HEMMELIGHETSSJEKK-ekspert** | Auto (via SIKKERHETS) |
| GDPR-vurdering | **GDPR-ekspert** | Auto (via KVALITETSSIKRINGS) |
| Accessibility audit | **TILGJENGELIGHETS-ekspert** | Auto (via KVALITETSSIKRINGS) |
| Performance optimization | **YTELSE-ekspert** | Manuell eller Auto |
| User testing | **BRUKERTEST-ekspert** | Manuell eller Auto |

---

## 🎯 Prioritet for samiske.no

### KRITISK (bruk alltid)
1. **ITERASJONS-agent** (orchestrator for nye features)
2. **PLANLEGGER-agent** (planning før koding)
3. **BYGGER-agent** (implementering)
4. **SIKKERHETS-agent** (sikkerhet i alle faser)
5. **REVIEWER-agent** (kvalitetssikring)

### VIKTIG (bruk ofte)
6. **DEBUGGER-agent** (når noe er broken)
7. **KVALITETSSIKRINGS-agent** (før releases)
8. **DOKUMENTERER-agent** (hold docs oppdatert)

### ETTER BEHOV (bruk når relevant)
9-21. Alle ekspert-agenter (kalles automatisk av orchestrators)

---

**Sist oppdatert:** 2026-01-08
**Versjon:** 1.0
**Status:** Alle 21 agenter implementert og testet

**Se også:**
- `BRUKER-GUIDE.md` - Praktisk guide til hvordan bruke agentene
- `Projektleder.md` - Fullstendig teknisk dokumentasjon
- `.claude/agents/` - Agent-implementasjoner
