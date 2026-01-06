# Ekspert-agenter - Oversikt

**8 spesialiserte agenter med dyp ekspertise på spesifikke oppgaver**

Disse agentene kalles normalt automatisk av Prosess-agenter når det trengs, men kan også aktiveres direkte.

---

## 🎨 Design & UX

### [WIREFRAME-ekspert](WIREFRAME-ekspert.md)
**Transformerer brukerflyt til visuelle wireframes**
- **Kalles av:** KRAV-agent (Fase 2)
- **Når:** Wireframes skal lages
- **Leveranser:** `docs/wireframes/[feature].md`

---

## 🔒 Sikkerhet

### [TRUSSELMODELLERINGS-ekspert](TRUSSELMODELLERINGS-ekspert.md)
**Gjennomfører systematisk STRIDE-trusselmodellering**
- **Kalles av:** ARKITEKTUR-agent (Fase 3)
- **Når:** Trusselmodellering skal gjøres
- **Leveranser:** `docs/security/trusselmodell.md`

### [OWASP-ekspert](OWASP-ekspert.md)
**Tester mot OWASP Top 10 sikkerhetsstandarder**
- **Kalles av:** KVALITETSSIKRINGS-agent (Fase 6)
- **Når:** OWASP Top 10 sikkerhetstest
- **Leveranser:** `docs/security/owasp-test.md`

### [HEMMELIGHETSSJEKK-ekspert](HEMMELIGHETSSJEKK-ekspert.md)
**Finner hardkodede hemmeligheter i kode og git-historikk**
- **Kalles av:** KVALITETSSIKRINGS-agent (Fase 6)
- **Når:** Før deploy, secrets scanning
- **Leveranser:** `docs/security/hemmelighetssjekk.md`

---

## 📊 Personvern & Compliance

### [GDPR-ekspert](GDPR-ekspert.md)
**Vurderer GDPR-compliance og implementering**
- **Kalles av:** KRAV-agent (Fase 2) eller ARKITEKTUR-agent (Fase 3)
- **Når:** Persondata håndteres
- **Leveranser:** `docs/gdpr/sjekkliste.md`, `docs/gdpr/personvernerklæring-template.md`

---

## 🎯 Testing & Kvalitet

### [BRUKERTEST-ekspert](BRUKERTEST-ekspert.md)
**Planlegger og analyserer brukertesting**
- **Kalles av:** ITERASJONS-agent (Fase 5) eller KVALITETSSIKRINGS-agent (Fase 6)
- **Når:** Brukertesting skal gjennomføres
- **Leveranser:** `docs/brukertesting/[dato]-rapport.md`

### [TILGJENGELIGHETS-ekspert](TILGJENGELIGHETS-ekspert.md)
**Tester mot WCAG-standarder for tilgjengelighet**
- **Kalles av:** KVALITETSSIKRINGS-agent (Fase 6)
- **Når:** WCAG-testing skal gjøres
- **Leveranser:** `docs/tilgjengelighet/rapport.md`

---

## 📈 Ytelse

### [YTELSE-ekspert](YTELSE-ekspert.md)
**Måler og optimaliserer applikasjonens ytelse**
- **Kalles av:** ITERASJONS-agent (Fase 5)
- **Når:** Ytelsesoptimalisering trengs
- **Leveranser:** `docs/ytelse/rapport.md`

---

## Quick Reference

| Ekspert | Kalles av | Når | Kommando (hvis direkte) |
|---------|-----------|-----|-------------------------|
| 🎨 WIREFRAME | KRAV-agent | Wireframes trengs | `Aktiver WIREFRAME-ekspert. Lag wireframes for [funksjon].` |
| ⚠️ TRUSSELMODELLERING | ARKITEKTUR-agent | Fase 3 | `Aktiver TRUSSELMODELLERINGS-ekspert. Gjennomfør STRIDE-analyse.` |
| 🔐 OWASP | KVALITETSSIKRINGS-agent | Fase 6 | `Aktiver OWASP-ekspert. Gjennomfør OWASP Top 10 test.` |
| 🔑 HEMMELIGHETSSJEKK | KVALITETSSIKRINGS-agent | Før deploy | `Aktiver HEMMELIGHETSSJEKK-ekspert. Søk etter hemmeligheter.` |
| 📊 GDPR | KRAV/ARKITEKTUR-agent | Persondata | `Aktiver GDPR-ekspert. Vurder GDPR-compliance.` |
| 🎯 BRUKERTEST | ITERASJONS/KVALITETSSIKRINGS-agent | Brukertesting | `Aktiver BRUKERTEST-ekspert. Planlegg brukertesting.` |
| ♿ TILGJENGELIGHET | KVALITETSSIKRINGS-agent | WCAG-test | `Aktiver TILGJENGELIGHETS-ekspert. Test tilgjengelighet.` |
| 📈 YTELSE | ITERASJONS-agent | Optimalisering | `Aktiver YTELSE-ekspert. Analyser ytelse.` |

---

**Disse ekspertene gir dyp spesialkompetanse når du trenger det.**

Tilbake til: [AGENTS-OVERSIKT.md](../AGENTS-OVERSIKT.md)
