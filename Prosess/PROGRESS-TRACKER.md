# Progress Tracker: [Prosjektnavn]

**Opprettet:** [Dato]
**Sist oppdatert:** [Dato]
**Status:** [Planning / Development / Testing / Launched]

---

## 📊 Overall Progress

```
[█████████░░░░░░░░░░░] 45% Complete

Fase 1: ✅ Fullført
Fase 2: ✅ Fullført
Fase 3: ⏳ Pågår
Fase 4: ⬜ Ikke startet
Fase 5: ⬜ Ikke startet
Fase 6: ⬜ Ikke startet
Fase 7: ⬜ Ikke startet
```

**Estimert ferdigstillelse:** [Dato]

---

## 🎯 Quick Stats

| Metric | Verdi |
|--------|-------|
| **Prosjektnavn** | [Navn] |
| **Startdato** | [Dato] |
| **Estimert lansering** | [Dato] |
| **Dager brukt** | [Antall] |
| **Fase** | [1-7] |
| **Dokumenter laget** | [Antall] / 23+ |
| **Kode skrevet** | [Ja/Nei] |
| **Bugs funnet** | [Antall] |
| **Bugs fikset** | [Antall] |

---

# Fase 1: Idé, Visjon & Risikovurdering

**Status:** [ ] Ikke startet | [ ] Pågår | [✅] Fullført
**Dato startet:** [Dato]
**Dato fullført:** [Dato]
**Tidsbruk:** [Timer]

## Oppgaver

- [ ] Problemdefinisjon dokumentert
- [ ] Målgruppe definert
- [ ] Verdiforslag formulert
- [ ] Suksesskriterier satt
- [ ] Dataklassifisering gjennomført
- [ ] Risikovurdering fullført
- [ ] Scope-avgrensning definert

## Leveranser

- [ ] `docs/vision.md` skrevet
- [ ] `docs/security/risikovurdering.md` skrevet
- [ ] `docs/security/dataklassifisering.md` skrevet

## Notater

```
[Skriv notater her - f.eks. viktige beslutninger, utfordringer, lærdom]
```

**Agent brukt:** OPPSTART-agent
**Neste steg:** Fase 2 - Kravspesifikasjon

---

# Fase 2: Kravspesifikasjon inkl. Sikkerhetskrav

**Status:** [ ] Ikke startet | [ ] Pågår | [ ] Fullført
**Dato startet:** [Dato]
**Dato fullført:** [Dato]
**Tidsbruk:** [Timer]

## Oppgaver

- [ ] Brukerhistorier dokumentert (MoSCoW)
- [ ] Datamodell designet
- [ ] Sikkerhetskrav spesifisert
- [ ] MVP definert
- [ ] Edge cases identifisert
- [ ] Wireframes laget (valgfritt)

## Leveranser

- [ ] `docs/krav/brukerhistorier.md` skrevet
- [ ] `docs/krav/datamodell.md` skrevet
- [ ] `docs/krav/sikkerhetskrav.md` skrevet
- [ ] `docs/krav/mvp-definition.md` skrevet
- [ ] `docs/krav/edge-cases.md` skrevet
- [ ] `docs/krav/wireframes/` (valgfritt)

## MoSCoW Breakdown

- **MUST HAVE:** [Antall brukerhistorier]
- **SHOULD HAVE:** [Antall brukerhistorier]
- **COULD HAVE:** [Antall brukerhistorier]
- **WON'T HAVE:** [Antall features]

## Notater

```
[Skriv notater her]
```

**Agent brukt:** KRAV-agent, (WIREFRAME-ekspert hvis wireframes)
**Neste steg:** Fase 3 - Teknisk Design

---

# Fase 3: Teknisk Design og Trusselmodellering

**Status:** [ ] Ikke startet | [ ] Pågår | [ ] Fullført
**Dato startet:** [Dato]
**Dato fullført:** [Dato]
**Tidsbruk:** [Timer]

## Oppgaver

- [ ] Tech stack valgt
- [ ] Database-skjema designet
- [ ] API-endepunkter definert
- [ ] Auth/authz-system designet
- [ ] STRIDE trusselmodellering gjennomført
- [ ] Arkitektur-diagram laget

## Leveranser

- [ ] `docs/teknisk-spec.md` skrevet
- [ ] `docs/database-schema.md` skrevet
- [ ] `docs/api-design.md` skrevet
- [ ] `docs/security/trusselmodell.md` skrevet
- [ ] `docs/arkitektur-diagram.png` (valgfritt)

## Tech Stack

| Layer | Valg | Begrunnelse |
|-------|------|-------------|
| Frontend | [Teknologi] | [Hvorfor] |
| Styling | [Teknologi] | [Hvorfor] |
| Backend | [Teknologi] | [Hvorfor] |
| Database | [Teknologi] | [Hvorfor] |
| Auth | [Teknologi] | [Hvorfor] |
| Hosting | [Teknologi] | [Hvorfor] |

