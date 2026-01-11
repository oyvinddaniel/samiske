# START HER: Quick Guide til Prosess A-Å

**👋 Velkommen til Prosess A-Å!**

Dette dokumentet hjelper deg raskt i gang, enten du er helt ny eller erfaren bruker.

---

## 🎯 Hva er Prosess A-Å?

Et komplett system for å bygge apper med AI-assistanse - fra idé til produksjon.

**Består av:**
- **7 faser** (Idé → Krav → Design → MVP → Utvikling → Testing → Publisering)
- **21 AI-agenter** (6 basis + 7 prosess + 8 ekspert)
- **Sikkerhet innbakt** (ikke påklistret på slutten)

**Målgruppe:** Ikke-kodere som bygger med AI-verktøy (Cursor, Claude, Supabase, Vercel)

---

## 🆕 Er du helt ny til koding med AI?

**👉 START HER:**
→ Gå til [Opplæring/00-LES-MEG-FØRST.md](Opplæring/00-LES-MEG-FØRST.md)

Denne mappen inneholder:
- ✅ **Installasjonsveiledning** (Dag 0) - Node.js, Git, Cursor, etc.
- ✅ **Ordbok med alle tekniske termer** - API, frontend, backend forklart enkelt
- ✅ **Verktøy-guider** (Cursor, Supabase, Vercel) - Lær verktøyene i dybden
- ✅ **Scenario-bibliotek** - Vanlige situasjoner (fortsette etter stengt chat, etc.)
- ✅ **Feilsøkingshjelp** - Systematisk tilnærming til problemer
- ✅ **Demonstrasjonsprosjekter** - Enkle apps for nybegynnere
- ✅ **Uke 1-plan** - Strukturert læring (2-3 timer/dag i 7 dager)

**Kom tilbake hit etter du har fullført Uke 1-planen.**

---

## 🎯 Har du grunnleggende verktøykunnskap?

**Fortsett under for Quick Start...**

---

## ⚡ Quick Start (5 minutter)

### **Steg 1: Hvor er du i prosjektet?**

Velg ditt scenario:

```
┌─────────────────────────────────────────────────────┐
│  "Jeg har en idé, men har ikke startet noe ennå"   │
│  → Gå til: FASE 1 - Aktiver OPPSTART-agent         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  "Jeg vet hva jeg vil bygge, trenger kravspec"     │
│  → Gå til: FASE 2 - Aktiver KRAV-agent             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  "Jeg har kravene, trenger teknisk design"         │
│  → Gå til: FASE 3 - Aktiver ARKITEKTUR-agent       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  "Jeg vil starte å kode og bygge prototype"        │
│  → Gå til: FASE 4 - Aktiver MVP-agent              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  "Jeg har prototype, må fullføre funksjoner"       │
│  → Gå til: FASE 5 - Aktiver ITERASJONS-agent       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  "Appen er ferdig, må testes før lansering"        │
│  → Gå til: FASE 6 - Aktiver KVALITETSSIKRINGS-agent│
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  "Alt er testet, klar til å publisere"             │
│  → Gå til: FASE 7 - Aktiver PUBLISERINGS-agent     │
└─────────────────────────────────────────────────────┘
```

### **Steg 2: Aktiver agenten**

Se **[QUICK-START-PROMPTS.md](Agenter/QUICK-START-PROMPTS.md)** for kopier-klare prompts.

### **Steg 3: Følg agentens instruksjoner**

Agenten vil guide deg gjennom fasen steg-for-steg.

---

## 🧭 De 90/10 Agentene

**90% av tiden bruker du bare disse 4 agentene:**

### **1. 🌱 OPPSTART-agent**
**Når:** Du starter nytt prosjekt
**Gjør:** Problemdefinisjon, risikovurdering, dataklassifisering
**Output:** `docs/vision.md`, `docs/security/risikovurdering.md`

**Quick prompt:**
```
Aktiver OPPSTART-agent.
Jeg vil bygge [beskriv idé i 1-2 setninger].
```

---

### **2. 🎯 PLANLEGGER-agent**
**Når:** Du skal planlegge en ny feature
**Gjør:** Lager PRD (Product Requirements Document)
**Output:** `docs/prd/[feature-navn].md`

**Quick prompt:**
```
Aktiver PLANLEGGER-agent.
Jeg vil bygge [beskriv feature].
Lag PRD.
```

---

### **3. 🔨 BYGGER-agent**
**Når:** Du skal implementere kode
**Gjør:** Bygger i 3 stages (UI → Funksjonalitet → Sikkerhet)
**Output:** Fungerende kode

