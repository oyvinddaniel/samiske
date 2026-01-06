# NIVÅ 3: Ekspert-agenter

**8 spesialiserte agenter med dyp ekspertise på spesifikke oppgaver**

Disse agentene kalles normalt automatisk av Prosess-agenter når det trengs, men kan også aktiveres direkte.

---

## Oversikt

Ekspert-agenter har dyp spesialkompetanse på sine områder. De er "eksperter" som kalles inn når Prosess-agenter trenger hjelp med spesifikke oppgaver som krever dypere kompetanse enn de generiske Basis-agentene kan tilby.

**Eksempler:**
- WIREFRAME-ekspert: Lager wireframes i Fase 2
- TRUSSELMODELLERINGS-ekspert: STRIDE-analyse i Fase 3
- OWASP-ekspert: OWASP Top 10 sikkerhetstesting i Fase 6

**Hvordan de aktiveres:**
```
PROSESS-agent (f.eks. KRAV-agent)
    ↓
    "Jeg trenger wireframes..."
    ↓
    Kaller WIREFRAME-ekspert
    ↓
    WIREFRAME-ekspert produserer wireframes
    ↓
    PROSESS-agent fortsetter med neste steg
```

**Du kan også aktivere dem direkte:**
```
Aktiver [EKSPERT-NAVN].
[Beskriv oppgave]
```

---

## De 8 Ekspert-agentene

### 🎨 [WIREFRAME-ekspert](ekspert/WIREFRAME-ekspert.md)

**Transformerer brukerflyt til visuelle wireframes**

Lager wireframes (skisser) av UI basert på funksjonsbeskrivelse og brukerflyt.

**Kalles av:**
- 📋 KRAV-agent (Fase 2)

**Når:**
- Wireframes skal lages for features
- UI-flyt skal visualiseres
- Brukeropplevelse skal skisseres

**Aktivering (direkte):**
```
Aktiver WIREFRAME-ekspert.
Lag wireframes for [funksjon/side] basert på [beskrivelse].
```

**Leveranser:**
- `docs/wireframes/[feature].md` (ASCII-art, beskrivelse, eller Mermaid diagram)

---

### ⚠️ [TRUSSELMODELLERINGS-ekspert](ekspert/TRUSSELMODELLERINGS-ekspert.md)

**Gjennomfører systematisk STRIDE-trusselmodellering**

Identifiserer sikkerhetstrusler ved hjelp av STRIDE-metodikken (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege).

**Kalles av:**
- 🏗️ ARKITEKTUR-agent (Fase 3)

**Når:**
- Trusselmodellering skal gjøres
- Arkitektur designes (Fase 3)
- Nye sikkerhetskritiske features legges til

**Aktivering (direkte):**
```
Aktiver TRUSSELMODELLERINGS-ekspert.
Gjennomfør STRIDE-analyse for [feature/system].
```

**Leveranser:**
- `docs/security/trusselmodell.md` (STRIDE-analyse med risikovurdering og mottiltak)

---

### 🔐 [OWASP-ekspert](ekspert/OWASP-ekspert.md)

**Tester mot OWASP Top 10 sikkerhetsstandarder**

Gjennomfører sikkerhetstest basert på OWASP Top 10 (de 10 vanligste sikkerhetsårene i webapplikasjoner).

**Kalles av:**
- ✅ KVALITETSSIKRINGS-agent (Fase 6)

**Når:**
- OWASP Top 10 sikkerhetstest skal gjøres
- Før deploy til produksjon
- Som del av release-testing

**Aktivering (direkte):**
```
Aktiver OWASP-ekspert.
Gjennomfør OWASP Top 10 test for [applikasjon].
```

**Leveranser:**
- `docs/security/owasp-test.md` (test-resultat for hver OWASP Top 10 kategori)

---

### 🔑 [HEMMELIGHETSSJEKK-ekspert](ekspert/HEMMELIGHETSSJEKK-ekspert.md)

**Finner hardkodede hemmeligheter i kode og git-historikk**

Søker etter API-nøkler, passord, tokens, og andre hemmeligheter som ikke skal commites.

**Kalles av:**
- ✅ KVALITETSSIKRINGS-agent (Fase 6)

**Når:**
- Før deploy til produksjon
- Secrets scanning skal gjøres
- Som del av CI/CD pipeline

**Aktivering (direkte):**
```
Aktiver HEMMELIGHETSSJEKK-ekspert.
Søk etter hemmeligheter i [kodebase/repository].
```

**Leveranser:**
- `docs/security/hemmelighetssjekk.md` (rapport med funn og handlingsplan)

---

### 📊 [GDPR-ekspert](ekspert/GDPR-ekspert.md)

**Vurderer GDPR-compliance og implementering**

Hjelper med å forstå og implementere GDPR-krav når persondata håndteres.

