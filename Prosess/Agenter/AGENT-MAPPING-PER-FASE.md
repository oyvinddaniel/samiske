# Agent-mapping per fase

**Hvilke agenter brukes i hvilken fase av Prosess A-Å?**

Dette dokumentet viser nøyaktig hvilke agenter som er aktive i hver fase, hvilke aktiviteter de håndterer, og hvilke leveranser de produserer.

---

## Fase 1: Idé, Visjon & Risikovurdering

**Primær agent: 🌱 OPPSTART-agent**

| Aktivitet | Primær agent | Støtte-agenter | Leveranse |
|-----------|--------------|----------------|-----------|
| Problemdefinisjon | OPPSTART-agent | - | `docs/vision.md` |
| Målgruppedefinisjon | OPPSTART-agent | - | Del av `vision.md` |
| Dataklassifisering | OPPSTART-agent | - | `docs/security/dataklassifisering.md` |
| Risikovurdering | OPPSTART-agent | - | `docs/security/risikovurdering.md` |
| Kostnads/nyttevurdering | OPPSTART-agent | - | Del av `vision.md` |

### Arbeidsflyt Fase 1

```
1. Aktiver OPPSTART-agent
2. Agent guider deg gjennom problemdefinisjon
3. Agent klassifiserer data
4. Agent vurderer risiko
5. Agent lager vision.md
```

**Når er du ferdig med Fase 1?**
- ✅ Du har en klar problemdefinisjon
- ✅ Dataklassifisering er gjort
- ✅ Risikovurdering er dokumentert
- ✅ `docs/vision.md` er skrevet
- ✅ `docs/security/dataklassifisering.md` er skrevet
- ✅ `docs/security/risikovurdering.md` er skrevet

---

## Fase 2: Kravspesifikasjon inkl. Sikkerhetskrav

**Primær agent: 📋 KRAV-agent**

| Aktivitet | Primær agent | Støtte-agenter | Leveranse |
|-----------|--------------|----------------|-----------|
| Brukerhistorier | KRAV-agent | - | `docs/krav/brukerhistorier.md` |
| Datamodell | KRAV-agent | - | `docs/krav/datamodell.md` |
| Sikkerhetskrav | KRAV-agent | - | `docs/krav/sikkerhetskrav.md` |
| MVP-definisjon | KRAV-agent | - | `docs/krav/mvp-definition.md` |
| Edge cases | KRAV-agent | - | `docs/krav/edge-cases.md` |
| Wireframes (valgfritt) | KRAV-agent | WIREFRAME-ekspert | `docs/krav/wireframes/` |

### Arbeidsflyt Fase 2

```
1. Aktiver KRAV-agent
2. Agent leser vision.md
3. Agent lager brukerhistorier (må/bør/kan ha)
4. Agent definerer datamodell
5. Agent definerer sikkerhetskrav
6. Agent identifiserer edge cases
7. (Valgfritt) Agent kaller WIREFRAME-ekspert for UI-skisser
```

**Når er du ferdig med Fase 2?**
- ✅ Alle brukerhistorier er dokumentert med MoSCoW
- ✅ Datamodell er tegnet og dokumentert
- ✅ Sikkerhetskrav er spesifisert
- ✅ MVP er klart definert
- ✅ Edge cases er identifisert
- ✅ (Valgfritt) Wireframes er laget

---

## Fase 3: Teknisk Design og Trusselmodellering

**Primær agent: 🏗️ ARKITEKTUR-agent**

| Aktivitet | Primær agent | Støtte-agenter | Leveranse |
|-----------|--------------|----------------|-----------|
| Tech stack-valg | ARKITEKTUR-agent | - | `docs/teknisk-spec.md` |
| Database-design | ARKITEKTUR-agent | - | `docs/database-schema.md` |
| Autentisering/autorisasjon | ARKITEKTUR-agent | - | Del av teknisk spec |
| API-design | ARKITEKTUR-agent | - | `docs/api-design.md` |
| Trusselmodellering (STRIDE) | ARKITEKTUR-agent | TRUSSELMODELLERINGS-ekspert | `docs/security/trusselmodell.md` |
| Arkitektur-diagram | ARKITEKTUR-agent | - | `docs/arkitektur-diagram.png` |

### Arbeidsflyt Fase 3

