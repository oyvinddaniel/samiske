# NIVÅ 2: Prosess-agenter

**7 agenter som guider deg gjennom hver fase i Prosess A-Å**

Disse agentene koordinerer arbeidet i hver fase, kaller Basis-agenter og Ekspert-agenter når det trengs, og sørger for at alle leveranser blir laget.

---

## Oversikt

Prosess-agenter er koreografer av utviklingsprosessen. Hver agent er spesialist på sin fase og har ansvar for:
- Guide deg gjennom alle aktiviteter i fasen
- Kalle Basis-agenter når kode skal planlegges, bygges, reviewes, sikres, debugges eller dokumenteres
- Kalle Ekspert-agenter når spesialkompetanse trengs
- Sørge for at alle leveranser for fasen blir produsert
- Validere at fasen er fullført før du går videre

**Arbeidsflyt:**
```
PROSESS-agent
    ↓
    Kaller BASIS-agenter (PLANLEGGER, BYGGER, REVIEWER, etc.)
    ↓
    Kaller EKSPERT-agenter ved behov (WIREFRAME, TRUSSELMODELLERING, etc.)
    ↓
    Produserer leveranser
    ↓
    Validerer fullføring
```

---

## De 7 Prosess-agentene

### 🌱 [Fase 1: OPPSTART-agent](prosess/OPPSTART-agent.md)

**Idé, Visjon & Risikovurdering**

Definerer prosjektet klart, forstår risiko, og legger grunnlaget for sikker utvikling.

**Når brukes:**
- Når du starter et nytt prosjekt
- Når du har en idé som skal bli til et produkt
- Når du trenger å definere problemet og målgruppen

**Aktivering:**
```
Aktiver OPPSTART-agent.
Jeg skal starte et nytt prosjekt: [type produkt].
```

**Leveranser:**
- `docs/prosjektbeskrivelse.md`
- `docs/risikoregister.md`

**Kaller:**
- 📋 DOKUMENTERER-agent (for å lage docs)

---

### 📋 [Fase 2: KRAV-agent](prosess/KRAV-agent.md)

**Kravspesifikasjon (inkl. Sikkerhetskrav)**

Transformerer visjonen fra Fase 1 til konkrete, byggbare krav.

**Når brukes:**
- Etter Fase 1 er fullført
- Når du har prosjektbeskrivelse og risikoregister
- Når du trenger å definere funksjoner og krav

**Aktivering:**
```
Aktiver KRAV-agent.
Les docs/prosjektbeskrivelse.md og hjelp meg spesifisere krav.
```

**Leveranser:**
- `docs/kravdokument.md`
- `docs/wireframes/` (skisser)

**Kaller:**
- 🎨 WIREFRAME-ekspert (for UI-skisser)
- 📋 DOKUMENTERER-agent (for docs)

---

### 🏗️ [Fase 3: ARKITEKTUR-agent](prosess/ARKITEKTUR-agent.md)

**Teknisk Design og Trusselmodellering**

Bestemmer HVORDAN produktet skal bygges teknisk, med sikkerhet designet inn.

**Når brukes:**
- Etter Fase 2 er fullført
- Når du har kravdokument klart
- Når du skal velge tech stack og designe arkitektur

**Aktivering:**
```
Aktiver ARKITEKTUR-agent.
Les docs/kravdokument.md og hjelp meg designe teknisk løsning.
```

**Leveranser:**
- `docs/teknisk-spec.md`
- `docs/security/trusselmodell.md`
- `docs/arkitektur-diagram.png` (eller .md)

**Kaller:**
- ⚠️ TRUSSELMODELLERINGS-ekspert (STRIDE-analyse)
- 📋 DOKUMENTERER-agent (for docs)

---

### 🚀 [Fase 4: MVP-agent](prosess/MVP-agent.md)

**MVP/Prototype (med Sikker Koding)**

Får en fungerende, sikker prototype ut så raskt som mulig.

**Når brukes:**
- Etter Fase 3 er fullført
- Når du har teknisk spec klart
- Når du skal sette opp prosjekt og bygge første versjon

**Aktivering:**
```
Aktiver MVP-agent.
Sett opp prosjektet og bygg MVP basert på docs/teknisk-spec.md og docs/kravdokument.md
```

**Leveranser:**
- Fungerende prototype
- CI/CD pipeline konfigurert
- `README.md`