**Kalles av:**
- 📋 KRAV-agent (Fase 2) - når persondata identifiseres
- 🏗️ ARKITEKTUR-agent (Fase 3) - for GDPR-design

**Når:**
- Persondata skal håndteres
- GDPR-compliance skal vurderes
- Personvernerklæring skal lages

**Aktivering (direkte):**
```
Aktiver GDPR-ekspert.
Vurder GDPR-compliance for [feature/system].
```

**Leveranser:**
- `docs/gdpr/sjekkliste.md` (GDPR-sjekkliste)
- `docs/gdpr/personvernerklæring-template.md` (draft personvernerklæring)

---

### 🎯 [BRUKERTEST-ekspert](ekspert/BRUKERTEST-ekspert.md)

**Planlegger og analyserer brukertesting**

Hjelper med å planlegge, gjennomføre, og analysere brukertesting.

**Kalles av:**
- 🔄 ITERASJONS-agent (Fase 5) - kontinuerlig validering
- ✅ KVALITETSSIKRINGS-agent (Fase 6) - final user testing

**Når:**
- Brukertesting skal planlegges
- Brukervalidering trengs
- Feedback fra brukere skal analyseres

**Aktivering (direkte):**
```
Aktiver BRUKERTEST-ekspert.
Planlegg brukertesting for [feature/app].
```

**Leveranser:**
- `docs/brukertesting/[dato]-rapport.md` (testplan, funn, anbefalinger)

---

### ♿ [TILGJENGELIGHETS-ekspert](ekspert/TILGJENGELIGHETS-ekspert.md)

**Tester mot WCAG-standarder for tilgjengelighet**

Sikrer at applikasjonen er tilgjengelig for alle brukere, inkludert de med funksjonsnedsettelser.

**Kalles av:**
- ✅ KVALITETSSIKRINGS-agent (Fase 6)

**Når:**
- WCAG-testing skal gjøres
- Tilgjengelighet skal vurderes
- Før lansering (del av Fase 6)

**Aktivering (direkte):**
```
Aktiver TILGJENGELIGHETS-ekspert.
Test tilgjengelighet for [app/feature].
```

**Leveranser:**
- `docs/tilgjengelighet/rapport.md` (WCAG AA test-resultat)

---

### 📈 [YTELSE-ekspert](ekspert/YTELSE-ekspert.md)

**Måler og optimaliserer applikasjonens ytelse**

Analyserer og forbedrer ytelse (load times, bundle size, runtime performance).

**Kalles av:**
- 🔄 ITERASJONS-agent (Fase 5)

**Når:**
- Ytelsesoptimalisering trengs
- Performance-problemer oppdages
- Del av polering i Fase 5

**Aktivering (direkte):**
```
Aktiver YTELSE-ekspert.
Analyser og optimaliser ytelse for [app/feature].
```

**Leveranser:**
- `docs/ytelse/rapport.md` (metrics, bottlenecks, optimalisering)

---

## Quick Reference

| Ekspert | Type | Kalles av | Når | Kommando (direkte) |
|---------|------|-----------|-----|-------------------|
| 🎨 WIREFRAME | Design/UX | KRAV-agent | Wireframes | `Aktiver WIREFRAME-ekspert. Lag wireframes for [funksjon].` |
| ⚠️ TRUSSELMODELLERING | Sikkerhet | ARKITEKTUR-agent | Fase 3 | `Aktiver TRUSSELMODELLERINGS-ekspert. Gjennomfør STRIDE-analyse.` |
| 🔐 OWASP | Sikkerhet | KVALITETSSIKRINGS-agent | Fase 6 | `Aktiver OWASP-ekspert. Gjennomfør OWASP Top 10 test.` |
| 🔑 HEMMELIGHETSSJEKK | Sikkerhet | KVALITETSSIKRINGS-agent | Før deploy | `Aktiver HEMMELIGHETSSJEKK-ekspert. Søk etter hemmeligheter.` |
| 📊 GDPR | Compliance | KRAV/ARKITEKTUR-agent | Persondata | `Aktiver GDPR-ekspert. Vurder GDPR-compliance.` |
| 🎯 BRUKERTEST | Testing | ITERASJONS/KVALITETSSIKRINGS-agent | Brukervalidering | `Aktiver BRUKERTEST-ekspert. Planlegg brukertesting.` |
| ♿ TILGJENGELIGHET | Testing | KVALITETSSIKRINGS-agent | WCAG-test | `Aktiver TILGJENGELIGHETS-ekspert. Test tilgjengelighet.` |
| 📈 YTELSE | Optimalisering | ITERASJONS-agent | Performance | `Aktiver YTELSE-ekspert. Analyser ytelse.` |

---

## Ekspert-agenter per kategori

