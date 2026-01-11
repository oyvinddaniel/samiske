# BRUKER-GUIDE: Slik bruker du AI-agentene
## Enkel oppskrift for ikke-kodere

> **For:** Prosjekteiere og ikke-tekniske brukere
> **Sist oppdatert:** 2026-01-08
> **Lesetid:** 15 minutter

---

## 📖 Hva er en AI-agent?

**Enkelt forklart:**
En AI-agent er som en spesialisert medarbeider som er ekspert på én spesifikk oppgave. I stedet for å ha én Claude som skal gjøre ALT, har vi nå 21 spesialiserte "medarbeidere" som jobber sammen.

**Tenk på det som et team:**
- **PLANLEGGER** = Prosjektleder som lager planer
- **BYGGER** = Utvikler som koder
- **REVIEWER** = Kvalitetskontrollør som sjekker arbeidet
- **SIKKERHETS** = Sikkerhetsekspert som passer på at alt er trygt
- **DEBUGGER** = Problemløser som fikser feil
- osv...

**Hvorfor er dette bra?**
- ✅ Hver agent er **ekspert** på sitt felt (bedre kvalitet)
- ✅ Flere agenter kan jobbe **samtidig** (raskere ferdig)
- ✅ Mindre feil fordi agenter **sjekker hverandre**
- ✅ Prosessen blir **forutsigbar** (samme kvalitet hver gang)

---

## 🎯 De 6 agentene du kommer til å bruke mest

Disse 6 agentene dekker 90% av alt daglig arbeid:

### 1. 🎯 PLANLEGGER - "Prosjektlederen"

**Hva gjør den?**
Lager en detaljert plan før vi begynner å bygge noe. Tenk på det som å lage en tegning før du bygger et hus.

**Når bruker du den?**
Hver gang du skal bygge noe nytt (ny funksjon, ny side, etc.)

**Slik ber du om hjelp:**
```
Aktiver PLANLEGGER-agent.
Jeg vil bygge en funksjon hvor brukere kan redigere profilen sin.
```

**Hva skjer da?**
1. Agenten stiller deg oppklarende spørsmål
2. Du svarer på spørsmålene
3. Agenten lager en detaljert plan (PRD) som lagres i `docs/prd/`
4. Du godkjenner planen (eller ber om endringer)

**Hvor lang tid tar det?**
5-15 minutter for en liten funksjon, 30-60 minutter for en stor funksjon.

---

### 2. 🔨 BYGGER - "Utvikleren"

**Hva gjør den?**
Bygger det som står i planen. Skriver kode, lager brukergrensesnitt, kobler til database.

**Når bruker du den?**
Etter at PLANLEGGER har laget en plan.

**Slik ber du om hjelp:**
```
Aktiver BYGGER-agent.
Implementer planen i docs/prd/profil-redigering.md
```

**Hva skjer da?**
Agenten jobber i 5 steg:
1. **Steg 1:** Bygger brukergrensesnittet (det du ser på skjermen)
2. **Steg 2:** Kobler til database (så data faktisk lagres)
3. **Steg 3:** Skriver tester (sjekker at alt fungerer)
4. **Steg 4:** Kjører sikkerhetssjekk (passer på at det er trygt)
5. **Steg 5:** Tester i et trygt miljø og fikser eventuelle feil

**Hvor lang tid tar det?**
1-3 timer for en typisk funksjon (avhengig av kompleksitet).

**Viktig å vite:**
- Du kan be om å godkjenne hvert steg (hvis du vil ha kontroll)
- Eller la den jobbe helt selvstendig (hvis du stoler på prosessen)

---

### 3. 🔍 REVIEWER - "Kvalitetskontrolløren"

**Hva gjør den?**
Sjekker at koden som BYGGER har laget er bra. Som en siste kvalitetskontroll før noe går live.

**Når bruker du den?**
Automatisk etter BYGGER er ferdig, eller manuelt hvis du vil ha en ekstra sjekk.

**Slik ber du om hjelp:**
```
Aktiver REVIEWER-agent.
Review koden for profil-redigering.
```