## STRIDE Threats Found

- [ ] Spoofing: [Antall trusler funnet] → [Antall mitigert]
- [ ] Tampering: [Antall trusler funnet] → [Antall mitigert]
- [ ] Repudiation: [Antall trusler funnet] → [Antall mitigert]
- [ ] Information Disclosure: [Antall trusler funnet] → [Antall mitigert]
- [ ] Denial of Service: [Antall trusler funnet] → [Antall mitigert]
- [ ] Elevation of Privilege: [Antall trusler funnet] → [Antall mitigert]

## Notater

```
[Skriv notater her]
```

**Agent brukt:** ARKITEKTUR-agent, TRUSSELMODELLERINGS-ekspert
**Neste steg:** Fase 4 - MVP/Prototype

---

# Fase 4: MVP/Prototype (med Sikker Koding)

**Status:** [ ] Ikke startet | [ ] Pågår | [ ] Fullført
**Dato startet:** [Dato]
**Dato fullført:** [Dato]
**Tidsbruk:** [Timer]

## Oppgaver

- [ ] Prosjekt initialisert
- [ ] Git-repo satt opp
- [ ] CI/CD pipeline konfigurert
- [ ] Secrets-håndtering implementert
- [ ] Database satt opp med RLS
- [ ] Autentisering implementert
- [ ] Én kjernefunksjon bygget (prototype)
- [ ] Input-validering på plass
- [ ] Grunnleggende tester skrevet
- [ ] Deployet til staging

## Leveranser

- [ ] Initialisert prosjekt (Next.js/etc.)
- [ ] `.git/` initialisert
- [ ] `.github/workflows/ci.yml` laget
- [ ] `.env.example` laget
- [ ] `.gitignore` laget
- [ ] Database migrasjoner laget
- [ ] RLS policies implementert
- [ ] Auth-kode implementert
- [ ] Prototype fungerer i staging

## Prototype Feature

**Funksjon:** [Beskriv den ene kjernefunksjonen bygget]
**Status:** [Fungerer / Bugs gjenstår]

## Notater

```
[Skriv notater her]
```

**Agent brukt:** MVP-agent, HEMMELIGHETSSJEKK-ekspert, BYGGER-agent, SIKKERHETS-agent
**Neste steg:** Fase 5 - Utvikling & Iterasjon

---

# Fase 5: Utvikling, Iterasjon & Kontinuerlig Validering

**Status:** [ ] Ikke startet | [ ] Pågår | [ ] Fullført
**Dato startet:** [Dato]
**Dato fullført:** [Dato]
**Tidsbruk:** [Timer]

## Oppgaver

- [ ] Alle MVP MUST HAVE-funksjoner implementert
- [ ] Code review gjennomført for all kode
- [ ] Brukervalidering gjennomført
- [ ] SAST-verktøy kjører i CI/CD
- [ ] Komplett feilhåndtering implementert
- [ ] UI/UX polert
- [ ] Ytelse optimalisert (Lighthouse > 90)
- [ ] Loading/tomme tilstander implementert
- [ ] Sekundære funksjoner vurdert/implementert
- [ ] Eksport/import implementert (hvis relevant)

## Features Implementert

| # | Feature | PRD | Implementert | Reviewed | Testet |
|---|---------|-----|--------------|----------|--------|
| 1 | [Feature navn] | ✅ | ✅ | ✅ | ✅ |
| 2 | [Feature navn] | ✅ | ✅ | ✅ | ⏳ |
| 3 | [Feature navn] | ✅ | ⏳ | ⬜ | ⬜ |
| ... | | | | | |

**Total features:** [X] MUST HAVE, [Y] SHOULD HAVE

## Brukervalidering

- [ ] Testplan laget
- [ ] [Antall] brukere testet
- [ ] Feedback samlet
- [ ] Kritisk feedback adressert

## Ytelse

- **Lighthouse Performance:** [Score] / 100
- **Lighthouse Accessibility:** [Score] / 100
- **Lighthouse Best Practices:** [Score] / 100
- **Lighthouse SEO:** [Score] / 100

## Notater

```
[Skriv notater her]
```

**Agent brukt:** ITERASJONS-agent, PLANLEGGER-agent (per feature), BYGGER-agent, REVIEWER-agent, SIKKERHETS-agent, BRUKERTEST-ekspert, YTELSE-ekspert
**Neste steg:** Fase 6 - Testing & Kvalitetssikring

---

# Fase 6: Testing, Sikkerhet & Kvalitetssikring

**Status:** [ ] Ikke startet | [ ] Pågår | [ ] Fullført
**Dato startet:** [Dato]
**Dato fullført:** [Dato]
**Tidsbruk:** [Timer]