### 🎨 Design & UX (1 agent)
- **WIREFRAME-ekspert** - Visualiserer UI-flyt og layout

### 🔒 Sikkerhet (3 agenter)
- **TRUSSELMODELLERINGS-ekspert** - STRIDE-analyse
- **OWASP-ekspert** - OWASP Top 10 testing
- **HEMMELIGHETSSJEKK-ekspert** - Secrets scanning

### 📊 Personvern & Compliance (1 agent)
- **GDPR-ekspert** - GDPR-compliance

### 🎯 Testing & Kvalitet (2 agenter)
- **BRUKERTEST-ekspert** - User testing
- **TILGJENGELIGHETS-ekspert** - WCAG accessibility

### 📈 Ytelse (1 agent)
- **YTELSE-ekspert** - Performance optimization

---

## Hvordan bruke Ekspert-agenter

### 1. Automatisk (anbefalt)

La Prosess-agenter kalle Ekspert-agenter automatisk:

```
> Aktiver ARKITEKTUR-agent.
> Les docs/kravdokument.md og hjelp meg designe teknisk løsning.

ARKITEKTUR-agent:
"STEG 4: Trusselmodellering
For dette kaller jeg TRUSSELMODELLERINGS-ekspert."

[TRUSSELMODELLERINGS-ekspert aktiveres automatisk]

TRUSSELMODELLERINGS-ekspert:
"Jeg skal gjennomføre STRIDE-analyse for ditt system..."
```

**Fordeler:**
- Du slipper å huske hvilke eksperter som trengs når
- Prosess-agenten kaller dem på riktig tidspunkt
- Alt skjer automatisk i riktig rekkefølge

### 2. Manuelt (når nødvendig)

Aktiver Ekspert-agenter direkte når du har behov:

```
Aktiver [EKSPERT-NAVN].
[Beskriv oppgave]
```

**Eksempel:**
```
Aktiver OWASP-ekspert.
Gjennomfør OWASP Top 10 test for min Next.js app.
```

**Når bruke manuelt:**
- Du er utenfor Prosess A-Å
- Du trenger kun én spesifikk ekspertise
- Du gjør ad-hoc testing/validering

---

## Ekspert-agenter per fase

### Fase 1: OPPSTART
*Ingen ekspert-agenter brukes normalt*

### Fase 2: KRAV
- 🎨 **WIREFRAME-ekspert** - Lager UI-skisser
- 📊 **GDPR-ekspert** - Hvis persondata håndteres

### Fase 3: ARKITEKTUR
- ⚠️ **TRUSSELMODELLERINGS-ekspert** - STRIDE-analyse
- 📊 **GDPR-ekspert** - GDPR-design

### Fase 4: MVP
*Ingen ekspert-agenter brukes normalt (kun Basis-agenter)*

### Fase 5: ITERASJONS
- 🎯 **BRUKERTEST-ekspert** - Kontinuerlig brukervalidering
- 📈 **YTELSE-ekspert** - Performance-optimalisering

### Fase 6: KVALITETSSIKRINGS
- 🔐 **OWASP-ekspert** - OWASP Top 10 testing
- 🔑 **HEMMELIGHETSSJEKK-ekspert** - Secrets scanning
- ♿ **TILGJENGELIGHETS-ekspert** - WCAG testing
- 🎯 **BRUKERTEST-ekspert** - Final user testing
- 📊 **GDPR-ekspert** - Final compliance check

### Fase 7: PUBLISERINGS
*Ingen ekspert-agenter brukes normalt*

Se [AGENT-MAPPING-PER-FASE.md](AGENT-MAPPING-PER-FASE.md) for detaljert oversikt.

---

## Arbeidsflyt-eksempel: ARKITEKTUR-agent kaller TRUSSELMODELLERINGS-ekspert

**Scenario:** Du designer arkitektur for en app med brukerautentisering.

```
> Aktiver ARKITEKTUR-agent.
> Jeg skal designe arkitektur for min task manager-app med user auth.

ARKITEKTUR-agent:
"STEG 1: Tech Stack-valg
Jeg anbefaler:
- Frontend: Next.js
- Backend: Supabase (PostgreSQL + Auth)
- Hosting: Vercel

Er dette OK?"

> Ja

ARKITEKTUR-agent:
"STEG 4: Trusselmodellering
Siden appen har brukerautentisering, skal jeg gjennomføre STRIDE-analyse.
For dette kaller jeg TRUSSELMODELLERINGS-ekspert."

[TRUSSELMODELLERINGS-ekspert aktiveres]

TRUSSELMODELLERINGS-ekspert:
"Jeg skal gjennomføre STRIDE-analyse for din task manager-app.

STRIDE-ANALYSE:

1. SPOOFING (Identitetsforfalskning)
   Trussel: Angriper utgir seg for å være en annen bruker
   Risiko: HØY
   Mottiltak:
   - Multi-factor authentication (MFA)
   - Email verification
   - Password strength requirements
   - Rate limiting på login

2. TAMPERING (Manipulering av data)
   Trussel: Angriper endrer tasks som tilhører andre brukere
   Risiko: MIDDELS
   Mottiltak:
   - Row Level Security (RLS) i Supabase
   - Input validation
   - CSRF protection

...
[7 STRIDE-kategorier totalt]

LEVERANSE:
✅ docs/security/trusselmodell.md opprettet"

ARKITEKTUR-agent:
"Takk, TRUSSELMODELLERINGS-ekspert.

✅ Fase 3 fullført. Leveranser:
- docs/teknisk-spec.md
- docs/security/trusselmodell.md
- docs/arkitektur-diagram.png"
```