**Hva skjer da?**
Agenten sjekker 7 ting:
1. Er koden lett å forstå?
2. Er den for komplisert?
3. Er den sikker?
4. Er den rask nok?
5. Er det skrevet tester?
6. Følger den prosjektets regler?
7. Alt i alt: Kan dette godkjennes?

**Hva får du tilbake?**
En rapport som sier:
- **GODKJENT** (kan gå live)
- **TRENGER ENDRINGER** (må fikses først)
- **KOMMENTAR** (ingen kritiske problemer, men forslag til forbedringer)

**Hvor lang tid tar det?**
5-15 minutter.

---

### 4. 🛡️ SIKKERHETS - "Sikkerhetsvakten"

**Hva gjør den?**
Passer på at alt som bygges er trygt. Sjekker for vanlige sikkerhetshull.

**Når bruker du den?**
Automatisk i BYGGER steg 4, eller manuelt før du deployer noe viktig.

**Slik ber du om hjelp:**
```
Aktiver SIKKERHETS-agent.
Sjekk sikkerheten på profil-redigering.
```

**Hva skjer da?**
Agenten sjekker:
- Er passord og API-nøkler skjult? (ikke synlig i koden)
- Kan brukere se andres private data?
- Kan noen hacke seg inn?
- Er all brukerinput sjekket? (forhindrer injection-angrep)

**Hva får du tilbake?**
En sikkerhetsvurdering med:
- **P1 (Kritisk):** Må fikses NÅ (før deploy)
- **P2 (Viktig):** Bør fikses snart
- **P3 (Middels):** Kan fikses senere

**Hvor lang tid tar det?**
5-10 minutter.

---

### 5. 🐛 DEBUGGER - "Problemløseren"

**Hva gjør den?**
Finner og fikser feil. Som en lege som diagnostiserer og behandler en sykdom.

**Når bruker du den?**
Når noe er galt - knapper som ikke virker, feilmeldinger, ting som ikke oppfører seg som forventet.

**Slik ber du om hjelp:**
```
Aktiver DEBUGGER-agent.
Jeg har følgende problem: Når jeg klikker på "Lagre" i profilredigering, skjer det ingenting.
```

**Hva skjer da?**
Agenten jobber systematisk:
1. Samler informasjon (når skjer feilen? Hvilke steg?)
2. Gjenskaper problemet (prøver å få samme feil)
3. Isolerer årsaken (finner hvor i koden det går galt)
4. Lager en teori om hvorfor
5. Fikser problemet
6. Verifiserer at det fungerer nå
7. Skriver en test så feilen ikke kommer tilbake

**Hvor lang tid tar det?**
15 minutter til 2 timer (avhengig av hvor vanskelig problemet er).

**Viktig å vite:**
- Gi så detaljert beskrivelse som mulig av problemet
- Fortell hva du gjorde før feilen oppsto
- Si om det fungerte før (eller om det alltid har vært sånn)

---

### 6. 📋 DOKUMENTERER - "Sekretæren"

**Hva gjør den?**
Holder dokumentasjonen oppdatert. Skriver ned hva som er gjort, hvorfor, og hvordan ting fungerer.

**Når bruker du den?**
Automatisk etter store endringer, eller manuelt hvis dokumentasjon er utdatert.

**Slik ber du om hjelp:**
```
Aktiver DOKUMENTERER-agent.
Oppdater dokumentasjonen for profil-redigering.
```

**Hva skjer da?**
Agenten oppdaterer:
- `STATUS.md` (hva er gjort)
- `BACKLOG.md` (hva gjenstår)
- `CHANGELOG.md` (historikk over endringer)
- PRD-filer (hvis det er endringer i planen)

**Hvor lang tid tar det?**
5-10 minutter.

**Viktig å vite:**
Dokumentasjonen er viktig for fremtidig deg (og andre som skal jobbe på prosjektet). Ikke hopp over dette!

---

## 🚀 De 2 "superagentene" (orchestrators)

Disse 2 agentene er som **direktører** som styrer de andre agentene. De bestemmer hvilke agenter som skal jobbe, og i hvilken rekkefølge.

### 7. 🔄 ITERASJONS-agent ⭐ - "Prosjektdirektøren"