## Oppgaver

- [ ] E2E-tester dekker alle kritiske brukerflyter
- [ ] OWASP Top 10 testing gjennomført
- [ ] Hemmelighetssjekk gjennomført
- [ ] GDPR-compliance verifisert (hvis relevant)
- [ ] WCAG AA-nivå oppnådd (hvis kundevendt)
- [ ] Cross-browser testing gjennomført
- [ ] Last-testing gjennomført (hvis relevant)
- [ ] Dokumentasjon oppdatert
- [ ] Alle tester passerer i staging
- [ ] Deploy-sjekkliste klar

## Testing Summary

### **E2E Testing**
- **Ant tester:** [Antall]
- **Passerte:** [Antall]
- **Feilet:** [Antall]
- **Tool:** [Playwright / Cypress / etc.]

### **OWASP Top 10 (2021)**

| # | Sårbarhet | Testet | Status | Severity |
|---|-----------|--------|--------|----------|
| 1 | Broken Access Control | ✅ | ✅ Pass | - |
| 2 | Cryptographic Failures | ✅ | ✅ Pass | - |
| 3 | Injection | ✅ | ⚠️ 1 issue | Low |
| 4 | Insecure Design | ✅ | ✅ Pass | - |
| 5 | Security Misconfiguration | ✅ | ✅ Pass | - |
| 6 | Vulnerable Components | ✅ | ✅ Pass | - |
| 7 | Authentication Failures | ✅ | ✅ Pass | - |
| 8 | Data Integrity Failures | ✅ | ✅ Pass | - |
| 9 | Logging Failures | ✅ | ✅ Pass | - |
| 10 | SSRF | ✅ | ✅ Pass | - |

**Issues funnet:** [Antall]
**Issues fikset:** [Antall]
**Åpne issues:** [Antall]

### **OWASP Agentic Top 10 (2026)**

| # | Sårbarhet | Testet | Status |
|---|-----------|--------|--------|
| 1 | Prompt Injection | ✅ | ✅ Pass |
| 2 | Goal Hijacking | ✅ | ✅ Pass |
| 3 | Excessive Agency | ✅ | ✅ Pass |
| ... | | | |

### **Secrets Scanning**
- **Ant filer skannet:** [Antall]
- **Secrets funnet:** [Antall]
- **Alle fikset:** [Ja/Nei]

### **GDPR Compliance**
- [ ] Personvernerklæring laget
- [ ] Sletting-funksjon fungerer
- [ ] Eksport-funksjon fungerer
- [ ] Databehandleravtale (hvis aktuelt)

### **Accessibility (WCAG)**
- **Nivå:** [A / AA / AAA]
- **Ant issues funnet:** [Antall]
- **Ant issues fikset:** [Antall]
- **Tool:** [axe / Lighthouse / etc.]

### **Cross-Browser Testing**

| Browser | Versjon | Status | Notater |
|---------|---------|--------|---------|
| Chrome | [Versjon] | ✅ | - |
| Firefox | [Versjon] | ✅ | - |
| Safari | [Versjon] | ⚠️ | Minor CSS issue |
| Edge | [Versjon] | ✅ | - |

## Notater

```
[Skriv notater her]
```

**Agent brukt:** KVALITETSSIKRINGS-agent, OWASP-ekspert, HEMMELIGHETSSJEKK-ekspert, GDPR-ekspert, TILGJENGELIGHETS-ekspert, DOKUMENTERER-agent
**Neste steg:** Fase 7 - Publisering

---

# Fase 7: Publisering, Overvåking & Vedlikehold

**Status:** [ ] Ikke startet | [ ] Pågår | [ ] Fullført
**Dato startet:** [Dato]
**Dato fullført:** [Dato]
**Tidsbruk:** [Timer]

## Oppgaver

- [ ] Produksjonsmiljø satt opp
- [ ] Security headers konfigurert (A+ rating)
- [ ] SSL/TLS sertifikat installert (A+ rating)
- [ ] DNS konfigurert og fungerer
- [ ] Backup kjører automatisk
- [ ] Logging fanger feil og viktige hendelser
- [ ] Alerting varsler ved kritiske problemer
- [ ] Incident Response-plan dokumentert
- [ ] Deployment dokumentert
- [ ] Vedlikeholdsplan laget
- [ ] App deployet til produksjon
- [ ] Smoke tests passerer i produksjon

## Production Checklist

### **Infrastruktur**
- [ ] Domene: [ditt-domene.com] ✅ Fungerer
- [ ] Hosting: [Vercel / etc.]
- [ ] Database: [Supabase / etc.]
- [ ] CDN: [Cloudflare / etc.]