**Merk:** Du trengte ikke å aktivere TRUSSELMODELLERINGS-ekspert manuelt - ARKITEKTUR-agent gjorde det automatisk.

---

## Fordeler med Ekspert-agenter

✅ **Dyp spesialkompetanse** - Eksperter på sine felt
✅ **Automatisk koordinering** - Kalles av Prosess-agenter
✅ **Modulær** - Enkelt å legge til nye eksperter
✅ **Fokusert** - Gjør én ting veldig godt
✅ **Gjenbrukbar** - Samme ekspert brukes i flere faser

---

## Relasjon til andre agent-nivåer

### **NIVÅ 1: Basis-agenter**
Ekspert-agenter samarbeider med Basis-agenter:
- 📋 **DOKUMENTERER-agent** - Dokumenterer funn fra eksperter
- 🐛 **DEBUGGER-agent** - Fikser issues funnet av sikkerhetskeksperter
- 🛡️ **SIKKERHETS-agent** - Koordinerer med sikkerhetseksperter

Se [NIVÅ-1-BASIS-AGENTER.md](NIVÅ-1-BASIS-AGENTER.md)

### **NIVÅ 2: Prosess-agenter**
Prosess-agenter kaller Ekspert-agenter:
- 📋 **KRAV-agent** → kaller WIREFRAME-ekspert, GDPR-ekspert
- 🏗️ **ARKITEKTUR-agent** → kaller TRUSSELMODELLERINGS-ekspert, GDPR-ekspert
- 🔄 **ITERASJONS-agent** → kaller BRUKERTEST-ekspert, YTELSE-ekspert
- ✅ **KVALITETSSIKRINGS-agent** → kaller OWASP, HEMMELIGHETSSJEKK, TILGJENGELIGHET, BRUKERTEST

Se [NIVÅ-2-PROSESS-AGENTER.md](NIVÅ-2-PROSESS-AGENTER.md)

---

## Detaljerte spesifikasjoner

For fullstendige instruksjoner til AI for hver Ekspert-agent, se de individuelle filene i [ekspert/](ekspert/) mappen:

- [WIREFRAME-ekspert.md](ekspert/WIREFRAME-ekspert.md)
- [TRUSSELMODELLERINGS-ekspert.md](ekspert/TRUSSELMODELLERINGS-ekspert.md)
- [OWASP-ekspert.md](ekspert/OWASP-ekspert.md)
- [HEMMELIGHETSSJEKK-ekspert.md](ekspert/HEMMELIGHETSSJEKK-ekspert.md)
- [GDPR-ekspert.md](ekspert/GDPR-ekspert.md)
- [BRUKERTEST-ekspert.md](ekspert/BRUKERTEST-ekspert.md)
- [TILGJENGELIGHETS-ekspert.md](ekspert/TILGJENGELIGHETS-ekspert.md)
- [YTELSE-ekspert.md](ekspert/YTELSE-ekspert.md)

Hver fil inneholder:
- **FORMÅL** - Hva ekspert-agenten gjør
- **AKTIVERING** - Når og hvordan aktivere
- **PROSESS** - Detaljert steg-for-steg workflow
- **RETNINGSLINJER** - Hva agenten skal og ikke skal gjøre
- **LEVERANSER** - Hva ekspert-agenten produserer

---

## Neste steg

1. **La Prosess-agenter kalle eksperter automatisk** - anbefalt arbeidsflyt
2. **Aktiver direkte ved behov** - når du trenger spesifikk ekspertise
3. **Les ekspert-filene** - for å forstå hva hver ekspert gjør
4. **Se AGENT-MAPPING-PER-FASE.md** - oversikt over hvilke eksperter brukes i hvilke faser

Se også:
- [AGENT-MAPPING-PER-FASE.md](AGENT-MAPPING-PER-FASE.md) - Eksperter per fase
- [QUICK-START-PROMPTS.md](QUICK-START-PROMPTS.md) - Kopier-klare prompts

---

**Disse ekspertene gir dyp spesialkompetanse når du trenger det.**