**Hva gjør den?**
Koordinerer alle de andre agentene når du skal bygge noe. Den er som en prosjektleder som delegerer oppgaver til teamet.

**Når bruker du den?**
For større funksjoner hvor du vil at Claude skal håndtere hele prosessen fra start til slutt.

**Slik ber du om hjelp:**
```
Aktiver ITERASJONS-agent.
Jeg vil bygge en funksjon hvor brukere kan redigere profilen sin.
Bruk parallell orchestration for backend og frontend.
```

**Hva skjer da?**
Agenten spawner (starter) andre agenter:
1. **PLANLEGGER** → Lager plan
2. **BYGGER (Backend)** + **BYGGER (Frontend)** → Jobber samtidig!
3. **SIKKERHETS** → Sjekker sikkerhet
4. **REVIEWER** → Kvalitetssjekk
5. **DOKUMENTERER** → Oppdaterer docs

**Magien: Parallell jobbing**
I stedet for å vente på at backend er ferdig før frontend starter, jobber begge samtidig. Dette sparer 60-70% av tiden!

**Eksempel:**
- **Uten ITERASJONS:** 8 timer (1 agent jobber av gangen)
- **Med ITERASJONS:** 3 timer (flere agenter jobber samtidig)

**Hvor lang tid tar det?**
2-4 timer for en typisk funksjon (vs 6-10 timer uten).

**Viktig å vite:**
- Dette er den viktigste agenten for samiske.no!
- Bruk denne for alt som tar mer enn 1-2 timer
- Du kan lene deg tilbake mens den jobber (den rapporterer fremgang underveis)

---

### 8. ✅ KVALITETSSIKRINGS-agent ⭐ - "Sjefinspektøren"

**Hva gjør den?**
Kjører en fullstendig kvalitetssjekk før du deployer noe stort til produksjon. Som en FAU-godkjenning før bygget kan tas i bruk.

**Når bruker du den?**
Før store releaser eller nye funksjoner går live.

**Slik ber du om hjelp:**
```
Aktiver KVALITETSSIKRINGS-agent.
Kjør full pre-release audit.
```

**Hva skjer da?**
Agenten spawner 5 ekspert-agenter som jobber samtidig:
1. **OWASP-ekspert** → Sjekker sikkerhet (OWASP Top 10)
2. **HEMMELIGHETSSJEKK-ekspert** → Sjekker at ingen passord/API-nøkler er synlige
3. **TILGJENGELIGHETS-ekspert** → Sjekker at folk med funksjonsnedsettelser kan bruke siden
4. **GDPR-ekspert** → Sjekker personvern og GDPR-compliance
5. **BRUKERTEST-ekspert** → Sjekker brukervennlighet

**Hva får du tilbake?**
En omfattende rapport med:
- **Pass** ✅ (alt ok)
- **Fail** ❌ (kritiske problemer som MÅ fikses)
- **Warning** ⚠️ (forbedringer som BØR gjøres)

**Hvor lang tid tar det?**
1-2 timer (men sparer deg for potensielle katastrofer senere).

**Viktig å vite:**
- **Kjør alltid før store releaser!**
- Bedre å finne problemer nå enn etter at brukere har oppdaget dem
- Rapporten kan brukes til å vise stakeholders at alt er gjort riktig

---

## 📚 Oppskrifter: Slik bruker du agentene i praksis

### Oppskrift 1: Bygge en ny liten funksjon (1-2 timer)

**Scenario:** Du vil legge til en «Del»-knapp på innlegg.

**Steg-for-steg:**

```
Steg 1: Planlegging (5-10 min)
Du skriver til Claude:
"Aktiver PLANLEGGER-agent.
Jeg vil legge til en Del-knapp på innlegg som lar brukere dele via Web Share API."

→ PLANLEGGER stiller spørsmål
→ Du svarer
→ PLANLEGGER lager PRD i docs/prd/share-button.md
→ Du godkjenner planen

---

Steg 2: Implementering (30-60 min)
Du skriver til Claude:
"Aktiver BYGGER-agent.
Implementer docs/prd/share-button.md
Autonomy level: balanced"

→ BYGGER bygger UI (Del-knapp)
→ BYGGER kobler til Web Share API
→ BYGGER skriver tester
→ BYGGER kjører sikkerhetsjekk
→ BYGGER verifiserer at det fungerer

---

Steg 3: Review (5-10 min)
Claude aktiverer automatisk REVIEWER-agent
(eller du ber om det manuelt)

→ REVIEWER sjekker koden
→ REVIEWER gir rapport: GODKJENT ✅

---

Steg 4: Deploy
Du pusher koden til GitHub
→ Vercel deployer automatisk til produksjon
→ Ferdig!
```