```
1. Aktiver ARKITEKTUR-agent
2. Agent leser kravdokumentene
3. Agent foreslår tech stack
4. Agent designer database-skjema
5. Agent designer API-endepunkter
6. Agent designer auth/authz-system
7. Agent kaller TRUSSELMODELLERINGS-ekspert
8. TRUSSELMODELLERINGS-ekspert gjennomfører STRIDE-analyse
9. Agent dokumenterer alt i teknisk spec
```

**Når er du ferdig med Fase 3?**
- ✅ Tech stack er valgt og dokumentert
- ✅ Database-skjema er designet
- ✅ API-endepunkter er definert
- ✅ Auth/authz-system er designet
- ✅ STRIDE-trusselmodellering er gjennomført
- ✅ Arkitektur-diagram er laget
- ✅ `docs/teknisk-spec.md` er komplett

---

## Fase 4: MVP/Prototype (med Sikker Koding)

**Primær agent: 🚀 MVP-agent**

| Aktivitet | Primær agent | Støtte-agenter | Leveranse |
|-----------|--------------|----------------|-----------|
| Prosjektoppsett | MVP-agent | - | Initialisert prosjekt |
| Git-oppsett | MVP-agent | - | `.git/`, `.gitignore` |
| CI/CD-oppsett | MVP-agent | - | `.github/workflows/` |
| Secrets-håndtering | MVP-agent | HEMMELIGHETSSJEKK-ekspert | `.env.example`, dokumentasjon |
| Database-setup | MVP-agent | - | Migreringer, RLS policies |
| Auth-implementasjon | MVP-agent | SIKKERHETS-agent | Auth-kode med sikkerhet |
| Én kjernefunksjon (prototype) | MVP-agent | BYGGER-agent | Fungerende prototype |
| Input-validering | MVP-agent | SIKKERHETS-agent | Valideringskode |
| Grunnleggende tester | MVP-agent | - | Test-filer |

### Arbeidsflyt Fase 4

```
1. Aktiver MVP-agent
2. Agent setter opp prosjekt (Next.js/Supabase/Vercel)
3. Agent setter opp Git repo
4. Agent setter opp CI/CD pipeline
5. Agent kaller HEMMELIGHETSSJEKK-ekspert for secrets-håndtering
6. Agent setter opp database med RLS
7. Agent implementerer autentisering
8. Agent kaller BYGGER-agent for å bygge én kjernefunksjon
9. BYGGER-agent bygger i 3 stages (UI → Funksjon → Sikkerhet)
10. Agent implementerer grunnleggende tester
11. Agent deployer til staging
```

**Når er du ferdig med Fase 4?**
- ✅ Prosjekt er satt opp med valgt stack
- ✅ Git repo er initialisert
- ✅ CI/CD kjører automatiske tester ved push
- ✅ Secrets håndteres trygt (ikke i kode)
- ✅ Database er satt opp med RLS
- ✅ Autentisering fungerer
- ✅ Én kjernefunksjon er implementert og fungerer
- ✅ Input-validering er på plass
- ✅ Grunnleggende tester kjører og passerer
- ✅ Appen er deployet til staging-miljø

---

## Fase 5: Utvikling, Iterasjon & Kontinuerlig Validering

**Primær agent: 🔄 ITERASJONS-agent**

| Aktivitet | Primær agent | Støtte-agenter | Leveranse |
|-----------|--------------|----------------|-----------|
| Fullføre MVP-funksjoner | ITERASJONS-agent | PLANLEGGER-agent, BYGGER-agent | Feature-komplett app |
| Code review | ITERASJONS-agent | REVIEWER-agent | Kvalitetssikret kode |
| Brukervalidering | ITERASJONS-agent | BRUKERTEST-ekspert | Bruker-feedback rapport |
| SAST (Static Analysis) | ITERASJONS-agent | SIKKERHETS-agent | Sikkerhetsskanningsrapport |
| Feilhåndtering (komplett) | ITERASJONS-agent | BYGGER-agent | Robust feilhåndtering |
| Polert UI/UX | ITERASJONS-agent | BYGGER-agent | Polert brukergrensesnitt |
| Ytelsesoptimalisering | ITERASJONS-agent | YTELSE-ekspert | Ytelsesrapport + optimaliseringer |
| Loading/tomme tilstander | ITERASJONS-agent | BYGGER-agent | Forbedret UX |
| Sekundære funksjoner | ITERASJONS-agent | PLANLEGGER-agent, BYGGER-agent | Ekstra features |
| Eksport/import | ITERASJONS-agent | BYGGER-agent | Data-portabilitet |