**Kaller:**
- 🎯 PLANLEGGER-agent (MVP task breakdown)
- 🔨 BYGGER-agent (implementering)
- 🔍 REVIEWER-agent (code review)
- 🛡️ SIKKERHETS-agent (security audit)
- 📋 DOKUMENTERER-agent (docs)

---

### 🔄 [Fase 5: ITERASJONS-agent](prosess/ITERASJONS-agent.md)

**Utvikling, Iterasjon & Kontinuerlig Validering**

Fullfører alle MVP-funksjoner, polerer, og kontinuerlig validerer med brukere.

**Når brukes:**
- Etter Fase 4 er fullført
- Når du har fungerende prototype
- Når du skal fullføre features og polere produktet

**Aktivering:**
```
Aktiver ITERASJONS-agent.
Fullføre MVP-funksjoner og polere produktet basert på docs/BACKLOG.md
```

**Leveranser:**
- Feature-komplett applikasjon
- SAST konfigurert
- Brukertest-notater

**Kaller:**
- 🎯 PLANLEGGER-agent (feature planning)
- 🔨 BYGGER-agent (implementering)
- 🔍 REVIEWER-agent (code review)
- 🛡️ SIKKERHETS-agent (SAST setup)
- 🐛 DEBUGGER-agent (bug fixing)
- 🎯 BRUKERTEST-ekspert (brukervalidering)
- 📈 YTELSE-ekspert (performance)
- 📋 DOKUMENTERER-agent (docs)

---

### ✅ [Fase 6: KVALITETSSIKRINGS-agent](prosess/KVALITETSSIKRINGS-agent.md)

**Testing, Sikkerhet & Kvalitetssikring**

Verifiserer at produktet er klart for lansering - fungerer, er sikkert, og er av høy kvalitet.

**Når brukes:**
- Etter Fase 5 er fullført
- Når du har feature-komplett applikasjon
- Når du skal teste og validere før lansering

**Aktivering:**
```
Aktiver KVALITETSSIKRINGS-agent.
Gjennomfør full testing og sikkerhetsvurdering før lansering.
```

**Leveranser:**
- `docs/testrapport.md`
- `docs/security/sikkerhetsrapport.md`
- Bug-fri (eller akseptert) applikasjon

**Kaller:**
- 🔐 OWASP-ekspert (OWASP Top 10)
- 🔑 HEMMELIGHETSSJEKK-ekspert (secrets scanning)
- ♿ TILGJENGELIGHETS-ekspert (WCAG)
- 🎯 BRUKERTEST-ekspert (final user testing)
- 📊 GDPR-ekspert (compliance)
- 🐛 DEBUGGER-agent (bug fixing)
- 📋 DOKUMENTERER-agent (docs)

---

### 🌐 [Fase 7: PUBLISERINGS-agent](prosess/PUBLISERINGS-agent.md)

**Publisering, Overvåking & Vedlikehold**

Lanserer produktet sikkert og setter opp systemer for drift og vedlikehold.

**Når brukes:**
- Etter Fase 6 er fullført
- Når du har testet og validert applikasjonen
- Når du skal publisere til produksjon

**Aktivering:**
```
Aktiver PUBLISERINGS-agent.
Publiser til produksjon og sett opp overvåking.
```

**Leveranser:**
- Live applikasjon
- `docs/drift.md`
- `docs/incident-response.md`
- Oppdatert `docs/logs/CHANGELOG.md`

**Kaller:**
- 🛡️ SIKKERHETS-agent (production hardening)
- 📋 DOKUMENTERER-agent (drift-docs)

---

## Quick Reference

| Fase | Agent | Formål | Fil | Viktigste leveranse |
|------|-------|--------|-----|-------------------|
| 1 | 🌱 OPPSTART | Idé & Risiko | [OPPSTART-agent.md](prosess/OPPSTART-agent.md) | prosjektbeskrivelse.md |
| 2 | 📋 KRAV | Kravspec | [KRAV-agent.md](prosess/KRAV-agent.md) | kravdokument.md |
| 3 | 🏗️ ARKITEKTUR | Tech Design | [ARKITEKTUR-agent.md](prosess/ARKITEKTUR-agent.md) | teknisk-spec.md |
| 4 | 🚀 MVP | Prototype | [MVP-agent.md](prosess/MVP-agent.md) | Fungerende prototype |
| 5 | 🔄 ITERASJONS | Fullføring | [ITERASJONS-agent.md](prosess/ITERASJONS-agent.md) | Feature-komplett app |
| 6 | ✅ KVALITETSSIKRINGS | Testing | [KVALITETSSIKRINGS-agent.md](prosess/KVALITETSSIKRINGS-agent.md) | testrapport.md |
| 7 | 🌐 PUBLISERINGS | Lansering | [PUBLISERINGS-agent.md](prosess/PUBLISERINGS-agent.md) | Live applikasjon |