**Quick prompt:**
```
Aktiver BYGGER-agent.
Implementer basert på docs/prd/[filnavn].md
```

---

### **4. 🐛 DEBUGGER-agent**
**Når:** Noe er i stykker
**Gjør:** Finner og fikser bugs
**Output:** Fikset kode

**Quick prompt:**
```
Aktiver DEBUGGER-agent.
Jeg har følgende problem: [beskriv bug].
```

---

## 📊 De 10%: Prosess-agenter (for full workflow)

Når du går gjennom hele utviklingssyklusen, bruker du **Prosess-agenter** (én per fase).

Disse kaller automatisk Basis-agenter og Ekspert-agenter når nødvendig:

| Fase | Agent | Hva den gjør |
|------|-------|--------------|
| **1** | 🌱 **OPPSTART-agent** | Problemdefinisjon, risiko |
| **2** | 📋 **KRAV-agent** | Brukerhistorier, kravspec |
| **3** | 🏗️ **ARKITEKTUR-agent** | Tech stack, design, trusselmodellering |
| **4** | 🚀 **MVP-agent** | Prosjektoppsett, prototype |
| **5** | 🔄 **ITERASJONS-agent** | Fullføre features, polering |
| **6** | ✅ **KVALITETSSIKRINGS-agent** | Testing, sikkerhet |
| **7** | 🌐 **PUBLISERINGS-agent** | Deploy, monitoring |

**Du trenger IKKE å manuelt kalle:**
- REVIEWER-agent (kalles automatisk av ITERASJONS-agent)
- SIKKERHETS-agent (kalles automatisk i flere faser)
- DOKUMENTERER-agent (kalles automatisk)
- Ekspert-agenter (OWASP, GDPR, etc. - kalles automatisk)

---

## 🎯 Decision Tree: Hvilken agent trenger jeg?

```
START HER
    ↓
Har du startet prosjektet?
    │
    ├─ NEI → Aktiver OPPSTART-agent (Fase 1)
    │        Deretter følg Fase 2-7 sekvensielt
    │
    └─ JA
       ↓
       Har du en bug?
       │
       ├─ JA → Aktiver DEBUGGER-agent
       │
       └─ NEI
          ↓
          Skal du bygge ny feature?
          │
          ├─ JA
          │   ↓
          │   Har du PRD for featuren?
          │   │
          │   ├─ NEI → Aktiver PLANLEGGER-agent (lag PRD)
          │   │        Deretter BYGGER-agent
          │   │
          │   └─ JA → Aktiver BYGGER-agent
          │
          └─ NEI
             ↓
             Er du klar for lansering?
             │
             ├─ JA → Aktiver KVALITETSSIKRINGS-agent
             │        Deretter PUBLISERINGS-agent
             │
             └─ NEI → Les AGENT-MAPPING-PER-FASE.md
                      for å finne riktig agent
```

---

## 📚 Viktige dokumenter

### **For nybegynnere:**
1. **Les først:** [AGENTS-OVERSIKT.md](Agenter/AGENTS-OVERSIKT.md) (15 min)
2. **Deretter:** [QUICK-START-PROMPTS.md](Agenter/QUICK-START-PROMPTS.md) (kopier-klare prompts)
3. **Så:** [DEMO-PROSJEKT.md](DEMO-PROSJEKT.md) (se eksempel end-to-end)

### **For erfarne brukere:**
1. **Quick reference:** [AGENT-MAPPING-PER-FASE.md](Agenter/AGENT-MAPPING-PER-FASE.md)
2. **Prompts:** [QUICK-START-PROMPTS.md](Agenter/QUICK-START-PROMPTS.md)
3. **Filstruktur:** [FILSTRUKTUR-GUIDE.md](FILSTRUKTUR-GUIDE.md)

### **For dyptgående forståelse:**
1. **Fase-dokumenter:** [Fase 1-7 dokumenter](.)
2. **Agent-detaljer:**
   - [NIVÅ-1-BASIS-AGENTER.md](Agenter/NIVÅ-1-BASIS-AGENTER.md)
   - [NIVÅ-2-PROSESS-AGENTER.md](Agenter/NIVÅ-2-PROSESS-AGENTER.md)
   - [NIVÅ-3-EKSPERT-AGENTER.md](Agenter/NIVÅ-3-EKSPERT-AGENTER.md)

---

## 🚀 3 Vanligste Scenarios

### **Scenario 1: Helt nytt prosjekt (første gang)**