### Arbeidsflyt Fase 5

```
1. Aktiver ITERASJONS-agent
2. Agent leser MVP-definition og ser hva som mangler
3. For hver feature:
   a. Agent kaller PLANLEGGER-agent for PRD
   b. Agent kaller BYGGER-agent for implementasjon
   c. Agent kaller REVIEWER-agent for code review
   d. Agent kaller SIKKERHETS-agent for security review
4. Agent kaller BRUKERTEST-ekspert for brukervalidering
5. Agent setter opp SAST-verktøy (CodeQL, Dependabot)
6. Agent implementerer komplett feilhåndtering
7. Agent polerer UI/UX
8. Agent kaller YTELSE-ekspert for optimalisering
9. Agent implementerer loading/tomme tilstander
10. Agent implementerer sekundære funksjoner (tid tillater)
11. Agent implementerer eksport/import (hvis relevant)
```

**Når er du ferdig med Fase 5?**
- ✅ Alle MVP-funksjoner er implementert
- ✅ Code review er gjennomført for all kode
- ✅ Brukervalidering er gjennomført og feedback adressert
- ✅ SAST-verktøy kjører i CI/CD
- ✅ Komplett feilhåndtering er implementert
- ✅ UI/UX er polert og profesjonelt
- ✅ Ytelse er god (Lighthouse score > 90)
- ✅ Loading/tomme tilstander er implementert
- ✅ Sekundære funksjoner er vurdert/implementert
- ✅ Eksport/import er implementert (hvis relevant)

---

## Fase 6: Testing, Sikkerhet & Kvalitetssikring

**Primær agent: ✅ KVALITETSSIKRINGS-agent**

| Aktivitet | Primær agent | Støtte-agenter | Leveranse |
|-----------|--------------|----------------|-----------|
| End-to-end testing | KVALITETSSIKRINGS-agent | - | E2E test suite |
| OWASP Top 10 testing | KVALITETSSIKRINGS-agent | OWASP-ekspert | Sikkerhetsrapport |
| Hemmelighetssjekk | KVALITETSSIKRINGS-agent | HEMMELIGHETSSJEKK-ekspert | Secrets audit rapport |
| GDPR-compliance (hvis relevant) | KVALITETSSIKRINGS-agent | GDPR-ekspert | GDPR compliance rapport |
| Tilgjengelighetstesting (WCAG) | KVALITETSSIKRINGS-agent | TILGJENGELIGHETS-ekspert | Accessibility rapport |
| Cross-browser testing | KVALITETSSIKRINGS-agent | - | Kompatibilitetsrapport |
| Last-testing (hvis relevant) | KVALITETSSIKRINGS-agent | YTELSE-ekspert | Last-testrapport |
| Dokumentasjon oppdatert | KVALITETSSIKRINGS-agent | DOKUMENTERER-agent | Oppdatert dokumentasjon |
| Produksjonslignende test | KVALITETSSIKRINGS-agent | - | Testrapport staging-miljø |

### Arbeidsflyt Fase 6

```
1. Aktiver KVALITETSSIKRINGS-agent
2. Agent implementerer E2E-tester (Playwright/Cypress)
3. Agent kaller OWASP-ekspert for OWASP Top 10 testing
4. OWASP-ekspert tester hver sårbarhet manuelt
5. Agent kaller HEMMELIGHETSSJEKK-ekspert
6. HEMMELIGHETSSJEKK-ekspert skanner kode + git historikk
7. (Hvis persondata) Agent kaller GDPR-ekspert
8. Agent kaller TILGJENGELIGHETS-ekspert for WCAG-testing
9. Agent tester i Chrome, Firefox, Safari, Edge
10. (Hvis relevant) Agent kaller YTELSE-ekspert for last-testing
11. Agent kaller DOKUMENTERER-agent for å oppdatere docs
12. Agent kjører full test-suite i staging-miljø
13. Agent lager sjekklisterapport for deploy
```