---

## Hvordan bruke Prosess-agentene

### 1. Gå gjennom fasene sekvensielt

Prosess-agentene er designet for å følge Prosess A-Å:

```
Fase 1: OPPSTART
    ↓ (produserer prosjektbeskrivelse.md, risikoregister.md)
Fase 2: KRAV
    ↓ (produserer kravdokument.md, wireframes/)
Fase 3: ARKITEKTUR
    ↓ (produserer teknisk-spec.md, trusselmodell.md)
Fase 4: MVP
    ↓ (produserer fungerende prototype)
Fase 5: ITERASJONS
    ↓ (produserer feature-komplett applikasjon)
Fase 6: KVALITETSSIKRINGS
    ↓ (produserer testrapport.md, sikkerhetsrapport.md)
Fase 7: PUBLISERINGS
    ↓ (produserer live applikasjon)
```

**Ikke hopp over faser** - hver fase bygger på forrige.

### 2. Aktiver agenten for fasen

```
Aktiver [FASE]-agent.
[Beskriv kontekst/oppgave]
```

**Eksempel:**
```
Aktiver ARKITEKTUR-agent.
Les docs/kravdokument.md og hjelp meg designe teknisk løsning.
```

### 3. La agenten koordinere

Prosess-agenten vil:
- Guide deg gjennom alle steg i fasen
- Kalle Basis-agenter når kode skal håndteres
- Kalle Ekspert-agenter når spesialkompetanse trengs
- Produsere alle nødvendige leveranser
- Validere at fasen er fullført

**Du trenger ikke å kalle Basis-agenter eller Ekspert-agenter manuelt** - Prosess-agenten gjør dette automatisk.

### 4. Fullfør leveransene

Hver fase har spesifikke leveranser som MÅ være på plass før du går videre til neste fase.

**Eksempel - Fase 3:**
- ✅ `docs/teknisk-spec.md` (tech stack, database-skjema, API-design)
- ✅ `docs/security/trusselmodell.md` (STRIDE-analyse)
- ✅ `docs/arkitektur-diagram.png` (visuell oversikt)

Prosess-agenten vil fortelle deg når alle leveranser er klare.

### 5. Godkjenn før neste fase

Før du går til neste fase, sjekk:
- ✅ Alle leveranser er produsert
- ✅ Du forstår og godkjenner beslutningene
- ✅ Ingen kritiske spørsmål er ubesvart

---

## Arbeidsflyt-eksempel: Fra idé til produksjon

**Scenario:** Du vil bygge en task manager-app.

### **Fase 1: OPPSTART**
```
> Aktiver OPPSTART-agent.
> Jeg skal bygge en task manager-app.

OPPSTART-agent:
"La meg stille spørsmål om prosjektet..."
[9 steg senere]
"✅ Fase 1 fullført. Leveranser:
- docs/prosjektbeskrivelse.md
- docs/risikoregister.md"
```

### **Fase 2: KRAV**
```
> Aktiver KRAV-agent.
> Les docs/prosjektbeskrivelse.md og hjelp meg spesifisere krav.

KRAV-agent:
"Jeg leser prosjektbeskrivelsen..."
[Kaller WIREFRAME-ekspert for UI-skisser]
"✅ Fase 2 fullført. Leveranser:
- docs/kravdokument.md
- docs/wireframes/"
```

### **Fase 3: ARKITEKTUR**
```
> Aktiver ARKITEKTUR-agent.
> Les docs/kravdokument.md og hjelp meg designe teknisk løsning.

ARKITEKTUR-agent:
"Jeg anbefaler Next.js, Supabase, Vercel..."
[Kaller TRUSSELMODELLERINGS-ekspert]
"✅ Fase 3 fullført. Leveranser:
- docs/teknisk-spec.md
- docs/security/trusselmodell.md"
```

