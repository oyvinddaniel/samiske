# Fase 6: Testing, Sikkerhet & Kvalitetssikring

Før lansering må produktet testes grundig. Denne fasen handler om å finne og fikse problemer før brukerne gjør det.

------

## 🔴 Sikkerhetstest (OWASP Top 10)

**Hva betyr dette?** En systematisk gjennomgang av de ti vanligste og farligste sikkerhetssårbarhetene i webapplikasjoner, definert av OWASP (Open Web Application Security Project).

**OWASP Top 10 (forenklet):**

1. **Broken Access Control** – Brukere kan gjøre ting de ikke skal ha tilgang til
2. **Cryptographic Failures** – Sensitiv data er ikke kryptert ordentlig
3. **Injection** – Ondsinnet input (SQL, scripts) blir kjørt av systemet
4. **Insecure Design** – Grunnleggende designfeil som ikke kan fikses med kode
5. **Security Misconfiguration** – Feil innstillinger (standardpassord, unødvendige tjenester)
6. **Vulnerable Components** – Bruk av biblioteker med kjente sikkerhetshull
7. **Authentication Failures** – Svak innlogging, dårlig passordhåndtering
8. **Data Integrity Failures** – Stole på data uten å verifisere den
9. **Logging Failures** – Manglende eller utilstrekkelig logging
10. **Server-Side Request Forgery** – Serveren kan lures til å gjøre forespørsler den ikke skal

**Hvorfor er dette viktig?** Dette er ikke teoretiske trusler – det er de faktiske måtene hackere bryter seg inn i systemer på. Ved å teste mot denne listen sjekker du mot det som faktisk utnyttes i virkeligheten.

**Hvordan løse det?** Gå gjennom hver kategori og test produktet ditt:

- **Access Control**: Prøv å få tilgang til andres data ved å endre URL-er eller ID-er
- **Injection**: Skriv inn spesialtegn og script-kode i alle input-felt
- **Authentication**: Test svake passord, test "glemt passord"-flyten
- osv.

Be AI-assistenten lage en sjekkliste tilpasset produktet ditt.

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Enkel sjekk  | Viktig       | Kritisk    | Kritisk    |

For kundevendte apper er dette et absolutt minimum før lansering.

**Annen viktig forståelse:** OWASP-listen oppdateres med noen års mellomrom basert på faktiske angrep. Versjon fra 2021 er gjeldende. Du trenger ikke forstå alt teknisk – fokuser på å teste at systemet oppfører seg riktig.

------

## 🔴 Manuell testing av alle brukerflyter

**Hva betyr dette?** Å gå gjennom alle måtene brukere kan bruke produktet på, steg for steg, og verifisere at alt fungerer som forventet.

**Dette inkluderer:**

- Alle happy paths (hovedflytene)
- Alternative flyter (andre veier til samme mål)
- Edge cases (uvanlige situasjoner)
- Feilscenarier (hva skjer når ting går galt)

**Hvorfor er dette viktig?** Automatiske tester fanger mye, men ikke alt. Manuell testing avdekker problemer med brukeropplevelsen, logiske feil, og ting som "teknisk fungerer" men ikke gir mening for brukeren.

**Hvordan løse det?** Bruk brukerflyten fra Fase 2 som utgangspunkt. For hver flyt:

1. Gå gjennom steg for steg
2. Noter alt som ikke fungerer eller er forvirrende
3. Test også hva som skjer hvis du gjør noe uventet

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Moderat      | Viktig       | Kritisk    | Kritisk    |

Det er ingen unnskyldning for å lansere uten å ha testet manuelt.

**Annen viktig forståelse:** Test som om du prøver å ødelegge produktet. Hva skjer hvis du klikker tilbake midt i en prosess? Hva om du åpner to faner? Hva om du sender skjemaet to ganger raskt?

------

## 🔴 Cross-browser/device testing

**Hva betyr dette?** Å verifisere at produktet fungerer riktig i ulike nettlesere (Chrome, Safari, Firefox, Edge) og på ulike enheter (desktop, mobil, tablet).

**Hvorfor er dette viktig?** Nettlesere tolker kode litt forskjellig. Noe som ser perfekt ut i Chrome kan være ødelagt i Safari. Mobil har også andre utfordringer: berøringsskjerm, mindre plass, treg tilkobling.