**Når er du ferdig med Fase 6?**
- ✅ E2E-tester dekker alle kritiske brukerflyter
- ✅ OWASP Top 10 testing gjennomført, ingen kritiske funn
- ✅ Hemmelighetssjekk gjennomført, ingen secrets i kode/git
- ✅ GDPR-compliance verifisert (hvis relevant)
- ✅ WCAG AA-nivå oppnådd (hvis kundevendt)
- ✅ Cross-browser testing gjennomført
- ✅ Last-testing gjennomført (hvis relevant)
- ✅ Dokumentasjon er oppdatert og komplett
- ✅ Alle tester passerer i staging-miljø
- ✅ Deploy-sjekkliste er klar

---

## Fase 7: Publisering, Overvåking & Vedlikehold

**Primær agent: 🌐 PUBLISERINGS-agent**

| Aktivitet | Primær agent | Støtte-agenter | Leveranse |
|-----------|--------------|----------------|-----------|
| Produksjonsmiljø-oppsett | PUBLISERINGS-agent | SIKKERHETS-agent | Produksjonsmiljø |
| Security headers | PUBLISERINGS-agent | SIKKERHETS-agent | Sikre HTTP-headere |
| SSL/TLS-sertifikat | PUBLISERINGS-agent | - | HTTPS-konfigurasjon |
| DNS-oppsett | PUBLISERINGS-agent | - | Domene konfigurert |
| Backup-strategi | PUBLISERINGS-agent | - | Backup-system |
| Logging og overvåking | PUBLISERINGS-agent | - | Logging-system (Sentry/etc) |
| Alerting | PUBLISERINGS-agent | - | Alert-system |
| Incident Response-plan | PUBLISERINGS-agent | SIKKERHETS-agent | IR-plan dokument |
| Dokumenter deployment | PUBLISERINGS-agent | DOKUMENTERER-agent | Deployment guide |
| Vedlikeholdsplan | PUBLISERINGS-agent | - | Vedlikeholdsplan |
| Deploy til produksjon | PUBLISERINGS-agent | - | Live app |
| Post-deploy smoke test | PUBLISERINGS-agent | - | Verifisering produksjon OK |

### Arbeidsflyt Fase 7

```
1. Aktiver PUBLISERINGS-agent
2. Agent setter opp produksjonsmiljø (Vercel/etc)
3. Agent kaller SIKKERHETS-agent for security headers
4. Agent konfigurerer SSL/TLS
5. Agent setter opp DNS med domene
6. Agent konfigurerer backup-strategi
7. Agent setter opp logging (Sentry, Vercel Analytics, etc)
8. Agent setter opp alerting for kritiske feil
9. Agent kaller SIKKERHETS-agent for Incident Response-plan
10. Agent kaller DOKUMENTERER-agent for deployment guide
11. Agent lager vedlikeholdsplan
12. Agent deployer til produksjon
13. Agent kjører smoke tests i produksjon
14. Agent verifiserer at alt fungerer
```

**Når er du ferdig med Fase 7?**
- ✅ Produksjonsmiljø er satt opp med riktig konfigurasjon
- ✅ Security headers er konfigurert (A+ på securityheaders.com)
- ✅ SSL/TLS fungerer (A+ på SSL Labs)
- ✅ DNS er konfigurert og domene fungerer
- ✅ Backup kjører automatisk
- ✅ Logging fanger feil og viktige hendelser
- ✅ Alerting varsler deg ved kritiske problemer
- ✅ Incident Response-plan er dokumentert
- ✅ Deployment er dokumentert
- ✅ Vedlikeholdsplan er laget
- ✅ App er live i produksjon
- ✅ Smoke tests passerer i produksjon

---

## Basis-agenter: Brukes på tvers av alle faser

Disse agentene kan aktiveres når som helst, i enhver fase:

### 🎯 PLANLEGGER-agent
**Når brukes den?**
- Når du skal starte en ny feature eller funksjon
- Når du trenger en PRD (Product Requirements Document)
- Når du skal bryte ned en stor oppgave

**Brukes typisk i:**
- Fase 2 (Kravspesifikasjon)
- Fase 5 (Nye features under iterasjon)

### 🔨 BYGGER-agent
**Når brukes den?**
- Når du skal implementere kode basert på en PRD
- Når du skal bygge UI-komponenter
- Når du skal implementere backend-logikk

**Brukes typisk i:**
- Fase 4 (MVP-prototype)
- Fase 5 (Feature-implementasjon)