### **Fase 4-7:**
Fortsett på samme måte gjennom MVP, ITERASJONS, KVALITETSSIKRINGS, og PUBLISERINGS.

---

## Fordeler med Prosess-agenter

✅ **Strukturert** - Følger beprøvd utviklingsprosess
✅ **Automatisk koordinering** - Kaller riktige agenter automatisk
✅ **Komplett** - Sørger for at ingen steg hoppes over
✅ **Skalerbar** - Fungerer for små og store prosjekter
✅ **Sikkerhet innbakt** - Security i hver fase, ikke bare til slutt
✅ **Dokumentasjon automatisk** - Docs oppdateres underveis

---

## Relasjon til andre agent-nivåer

### **NIVÅ 1: Basis-agenter**
Prosess-agenter kaller Basis-agenter når kode skal håndteres:
- 🎯 PLANLEGGER-agent - Bryter ned features til tasks
- 🔨 BYGGER-agent - Implementerer kode
- 🔍 REVIEWER-agent - Reviewer kode
- 🛡️ SIKKERHETS-agent - Security audit
- 🐛 DEBUGGER-agent - Fikser bugs
- 📋 DOKUMENTERER-agent - Oppdaterer docs

Se [NIVÅ-1-BASIS-AGENTER.md](NIVÅ-1-BASIS-AGENTER.md)

### **NIVÅ 3: Ekspert-agenter**
Prosess-agenter kaller Ekspert-agenter når spesialkompetanse trengs:
- 🎨 WIREFRAME-ekspert - UI-skisser (Fase 2)
- ⚠️ TRUSSELMODELLERINGS-ekspert - STRIDE (Fase 3)
- 🔐 OWASP-ekspert - OWASP Top 10 (Fase 6)
- 🔑 HEMMELIGHETSSJEKK-ekspert - Secrets scanning (Fase 6)
- 📊 GDPR-ekspert - GDPR compliance (Fase 6)
- 🎯 BRUKERTEST-ekspert - User testing (Fase 5, 6)
- ♿ TILGJENGELIGHETS-ekspert - WCAG (Fase 6)
- 📈 YTELSE-ekspert - Performance (Fase 5)

Se [NIVÅ-3-EKSPERT-AGENTER.md](NIVÅ-3-EKSPERT-AGENTER.md)

---

## Detaljerte spesifikasjoner

For fullstendige instruksjoner til AI for hver Prosess-agent, se de individuelle filene i [prosess/](prosess/) mappen:

- [OPPSTART-agent.md](prosess/OPPSTART-agent.md)
- [KRAV-agent.md](prosess/KRAV-agent.md)
- [ARKITEKTUR-agent.md](prosess/ARKITEKTUR-agent.md)
- [MVP-agent.md](prosess/MVP-agent.md)
- [ITERASJONS-agent.md](prosess/ITERASJONS-agent.md)
- [KVALITETSSIKRINGS-agent.md](prosess/KVALITETSSIKRINGS-agent.md)
- [PUBLISERINGS-agent.md](prosess/PUBLISERINGS-agent.md)

Hver fil inneholder:
- **FORMÅL** - Hva agenten skal oppnå i denne fasen
- **AKTIVERING** - Prompt for å aktivere agenten
- **INSTRUKSJON TIL AI** - Detaljert steg-for-steg workflow
- **LEVERANSER** - Hva agenten produserer
- **KALLER** - Hvilke andre agenter som kalles

---

## Neste steg

1. **Start med Fase 1** - Aktiver OPPSTART-agent
2. **Følg fasene sekvensielt** - ikke hopp over
3. **La agentene koordinere** - de kaller andre agenter automatisk
4. **Fullfør alle leveranser** - før du går til neste fase
5. **Bruk AGENT-MAPPING-PER-FASE.md** - for oversikt over hvilke agenter som brukes i hver fase

Se også:
- [AGENT-MAPPING-PER-FASE.md](AGENT-MAPPING-PER-FASE.md) - Oversikt per fase
- [QUICK-START-PROMPTS.md](QUICK-START-PROMPTS.md) - Kopier-klare prompts

---

**Disse agentene styrer hele utviklingsprosessen fra start til produksjon.**