**Total tid:** 1-1.5 timer

---

### Oppskrift 2: Bygge en stor funksjon (1 uke+)

**Scenario:** Du vil bygge et meldingssystem hvor brukere kan sende direktemeldinger til hverandre.

**Steg-for-steg:**

```
Steg 1: Aktiver superagenten (5 min)
Du skriver til Claude:
"Aktiver ITERASJONS-agent.
Jeg vil bygge et meldingssystem hvor brukere kan:
- Sende direktemeldinger til venner
- Se meldingshistorikk
- Få varsling om nye meldinger
- Markere meldinger som lest
Bruk parallell orchestration."

→ ITERASJONS tar over hele prosessen

---

Steg 2: ITERASJONS orkestererer (automatisk)
ITERASJONS spawner automatisk:

1. PLANLEGGER → Lager detaljert PRD (30 min)
2. BYGGER (Backend) → API endpoints + database (parallell)
   BYGGER (Frontend) → UI komponenter (parallell)
   BYGGER (Realtime) → Websockets for live updates (parallell)
   → Total tid: 4 timer (vs 12 timer sekvensielt)
3. SIKKERHETS → Sjekker at meldinger er private (30 min)
4. REVIEWER → Kvalitetssjekk av alt (1 time)
5. DOKUMENTERER → Oppdaterer dokumentasjon (15 min)

→ ITERASJONS rapporterer fremgang underveis
→ Du kan følge med, men trenger ikke gjøre noe

---

Steg 3: Testing (din jobb)
ITERASJONS er ferdig, nå tester du:
- Send en melding til deg selv
- Test på mobil og desktop
- Test med flere brukere

Finner du bugs?
→ Aktiver DEBUGGER-agent for hver bug

---

Steg 4: Pre-release audit
Du skriver til Claude:
"Aktiver KVALITETSSIKRINGS-agent.
Kjør full audit på meldingssystemet."

→ KVALITETSSIKRINGS spawner 5 eksperter parallelt
→ Får rapport etter 1-2 timer
→ Fikser eventuelle P1-issues

---

Steg 5: Deploy
Push til GitHub → Deploy til produksjon
→ Ferdig!
```

**Total tid med ITERASJONS:** 1-2 dager (vs 1 uke+ uten)

---

### Oppskrift 3: Fikse en bug

**Scenario:** Brukere rapporterer at «Lagre»-knappen ikke fungerer i profilredigering.

**Steg-for-steg:**

```
Steg 1: Aktiver problemløseren (2 min)
Du skriver til Claude:
"Aktiver DEBUGGER-agent.
Problem: Når brukere klikker 'Lagre' i profilredigering, skjer det ingenting.
De får ingen feilmelding, men endringene lagres ikke.
Dette startet i dag morgen."

---

Steg 2: DEBUGGER jobber systematisk (15-60 min)
→ Samler informasjon (logger, feilmeldinger)
→ Gjenskaper problemet
→ Finner årsaken (f.eks. en database-connection issue)
→ Foreslår fix
→ Du godkjenner
→ Implementerer fix
→ Verifiserer at det fungerer nå
→ Skriver test så det ikke skjer igjen

---

Steg 3: Deploy fix
Push til GitHub → Deploy
→ Problemet er løst!
```

**Total tid:** 30 minutter til 2 timer (avhengig av kompleksitet)

---

### Oppskrift 4: Sikre at sikkerhet er ivaretatt (alltid)

**Sikkerhet er ikke noe du gjør til slutt - det skal være integrert i ALLE faser!**

#### 🛡️ Fase 1: Under planlegging