**Hvordan løse det?**

- Test i de nettleserne målgruppen din bruker mest
- Test på ekte mobil, ikke bare "mobile view" i desktop-nettleser
- Sjekk spesielt: layout, navigasjon, skjemaer, popup-vinduer

Minimum for de fleste: Chrome, Safari, mobil Chrome, mobil Safari.

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Lav          | Moderat      | Kritisk    | Kritisk    |

For interne verktøy kan du kanskje standardisere på én nettleser. For kundevendte må du støtte det brukerne faktisk bruker.

**Annen viktig forståelse:** Safari (spesielt på iOS) er ofte der ting går galt. Test alltid på iPhone/iPad hvis produktet skal fungere på mobil.

------

## 🔴 Bug-fixing (alle kritiske)

**Hva betyr dette?** Systematisk fikse alle feil som er funnet under testing, med prioritet på kritiske og alvorlige bugs før lansering.

**Bug-kategorier:**

- **Kritisk**: Appen krasjer, data går tapt, sikkerhetshull
- **Alvorlig**: Hovedfunksjoner fungerer ikke, veldig forvirrende UX
- **Moderat**: Mindre funksjoner fungerer ikke, irriterende men ikke blokkerende
- **Lav**: Kosmetiske feil, små irritasjonsmomenter

**Hvorfor er dette viktig?** Å lansere med kjente kritiske bugs er uprofesjonelt og potensielt farlig. Brukere mister tillit raskt, og sikkerhetsfeil kan få alvorlige konsekvenser.

**Hvordan løse det?**

1. Samle alle bugs i en liste med prioritet
2. Fiks alle kritiske og alvorlige før lansering
3. Moderate kan vurderes – noen kan aksepteres midlertidig
4. Lave kan fikses etter lansering

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Viktig       | Viktig       | Kritisk    | Kritisk    |

Null kjente kritiske bugs er kravet for lansering.

**Annen viktig forståelse:** En "kjent bug" du aksepterer bør dokumenteres. Skriv ned hva problemet er, hvem det påvirker, og planen for å fikse det.

------

## 🔴 Hemmelighetssjekk

**Hva betyr dette?** En grundig gjennomgang for å sikre at ingen API-nøkler, passord, tokens, eller andre hemmeligheter er lagret i koden eller versjonskontrollhistorikken.

**Vanlige steder hemmeligheter gjemmer seg:**

- Direkte i koden ("hardkodet")
- I konfigurasjonsfiler som er sjekket inn
- I git-historikken (selv om de er fjernet nå)
- I kommentarer eller TODO-er
- I feilmeldinger eller logger

**Hvorfor er dette viktig?** Hemmeligheter i koden er en av de vanligste årsakene til sikkerhetsbrudd. Hackere har automatiske verktøy som søker gjennom GitHub etter API-nøkler og utnytter dem innen minutter.

**Hvordan løse det?**

- Bruk verktøy som `git-secrets`, `trufflehog`, eller GitHubs innebygde "secret scanning"
- Søk manuelt etter vanlige mønstre: "api_key", "secret", "password", "token"
- Sjekk git-historikken, ikke bare nåværende kode
- Hvis du finner noe: bytt ut hemmeligheten umiddelbart (den er kompromittert)

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Viktig       | Kritisk      | Kritisk    | Kritisk    |

Alt som bruker API-nøkler eller hemmeligheter må sjekkes.

**Annen viktig forståelse:** Hvis en hemmelighet noensinne har vært i git-historikken, må den anses som kompromittert – selv om du fjerner den. Generer nye nøkler.

------

## 🟡 Penetrasjonstesting

**Hva betyr dette?** Et simulert angrep på systemet ditt for å finne sikkerhetshull. Enten gjort av deg selv, AI-assistenten, eller profesjonelle sikkerhetskonsulenter.

**Forskjell fra OWASP-sjekk:** OWASP-sjekk er systematisk testing mot kjente kategorier. Penetrasjonstesting er mer kreativ – du tenker som en angriper og prøver å finne unike svakheter i akkurat ditt system.

**Hvorfor er dette viktig?** Angripere er kreative. De kombinerer små svakheter på uventede måter. Penetrasjonstesting etterligner denne tilnærmingen for å finne problemer før ekte angripere gjør det.