```
TID: 2-6 uker avhengig av kompleksitet

DAG 1-2: PLANLEGGING
├─ Aktiver OPPSTART-agent → vision.md
├─ Aktiver KRAV-agent → kravdokumenter
└─ Aktiver ARKITEKTUR-agent → teknisk spec

DAG 3-5: MVP
└─ Aktiver MVP-agent → fungerende prototype

UKE 2-4: UTVIKLING
└─ Aktiver ITERASJONS-agent → feature-komplett app

UKE 5: TESTING
└─ Aktiver KVALITETSSIKRINGS-agent → testet app

DAG SISTE: LANSERING
└─ Aktiver PUBLISERINGS-agent → live app
```

**Kopier-klar kommando:**
```
Aktiver OPPSTART-agent.
Jeg vil bygge [din idé].
```

---

### **Scenario 2: Legg til ny feature (daglig bruk)**

```
TID: 1-3 dager per feature

STEG 1: PLANLEGG (30 min)
└─ Aktiver PLANLEGGER-agent → PRD lages

STEG 2: BYGG (4-8 timer)
└─ Aktiver BYGGER-agent → implementer feature

STEG 3: REVIEW (1-2 timer)
├─ Aktiver REVIEWER-agent → code review
└─ Aktiver SIKKERHETS-agent → security review

STEG 4: DEPLOY
└─ Deploy til staging → testing → produksjon
```

**Kopier-klar kommando:**
```
Aktiver PLANLEGGER-agent.
Jeg vil bygge [feature].
Lag PRD.
```

---

### **Scenario 3: Fikse en bug (ad-hoc)**

```
TID: 30 min - 4 timer avhengig av kompleksitet

STEG 1: IDENTIFISER
└─ Aktiver DEBUGGER-agent → finn årsak

STEG 2: FIKS
└─ DEBUGGER-agent → implementer fix

STEG 3: VERIFISER
└─ Kjør tester → verifiser fix
```

**Kopier-klar kommando:**
```
Aktiver DEBUGGER-agent.
Jeg har følgende problem: [beskriv bug].
```

---

## ⚠️ Vanlige Misforståelser

### ❌ Misforståelse 1: "Jeg må kalle alle 21 agenter manuelt"
✅ **Realitet:** Du aktiverer hovedsakelig bare **Prosess-agenter** (7 stk). De kaller de andre automatisk.

### ❌ Misforståelse 2: "Jeg må følge alle 7 faser selv for en liten feature"
✅ **Realitet:** For eksisterende prosjekter: Bruk bare PLANLEGGER → BYGGER → REVIEWER.

### ❌ Misforståelse 3: "Jeg kan hoppe over Fase 1-3 og gå rett til koding"
✅ **Realitet:** For NYE prosjekter må du gå gjennom Fase 1-3. Men det tar bare 1-2 dager og sparer uker senere.

### ❌ Misforståelse 4: "OWASP-ekspert er for store prosjekter"
✅ **Realitet:** OWASP-testing er kritisk for ALLE kundevendte apper, uansett størrelse. Tar 2-3 timer, kan spare deg for databrudd.

---

## 🎓 Læringssti

### **Første prosjekt (anbefalt):**

**Uke 1: Lær systemet**
- Les AGENTS-OVERSIKT.md (30 min)
- Les DEMO-PROSJEKT.md (1 time)
- Les Fase 1 dokumentet (30 min)

**Uke 2-3: Bygg et enkelt prosjekt**
- Velg noe ENKELT (todo-liste, notatapp, etc.)
- Følg alle 7 faser
- Lær ved å gjøre

**Uke 4+: Bygg ditt faktiske prosjekt**
- Nå har du erfaring
- Du vet hvilke agenter du trenger
- Du kan gå raskere

### **Erfarne brukere:**

Du kan hoppe rett til:
- QUICK-START-PROMPTS.md → kopier prompts
- AGENT-MAPPING-PER-FASE.md → quick reference
- Start koding

---

## 🔥 Pro Tips

### **Tip 1: Alltid gi kontekst**
```
❌ Dårlig: "Aktiver BYGGER-agent"
✅ Bra: "Aktiver BYGGER-agent. Implementer brukerautentisering basert på docs/prd/auth.md"
```

### **Tip 2: Referer til eksisterende dokumenter**
```
✅ "Les docs/vision.md og docs/krav/*.md før du fortsetter"
```

### **Tip 3: Vær spesifikk på leveranser**
```
✅ "Lagre resultatet i docs/security/trusselmodell.md"
```

### **Tip 4: Bruk 3-stage tilnærmingen**
Når du bygger features:
1. **Stage 1:** UI only (mock data)
2. **Stage 2:** Real functionality
3. **Stage 3:** Testing + Security

Dette forhindrer at du bygger masse funksjonalitet som må kastes.