### **Sikkerhet**
- [ ] HTTPS enforced
- [ ] Security headers: [A+ / A / B / etc.] rating på securityheaders.com
- [ ] SSL Labs: [A+ / A / B / etc.] rating
- [ ] HSTS enabled
- [ ] CSP configured

### **Monitoring & Logging**
- [ ] Error logging: [Sentry / LogRocket / etc.]
- [ ] Analytics: [PostHog / Plausible / etc.]
- [ ] Uptime monitoring: [UptimeRobot / etc.]
- [ ] Performance monitoring: [Vercel Analytics / etc.]

### **Backup & Recovery**
- [ ] Database backup daily
- [ ] Backup restore testet
- [ ] Rollback-prosedyre dokumentert

### **Alerting**
- [ ] Email alerts for critical errors
- [ ] Slack/Discord webhook (valgfritt)
- [ ] Uptime alerts

## Smoke Tests (Post-Deploy)

- [ ] Homepage loads
- [ ] Login fungerer
- [ ] CRUD operations fungerer
- [ ] API endepunkter responder
- [ ] Database forbindelse OK
- [ ] Email sending fungerer

## Leveranser

- [ ] `docs/deployment/deployment-guide.md` skrevet
- [ ] `docs/deployment/vedlikeholdsplan.md` skrevet
- [ ] `docs/deployment/rollback-prosedyre.md` skrevet
- [ ] `docs/security/incident-response-plan.md` skrevet
- [ ] `docs/logs/CHANGELOG.md` oppdatert

## Launch Metrics (Dag 1)

| Metric | Verdi |
|--------|-------|
| **Total brukere** | [Antall] |
| **Registreringer (dag 1)** | [Antall] |
| **Uptime** | [%] |
| **Error rate** | [%] |
| **Avg response time** | [ms] |
| **Critical bugs** | [Antall] |

## Notater

```
[Skriv notater her - første inntrykk, bugs funnet, feedback mottatt]
```

**Agent brukt:** PUBLISERINGS-agent, SIKKERHETS-agent, DOKUMENTERER-agent
**Neste steg:** 🎉 **Prosjektet er lansert!** → Kontinuerlig vedlikehold og v1.1 planlegging

---

# Post-Launch: Vedlikehold & Videreutvikling

## v1.0 → v1.1 Roadmap

**Planlagte features:**
- [ ] [Feature 1 fra SHOULD HAVE]
- [ ] [Feature 2 fra SHOULD HAVE]
- [ ] [Feature 3 basert på brukerfeedback]

**Estimert lansering v1.1:** [Dato]

## Bugs Funnet i Produksjon

| # | Bug | Severity | Rapportert | Fikset | Deployet |
|---|-----|----------|------------|--------|----------|
| 1 | [Beskrivelse] | High | [Dato] | ✅ | ✅ |
| 2 | [Beskrivelse] | Low | [Dato] | ⏳ | ⬜ |

## Brukerfeedback

**Positive kommentarer:**
- [Feedback 1]
- [Feedback 2]

**Forbedringssuggesjon:**
- [Suggestion 1]
- [Suggestion 2]

---

# Refleksjon & Lærdom

## ✅ Hva fungerte bra

1. [Skriv hva som fungerte godt]
2. [...]
3. [...]

## ⚠️ Hva var utfordrende

1. [Skriv utfordringer]
2. [...]
3. [...]

## 💡 Hva ville jeg gjort annerledes neste gang

1. [Lærdom]
2. [...]
3. [...]

## 🎯 Tips til andre

1. [Tip 1]
2. [...]
3. [...]

---

## 📊 Final Statistics

| Metric | Verdi |
|--------|-------|
| **Total dager** | [Antall] |
| **Total timer** | [Antall] |
| **Ant faser fullført** | 7 / 7 |
| **Ant dokumenter laget** | [Antall] |
| **Lines of code** | [Antall] |
| **Ant bugs funnet (testing)** | [Antall] |
| **Ant bugs funnet (prod)** | [Antall] |
| **Ant sikkerhetsissues** | [Antall] |
| **Lighthouse score (prod)** | [Score] / 100 |
| **Security rating** | [Rating] |
| **Ant brukere (uke 1)** | [Antall] |

---

## 🏆 Suksesskriterier (fra Fase 1)

| Kriterium | Mål | Faktisk | Status |
|-----------|-----|---------|--------|
| [Kriterium 1] | [Mål] | [Faktisk] | ✅ / ⚠️ / ❌ |
| [Kriterium 2] | [Mål] | [Faktisk] | ✅ / ⚠️ / ❌ |
| [Kriterium 3] | [Mål] | [Faktisk] | ✅ / ⚠️ / ❌ |

---

**Prosjektet er fullført! 🎉**

**Sist oppdatert:** [Dato]
**Versjon:** 1.0