**Hvordan løse det?** For de fleste vibekoding-prosjekter:

- Gjør en "tenk som en angriper"-øvelse selv
- Be AI-assistenten foreslå angrepsscenarier spesifikke for produktet ditt
- For sensitive apper (finans, helse): vurder profesjonell penetrasjonstest

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Nei          | Valgfritt    | Anbefalt   | Kritisk    |

Profesjonell penetrasjonstesting koster penger, men er verdt det for sensitive systemer.

**Annen viktig forståelse:** Selv enkel "hva om jeg prøver dette?"-testing finner ofte problemer. Du trenger ikke være ekspert for å tenke kreativt om misbruk.

------

## 🟡 Ytelsestest

**Hva betyr dette?** Måle hvor raskt produktet laster og responderer, og identifisere flaskehalser som gjør det tregt.

**Vanlige målinger:**

- **Lastetid**: Hvor lang tid tar det før siden er brukbar?
- **Time to First Byte**: Hvor raskt svarer serveren?
- **Largest Contentful Paint**: Når er hovedinnholdet synlig?
- **Interaktivitet**: Når kan brukeren faktisk klikke og bruke siden?

**Hvorfor er dette viktig?** Brukere forventer at ting skjer umiddelbart. Studier viser at 53% av mobilbrukere forlater sider som tar mer enn 3 sekunder å laste. Ytelse påvirker også Google-rangering.

**Hvordan løse det?**

- Bruk Lighthouse (innebygd i Chrome DevTools) for å få en score og forslag
- Sjekk spesielt på treg tilkobling (simuler 3G i DevTools)
- Fokuser på de største forbedringene Lighthouse foreslår

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Lav          | Moderat      | Viktig     | Kritisk    |

For kundevendte apper er ytelse direkte knyttet til brukeropplevelse og forretningsresultater.

**Annen viktig forståelse:** En Lighthouse-score over 90 er bra. Over 70 er akseptabelt. Under 50 betyr at du har arbeid å gjøre.

------

## 🟡 Brukertesting (3-5 personer)

**Hva betyr dette?** La ekte mennesker i målgruppen prøve produktet uten instruksjoner eller hjelp, og observer hva som skjer.

**Hvordan det fungerer:**

1. Finn 3-5 personer som ligner målgruppen
2. Gi dem en oppgave: "Opprett en konto og legg til en oppgave"
3. Observer uten å hjelpe (dette er vanskelig!)
4. Noter hvor de blir forvirret eller frustrert
5. Etterpå: spør hva som var vanskelig

**Hvorfor er dette viktig?** Du er for nær produktet til å se det objektivt. Det som er åpenbart for deg, er ikke åpenbart for nye brukere. Brukertesting avslører blindsoner du ikke visste du hadde.

**Hvordan løse det?**

- Rekrutter fra målgruppen (ikke kolleger eller familie med mindre de er i målgruppen)
- Bruk "think aloud"-metoden: be dem si høyt hva de tenker mens de bruker produktet
- Ta opp skjermen (med tillatelse) for å gjennomgå etterpå

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Lav          | Moderat      | Viktig     | Kritisk    |

For kundevendte produkter er dette en av de mest verdifulle testformene.

**Annen viktig forståelse:** 5 brukere finner ca. 85% av brukervennlighetsproblemene. Du trenger ikke mange – du trenger ekte observasjon.

------

## 🟡 Tilgjengelighetstest

**Hva betyr dette?** Verifisere at produktet kan brukes av mennesker med nedsatt funksjonsevne – synshemmede, bevegelseshemmede, hørselshemmede, og andre.

**WCAG (Web Content Accessibility Guidelines) hovedprinsipper:**

- **Perceivable**: Kan innholdet oppfattes? (tekst på bilder, kontrast, skjermleser-støtte)
- **Operable**: Kan det brukes uten mus? (tastaturnavigasjon)
- **Understandable**: Er det forståelig? (klart språk, konsistent layout)
- **Robust**: Fungerer det med hjelpemidler? (skjermlesere, forstørrelsesprogrammer)

**Hvorfor er dette viktig?** Ca. 15-20% av befolkningen har en form for funksjonsnedsettelse. Utilgjengelige produkter ekskluderer disse brukerne. I tillegg er tilgjengelighet lovpålagt i mange sammenhenger.