```
Når PLANLEGGER lager PRD, spør:
"Hvilke sikkerhetstiltak må være på plass?"

PLANLEGGER vil identifisere:
- Hvem skal ha tilgang? (authz)
- Hva kan gå galt? (threat modeling)
- Hvilke data må beskyttes? (PII, secrets)
```

#### 🛡️ Fase 2: Under bygging

```
BYGGER kjører automatisk SIKKERHETS i Stage 4:
- Secrets scanning (API-nøkler, passord)
- PII detection (personnummer, e-post)
- SQL injection sjekk
- XSS (cross-site scripting) sjekk

Hvis issues finnes → fikses før videre
```

#### 🛡️ Fase 3: Under review

```
REVIEWER sjekker sikkerhet som del av 7-step review:
- Er RLS policies korrekte? (row-level security i Supabase)
- Er input validert?
- Er passord hashet?
- Er sensitive data kryptert?
```

#### 🛡️ Fase 4: Før deploy

```
Før store releaser, kjør:
"Aktiver KVALITETSSIKRINGS-agent"

→ OWASP-ekspert sjekker alle 10 OWASP kategorier
→ HEMMELIGHETSSJEKK-ekspert scanner for lekkede secrets
→ GDPR-ekspert sjekker privacy compliance

Alle P1-issues MÅ fikses før deploy!
```

#### 🛡️ Fase 5: Etter deploy

```
Overvåk logger for:
- Uvanlig aktivitet
- Feilede login-forsøk
- API-feil

Hvis mistanke om sikkerhetsbrudd:
→ Aktiver DEBUGGER-agent for å undersøke
```

**Gylne regler for sikkerhet:**
1. ✅ **ALDRI** commit passord, API-nøkler, eller secrets til GitHub
2. ✅ **ALLTID** bruk RLS policies i Supabase (row-level security)
3. ✅ **ALLTID** valider brukerinput (folk kan skrive farlig kode)
4. ✅ **ALLTID** kjør KVALITETSSIKRINGS før store releaser
5. ✅ **ALDRI** stole på at «det nok går bra» - sjekk alltid!

---

## 🎯 Vanlige spørsmål (FAQ)

### Spørsmål 1: Når skal jeg bruke ITERASJONS vs bare BASIS-agenter?

**Svar:**
- **Bruk BASIS-agenter direkte** hvis:
  - Oppgaven er liten (< 2 timer)
  - Det er kun én fil som skal endres
  - Du vil ha full kontroll over hvert steg

- **Bruk ITERASJONS** hvis:
  - Oppgaven er stor (> 2 timer)
  - Flere filer må endres
  - Du vil at Claude skal håndtere hele prosessen
  - Du vil spare tid med parallell jobbing

---

### Spørsmål 2: Hvor mange agenter kan jobbe samtidig?

**Svar:**
- **Uten ITERASJONS:** 1 agent av gangen
- **Med ITERASJONS:** Opptil 5-10 agenter samtidig
- **Begrensning:** Token-bruk (mer parallellitet = høyere kostnad)

**Praktisk anbefaling for samiske.no:**
- 2-3 BYGGER-agenter parallelt (backend, frontend, testing)
- 5 ekspert-agenter parallelt (i KVALITETSSIKRINGS)

---

### Spørsmål 3: Hva om agenten gjør noe feil?

**Svar:**
**Det er HELT NORMALT at agenter gjør feil!** (akkurat som mennesker)

**Når en agent gjør feil:**
1. Claude vil ofte oppdage det selv (self-correction i BYGGER Stage 5)
2. REVIEWER vil fange det i kvalitetssjekken
3. Du kan be DEBUGGER fikse det

**Viktigste regel:**
🔴 **Test alltid før deploy til produksjon!**

---

### Spørsmål 4: Kan jeg stoppe en agent midt i prosessen?

**Svar:**
Ja! Bare skriv "Stopp" i chatten.

Men bedre:
- La agenten fullføre det den holder på med
- Deretter si hva som skal endres
- Agenten kan justere basert på feedback

---

### Spørsmål 5: Hvordan vet jeg at sikkerhet er ivaretatt?

**Svar:**
**Tre nivåer av sikkerhet:**

1. **Nivå 1 (Automatisk):**
   - BYGGER kjører automatisk SIKKERHETS i Stage 4
   - Secrets scanning
   - PII detection

