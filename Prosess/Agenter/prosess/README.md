# Prosess-agenter - Oversikt

**7 agenter som guider deg gjennom hver fase i Prosess A-Å**

Disse agentene koordinerer arbeidet i hver fase, kaller Basis-agenter og Ekspert-agenter når det trengs, og sørger for at alle leveranser blir laget.

---

## De 7 Prosess-agentene

### 🌱 [Fase 1: OPPSTART-agent](./OPPSTART-agent.md)
**Idé, Visjon & Risikovurdering**

Definerer prosjektet klart, forstår risiko, og legger grunnlaget for sikker utvikling.

**Aktivering:**
```
Aktiver OPPSTART-agent.
Jeg skal starte et nytt prosjekt: [type produkt].
```

**Leveranser:**
- `docs/prosjektbeskrivelse.md`
- `docs/risikoregister.md`

---

### 📋 [Fase 2: KRAV-agent](./KRAV-agent.md)
**Kravspesifikasjon (inkl. Sikkerhetskrav)**

Transformerer visjonen fra Fase 1 til konkrete, byggbare krav.

**Aktivering:**
```
Aktiver KRAV-agent.
Les docs/prosjektbeskrivelse.md og hjelp meg spesifisere krav.
```

**Leveranser:**
- `docs/kravdokument.md`
- `docs/wireframes/` (skisser)

---

### 🏗️ [Fase 3: ARKITEKTUR-agent](./ARKITEKTUR-agent.md)
**Teknisk Design og Trusselmodellering**

Bestemmer HVORDAN produktet skal bygges teknisk, med sikkerhet designet inn.

**Aktivering:**
```
Aktiver ARKITEKTUR-agent.
Les docs/kravdokument.md og hjelp meg designe teknisk løsning.
```

**Leveranser:**
- `docs/teknisk-spec.md`
- `docs/security/trusselmodell.md`
- `docs/arkitektur-diagram.png` (eller .md)

---

### 🚀 [Fase 4: MVP-agent](./MVP-agent.md)
**MVP/Prototype (med Sikker Koding)**

Får en fungerende, sikker prototype ut så raskt som mulig.

**Aktivering:**
```
Aktiver MVP-agent.
Sett opp prosjektet og bygg MVP basert på docs/teknisk-spec.md og docs/kravdokument.md
```

**Leveranser:**
- Fungerende prototype
- CI/CD pipeline konfigurert
- README.md

---

### 🔄 [Fase 5: ITERASJONS-agent](./ITERASJONS-agent.md)
**Utvikling, Iterasjon & Kontinuerlig Validering**

Fullfører alle MVP-funksjoner, polerer, og kontinuerlig validerer med brukere.

**Aktivering:**
```
Aktiver ITERASJONS-agent.
Fullføre MVP-funksjoner og polere produktet basert på docs/BACKLOG.md
```

**Leveranser:**
- Feature-komplett applikasjon
- SAST konfigurert
- Brukertest-notater

---

### ✅ [Fase 6: KVALITETSSIKRINGS-agent](./KVALITETSSIKRINGS-agent.md)
**Testing, Sikkerhet & Kvalitetssikring**

Verifiserer at produktet er klart for lansering - fungerer, er sikkert, og er av høy kvalitet.

**Aktivering:**
```
Aktiver KVALITETSSIKRINGS-agent.
Gjennomfør full testing og sikkerhetsvurdering før lansering.
```

**Leveranser:**
- `docs/testrapport.md`
- `docs/security/sikkerhetsrapport.md`
- Bug-fri (eller akseptert) applikasjon

---

### 🌐 [Fase 7: PUBLISERINGS-agent](./PUBLISERINGS-agent.md)
**Publisering, Overvåking & Vedlikehold**

Lanserer produktet sikkert og setter opp systemer for drift og vedlikehold.

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

---

## Quick Reference

| Fase | Agent | Formål | Fil |
|------|-------|--------|-----|
| 1 | 🌱 OPPSTART | Idé, Visjon & Risikovurdering | [OPPSTART-agent.md](./OPPSTART-agent.md) |
| 2 | 📋 KRAV | Kravspesifikasjon | [KRAV-agent.md](./KRAV-agent.md) |
| 3 | 🏗️ ARKITEKTUR | Teknisk Design | [ARKITEKTUR-agent.md](./ARKITEKTUR-agent.md) |
| 4 | 🚀 MVP | MVP/Prototype | [MVP-agent.md](./MVP-agent.md) |
| 5 | 🔄 ITERASJONS | Utvikling & Iterasjon | [ITERASJONS-agent.md](./ITERASJONS-agent.md) |
| 6 | ✅ KVALITETSSIKRINGS | Testing & Kvalitet | [KVALITETSSIKRINGS-agent.md](./KVALITETSSIKRINGS-agent.md) |
| 7 | 🌐 PUBLISERINGS | Publisering & Drift | [PUBLISERINGS-agent.md](./PUBLISERINGS-agent.md) |

---

## Hvordan bruke

1. **Start med Fase 1** - OPPSTART-agent
2. **Gå gjennom fasene sekvensielt** - hver fase bygger på forrige
3. **Følg aktiveringsinstruksjonene** i hver agent-fil
4. **Fullfør leveransene** før du går videre til neste fase
5. **La agentene kalle andre agenter** når nødvendig (Basis-agenter og Ekspert-agenter)

---

## Relaterte agenter

Prosess-agentene koordinerer og kaller:
- **Basis-agenter** (NIVÅ 1) - Grunnleggende byggeklosser
- **Ekspert-agenter** (NIVÅ 3) - Spesialiserte oppgaver

Se [NIVÅ-2-PROSESS-AGENTER.md](../NIVÅ-2-PROSESS-AGENTER.md) for fullstendig beskrivelse.

---

**Disse agentene styrer hele utviklingsprosessen fra start til produksjon.**