**Hvordan løse det?**

- Kjør automatisk tilgjengelighetstest (axe DevTools, WAVE)
- Test med tastatur alene (kan du nå alt uten mus?)
- Test med skjermleser (VoiceOver på Mac, NVDA på Windows)
- Sjekk fargekontrast

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Lav          | Moderat      | Viktig     | Kritisk    |

Offentlige nettsteder har lovkrav. Kundevendte produkter bør være tilgjengelige.

**Annen viktig forståelse:** Tilgjengelighet gjør produktet bedre for alle – ikke bare de med funksjonsnedsettelse. Gode kontraster, tastaturnavigasjon, og klart språk hjelper alle.

------

## 🟢 Load testing

**Hva betyr dette?** Teste hvordan systemet oppfører seg under høy belastning – mange samtidige brukere, mange forespørsler.

**Hva du tester:**

- Hvor mange samtidige brukere tåler systemet?
- Hva skjer når grensen nås?
- Hvor tregt blir det under høy last?
- Krasjer det, eller degraderer det elegant?

**Hvorfor er dette viktig?** Hvis produktet blir populært, vil du ha mange brukere samtidig. Et system som fungerer perfekt for én bruker kan bryte sammen for hundre. Du vil vite grensene før brukerne oppdager dem.

**Hvordan løse det?**

- Verktøy som k6, Artillery, eller Apache JMeter kan simulere mange brukere
- Start med å teste normal forventet last
- Øk gradvis til systemet begynner å streve
- Noter hvor grensen går og planlegg tiltak

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Nei          | Lav          | Moderat    | Kritisk    |

For små produkter er dette overdrevet. For noe som kan bli viralt eller har mange brukere, er det essensielt.

**Annen viktig forståelse:** Bedre å vite at systemet tåler 500 samtidige brukere og krasjer ved 600, enn å oppdage det når 600 brukere faktisk prøver.

------

## 🟢 Automatiserte E2E-tester

**Hva betyr dette?** Ende-til-ende-tester som simulerer en ekte bruker og går gjennom hele flyten automatisk – klikker på knapper, fyller ut skjemaer, verifiserer resultater.

**Forskjell fra andre tester:**

- **Unit-tester**: Tester små kodebiter isolert
- **Integrasjonstester**: Tester at deler fungerer sammen
- **E2E-tester**: Tester hele systemet fra brukerens perspektiv

**Hvorfor er dette viktig?** E2E-tester fanger problemer som oppstår når alle delene settes sammen. De fungerer som et sikkerhetsnett – hver gang du gjør endringer, kjører testene og fanger regresjoner.

**Hvordan løse det?**

- Verktøy som Playwright, Cypress, eller Selenium
- Start med de mest kritiske brukerflytene (innlogging, hovedfunksjon)
- Kjør testene automatisk i CI/CD-pipelinen

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Nei          | Valgfritt    | Anbefalt   | Kritisk    |

Krever investering å sette opp og vedlikeholde, men betaler seg for større prosjekter.

**Annen viktig forståelse:** E2E-tester er tregere og mer skjøre enn unit-tester. Ikke test alt med E2E – fokuser på de kritiske flytene.

------

## 📄 Leveranse: Testrapport + Sikkerhetsrapport + Bug-fri applikasjon

Når Fase 6 er fullført, skal du ha:

**Testrapport:**

- Oversikt over all testing som er utført
- Resultater fra manuell testing
- Cross-browser/device testresultater
- Ytelsesmålinger (Lighthouse-score)
- Tilgjengelighetsrapport
- Liste over funn og hva som ble fikset

**Sikkerhetsrapport:**

- OWASP Top 10 gjennomgang med status for hver kategori
- Hemmelighetssjekk-resultat
- SAST-verktøy-resultater
- Eventuelle funn fra penetrasjonstesting
- Kjente gjenværende risikoer (hvis noen)

**Bug-fri applikasjon:**

- Alle kritiske og alvorlige bugs fikset
- Moderate bugs vurdert og enten fikset eller dokumentert
- Ingen kjente sikkerhetshull
- Klar for lansering

------

Klar for Fase 7: Publisering, Overvåking & Vedlikehold?