### 🔍 REVIEWER-agent
**Når brukes den?**
- Etter at kode er skrevet
- Før kode merges til main branch
- Når du vil ha kvalitetssjekk

**Brukes typisk i:**
- Fase 5 (Code review av features)
- Fase 6 (Final review før testing)

### 🛡️ SIKKERHETS-agent
**Når brukes den?**
- Før deploy til produksjon
- Når sikkerhetskritisk kode er skrevet
- For security audit av eksisterende kode

**Brukes typisk i:**
- Fase 4 (Sikkerhet i MVP)
- Fase 5 (Sikkerhet i nye features)
- Fase 6 (Final security audit)
- Fase 7 (Pre-deploy security check)

### 🐛 DEBUGGER-agent
**Når brukes den?**
- Når du har en bug som må fikses
- Når tester feiler
- Når noe ikke fungerer som forventet

**Brukes typisk i:**
- Alle faser når bugs oppstår
- Spesielt Fase 5 og 6

### 📋 DOKUMENTERER-agent
**Når brukes den?**
- Når dokumentasjon må oppdateres
- Etter nye features er lagt til
- Før lansering

**Brukes typisk i:**
- Fase 6 (Oppdatere docs før testing)
- Fase 7 (Deployment-dokumentasjon)
- Løpende ved store endringer

---

## Ekspert-agenter: Kalles av Prosess-agenter ved behov

Disse er spesialiserte agenter som Prosess-agentene kaller når de trenger ekspertise:

| Ekspert-agent | Kalles av | I hvilken fase |
|---------------|-----------|----------------|
| 🎨 WIREFRAME-ekspert | KRAV-agent | Fase 2 |
| ⚠️ TRUSSELMODELLERINGS-ekspert | ARKITEKTUR-agent | Fase 3 |
| 🔐 OWASP-ekspert | KVALITETSSIKRINGS-agent | Fase 6 |
| 🔑 HEMMELIGHETSSJEKK-ekspert | MVP-agent, KVALITETSSIKRINGS-agent | Fase 4, 6 |
| 📊 GDPR-ekspert | KVALITETSSIKRINGS-agent | Fase 6 |
| 🎯 BRUKERTEST-ekspert | ITERASJONS-agent | Fase 5 |
| ♿ TILGJENGELIGHETS-ekspert | KVALITETSSIKRINGS-agent | Fase 6 |
| 📈 YTELSE-ekspert | ITERASJONS-agent, KVALITETSSIKRINGS-agent | Fase 5, 6 |

---

## Quick Reference: Hvilken fase er jeg i?

### 🤔 "Jeg har en idé, men har ikke startet noe ennå"
→ **FASE 1** - Aktiver OPPSTART-agent

### 📝 "Jeg vet hva jeg vil bygge, men trenger å definere krav"
→ **FASE 2** - Aktiver KRAV-agent

### 🏗️ "Jeg har kravene klare, men trenger å designe løsningen"
→ **FASE 3** - Aktiver ARKITEKTUR-agent

### 🚀 "Jeg vil starte å kode og bygge en prototype"
→ **FASE 4** - Aktiver MVP-agent

### 🔄 "Jeg har en prototype, men trenger å fullføre funksjonene"
→ **FASE 5** - Aktiver ITERASJONS-agent

### ✅ "Jeg er nesten ferdig, men må teste grundig før lansering"
→ **FASE 6** - Aktiver KVALITETSSIKRINGS-agent

### 🌐 "Alt er testet, jeg er klar til å publisere"
→ **FASE 7** - Aktiver PUBLISERINGS-agent

### 🐛 "Jeg har en bug som må fikses" (når som helst)
→ Aktiver DEBUGGER-agent

### 📄 "Dokumentasjonen min må oppdateres" (når som helst)
→ Aktiver DOKUMENTERER-agent

---

## Vanlige arbeidsflyter

### Scenario 1: Start et helt nytt prosjekt

