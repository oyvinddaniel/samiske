# Filstruktur-guide for Prosess A-Å Prosjekter

**Komplett oversikt over hvor alle leveranser fra agentene skal lagres**

---

## 📋 Innholdsfortegnelse

- [Komplett filstruktur-mal](#komplett-filstruktur-mal)
- [Automatisering](#automatisering-opprett-struktur-automatisk)
- [Fil-til-agent mapping](#fil-til-agent-mapping)
- [Fase-til-fil mapping](#fase-til-fil-mapping)
- [Best practices](#best-practices)
- [Eksempler](#eksempler-på-filinnhold)

---

## 📁 Komplett filstruktur-mal

Kopier denne strukturen til ditt nye prosjekt:

```
mitt-prosjekt/
│
├── docs/                                    📚 DOKUMENTASJON
│   │
│   ├── vision.md                            [Fase 1: OPPSTART-agent]
│   ├── PROJECT.md                           [Manuel oppsett - prosjektoversikt]
│   ├── STATUS.md                            [Oppdateres løpende]
│   ├── BACKLOG.md                           [Oppdateres løpende]
│   │
│   ├── krav/                                [Fase 2: KRAV-agent]
│   │   ├── brukerhistorier.md
│   │   ├── datamodell.md
│   │   ├── sikkerhetskrav.md
│   │   ├── mvp-definition.md
│   │   ├── edge-cases.md
│   │   └── wireframes/
│   │       ├── login.txt                    [WIREFRAME-ekspert]
│   │       ├── dashboard.txt
│   │       └── profile.txt
│   │
│   ├── teknisk-spec.md                      [Fase 3: ARKITEKTUR-agent]
│   ├── api-design.md                        [Fase 3: ARKITEKTUR-agent]
│   ├── database-schema.md                   [Fase 3: ARKITEKTUR-agent]
│   ├── arkitektur-diagram.png               [Fase 3: ARKITEKTUR-agent]
│   │
│   ├── prd/                                 [Fase 5: PLANLEGGER-agent]
│   │   ├── _TEMPLATE-SIMPLE.md              [Template for enkle features]
│   │   ├── _TEMPLATE-DATA.md                [Template for CRUD features]
│   │   ├── user-auth.md                     [Eksempel PRD]
│   │   ├── dashboard.md
│   │   └── user-profile.md
│   │
│   ├── security/                            🔐 SIKKERHET
│   │   ├── risikovurdering.md               [Fase 1: OPPSTART-agent]
│   │   ├── dataklassifisering.md            [Fase 1: OPPSTART-agent]
│   │   ├── trusselmodell.md                 [Fase 3: TRUSSELMODELLERINGS-ekspert]
│   │   ├── owasp-rapport.md                 [Fase 6: OWASP-ekspert]
│   │   ├── secrets-audit.md                 [Fase 4/6: HEMMELIGHETSSJEKK-ekspert]
│   │   └── incident-response-plan.md        [Fase 7: PUBLISERINGS-agent]
│   │
│   ├── testing/                             🧪 TESTING
│   │   ├── e2e-testplan.md                  [Fase 6: KVALITETSSIKRINGS-agent]
│   │   ├── accessibility-rapport.md         [Fase 6: TILGJENGELIGHETS-ekspert]
│   │   ├── ytelse-rapport.md                [Fase 5/6: YTELSE-ekspert]
│   │   └── cross-browser-test.md            [Fase 6: KVALITETSSIKRINGS-agent]
│   │
│   ├── privacy/                             🔒 PERSONVERN
│   │   ├── gdpr-compliance.md               [Fase 6: GDPR-ekspert]
│   │   └── personvernerklaring.md           [Fase 2/6: KRAV + GDPR-ekspert]
│   │
│   ├── user-testing/                        👥 BRUKERTESTING
│   │   ├── test-plan.md                     [Fase 5: BRUKERTEST-ekspert]
│   │   ├── test-resultater.md
│   │   └── feedback-rapport.md
│   │
│   ├── deployment/                          🚀 DEPLOYMENT
│   │   ├── deployment-guide.md              [Fase 7: PUBLISERINGS-agent]
│   │   ├── vedlikeholdsplan.md              [Fase 7: PUBLISERINGS-agent]
│   │   └── rollback-prosedyre.md            [Fase 7: PUBLISERINGS-agent]
│   │
│   └── logs/                                📝 HISTORIKK
│       ├── CHANGELOG.md                     [DOKUMENTERER-agent]
│       ├── PROGRESS-TRACKER.md              [Manuell oppdatering]
│       └── decisions/                       [Architecture Decision Records]
│           ├── 001-tech-stack.md
│           ├── 002-database-choice.md
│           └── 003-auth-method.md
│
├── src/                                     💻 KILDEKODE
│   ├── app/                                 [Next.js app directory]
│   ├── components/                          [React komponenter]
│   ├── lib/                                 [Utility functions]
│   ├── hooks/                               [React hooks]
│   ├── types/                               [TypeScript types]
│   └── utils/                               [Helper functions]
│
├── supabase/                                🗄️ DATABASE
│   ├── migrations/                          [Database migrations]
│   ├── seed.sql                             [Seed data]
│   └── config.toml
│
├── tests/                                   🧪 TESTER
│   ├── unit/                                [Unit tests]
│   ├── integration/                         [Integration tests]
│   └── e2e/                                 [E2E tests - Playwright/Cypress]
│
├── .github/                                 🤖 CI/CD
│   └── workflows/
│       ├── ci.yml                           [Fase 4: MVP-agent]
│       ├── deploy-staging.yml
│       └── deploy-production.yml
│
├── public/                                  📸 STATISKE FILER
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── .env.example                             [Fase 4: MVP-agent]
├── .env.local                               [IKKE commit - secrets her]
├── .gitignore                               [Fase 4: MVP-agent]
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── README.md                                [DOKUMENTERER-agent]
```

---

## 🤖 Automatisering: Opprett struktur automatisk

### **Bash script (macOS/Linux)**

Kopier dette og kjør i terminalen:

```bash
#!/bin/bash

# Sett prosjektnavn
PROJECT_NAME="mitt-prosjekt"

# Opprett hovedmapper
mkdir -p $PROJECT_NAME/{docs,src,tests,public,.github/workflows,supabase/migrations}

# Opprett docs/ struktur
mkdir -p $PROJECT_NAME/docs/{krav/wireframes,security,testing,privacy,user-testing,deployment,logs/decisions,prd}

# Opprett hoveddokumenter
cd $PROJECT_NAME

touch docs/vision.md
touch docs/PROJECT.md
touch docs/STATUS.md
touch docs/BACKLOG.md
touch docs/teknisk-spec.md
touch docs/api-design.md
touch docs/database-schema.md

# Krav
touch docs/krav/{brukerhistorier.md,datamodell.md,sikkerhetskrav.md,mvp-definition.md,edge-cases.md}

# Security
touch docs/security/{risikovurdering.md,dataklassifisering.md,trusselmodell.md,owasp-rapport.md,secrets-audit.md,incident-response-plan.md}

# Testing
touch docs/testing/{e2e-testplan.md,accessibility-rapport.md,ytelse-rapport.md,cross-browser-test.md}

# Privacy
touch docs/privacy/{gdpr-compliance.md,personvernerklaring.md}

# User testing
touch docs/user-testing/{test-plan.md,test-resultater.md,feedback-rapport.md}

# Deployment
touch docs/deployment/{deployment-guide.md,vedlikeholdsplan.md,rollback-prosedyre.md}

# Logs
touch docs/logs/CHANGELOG.md
touch docs/logs/PROGRESS-TRACKER.md

# PRD templates
touch docs/prd/{_TEMPLATE-SIMPLE.md,_TEMPLATE-DATA.md}

# Root files
touch .env.example
touch .gitignore
touch README.md

echo "✅ Prosjektstruktur opprettet i ./$PROJECT_NAME/"
echo "📂 Neste steg: cd $PROJECT_NAME && start Claude Code"
```

**Hvordan bruke:**
1. Lagre scriptet som `create-project-structure.sh`
2. Kjør: `chmod +x create-project-structure.sh`
3. Kjør: `./create-project-structure.sh`

---

### **PowerShell script (Windows)**

```powershell
# Sett prosjektnavn
$PROJECT_NAME = "mitt-prosjekt"

# Opprett hovedmapper
New-Item -ItemType Directory -Force -Path "$PROJECT_NAME\docs\krav\wireframes"
New-Item -ItemType Directory -Force -Path "$PROJECT_NAME\docs\security"
New-Item -ItemType Directory -Force -Path "$PROJECT_NAME\docs\testing"
New-Item -ItemType Directory -Force -Path "$PROJECT_NAME\docs\privacy"
New-Item -ItemType Directory -Force -Path "$PROJECT_NAME\docs\user-testing"
New-Item -ItemType Directory -Force -Path "$PROJECT_NAME\docs\deployment"
New-Item -ItemType Directory -Force -Path "$PROJECT_NAME\docs\logs\decisions"
New-Item -ItemType Directory -Force -Path "$PROJECT_NAME\docs\prd"
New-Item -ItemType Directory -Force -Path "$PROJECT_NAME\src"
New-Item -ItemType Directory -Force -Path "$PROJECT_NAME\tests"
New-Item -ItemType Directory -Force -Path "$PROJECT_NAME\public"
New-Item -ItemType Directory -Force -Path "$PROJECT_NAME\.github\workflows"
New-Item -ItemType Directory -Force -Path "$PROJECT_NAME\supabase\migrations"

# Opprett filer (eksempel for noen viktige)
New-Item -ItemType File -Force -Path "$PROJECT_NAME\docs\vision.md"
New-Item -ItemType File -Force -Path "$PROJECT_NAME\docs\PROJECT.md"
New-Item -ItemType File -Force -Path "$PROJECT_NAME\docs\STATUS.md"
New-Item -ItemType File -Force -Path "$PROJECT_NAME\docs\BACKLOG.md"
New-Item -ItemType File -Force -Path "$PROJECT_NAME\.env.example"
New-Item -ItemType File -Force -Path "$PROJECT_NAME\.gitignore"
New-Item -ItemType File -Force -Path "$PROJECT_NAME\README.md"

Write-Host "✅ Prosjektstruktur opprettet i .\$PROJECT_NAME\"
Write-Host "📂 Neste steg: cd $PROJECT_NAME && start Claude Code"
```

---

## 📊 Fil-til-agent mapping

Hvilken agent lager hvilke filer?

| Fil | Agent | Fase | Når |
|-----|-------|------|-----|
| **vision.md** | OPPSTART-agent | 1 | Start av prosjekt |
| **risikovurdering.md** | OPPSTART-agent | 1 | Start av prosjekt |
| **dataklassifisering.md** | OPPSTART-agent | 1 | Start av prosjekt |
| **brukerhistorier.md** | KRAV-agent | 2 | Etter Fase 1 |
| **datamodell.md** | KRAV-agent | 2 | Etter Fase 1 |
| **sikkerhetskrav.md** | KRAV-agent | 2 | Etter Fase 1 |
| **mvp-definition.md** | KRAV-agent | 2 | Etter Fase 1 |
| **wireframes/*.txt** | WIREFRAME-ekspert | 2 | Valgfritt i Fase 2 |
| **teknisk-spec.md** | ARKITEKTUR-agent | 3 | Etter Fase 2 |
| **database-schema.md** | ARKITEKTUR-agent | 3 | Etter Fase 2 |
| **api-design.md** | ARKITEKTUR-agent | 3 | Etter Fase 2 |
| **trusselmodell.md** | TRUSSELMODELLERINGS-ekspert | 3 | I Fase 3 |
| **.env.example** | MVP-agent | 4 | Prosjektoppsett |
| **.gitignore** | MVP-agent | 4 | Prosjektoppsett |
| **.github/workflows/*.yml** | MVP-agent | 4 | CI/CD oppsett |
| **secrets-audit.md** | HEMMELIGHETSSJEKK-ekspert | 4 | Under MVP-bygging |
| **prd/[feature].md** | PLANLEGGER-agent | 5 | For hver ny feature |
| **ytelse-rapport.md** | YTELSE-ekspert | 5/6 | Ved optimalisering |
| **user-testing/*.md** | BRUKERTEST-ekspert | 5 | Brukervalidering |
| **e2e-testplan.md** | KVALITETSSIKRINGS-agent | 6 | Før lansering |
| **owasp-rapport.md** | OWASP-ekspert | 6 | Sikkerhetstesting |
| **accessibility-rapport.md** | TILGJENGELIGHETS-ekspert | 6 | WCAG-testing |
| **gdpr-compliance.md** | GDPR-ekspert | 6 | Compliance-sjekk |
| **deployment-guide.md** | PUBLISERINGS-agent | 7 | Før deploy |
| **vedlikeholdsplan.md** | PUBLISERINGS-agent | 7 | Ved lansering |
| **incident-response-plan.md** | PUBLISERINGS-agent | 7 | Ved lansering |
| **CHANGELOG.md** | DOKUMENTERER-agent | Løpende | Etter endringer |
| **README.md** | DOKUMENTERER-agent | Løpende | Etter endringer |

---

## 🗺️ Fase-til-fil mapping

Hva skal finnes etter hver fase?

### **Etter Fase 1: Idé, Visjon & Risikovurdering**

✅ **Skal eksistere:**
```
docs/
├── vision.md
└── security/
    ├── risikovurdering.md
    └── dataklassifisering.md
```

**Sjekk:**
```bash
ls docs/vision.md docs/security/risikovurdering.md docs/security/dataklassifisering.md
```

---

### **Etter Fase 2: Kravspesifikasjon**

✅ **Skal eksistere:**
```
docs/
├── vision.md                     [Fra Fase 1]
├── krav/
│   ├── brukerhistorier.md
│   ├── datamodell.md
│   ├── sikkerhetskrav.md
│   ├── mvp-definition.md
│   ├── edge-cases.md
│   └── wireframes/               [Valgfritt]
└── security/                     [Fra Fase 1]
```

**Sjekk:**
```bash
ls docs/krav/brukerhistorier.md docs/krav/datamodell.md docs/krav/mvp-definition.md
```

---

### **Etter Fase 3: Teknisk Design**

✅ **Skal eksistere:**
```
docs/
├── vision.md                     [Fra Fase 1]
├── krav/                         [Fra Fase 2]
├── teknisk-spec.md
├── api-design.md
├── database-schema.md
└── security/
    ├── risikovurdering.md        [Fra Fase 1]
    ├── dataklassifisering.md     [Fra Fase 1]
    └── trusselmodell.md          [NYT]
```

**Sjekk:**
```bash
ls docs/teknisk-spec.md docs/api-design.md docs/security/trusselmodell.md
```

---

### **Etter Fase 4: MVP/Prototype**

✅ **Skal eksistere:**
```
docs/                             [Alt fra Fase 1-3]
src/                              [Fungerende kode]
tests/                            [Grunnleggende tester]
supabase/                         [Database setup]
.github/workflows/                [CI/CD]
.env.example
.gitignore
README.md
```

**Sjekk:**
```bash
ls .env.example .gitignore .github/workflows/ci.yml src/app
```

---

### **Etter Fase 5: Utvikling & Iterasjon**

✅ **Skal eksistere:**
```
docs/
├── prd/
│   ├── feature-1.md
│   ├── feature-2.md
│   └── ...
├── user-testing/
│   └── test-plan.md
└── testing/
    └── ytelse-rapport.md
src/                              [Feature-komplett kode]
tests/                            [Utvidede tester]
```

**Sjekk:**
```bash
ls docs/prd/*.md
```

---

### **Etter Fase 6: Testing & Kvalitetssikring**

✅ **Skal eksistere:**
```
docs/
├── testing/
│   ├── e2e-testplan.md
│   ├── accessibility-rapport.md
│   ├── ytelse-rapport.md
│   └── cross-browser-test.md
├── security/
│   ├── owasp-rapport.md
│   └── secrets-audit.md
└── privacy/
    └── gdpr-compliance.md        [Hvis relevant]
tests/
├── unit/
├── integration/
└── e2e/
```

**Sjekk:**
```bash
ls docs/testing/e2e-testplan.md docs/security/owasp-rapport.md
```

---

### **Etter Fase 7: Publisering**

✅ **Skal eksistere:**
```
docs/
├── deployment/
│   ├── deployment-guide.md
│   ├── vedlikeholdsplan.md
│   └── rollback-prosedyre.md
├── security/
│   └── incident-response-plan.md
└── logs/
    └── CHANGELOG.md
```

**Sjekk:**
```bash
ls docs/deployment/deployment-guide.md docs/logs/CHANGELOG.md
```

---

## ✅ Best Practices

### **1. Konsistent navngivning**

```
✅ Bra:
docs/krav/brukerhistorier.md
docs/krav/datamodell.md
docs/krav/sikkerhetskrav.md

❌ Dårlig:
docs/krav/user-stories.md        # Blanding norsk/engelsk
docs/krav/DataModell.md           # Inkonsistent case
docs/krav/sikkerhet_krav.md      # Blanding bindestrek/underscore
```

**Regel:** Bruk norsk, lowercase, bindestrek mellom ord.

---

### **2. Versjonering av filer**

Ikke lag `vision-v1.md`, `vision-v2.md`. Bruk Git for versjonering.

```
✅ Bra:
docs/vision.md                    # Oppdater denne
(Git history holder eldre versjoner)

❌ Dårlig:
docs/vision-v1.md
docs/vision-v2.md
docs/vision-final.md
docs/vision-final-FINAL.md
```

---

### **3. Datostempel i dokumenter**

Legg til dato i toppen av hvert dokument:

```markdown
# Vision for [Prosjektnavn]

**Opprettet:** 2026-01-05
**Sist oppdatert:** 2026-01-06
**Fase:** 1 - Idé, Visjon & Risikovurdering

---

[Innhold her]
```

---

### **4. README.md i hver mappe**

For komplekse mapper, legg til README.md:

```
docs/
├── README.md                     # Forklarer docs/ struktur
├── krav/
│   └── README.md                 # Forklarer krav/ struktur
├── security/
│   └── README.md                 # Forklarer security/ struktur
└── prd/
    └── README.md                 # Forklarer PRD-prosess
```

---

### **5. .gitignore korrekt satt opp**

```gitignore
# Environment variables
.env
.env.local
.env.*.local

# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output/

# Production
build/
dist/
.next/
out/

# Misc
.DS_Store
*.log
*.swp

# IDE
.vscode/
.idea/
*.sublime-*

# Secrets (ALDRI commit)
*.pem
*.key
secrets.json
```

---

## 📖 Eksempler på filinnhold

### **Eksempel: docs/vision.md**

```markdown
# Vision for TaskMaster Pro

**Opprettet:** 2026-01-05
**Sist oppdatert:** 2026-01-05
**Fase:** 1 - Idé, Visjon & Risikovurdering
**Agent:** OPPSTART-agent

---

## Problemdefinisjon

Freelancere og små bedrifter sliter med å holde oversikt over prosjekter
og oppgaver når de håndterer flere klienter samtidig. Eksisterende verktøy
som Trello og Asana er for komplekse og dyre for småbedrifter.

Dette fører til:
- Tapte deadlines
- Glemt arbeid
- Ineffektiv tidsbruk
- Stress og frustrasjon

## Målgruppe

**Primær:** Freelancere innen design, utvikling og konsulentbransjen
som jobber med 3-10 klienter samtidig.

**Sekundær:** Små byråer (2-5 ansatte) som trenger enkel prosjektstyring.

## Verdiforslag

TaskMaster Pro lar deg holde oversikt over alle prosjektene dine på én plass,
uten kompleksitet og uten høy kostnad. Fokuser på arbeidet, ikke verktøyet.

## Suksesskriterier

1. 80% av brukerne skal kunne opprette sitt første prosjekt innen 5 minutter
2. 90% av brukerne skal logge inn minst 3 ganger per uke
3. Gjennomsnittlig tidssparing: 2 timer per uke per bruker

## Scope

**Inkludert i MVP:**
- Opprett prosjekter
- Legg til oppgaver
- Sett deadlines
- Grunnleggende rapportering

**IKKE inkludert i MVP:**
- Team-funksjoner
- Tidsregistrering
- Fakturering
- Mobile apps

---

Neste steg: Fase 2 - Kravspesifikasjon
```

---

### **Eksempel: docs/krav/mvp-definition.md**

```markdown
# MVP-definisjon for TaskMaster Pro

**Opprettet:** 2026-01-06
**Sist oppdatert:** 2026-01-06
**Fase:** 2 - Kravspesifikasjon
**Agent:** KRAV-agent

---

## MoSCoW Prioritering

### **MUST HAVE (Kritisk for MVP)**

1. **Brukerautentisering**
   - Registrering med email/passord
   - Innlogging
   - Passord-reset

2. **Prosjekthåndtering**
   - Opprett prosjekt
   - Rediger prosjekt
   - Slett prosjekt
   - Vis alle prosjekter

3. **Oppgavehåndtering**
   - Legg til oppgave under prosjekt
   - Marker oppgave som fullført
   - Sett deadline
   - Vis alle oppgaver per prosjekt

4. **Dashboard**
   - Oversikt over aktive prosjekter
   - Kommende deadlines (neste 7 dager)
   - Fremdrift (% ferdig per prosjekt)

### **SHOULD HAVE (Viktig, men ikke kritisk)**

1. **Filtrering og søk**
   - Søk i oppgaver
   - Filtrer på status (aktiv/fullført)

2. **Notifikasjoner**
   - Email-varsel 1 dag før deadline

### **COULD HAVE (Fint å ha)**

1. **Eksport**
   - Eksporter prosjekt som PDF

### **WON'T HAVE (Ikke i MVP)**

1. Team-funksjoner
2. Tidsregistrering
3. Fakturering
4. Mobile app
5. API-tilgang

---

## Definisjon av ferdig (MVP)

MVP er ferdig når:
- ✅ Alle "MUST HAVE"-funksjoner er implementert
- ✅ En freelancer kan opprette konto, legge til 3 prosjekter, og 10 oppgaver
- ✅ Grunnleggende sikkerhet er på plass (auth, input validering)
- ✅ Appen er deployet til staging og fungerer
- ✅ 3 test-brukere har testet og gitt positiv feedback

---

Neste steg: Fase 3 - Teknisk Design
```

---

## 🔍 Validering: Sjekk om du har alle filene

### **Sjekkliste etter Fase 6 (før lansering)**

Kjør disse kommandoene for å verifisere at alt er på plass:

```bash
# Fase 1
test -f docs/vision.md && echo "✅ vision.md" || echo "❌ vision.md MANGLER"
test -f docs/security/risikovurdering.md && echo "✅ risikovurdering.md" || echo "❌ risikovurdering.md MANGLER"

# Fase 2
test -f docs/krav/brukerhistorier.md && echo "✅ brukerhistorier.md" || echo "❌ brukerhistorier.md MANGLER"
test -f docs/krav/mvp-definition.md && echo "✅ mvp-definition.md" || echo "❌ mvp-definition.md MANGLER"

# Fase 3
test -f docs/teknisk-spec.md && echo "✅ teknisk-spec.md" || echo "❌ teknisk-spec.md MANGLER"
test -f docs/security/trusselmodell.md && echo "✅ trusselmodell.md" || echo "❌ trusselmodell.md MANGLER"

# Fase 4
test -f .env.example && echo "✅ .env.example" || echo "❌ .env.example MANGLER"
test -f .gitignore && echo "✅ .gitignore" || echo "❌ .gitignore MANGLER"

# Fase 6
test -f docs/security/owasp-rapport.md && echo "✅ owasp-rapport.md" || echo "❌ owasp-rapport.md MANGLER"
test -f docs/testing/e2e-testplan.md && echo "✅ e2e-testplan.md" || echo "❌ e2e-testplan.md MANGLER"
```

---

## 📞 Ressurser

- **START-HER.md** - Kom i gang raskt
- **QUICK-START-PROMPTS.md** - Kopier-klare prompts for å generere filer
- **DEMO-PROSJEKT.md** - Se et komplett eksempel
- **PROGRESS-TRACKER.md** - Følg fremdriften din

---

**Lykke til med struktureringen! 📁**

*Husk: En godt organisert filstruktur sparer deg for timer med leting senere.*

---

**Sist oppdatert:** 2026-01-06
**Versjon:** 1.0