2. **Nivå 2 (Review):**
   - REVIEWER sjekker sikkerhet i Step 3
   - RLS policies
   - Input validation

3. **Nivå 3 (Pre-deploy):**
   - KVALITETSSIKRINGS kjører full audit
   - OWASP-ekspert (alle 10 kategorier)
   - HEMMELIGHETSSJEKK-ekspert
   - GDPR-ekspert

**Hvis alle 3 nivåer passerer → sikkerhet er ivaretatt!**

---

### Spørsmål 6: Hva er forskjellen på «manuell» og «automatisk» aktivering?

**Svar:**
- **Manuell** = Du må eksplisitt be om agenten
  - Eksempel: "Aktiver PLANLEGGER-agent"

- **Automatisk** = Claude aktiverer agenten selv når det trengs
  - Eksempel: BYGGER aktiverer SIKKERHETS automatisk i Stage 4

**Hvilke er automatiske?**
- REVIEWER (etter BYGGER)
- SIKKERHETS (i BYGGER Stage 4)
- DOKUMENTERER (etter store endringer)
- Alle ekspert-agenter (når kalles av orchestrators)

**Hvilke er manuelle?**
- PLANLEGGER (du starter planlegging)
- BYGGER (du starter implementering)
- DEBUGGER (du rapporterer bugs)
- ITERASJONS (du starter store features)
- KVALITETSSIKRINGS (du starter pre-release audit)

---

### Spørsmål 7: Hvor finner jeg output fra agentene?

**Svar:**
Agenter lagrer output i spesifikke filer:

| Agent | Output | Hvor |
|-------|--------|------|
| PLANLEGGER | PRD (plan) | `docs/prd/[feature].md` |
| BYGGER | Kode | `src/` (flere filer) |
| REVIEWER | Review-rapport | (i chat, ikke fil) |
| SIKKERHETS | Security audit | (i chat, ikke fil) |
| DEBUGGER | Fix + test | `src/` + test-filer |
| DOKUMENTERER | Docs | `docs/STATUS.md`, `docs/CHANGELOG.md`, etc. |

---

## 🎓 Avanserte tips (når du er komfortabel)

### Tip 1: Bruk "autonomy levels" for BYGGER

```
Autonomy level: supervised
→ BYGGER ber om godkjenning etter hvert steg (maks kontroll)

Autonomy level: balanced (anbefalt)
→ BYGGER ber om godkjenning for kritiske beslutninger

Autonomy level: autonomous
→ BYGGER jobber helt selvstendig (minst kontroll)
```

**Anbefaling:** Start med "balanced", gå til "autonomous" når du stoler på prosessen.

---

### Tip 2: Kombiner agenter for maksimal effekt

**Scenario: Major feature før release**
```
1. Aktiver ITERASJONS (implementering)
2. Aktiver BRUKERTEST-ekspert (user testing)
3. Aktiver KVALITETSSIKRINGS (full audit)
```

**Resultat:**
- Feature er bygget
- Testet med brukere
- Full compliance-sjekk
- Klar for produksjon

**Tid:** 1 dag (vs 1 uke uten agenter)

---

### Tip 3: Bruk YTELSE-ekspert regelmessig

Performance degraderer over tid. Kjør YTELSE-ekspert hver måned:

```
Aktiver YTELSE-ekspert.
Optimaliser performance for samiske.no.
```

**Mål:**
- Lighthouse score > 90
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

---

## 📋 Sjekkliste: Før deploy til produksjon

Print ut denne sjekklisten og huk av:

**Planning & Development:**
- [ ] PLANLEGGER har laget PRD
- [ ] BYGGER har implementert i alle 5 stages
- [ ] REVIEWER har godkjent (APPROVE status)
- [ ] DOKUMENTERER har oppdatert docs

**Security:**
- [ ] SIKKERHETS har kjørt i BYGGER Stage 4
- [ ] Ingen P1-issues fra SIKKERHETS
- [ ] HEMMELIGHETSSJEKK-ekspert finner ingen secrets
- [ ] RLS policies er verifisert i Supabase