```
FASE 1: Aktiver OPPSTART-agent
   ↓
FASE 2: Aktiver KRAV-agent
   ↓ (valgfritt kaller WIREFRAME-ekspert)
FASE 3: Aktiver ARKITEKTUR-agent
   ↓ (kaller TRUSSELMODELLERINGS-ekspert)
FASE 4: Aktiver MVP-agent
   ↓ (kaller BYGGER-agent, HEMMELIGHETSSJEKK-ekspert, SIKKERHETS-agent)
FASE 5: Aktiver ITERASJONS-agent
   ↓ (kaller PLANLEGGER, BYGGER, REVIEWER, SIKKERHETS, BRUKERTEST-ekspert, YTELSE-ekspert)
FASE 6: Aktiver KVALITETSSIKRINGS-agent
   ↓ (kaller OWASP-ekspert, HEMMELIGHETSSJEKK-ekspert, GDPR-ekspert, TILGJENGELIGHETS-ekspert)
FASE 7: Aktiver PUBLISERINGS-agent
   ↓ (kaller SIKKERHETS-agent, DOKUMENTERER-agent)
FERDIG: Appen er live!
```

### Scenario 2: Legge til ny feature i eksisterende app

```
1. Aktiver PLANLEGGER-agent
   → Lag PRD for featuren

2. Aktiver BYGGER-agent
   → Implementer featuren (3 stages: UI → Funksjon → Sikkerhet)

3. Aktiver REVIEWER-agent
   → Code review av ny kode

4. Aktiver SIKKERHETS-agent
   → Security audit av featuren

5. Kjør tester, deploy til staging

6. Aktiver BRUKERTEST-ekspert (valgfritt)
   → Få bruker-feedback

7. Deploy til produksjon
```

### Scenario 3: Fikse en kritisk sikkerhetssårbarhet

```
1. Aktiver DEBUGGER-agent
   → Identifiser problemet

2. Aktiver SIKKERHETS-agent
   → Vurder alvorlighetsgrad og tiltak

3. Aktiver BYGGER-agent
   → Implementer fix

4. Aktiver REVIEWER-agent
   → Review av fix

5. Kjør full test-suite

6. Aktiver OWASP-ekspert (valgfritt)
   → Verifiser at sårbarheten er fikset

7. Emergency deploy til produksjon

8. Aktiver DOKUMENTERER-agent
   → Dokumenter incident og fix
```

### Scenario 4: Forberede eksisterende app for produksjon

```
Start i FASE 6:

1. Aktiver KVALITETSSIKRINGS-agent
   → Agent orchestrerer full test og sikkerhet
   → Kaller OWASP-ekspert
   → Kaller HEMMELIGHETSSJEKK-ekspert
   → Kaller GDPR-ekspert (hvis relevant)
   → Kaller TILGJENGELIGHETS-ekspert

2. Fikse alle funn fra testing
   → Bruk DEBUGGER-agent og BYGGER-agent

3. Aktiver DOKUMENTERER-agent
   → Oppdater all dokumentasjon

4. Gå til FASE 7:
   Aktiver PUBLISERINGS-agent
   → Deploy til produksjon
```

---

## Tips for effektiv bruk av agenter

### ✅ DO: Følg hierarkiet

- Start med **Prosess-agent** for fasen du er i
- La Prosess-agenten kalle **Basis-agenter** og **Ekspert-agenter**
- Stol på at Prosess-agenten vet hvilke agenter som trengs

### ✅ DO: Vær tydelig på kontekst

Når du aktiverer en agent, gi den kontekst:
```
Aktiver ARKITEKTUR-agent.
Les docs/kravdokument.md og hjelp meg designe teknisk løsning for en SaaS-app med 1000+ brukere.
```

### ✅ DO: Bekreft før store beslutninger

Agentene foreslår løsninger - du godkjenner før de går videre:
```
Agent: "Jeg anbefaler Next.js + Supabase. Er dette OK?"
Du: "Ja, fortsett"
```

### ❌ DON'T: Hopp over faser

Ikke gå direkte til Fase 4 uten å ha gjort Fase 1-3. Hver fase bygger på forrige.

### ❌ DON'T: Aktiver flere Prosess-agenter samtidig

Kun én Prosess-agent om gangen. Fullfør fasen før du går videre.

### ❌ DON'T: Micromanage Basis-agenter

La Prosess-agenten koordinere Basis-agentene. Du trenger vanligvis ikke kalle dem direkte.

**Unntak:** DEBUGGER-agent og DOKUMENTERER-agent kan kalles direkte når som helst.

---

## Neste steg

For kopier-klare prompts, se [QUICK-START-PROMPTS.md](QUICK-START-PROMPTS.md)
