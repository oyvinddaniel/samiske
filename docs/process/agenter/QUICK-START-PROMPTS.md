# Quick-Start Prompts

**Kopier-klare prompts for å aktivere agenter**

Dette dokumentet inneholder ferdigskrevne prompts du kan kopiere og lime inn for å aktivere agenter i hver fase av Prosess A-Å.

---

## 📖 Hvordan bruke dette dokumentet

1. **Finn scenariet ditt** i innholdsfortegnelsen nedenfor
2. **Kopier prompten** under scenariet
3. **Erstatt tekst i [firkantklammer]** med din egen informasjon
4. **Lim inn i Claude Code** og trykk Enter

---

## Innholdsfortegnelse

### Starte nytt prosjekt
- [Fase 1: Jeg har en idé](#fase-1-jeg-har-en-idé)
- [Fase 2: Definere krav](#fase-2-definere-krav)
- [Fase 3: Designe arkitektur](#fase-3-designe-arkitektur)
- [Fase 4: Bygge MVP](#fase-4-bygge-mvp)
- [Fase 5: Fullføre funksjoner](#fase-5-fullføre-funksjoner)
- [Fase 6: Teste før lansering](#fase-6-teste-før-lansering)
- [Fase 7: Publisere til produksjon](#fase-7-publisere-til-produksjon)

### Daglige oppgaver
- [Legge til ny feature](#legge-til-ny-feature)
- [Fikse en bug](#fikse-en-bug)
- [Code review](#code-review)
- [Security audit](#security-audit)
- [Oppdatere dokumentasjon](#oppdatere-dokumentasjon)

### Spesialiserte oppgaver
- [Lage wireframes](#lage-wireframes)
- [Trusselmodellering](#trusselmodellering)
- [OWASP-testing](#owasp-testing)
- [Secrets-sjekk](#secrets-sjekk)
- [GDPR-vurdering](#gdpr-vurdering)
- [Brukertest](#brukertest)
- [Tilgjengelighetstesting](#tilgjengelighetstesting)
- [Ytelsesoptimalisering](#ytelsesoptimalisering)

---

# Starte nytt prosjekt

## Fase 1: Jeg har en idé

### Scenario: Helt nytt prosjekt fra scratch

```
Aktiver OPPSTART-agent.

Jeg vil starte et nytt prosjekt: [beskriv prosjektet ditt i 1-2 setninger]

Hjelp meg med problemdefinisjon, dataklassifisering og risikovurdering.
```

**Eksempel:**
```
Aktiver OPPSTART-agent.

Jeg vil starte et nytt prosjekt: En SaaS-app for små bedrifter som lar dem administrere kundehenvendelser og support-tickets.

Hjelp meg med problemdefinisjon, dataklassifisering og risikovurdering.
```

### Scenario: Jeg har en delvis definert idé

```
Aktiver OPPSTART-agent.

Jeg har en idé om [beskriv ideen].

Jeg vet at målgruppen er [beskriv målgruppen].

Hjelp meg strukturere dette og vurdere risiko.
```

---

## Fase 2: Definere krav

### Scenario: Lage kravspesifikasjon fra visjon

```
Aktiver KRAV-agent.

Les docs/vision.md og hjelp meg lage en komplett kravspesifikasjon.

Inkluder brukerhistorier, datamodell, sikkerhetskrav og MVP-definisjon.
```

### Scenario: Jeg vet hvilke funksjoner jeg vil ha

```
Aktiver KRAV-agent.

Jeg vil bygge en app med følgende funksjoner:
- [Funksjon 1]
- [Funksjon 2]
- [Funksjon 3]

Hjelp meg strukturere dette som brukerhistorier og definere MVP.
```

### Scenario: Lage wireframes (valgfritt)

```
Aktiver KRAV-agent.

Jeg har laget brukerhistorier og trenger wireframes for:
- [Skjerm/side 1]
- [Skjerm/side 2]

Kall WIREFRAME-ekspert for å hjelpe meg.
```

---

## Fase 3: Designe arkitektur

### Scenario: Velge tech stack

```
Aktiver ARKITEKTUR-agent.

Les docs/kravdokument.md og hjelp meg velge tech stack.

Jeg er åpen for forslag, men jeg liker [nevn preferanser hvis du har noen].
```

**Eksempel:**
```
Aktiver ARKITEKTUR-agent.

Les docs/kravdokument.md og hjelp meg velge tech stack.

Jeg er åpen for forslag, men jeg liker Next.js og Supabase.
```

### Scenario: Designe komplett teknisk løsning

```
Aktiver ARKITEKTUR-agent.

Les docs/kravdokument.md og hjelp meg designe komplett teknisk løsning.

Inkluder:
- Tech stack-valg
- Database-design
- API-design
- Auth/authz-system
- Trusselmodellering (STRIDE)
```

### Scenario: Kun trusselmodellering

```
Aktiver ARKITEKTUR-agent.

Les docs/teknisk-spec.md og gjennomfør en STRIDE trusselmodellering.

Kall TRUSSELMODELLERINGS-ekspert for å hjelpe.
```

---

## Fase 4: Bygge MVP

### Scenario: Sette opp nytt prosjekt

```
Aktiver MVP-agent.

Les docs/teknisk-spec.md og sett opp et nytt prosjekt.

Tech stack: [Next.js/Supabase/Vercel eller annet]

Inkluder:
- Git-oppsett
- CI/CD-pipeline
- Database-setup
- Auth-implementasjon
- Secrets-håndtering
```

### Scenario: Bygge første prototype

```
Aktiver MVP-agent.

Jeg har satt opp prosjektet. Nå vil jeg bygge en prototype av kjernefunksjonen:

[Beskriv kjernefunksjonen]

Implementer denne med:
- UI-komponenter
- Backend-logikk
- Input-validering
- Grunnleggende tester

Deploy til staging når ferdig.
```

---

## Fase 5: Fullføre funksjoner

### Scenario: Fullføre alle MVP-funksjoner

```
Aktiver ITERASJONS-agent.

Les docs/krav/mvp-definition.md og se hvilke funksjoner som mangler.

Implementer alle "må ha"-funksjoner systematisk:
1. Lag PRD for hver
2. Implementer med sikkerhet
3. Code review
4. Brukervalidering

Når alt er ferdig, polér UI/UX og optimaliser ytelse.
```

### Scenario: Implementere én spesifikk feature

```
Aktiver ITERASJONS-agent.

Jeg vil implementere følgende feature:
[Beskriv featuren]

Gå gjennom full prosess:
1. Lag PRD
2. Implementer (UI → Funksjon → Sikkerhet)
3. Code review
4. Testing
```

### Scenario: Få bruker-feedback

```
Aktiver ITERASJONS-agent.

Jeg vil få bruker-feedback på appen.

Kall BRUKERTEST-ekspert for å hjelpe meg planlegge og gjennomføre brukertesting.
```

### Scenario: Optimalisere ytelse

```
Aktiver ITERASJONS-agent.

Appen føles treg. Hjelp meg optimalisere ytelsen.

Kall YTELSE-ekspert for å:
1. Måle ytelse (Lighthouse)
2. Identifisere flaskehalser
3. Implementere optimaliseringer
4. Verifisere forbedringer
```

---

## Fase 6: Teste før lansering

### Scenario: Full testing før lansering

```
Aktiver KVALITETSSIKRINGS-agent.

Appen er feature-komplett. Gjennomfør full testing og kvalitetssikring før lansering:

1. End-to-end testing
2. OWASP Top 10 testing
3. Hemmelighetssjekk
4. GDPR-compliance (hvis relevant)
5. Tilgjengelighetstesting (WCAG)
6. Cross-browser testing
7. Oppdater dokumentasjon

Gi meg en sjekkliste for deploy når alt er klart.
```

### Scenario: Bare sikkerhetstesting

```
Aktiver KVALITETSSIKRINGS-agent.

Gjennomfør sikkerhetstesting:
1. OWASP Top 10 (kall OWASP-ekspert)
2. Hemmelighetssjekk (kall HEMMELIGHETSSJEKK-ekspert)
3. Security headers

Rapporter alle funn.
```

### Scenario: Bare tilgjengelighetstesting

```
Aktiver KVALITETSSIKRINGS-agent.

Gjennomfør tilgjengelighetstesting.

Kall TILGJENGELIGHETS-ekspert for å teste WCAG AA-nivå.
```

---

## Fase 7: Publisere til produksjon

### Scenario: Deploy til produksjon første gang

```
Aktiver PUBLISERINGS-agent.

Jeg er klar til å publisere appen til produksjon.

Gjennomfør:
1. Produksjonsmiljø-oppsett
2. Security headers
3. SSL/TLS-sertifikat
4. DNS-oppsett for domene: [ditt-domene.com]
5. Backup-strategi
6. Logging og overvåking
7. Alerting
8. Incident Response-plan
9. Deploy til produksjon
10. Post-deploy smoke test
```

### Scenario: Sette opp overvåking

```
Aktiver PUBLISERINGS-agent.

Sett opp logging og overvåking for produksjonsappen:
- Error logging (Sentry)
- Analytics
- Uptime monitoring
- Alerting for kritiske feil
```

---

# Daglige oppgaver

## Legge til ny feature

### Scenario: Planlegge en ny feature

```
Aktiver PLANLEGGER-agent.

Jeg vil legge til følgende funksjonalitet:
[Beskriv funksjonen]

Lag en PRD (Product Requirements Document) som BYGGER-agent kan bruke.
```

### Scenario: Implementere basert på PRD

```
Aktiver BYGGER-agent.

Implementer featuren beskrevet i docs/prd/[filnavn].md

Følg 3-stage prosess:
1. UI Only (mock data)
2. Real Functionality
3. Test, Debug, Safety
```

---

## Fikse en bug

### Scenario: Undersøke og fikse bug

```
Aktiver DEBUGGER-agent.

Jeg har følgende problem:
[Beskriv problemet / feilen / uventet oppførsel]

Hjelp meg:
1. Reprodusere feilen
2. Identifisere årsaken
3. Foreslå løsning
4. Implementere fix
5. Verifisere at det er fikset
```

### Scenario: Tester feiler

```
Aktiver DEBUGGER-agent.

Følgende tester feiler:
[Skriv inn hvilke tester som feiler]

Hjelp meg finne årsaken og fikse dem.
```

---

## Code review

### Scenario: Review av ny kode

```
Aktiver REVIEWER-agent.

Gjennomfør code review av kode i:
[sti til filer eller PR-nummer hvis GitHub]

Sjekk:
- Funksjonalitet
- Sikkerhet
- Kodekvalitet
- Ytelse
- Best practices
```

### Scenario: Review før merge

```
Aktiver REVIEWER-agent.

Jeg har implementert [feature/bug-fix].

Gjennomfør full code review før jeg merger til main branch.
```

---

## Security audit

### Scenario: Generell security audit

```
Aktiver SIKKERHETS-agent.

Gjennomfør en security audit av appen.

Fokuser på:
- Input validering
- Output sanitering
- Autentisering/autorisasjon
- Hemmeligheter
- Sikre headers
- HTTPS
```

### Scenario: Security review av spesifikk feature

```
Aktiver SIKKERHETS-agent.

Gjennomfør security review av følgende kode:
[sti til filer]

Denne koden håndterer [beskriv hva koden gjør].

Sjekk for sikkerhetsproblemer.
```

---

## Oppdatere dokumentasjon

### Scenario: Oppdatere docs etter endringer

```
Aktiver DOKUMENTERER-agent.

Jeg har gjort følgende endringer:
[Beskriv endringene]

Oppdater relevant dokumentasjon:
- README.md
- API-dokumentasjon
- Deployment guide
- [andre relevante docs]
```

### Scenario: Lage komplett dokumentasjon

```
Aktiver DOKUMENTERER-agent.

Generer komplett dokumentasjon for prosjektet:
- README.md (oversikt, setup, bruk)
- docs/API.md (API-dokumentasjon)
- docs/DEPLOYMENT.md (hvordan deploye)
- docs/CONTRIBUTING.md (hvordan bidra)
```

---

# Spesialiserte oppgaver

## Lage wireframes

```
Aktiver WIREFRAME-ekspert.

Jeg trenger wireframes for følgende skjermer:
- [Skjerm 1]
- [Skjerm 2]
- [Skjerm 3]

Lag en ASCII-basert wireframe for hver skjerm basert på brukerhistoriene i docs/krav/brukerhistorier.md
```

**Eksempel:**
```
Aktiver WIREFRAME-ekspert.

Jeg trenger wireframes for følgende skjermer:
- Innloggingsside
- Dashboard
- Brukerprofilside

Lag en ASCII-basert wireframe for hver skjerm basert på brukerhistoriene i docs/krav/brukerhistorier.md
```

---

## Trusselmodellering

```
Aktiver TRUSSELMODELLERINGS-ekspert.

Gjennomfør en STRIDE trusselmodellering for appen.

Les docs/teknisk-spec.md og identifiser trusler innen:
- Spoofing
- Tampering
- Repudiation
- Information Disclosure
- Denial of Service
- Elevation of Privilege

For hver trussel, vurder sannsynlighet, konsekvens og foreslå mitigering.

Lagre resultatet i docs/security/trusselmodell.md
```

---

## OWASP-testing

```
Aktiver OWASP-ekspert.

Gjennomfør OWASP Top 10 testing av appen.

Test hver sårbarhet:
1. Broken Access Control
2. Cryptographic Failures
3. Injection
4. Insecure Design
5. Security Misconfiguration
6. Vulnerable Components
7. Authentication Failures
8. Data Integrity Failures
9. Logging Failures
10. SSRF

Rapporter funn i docs/security/owasp-report.md
```

---

## Secrets-sjekk

```
Aktiver HEMMELIGHETSSJEKK-ekspert.

Skann hele prosjektet for hardkodede hemmeligheter:
1. Søk i kode etter API-nøkler, tokens, passord
2. Sjekk .env-filer
3. Skann git-historikk

Rapporter alle funn og foreslå løsninger.
```

---

## GDPR-vurdering

```
Aktiver GDPR-ekspert.

Gjennomfør en GDPR-compliance vurdering av appen.

Sjekk:
1. Hvilket persondata lagres
2. Lovlig grunnlag for behandling
3. Informasjonssikkerhet
4. Brukerrettigheter (innsyn, sletting, eksport)
5. Databehandleravtaler
6. Personvernerklæring

Lagre resultatet i docs/privacy/gdpr-compliance.md
```

---

## Brukertest

```
Aktiver BRUKERTEST-ekspert.

Hjelp meg planlegge og gjennomføre brukertesting.

Målgruppe: [beskriv målgruppen]

Hjelp meg:
1. Lage test-oppgaver
2. Lage spørsmål til deltakerne
3. Forberede test-miljø
4. Analysere feedback

Lagre testplan i docs/user-testing/test-plan.md
```

---

## Tilgjengelighetstesting

```
Aktiver TILGJENGELIGHETS-ekspert.

Gjennomfør WCAG AA tilgjengelighetstesting av appen.

Test:
1. Perceivable (Oppfattbar)
2. Operable (Brukbar)
3. Understandable (Forståelig)
4. Robust (Robust)

Bruk automatiske verktøy (axe, Lighthouse) og manuell testing.

Rapporter funn og foreslå fikser i docs/accessibility/wcag-report.md
```

---

## Ytelsesoptimalisering

```
Aktiver YTELSE-ekspert.

Optimaliser ytelsen til appen.

Gjennomfør:
1. Mål nåværende ytelse (Lighthouse, WebPageTest)
2. Identifiser flaskehalser (nettverk, rendering, JavaScript)
3. Implementer optimaliseringer:
   - Lazy loading
   - Bildekomprimering
   - Code splitting
   - Caching
   - Database-optimaliseringer
4. Mål igjen for å verifisere forbedring

Mål: Lighthouse score > 90 på alle kategorier
```

---

# Kombinerte arbeidsflyter

## Ny feature fra start til slutt

### Komplett feature-implementasjon

```
Jeg vil implementere en ny feature: [beskriv featuren]

Kjør følgende prosess:

STEG 1: Planlegging
Aktiver PLANLEGGER-agent.
Lag PRD for featuren.

STEG 2: Implementasjon
Aktiver BYGGER-agent.
Implementer basert på PRD (3 stages: UI → Funksjon → Sikkerhet).

STEG 3: Review
Aktiver REVIEWER-agent.
Gjennomfør code review.

STEG 4: Security
Aktiver SIKKERHETS-agent.
Security audit av ny kode.

STEG 5: Testing
Kjør alle tester og deploy til staging.

STEG 6: Dokumentasjon
Aktiver DOKUMENTERER-agent.
Oppdater dokumentasjon.

STEG 7: Deploy
Deploy til produksjon.
```

---

## Sikkerhetsherdning før lansering

### Komplett sikkerhetssjekk

```
Aktiver SIKKERHETS-agent.

Gjennomfør komplett sikkerhetssjekk før lansering:

1. Kall HEMMELIGHETSSJEKK-ekspert
   → Skann kode og git-historikk

2. Kall OWASP-ekspert
   → Test OWASP Top 10

3. Verifiser security headers
   → Test med securityheaders.com

4. Verifiser SSL/TLS
   → Test med SSL Labs

5. Sjekk avhengigheter
   → Kjør npm audit / Dependabot

6. Review all autentisering/autorisasjon

Rapporter alle funn og foreslå fikser før deploy.
```

---

## Fra idé til MVP på én dag

### Hurtig MVP-prosess

```
Jeg vil bygge en enkel MVP på én dag.

Produktidé: [beskriv produktet i 1-2 setninger]

MORGEN (Fase 1-3):

Aktiver OPPSTART-agent.
Raskt: Problemdefinisjon, målgruppe, risikovurdering.

Aktiver KRAV-agent.
Raskt: 3-5 brukerhistorier, enkel datamodell, MVP-definisjon.

Aktiver ARKITEKTUR-agent.
Raskt: Tech stack (Next.js + Supabase), database-skjema, minimal sikkerhet.

MIDDAG (Fase 4):

Aktiver MVP-agent.
Sett opp prosjekt, implementer 1 kjernefunksjon, deploy til staging.

ETTERMIDDAG (Fase 5-6):

Aktiver ITERASJONS-agent.
Polér UI, legg til feilhåndtering, kjør grunnleggende tester.

Aktiver KVALITETSSIKRINGS-agent.
Minimal testing: funksjonalitet, grunnleggende sikkerhet.

KVELD (Fase 7):

Aktiver PUBLISERINGS-agent.
Deploy til produksjon, sett opp minimal overvåking.

Prioriter: Funksjonalitet over polish. Sikkerhet over fancy features. Lansering over perfeksjon.
```

---

## Tips for effektiv bruk av prompts

### ✅ Vær spesifikk

**Dårlig:**
```
Hjelp meg med appen
```

**Bra:**
```
Aktiver BYGGER-agent.
Implementer brukerautentisering med email/passord basert på docs/prd/auth.md
```

### ✅ Gi kontekst

**Dårlig:**
```
Aktiver ARKITEKTUR-agent.
```

**Bra:**
```
Aktiver ARKITEKTUR-agent.
Les docs/kravdokument.md og designe teknisk løsning for en SaaS-app med 1000+ brukere og betalingsintegrasjon.
```

### ✅ Vær tydelig på forventninger

**Dårlig:**
```
Lag dokumentasjon
```

**Bra:**
```
Aktiver DOKUMENTERER-agent.
Lag komplett README.md med: oversikt, setup-instruksjoner, API-dokumentasjon, deployment-guide, og bidra-retningslinjer.
```

### ✅ Referer til eksisterende dokumenter

**Bra:**
```
Aktiver BYGGER-agent.
Les docs/prd/dashboard.md og implementer dashboard-komponenten beskrevet der.
```

Dette sikrer at agenten har riktig kontekst og kan gjøre jobben mer presist.

---

## Tilpass til ditt prosjekt

### Erstatt plassholdere

Alle prompts i dette dokumentet bruker plassholdere i `[firkantklammer]`.

**Eksempel på plassholderbruk:**

**Template:**
```
Aktiver BYGGER-agent.
Implementer [feature-navn] basert på docs/prd/[filnavn].md
```

**Tilpasset:**
```
Aktiver BYGGER-agent.
Implementer brukerprofilside basert på docs/prd/user-profile.md
```

### Kombiner flere instruksjoner

Du kan kombinere flere steg i én prompt:

```
Aktiver MVP-agent.

Sett opp nytt Next.js-prosjekt med:
- TypeScript
- Tailwind CSS
- Supabase for backend
- GitHub Actions for CI/CD
- Vercel for hosting

Inkluder:
1. Git-repo init
2. .env.example med alle nødvendige variabler
3. Database-setup med RLS
4. Auth med Supabase Auth
5. Deploy til Vercel staging

Når ferdig, implementer én kjernefunksjon: [beskriv funksjonen]
```

---

## Feilsøking

### "Agenten forstår ikke hva den skal gjøre"

✅ **Løsning:** Gi mer kontekst og referer til eksisterende dokumenter.

```
Aktiver BYGGER-agent.

Les følgende dokumenter først:
- docs/prd/feature.md (krav)
- docs/teknisk-spec.md (arkitektur)
- docs/krav/datamodell.md (datastruktur)

Deretter implementer [feature-navn] med full input-validering og sikkerhet.
```

### "Jeg vet ikke hvilken agent jeg skal bruke"

✅ **Løsning:** Bruk [AGENT-MAPPING-PER-FASE.md](AGENT-MAPPING-PER-FASE.md) for å finne riktig agent basert på fase eller oppgave.

Eller bruk "Quick Reference" nederst i [AGENTS-OVERSIKT.md](AGENTS-OVERSIKT.md).

### "Agenten kaller ikke Ekspert-agenter"

✅ **Løsning:** Prosess-agenter kaller Ekspert-agenter automatisk. Men du kan også be om det eksplisitt:

```
Aktiver ARKITEKTUR-agent.

Les docs/teknisk-spec.md og gjennomfør trusselmodellering.

Kall TRUSSELMODELLERINGS-ekspert for STRIDE-analyse.
```

---

# 📋 Detaljerte Prompts (Avansert)

Disse promptene er mer strukturerte og gir agenten maksimal kontekst. Bruk disse når du vil ha mer presise resultater.

---

## Fase 1: OPPSTART-agent (Detaljert)

### **Template:**

```
Aktiver OPPSTART-agent.

KONTEKST:
- Jeg planlegger: [beskrivelse av prosjekt]
- Målgruppe: [hvem er brukerne]
- Nåværende situasjon: [hvordan løses problemet i dag]
- Tid tilgjengelig: [estimert tidsramme]

OPPGAVE:
Hjelp meg med Fase 1 - Idé, Visjon & Risikovurdering:
1. Problemdefinisjon (konkret smerte brukerne opplever)
2. Målgruppe (spesifikk persona)
3. Verdiforslag (hva er unikt vs. alternativer)
4. Suksesskriterier (målbare mål)
5. Dataklassifisering (hvilke data lagres, GDPR-relevant?)
6. Risikovurdering (hva kan gå galt)
7. Scope-avgrensning (hva er IKKE med i MVP)

LEVERANSER:
- docs/vision.md
- docs/security/risikovurdering.md
- docs/security/dataklassifisering.md

FORVENTNING:
Jeg forventer at du stiller oppklarende spørsmål før du lager dokumentene.
```

### **Eksempel (utfylt):**

```
Aktiver OPPSTART-agent.

KONTEKST:
- Jeg planlegger: En todo-app for freelancere som jobber med flere klienter
- Målgruppe: Freelance designere og utviklere, 3-10 aktive klienter, jobber alene
- Nåværende situasjon: Bruker Excel, Notion, eller post-it lapper - lite struktur
- Tid tilgjengelig: 3-4 uker på deltid

OPPGAVE:
Hjelp meg med Fase 1 - Idé, Visjon & Risikovurdering:
1. Problemdefinisjon (konkret smerte brukerne opplever)
2. Målgruppe (spesifikk persona)
3. Verdiforslag (hva er unikt vs. Asana/Trello)
4. Suksesskriterier (f.eks. % brukere som logger inn daglig)
5. Dataklassifisering (oppgaver, klientnavn, brukerinfo - GDPR?)
6. Risikovurdering (sikkerhet, product-market fit, konkurranse)
7. Scope-avgrensning (IKKE team-features, ikke tidsregistrering)

LEVERANSER:
- docs/vision.md
- docs/security/risikovurdering.md
- docs/security/dataklassifisering.md

FORVENTNING:
Jeg forventer at du stiller oppklarende spørsmål før du lager dokumentene.
```

---

## Fase 2: KRAV-agent (Detaljert)

### **Template:**

```
Aktiver KRAV-agent.

KONTEKST:
- Prosjekt: [navn fra vision.md]
- Les først: docs/vision.md
- Scope: [kort beskrivelse av MVP-scope]

OPPGAVE:
Lag komplett kravspesifikasjon:

1. **Brukerhistorier (MoSCoW-prioritert)**
   - MUST HAVE: Kritiske features for MVP
   - SHOULD HAVE: Viktige, men ikke kritisk
   - COULD HAVE: Fint å ha
   - WON'T HAVE: Eksplisitt utenfor scope
   - Format: "Som [rolle] vil jeg [handling] for å [verdi]"
   - Inkluder akseptkriterier for hver historie

2. **Datamodell**
   - Identifiser alle entiteter (tabeller)
   - Definer relasjoner (1:1, 1:N, N:M)
   - Spesifiser felt for hver tabell
   - Design RLS (Row Level Security) policies

3. **Sikkerhetskrav**
   - Input-validering (hva må valideres)
   - Autentisering/autorisasjon (hvem får tilgang til hva)
   - Data-beskyttelse (kryptering, backup)

4. **MVP-definisjon**
   - Hva er det absolutt minste som gir verdi?
   - Definisjon av ferdig (DoD)

5. **Edge cases**
   - Hva hvis bruker sletter konto?
   - Hva hvis data er tom?
   - Hva hvis API feiler?

LEVERANSER:
- docs/krav/brukerhistorier.md
- docs/krav/datamodell.md
- docs/krav/sikkerhetskrav.md
- docs/krav/mvp-definition.md
- docs/krav/edge-cases.md

TILLEGG (valgfritt):
Hvis jeg ber om wireframes, kall WIREFRAME-ekspert.
```

---

## Fase 3: ARKITEKTUR-agent (Detaljert)

### **Template:**

```
Aktiver ARKITEKTUR-agent.

KONTEKST:
- Prosjekt: [navn]
- Les først: docs/vision.md, docs/krav/*.md
- Tech stack preferanser: [Next.js / React / Vue / etc.]

OPPGAVE:
Design komplett teknisk løsning:

1. **Tech Stack-valg**
   - Frontend framework (og hvorfor)
   - Styling (CSS framework / Tailwind / etc.)
   - Backend (API framework)
   - Database (SQL / NoSQL og hvorfor)
   - Auth (Supabase / Auth0 / etc.)
   - Hosting (Vercel / AWS / etc.)
   - Språk (TypeScript / JavaScript / Python)
   - Begrunn hvert valg basert på kravene

2. **Database-design**
   - Skriv SQL CREATE TABLE statements
   - Definer indekser
   - Definer foreign keys og CASCADE regler
   - Design RLS policies (hvis Supabase/PostgreSQL)

3. **API-design**
   - List alle endepunkter (GET/POST/PUT/DELETE)
   - Request/response format
   - Error handling
   - Rate limiting

4. **Auth/Authz-system**
   - Autentisering: Hvordan logger brukere inn?
   - Autorisasjon: Hvem får tilgang til hva?
   - Session management

5. **Trusselmodellering**
   Kall TRUSSELMODELLERINGS-ekspert for STRIDE-analyse:
   - Spoofing (identitetstyv)
   - Tampering (manipulering)
   - Repudiation (fornektelse)
   - Information Disclosure (datalekkasje)
   - Denial of Service (tjenestestopp)
   - Elevation of Privilege (utvidede rettigheter)

LEVERANSER:
- docs/teknisk-spec.md
- docs/database-schema.md
- docs/api-design.md
- docs/security/trusselmodell.md
- docs/arkitektur-diagram.png (valgfritt)

FORVENTNING:
Begrunn alle valg. Hvis flere alternativer er like gode, presenter dem og la meg velge.
```

---

## Fase 4: MVP-agent (Detaljert)

### **Template:**

```
Aktiver MVP-agent.

KONTEKST:
- Prosjekt: [navn]
- Les først: docs/teknisk-spec.md, docs/krav/mvp-definition.md
- Tech stack: [fra teknisk-spec.md]

OPPGAVE:
Sett opp prosjekt og bygg fungerende prototype.

**STEG 1: Prosjektoppsett**
1. Initialiser prosjekt ([Next.js 14 / create-react-app / etc.])
2. Installer dependencies
3. Konfigurer TypeScript/ESLint/Prettier
4. Sett opp Tailwind CSS (hvis aktuelt)

**STEG 2: Git & CI/CD**
1. Git init, .gitignore
2. GitHub repo oppsett
3. GitHub Actions workflow:
   - Kjør linting
   - Kjør tester
   - Build check
   - Deploy til staging (on push to main)

**STEG 3: Secrets-håndtering**
Kall HEMMELIGHETSSJEKK-ekspert:
1. Lag .env.example (alle nødvendige env vars, UTEN verdier)
2. Dokumenter hvor secrets skal settes (Vercel / Railway / etc.)
3. Verifiser at .env er i .gitignore

**STEG 4: Database-setup**
1. Sett opp [Supabase / PostgreSQL / etc.]
2. Kjør migrations (fra database-schema.md)
3. Implementer RLS policies
4. Seed initial data (valgfritt)

**STEG 5: Autentisering**
Kall SIKKERHETS-agent for review:
1. Integrer [Supabase Auth / NextAuth / etc.]
2. Implementer registrering
3. Implementer innlogging
4. Implementer passord-reset
5. Session management (httpOnly cookies)

**STEG 6: Prototype - Én kjernefunksjon**
Kall BYGGER-agent:
1. Velg den MEST kritiske funksjonen fra MVP
2. Implementer i 3 stages:
   - Stage 1: UI only (mock data)
   - Stage 2: Real functionality
   - Stage 3: Input validation + error handling

**STEG 7: Grunnleggende tester**
1. Oppsett test framework (Vitest / Jest)
2. Skriv tester for kjernefunksjon
3. Verifiser at CI kjører testene

**STEG 8: Deploy til staging**
1. Deploy til [Vercel staging / Railway / etc.]
2. Verifiser at appen fungerer
3. Test auth i staging
4. Test kjernefunksjon i staging

LEVERANSER:
- Initialisert prosjekt
- .git/, .github/workflows/
- .env.example
- Database med RLS
- Auth fungerer
- Én kjernefunksjon implementert
- Grunnleggende tester
- Staging URL fungerer

FORVENTNING:
Fokuser på SIKKERHET fra første linje. Ingen shortcuts på auth/input validation.
```

---

## Fase 5: ITERASJONS-agent (Detaljert)

### **Template for full iterasjon:**

```
Aktiver ITERASJONS-agent.

KONTEKST:
- Prosjekt: [navn]
- Les først: docs/krav/mvp-definition.md, docs/prd/ (hvis finnes)
- Status: Prototype ferdig, [X] av [Y] features gjenstår

OPPGAVE:
Fullfør alle MVP-funksjoner og polér appen.

**WORKFLOW PER FEATURE:**

For hver feature i MVP MUST HAVE:

1. **Planlegging**
   Kall PLANLEGGER-agent:
   - Lag PRD i docs/prd/[feature-navn].md
   - Inkluder: Problem, løsning, success criteria, edge cases

2. **Implementering**
   Kall BYGGER-agent:
   - Implementer basert på PRD
   - 3 stages: UI → Funksjonalitet → Sikkerhet
   - Følg CONVENTIONS.md (koderegler)

3. **Code Review**
   Kall REVIEWER-agent:
   - Review koden
   - Sjekk: Funksjonalitet, sikkerhet, ytelse, best practices

4. **Security Review**
   Kall SIKKERHETS-agent:
   - Input validation
   - Output sanitering
   - Auth/authz korrekt
   - Ingen secrets hardkodet

5. **Testing**
   - Unit tests for logikk
   - Integration tests for API
   - Manuell testing i staging

**ETTER ALLE FEATURES:**

6. **Brukervalidering**
   Kall BRUKERTEST-ekspert:
   - Rekrutter 5-10 brukere i målgruppen
   - Lag testoppgaver
   - Samle feedback
   - Adresser kritiske issues

7. **SAST (Static Analysis)**
   - Sett opp CodeQL / Snyk / Dependabot
   - Fix alle high/critical issues

8. **Polering**
   - Komplett feilhåndtering (try/catch, error boundaries)
   - Loading states (spinners, skeletons)
   - Tomme tilstander ("No tasks yet")
   - Success/error toasts
   - Hover states, focus states (accessibility)

9. **Ytelsesoptimalisering**
   Kall YTELSE-ekspert:
   - Kjør Lighthouse
   - Mål: > 90 på alle kategorier
   - Optimaliser images, lazy loading, code splitting

LEVERANSER:
- Alle MVP MUST HAVE features implementert
- Alle features code reviewed
- Brukertest-feedback adressert
- SAST kjører i CI/CD
- Lighthouse score > 90
- docs/user-testing/feedback-rapport.md

FORVENTNING:
Kvalitet > hastighet. Hver feature skal være production-ready før neste.
```

---

## Fase 6: KVALITETSSIKRINGS-agent (Detaljert)

### **Template:**

```
Aktiver KVALITETSSIKRINGS-agent.

KONTEKST:
- Prosjekt: [navn]
- Status: Alle features implementert, klar for testing
- Tech stack: [fra teknisk-spec.md]

OPPGAVE:
Gjennomfør komplett testing og kvalitetssikring før lansering.

**TESTING-CHECKLIST:**

1. **End-to-End Testing**
   - Verktøy: [Playwright / Cypress]
   - Dekk alle kritiske brukerflyter:
     - Registrering → innlogging → kjernefunksjon → logout
     - Happy path + error paths
   - Mål: 100% coverage av kritiske flyter

2. **OWASP Top 10 Testing**
   Kall OWASP-ekspert:
   - Test hver sårbarhet manuelt
   - Både tradisjonelle (2021) OG AI-spesifikke (Agentic 2026)
   - Dokumenter alle funn
   - Fix alle high/critical issues

3. **Hemmelighetssjekk**
   Kall HEMMELIGHETSSJEKK-ekspert:
   - Skann kode for hardkodede secrets
   - Skann .env-filer
   - Skann git-historikk (viktig!)
   - Verifiser at .env.example ikke har verdier

4. **GDPR Compliance** (hvis aktuelt)
   Kall GDPR-ekspert:
   - Verifiser sletting-funksjon
   - Verifiser eksport-funksjon
   - Sjekk personvernerklæring
   - Sjekk samtykke-mekanisme

5. **Tilgjengelighetstesting** (hvis kundevendt)
   Kall TILGJENGELIGHETS-ekspert:
   - WCAG AA-nivå som minimum
   - Keyboard navigation
   - Screen reader testing
   - Color contrast
   - Alt texts for images

6. **Cross-Browser Testing**
   Test i:
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest)
   - Edge (latest)
   - Dokumenter browser-spesifikke issues

7. **Last-testing** (hvis relevant)
   Kall YTELSE-ekspert:
   - Simuler [X] samtidige brukere
   - Mål responstid under last
   - Identifiser flaskehalser

8. **Dokumentasjon-review**
   Kall DOKUMENTERER-agent:
   - Oppdater README.md
   - Oppdater API-dokumentasjon
   - Lag deployment guide
   - Oppdater CHANGELOG.md

9. **Staging Full Test**
   - Kjør ALLE tester i staging
   - Smoke test alle features
   - Verifiser at backup fungerer

LEVERANSER:
- docs/testing/e2e-testplan.md + test suite
- docs/security/owasp-rapport.md
- docs/security/secrets-audit.md
- docs/privacy/gdpr-compliance.md (hvis relevant)
- docs/testing/accessibility-rapport.md
- docs/testing/cross-browser-test.md
- docs/testing/ytelse-rapport.md
- Oppdatert dokumentasjon
- Deploy-sjekkliste

FORVENTNING:
Hvis du finner critical issues, STOPP og fix før du fortsetter.
```

---

## Fase 7: PUBLISERINGS-agent (Detaljert)

### **Template:**

```
Aktiver PUBLISERINGS-agent.

KONTEKST:
- Prosjekt: [navn]
- Status: Alle tester passerer i staging
- Domene: [ditt-domene.com]
- Hosting: [Vercel / AWS / etc.]

OPPGAVE:
Deploy til produksjon med komplett monitoring og sikkerhet.

**PRE-DEPLOY CHECKLIST:**

1. **Produksjonsmiljø**
   - Opprett prod environment i [Vercel / etc.]
   - Sett alle environment variables
   - Konfigurer produksjons-database (hvis separat fra staging)

2. **Security Hardening**
   Kall SIKKERHETS-agent:
   - Security headers:
     - CSP (Content Security Policy)
     - HSTS (Strict-Transport-Security)
     - X-Frame-Options: DENY
     - X-Content-Type-Options: nosniff
   - Verifiser: https://securityheaders.com → mål A+

3. **SSL/TLS**
   - Sertifikat installert (auto via Vercel/Cloudflare)
   - Verifiser: https://www.ssllabs.com/ssltest → mål A+
   - Enforced HTTPS (redirect http → https)

4. **DNS-oppsett**
   - A record / CNAME peker til hosting
   - Verifiser propagering (https://dnschecker.org)
   - CAA record (valgfritt, men anbefalt)

5. **Backup-strategi**
   - Database daily backup (auto via Supabase/etc.)
   - Test restore-prosedyre
   - Dokumenter i docs/deployment/rollback-prosedyre.md

6. **Logging & Monitoring**
   - Error logging: [Sentry / LogRocket]
   - Analytics: [PostHog / Plausible]
   - Uptime monitoring: [UptimeRobot / Checkly]
   - Performance: [Vercel Analytics / Datadog]

7. **Alerting**
   - Email alerts for critical errors
   - Slack/Discord webhook (valgfritt)
   - Uptime alerts (email/SMS)

8. **Incident Response Plan**
   Kall SIKKERHETS-agent:
   - Dokumenter i docs/security/incident-response-plan.md:
     - Hvem kontaktes ved databrudd?
     - Hvordan ruller vi tilbake deploy?
     - Hvordan varsler vi brukere?

**DEPLOY:**

9. **Deploy to Production**
   - Deploy via [Vercel / GitHub Actions / etc.]
   - Verifiser deployment success
   - Verifiser URL fungerer

10. **Post-Deploy Smoke Tests**
    - Homepage loads
    - Login fungerer
    - CRUD operations fungerer
    - Database forbindelse OK
    - Email sending fungerer (hvis aktuelt)

11. **Monitoring-verifisering**
    - Sentry fanger errors
    - Analytics logger events
    - Uptime monitor rapporterer "up"

**POST-DEPLOY:**

12. **Dokumentasjon**
    Kall DOKUMENTERER-agent:
    - docs/deployment/deployment-guide.md
    - docs/deployment/vedlikeholdsplan.md
    - docs/logs/CHANGELOG.md (v1.0 release)

LEVERANSER:
- Produksjonsapp live på [domene]
- Security headers A+
- SSL Labs A+
- Monitoring setup
- Backup testet
- Incident response plan
- Deployment guide
- Vedlikeholdsplan

FORVENTNING:
Double-check ALLE security settings før du deployer.
```

---

## 🎯 Tips for bruk av detaljerte prompts

### **Når bruke enkle vs. detaljerte prompts?**

**Bruk ENKLE prompts når:**
- Du har brukt Prosess A-Å før og vet hva agenten skal gjøre
- Du vil ha rask iterasjon
- Prosjektet er ukomplisert

**Bruk DETALJERTE prompts når:**
- Dette er ditt første prosjekt med Prosess A-Å
- Prosjektet er komplekst (sikkerhetskritisk, GDPR, etc.)
- Du vil ha maksimal kvalitet og grundighet
- Du samarbeider med andre (detaljert prompt = bedre dokumentasjon)

### **Hvordan tilpasse promptene?**

1. **KONTEKST-seksjonen:**
   - Fyll inn spesifikk info om DITT prosjekt
   - Vær konkret, ikke vag

2. **OPPGAVE-seksjonen:**
   - Behold strukturen, men legg til/fjern punkter etter behov
   - Hvis du ikke trenger noe (f.eks. wireframes), fjern det

3. **LEVERANSER-seksjonen:**
   - Endre filnavn hvis du har annen struktur
   - Legg til ekstra filer hvis nødvendig

4. **FORVENTNING-seksjonen:**
   - Spesifiser hva DU forventer
   - F.eks. "Jeg vil at du fokuserer ekstra på sikkerhet"

---

## Neste steg

- Se [AGENT-MAPPING-PER-FASE.md](AGENT-MAPPING-PER-FASE.md) for detaljert mapping av agenter per fase
- Les [AGENTS-OVERSIKT.md](AGENTS-OVERSIKT.md) for fullstendig oversikt over agent-systemet
- Les individuelle agent-filer for dyptgående instruksjoner:
  - [NIVÅ-1-BASIS-AGENTER.md](NIVÅ-1-BASIS-AGENTER.md)
  - [NIVÅ-2-PROSESS-AGENTER.md](NIVÅ-2-PROSESS-AGENTER.md)
  - [NIVÅ-3-EKSPERT-AGENTER.md](NIVÅ-3-EKSPERT-AGENTER.md)

---

**Lykke til! 🚀**

*Husk: Agentene er her for å hjelpe deg. Jo tydeligere du er, jo bedre kan de hjelpe.*