**Quality:**
- [ ] All manuell testing er gjort (du har testet selv)
- [ ] Bugs er fikset (via DEBUGGER)
- [ ] KVALITETSSIKRINGS har kjørt full audit (før store releaser)

**Compliance:**
- [ ] GDPR-ekspert har verifisert compliance
- [ ] TILGJENGELIGHETS-ekspert har sjekket WCAG
- [ ] OWASP-ekspert har godkjent (ingen P1-issues)

**Performance:**
- [ ] YTELSE-ekspert har verifisert (hvis relevant)
- [ ] Lighthouse score > 90

**Ready to deploy!** 🚀

---

## 🆘 Hjelp! Noe gikk galt

### Problem: "BYGGER er stuck"

**Løsning:**
```
1. Skriv "Stopp" i chatten
2. Sjekk om PRD eksisterer (BYGGER trenger planen)
3. Hvis ingen PRD: Aktiver PLANLEGGER først
4. Hvis PRD finnes: Prøv igjen med mer detaljert beskrivelse
```

---

### Problem: "REVIEWER fant mange issues"

**Løsning:**
```
1. Les rapporten nøye
2. Fokuser på P1-issues først (kritiske)
3. Be BYGGER fikse P1-issues
4. P2/P3 kan vente til senere
5. Kjør REVIEWER igjen etter fikser
```

---

### Problem: "SIKKERHETS fant secrets i koden"

**Løsning:**
```
1. STOPP! Ikke deploy!
2. Identifiser hvilke secrets (API-nøkler, passord)
3. Fjern fra koden
4. Flytt til .env-fil (Supabase miljøvariabler)
5. Hvis allerede committed til GitHub:
   → Roter secrets (generer nye nøkler)
   → Fjern fra git history
6. Kjør HEMMELIGHETSSJEKK igjen for å verifisere
```

---

### Problem: "Jeg vet ikke hvilken agent jeg skal bruke"

**Løsning:**
**Bruk denne flyten:**

```
Skal du bygge noe nytt?
  → Liten funksjon (< 2t): PLANLEGGER → BYGGER → REVIEWER
  → Stor funksjon (> 2t): ITERASJONS

Er noe broken?
  → DEBUGGER

Trenger du kvalitetssjekk?
  → Før merge: REVIEWER
  → Før stor release: KVALITETSSIKRINGS

Skal du deploy?
  → Sjekk at SIKKERHETS har godkjent
  → Kjør KVALITETSSIKRINGS hvis stor release

Trenger du oppdatert dokumentasjon?
  → DOKUMENTERER
```

---

## 🎯 Oppsummering: De 3 viktigste tingene å huske

### 1. 🔄 Bruk ITERASJONS for alt som tar mer enn 2 timer
**Hvorfor:** Sparer 60-70% tid med parallell jobbing
**Hvordan:**
```
Aktiver ITERASJONS-agent.
Jeg vil bygge [beskriv feature].
```

### 2. 🛡️ Sikkerhet skal sjekkes i ALLE faser
**Hvorfor:** Forhindrer sikkerhetsbrudd
**Hvordan:**
- BYGGER Stage 4 (automatisk)
- REVIEWER Step 3 (automatisk)
- KVALITETSSIKRINGS (manuelt før store releaser)

### 3. ✅ Kjør KVALITETSSIKRINGS før store releaser
**Hvorfor:** Fanger alle issues før produksjon
**Hvordan:**
```
Aktiver KVALITETSSIKRINGS-agent.
Kjør full pre-release audit.
```

---

## 📚 Hvor lære mer

**Dokumentasjon:**
- `AGENTER-KATALOG.md` - Detaljert info om alle 21 agenter
- `Projektleder.md` - Teknisk dokumentasjon (mer avansert)
- `.claude/agents/` - Agent-implementasjoner (for kodere)

**Hjelp:**
Hvis du står fast, skriv til Claude:
```
Jeg trenger hjelp med [beskriv problem].
Hvilken agent skal jeg bruke?
```

---

**Lykke til med agentene! 🎉**

**Sist oppdatert:** 2026-01-08
**Skrevet for:** Ikke-tekniske brukere
**Feedback:** Si fra hvis noe er uklart - vi forbedrer guiden løpende!