### **Tip 5: Ikke skip sikkerhet**
Hver fase har sikkerhetshensyn. Ikke hopp over dem:
- Fase 1: Dataklassifisering
- Fase 3: Trusselmodellering
- Fase 4-5: Sikker koding
- Fase 6: OWASP-testing

Å fikse sikkerhetshull tidlig er 10x billigere enn senere.

---

## 🆘 Hjelp, jeg står fast!

### **Problem:** "Jeg vet ikke hvilken fase jeg er i"
**Løsning:** Sjekk hva du har:
- Har du `docs/vision.md`? → Du har gjort Fase 1
- Har du `docs/krav/*.md`? → Du har gjort Fase 2
- Har du `docs/teknisk-spec.md`? → Du har gjort Fase 3
- Har du fungerende kode? → Du er i Fase 4-5
- Har du kjørt tester? → Du er i Fase 6
- Er appen live? → Du har gjort Fase 7

### **Problem:** "Agenten gir ikke de resultatene jeg forventer"
**Løsning:** Gi mer kontekst og vær tydelig:
```
Aktiver [AGENT].

KONTEKST:
- Prosjekt: [navn]
- Målgruppe: [hvem]
- Tech stack: [hva]

OPPGAVE:
[Beskriv nøyaktig hva du vil]

LEVERANSER:
[Hva forventer du som output]
```

### **Problem:** "Jeg har ikke tid til alle 7 faser"
**Løsning:** Prioriter:
- **Minimum:** Fase 1, 4, 7 (visjon → bygg → deploy)
- **Anbefalt:** Fase 1-4, 6-7 (hopp over iterasjon hvis enkel MVP)
- **Ideelt:** Alle 7 faser (gir best resultat)

Men vær klar over: Å hoppe over sikkerhetsfaser (3, 6) kan koste deg dyrt senere.

---

## ✅ Sjekkliste: Er jeg klar til å starte?

**For nytt prosjekt:**
- [ ] Jeg har lest AGENTS-OVERSIKT.md
- [ ] Jeg har sett på DEMO-PROSJEKT.md
- [ ] Jeg har opprettet prosjektmappe med docs/ struktur
- [ ] Jeg har en klar idé om hva jeg vil bygge
- [ ] Jeg er klar til å bruke 2-6 uker på dette

**For eksisterende prosjekt:**
- [ ] Jeg vet hvilken feature jeg vil bygge
- [ ] Jeg har QUICK-START-PROMPTS.md åpen
- [ ] Jeg vet om jeg trenger PRD eller kan bygge direkte

---

## 🎯 Neste Steg

**Velg basert på din situasjon:**

### **Jeg er helt ny:**
1. Les [AGENTS-OVERSIKT.md](Agenter/AGENTS-OVERSIKT.md)
2. Les [DEMO-PROSJEKT.md](DEMO-PROSJEKT.md)
3. Start med et enkelt prosjekt (todo-app)
4. Følg alle 7 faser

### **Jeg vil se et eksempel først:**
1. Gå til [DEMO-PROSJEKT.md](DEMO-PROSJEKT.md)
2. Se hvordan agentene brukes i praksis
3. Deretter start ditt eget prosjekt

### **Jeg vil starte NÅ:**
1. Åpne [QUICK-START-PROMPTS.md](Agenter/QUICK-START-PROMPTS.md)
2. Finn ditt scenario
3. Kopier prompten
4. Aktiver agenten i Claude Code

### **Jeg vil forstå systemet grundig:**
1. Les alle 7 fase-dokumenter
2. Les NIVÅ-1, 2, 3 BASIS-AGENTER.md filer
3. Les AGENT-MAPPING-PER-FASE.md
4. Start med et reelt prosjekt

---

## 📞 Ressurser

- **AGENTS-OVERSIKT.md** - Komplett oversikt over agent-systemet
- **QUICK-START-PROMPTS.md** - Kopier-klare prompts
- **AGENT-MAPPING-PER-FASE.md** - Hvilke agenter i hvilken fase
- **DEMO-PROSJEKT.md** - Fullstendig eksempel fra start til slutt
- **FILSTRUKTUR-GUIDE.md** - Hvor lagres alle filer
- **PROGRESS-TRACKER.md** - Følg fremdriften din

---

**Lykke til med ditt prosjekt! 🚀**

*Husk: Prosess A-Å er her for å hjelpe deg bygge tryggere, raskere og bedre. Ta deg tid til å forstå systemet, så vil det betale seg mange ganger over.*

---

**Sist oppdatert:** 2026-01-06
**Versjon:** 1.0
