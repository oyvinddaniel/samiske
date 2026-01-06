# Migreringsguide: Prosess A-Å integrasjon

> Guide for å forstå overgangen til Prosess A-Å
> Dato: 2026-01-06

---

## Hva har endret seg?

### Før (opprinnelig system)
- 6 basis AI-roller (PLANLEGGER, BYGGER, REVIEWER, SIKKERHETS, DEBUGGER, DOKUMENTERER)
- Ad-hoc workflow
- Dokumentasjon spredt i `docs/`

### Nå (med Prosess A-Å)
- **21 agenter** organisert i 3 nivåer:
  - **6 basis-agenter** (daglig bruk) - samme som før, men forbedret
  - **7 prosess-agenter** (én per utviklingsfase)
  - **8 ekspert-agenter** (spesialiserte oppgaver)
- Strukturert 7-fase prosess fra idé til produksjon
- Komplett dokumentasjon i `docs/process/`

---

## Viktig: Ingen progresjon mistet!

✅ **ALL eksisterende progresjon er bevart:**
- `docs/STATUS.md` - Uendret, alle pågående oppgaver intakte
- `docs/BACKLOG.md` - Uendret, alle oppgaver bevart
- `docs/logs/CHANGELOG.md` - Historikk bevart
- `docs/prd/` - Alle PRDer intakte

✅ **Ingen breaking changes:**
- Eksisterende AI-roller fungerer fortsatt
- Du kan fortsette å bruke PLANLEGGER, BYGGER, etc. som før
- Ny funksjonalitet er lagt til, ikke erstatt

---

## For samiske.no (post-launch)

Siden samiske.no allerede er live, trenger du **ikke** gå gjennom alle 7 faser. Vi er i **Fase 5-7** (Vedlikehold & Videreutvikling).

### Hva du skal bruke fremover

#### For daglige oppgaver (90% av tiden)
```
Bruk de 6 basis-agentene som før:
1. PLANLEGGER-agent → Lag PRD
2. BYGGER-agent → Implementer
3. REVIEWER-agent → Code review
4. SIKKERHETS-agent → Security audit
5. DEBUGGER-agent → Bug fixes
6. DOKUMENTERER-agent → Oppdater docs
```

**Intet nytt å lære!** Disse fungerer som før, men med forbedrede instruksjoner.

#### For større features (10% av tiden)
```
Bruk ITERASJONS-agent (Fase 5):

Aktiver ITERASJONS-agent.
Les docs/prd/[feature].md og implementer featuren.

→ Agent orchestrerer automatisk de 6 basis-agentene
```

Dette er nytt og kan spare deg tid på store features.

---

## Mappel-endringer

### Nye mapper

```
docs/
└── process/                    ← NY MAPPE
    ├── START-HER.md            ← Quick guide
    ├── faser/                  ← 7 fase-dokumenter
    ├── agenter/                ← 21 agent-instruksjoner
    └── templates/              ← PRD-templates (kommer)
```

### Oppdaterte filer

| Fil | Hva som endret |
|-----|----------------|
| `CLAUDE.md` | ✅ Lagt til Prosess A-Å referanser |
| `docs/AGENTS.md` | ✅ Utvidet med alle 21 agenter |
| `docs/README.md` | ✅ Oppdatert filstruktur |

### Uendrede filer (progresjon bevart)

| Fil | Status |
|-----|--------|
| `docs/PROJECT.md` | ✅ Uendret |
| `docs/STATUS.md` | ✅ Uendret |
| `docs/BACKLOG.md` | ✅ Uendret |
| `docs/CONVENTIONS.md` | ✅ Uendret |
| `docs/SECURITY.md` | ✅ Uendret |
| `docs/SETUP.md` | ✅ Uendret |
| `docs/DECISIONS.md` | ✅ Uendret |
| `docs/prd/*` | ✅ Uendret |
| `docs/logs/CHANGELOG.md` | ✅ Uendret |

---

## Praktisk bruk

### Scenario 1: Enkel feature (som før)

**Før:**
```
1. Aktiver PLANLEGGER-agent
2. Aktiver BYGGER-agent
3. Aktiver REVIEWER-agent
4. Deploy
```

**Nå (samme):**
```
1. Aktiver PLANLEGGER-agent
2. Aktiver BYGGER-agent
3. Aktiver REVIEWER-agent
4. Deploy
```

✅ **Ingen endring nødvendig!**

---

### Scenario 2: Større feature (nytt, valgfritt)

**Før:**
```
1. Aktiver PLANLEGGER-agent
2. Aktiver BYGGER-agent (mange ganger)
3. Aktiver REVIEWER-agent (mange ganger)
4. Aktiver SIKKERHETS-agent
5. Deploy
```

**Nå (kortere, valgfritt):**
```
Aktiver ITERASJONS-agent.
Les docs/prd/[feature].md og implementer.

→ Agent håndterer orchestreringen
```

✅ **Nytt alternativ for å spare tid**

---

### Scenario 3: Bug-fix (som før)

**Før:**
```
Aktiver DEBUGGER-agent.
Debug [problem].
```

**Nå (samme):**
```
Aktiver DEBUGGER-agent.
Debug [problem].
```

✅ **Ingen endring nødvendig!**

---

## Nye muligheter (valgfritt å bruke)

### 1. ITERASJONS-agent (Fase 5)
For store features som krever flere steg:
```
Aktiver ITERASJONS-agent.
Implementer [feature].

→ Orchestrerer automatisk PLANLEGGER, BYGGER, REVIEWER, SIKKERHETS
```

### 2. Ekspert-agenter
Kalles automatisk når nødvendig:
- **OWASP-ekspert** - Sikkerhetstesting
- **YTELSE-ekspert** - Performance-optimalisering
- **TILGJENGELIGHETS-ekspert** - WCAG-testing
- **GDPR-ekspert** - GDPR-compliance
- m.fl.

Du trenger ikke kalle disse manuelt - prosess-agenter kaller dem automatisk.

### 3. Strukturert prosess for nye prosjekter
Hvis du noensinne starter et nytt prosjekt, har du nå:
- 7 faser (Idé → Deploy)
- 7 prosess-agenter (én per fase)
- Templates og veiledning

---

## Hvordan lære mer

### Lær grunnleggende (5 min)
Les: `docs/process/START-HER.md`

### Lær agent-systemet (10 min)
Les: `docs/AGENTS.md`

### Lær alle agenter (20 min)
Les: `docs/process/agenter/AGENTS-OVERSIKT.md`

### Kopier-klare prompts
Bruk: `docs/process/agenter/QUICK-START-PROMPTS.md`

---

## FAQ

### Q: Må jeg lære det nye systemet?
**A:** Nei. De 6 basis-agentene fungerer som før. Prosess A-Å er valgfritt ekstra funksjonalitet.

### Q: Hva skjer med mine pågående oppgaver?
**A:** Ingenting. `STATUS.md` og `BACKLOG.md` er uendret.

### Q: Må jeg endre måten jeg jobber på?
**A:** Nei. Du kan fortsette som før. Nye features er valgfrie.

### Q: Når skal jeg bruke ITERASJONS-agent?
**A:** Valgfritt, men nyttig for store features (1-2 uker) hvor du vil spare tid på orchestrering.

### Q: Hva med ekspert-agenter?
**A:** Du kaller dem ikke direkte. De kalles automatisk når nødvendig.

### Q: Kan jeg ignorere Prosess A-Å?
**A:** Ja. Det meste av Prosess A-Å er for nye prosjekter. For samiske.no (post-launch) kan du fortsette med basis-agentene.

### Q: Hva er den største fordelen for meg?
**A:**
1. Forbedrede basis-agenter (bedre instruksjoner)
2. ITERASJONS-agent for store features (sparer tid)
3. Strukturert prosess hvis du starter nytt prosjekt

---

## Checklist for overgang

- [ ] Les `docs/process/START-HER.md` (5 min)
- [ ] Les `docs/AGENTS.md` (10 min)
- [ ] Fortsett å bruke basis-agentene som før
- [ ] Prøv ITERASJONS-agent neste gang du har stor feature (valgfritt)
- [ ] Verifiser at `STATUS.md` og `BACKLOG.md` er intakte

---

## Kontakt

Ved spørsmål, si:
```
"Jeg har spørsmål om overgangen til Prosess A-Å.
[Ditt spørsmål]"
```

---

## Oppsummering

✅ **Ingen progresjon mistet** - Alt bevart i STATUS.md, BACKLOG.md, etc.
✅ **Ingen breaking changes** - Basis-agenter fungerer som før
✅ **Nye muligheter** - ITERASJONS-agent, ekspert-agenter, strukturert prosess
✅ **Valgfritt** - Du bestemmer når/om du vil bruke nye features
✅ **Post-launch fokus** - System er tilpasset at samiske.no er live

**Du kan fortsette å jobbe som før. Nye features er valgfrie forbedringer.**

---

**Migrert:** 2026-01-06
**Versjon:** 1.0
**Status:** Fullført ✅	
