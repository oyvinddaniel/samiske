# Fase 3: Teknisk Design & Trusselmodellering

Denne fasen handler om å bestemme *hvordan* produktet skal bygges teknisk. Her tar du de konkrete valgene som setter rammene for utviklingen.

------

## 🔴 Tech stack-valg

**Hva betyr dette?** "Tech stack" er samlingen av teknologier som brukes for å bygge produktet. Dette inkluderer:

- **Frontend**: Det brukeren ser og interagerer med (f.eks. React, Vue, vanlig HTML/CSS)
- **Backend**: Serveren som håndterer logikk og data (f.eks. Node.js, Python, eller serverløse funksjoner)
- **Database**: Hvor data lagres (f.eks. PostgreSQL, MongoDB, Supabase)
- **Hosting**: Hvor produktet kjører (f.eks. Vercel, Netlify, AWS)

**Hvorfor er dette viktig?** Teknologivalgene påvirker alt som kommer etterpå: hastighet på utvikling, kostnader, ytelse, sikkerhet, og hvor lett det er å finne hjelp når noe går galt. Feil valg kan bety at du må bygge om fra scratch senere.

**Hvordan løse det?** For vibekoding med AI-assistent bør du velge teknologier som:

- Er godt dokumentert og utbredt (AI-en kjenner dem godt)
- Har innebygd sikkerhet der mulig
- Passer prosjektets størrelse (ikke overingeniør)

Diskuter alternativene med AI-assistenten og la den forklare fordeler og ulemper.

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Lav          | Viktig       | Kritisk    | Kritisk    |

For et lite script spiller det mindre rolle. For større prosjekter setter dette rammene for alt.

**Annen viktig forståelse:** Det finnes sjelden ett "riktig" svar. Velg noe som fungerer, er sikkert, og som AI-assistenten kan hjelpe deg med effektivt. Unngå å velge det nyeste og kuleste – velg det solide og velprøvde.

------

## 🔴 Arkitektur/Prosjektstruktur

**Hva betyr dette?** Hvordan koden organiseres i mapper og filer, og hvordan ulike deler av systemet kommuniserer med hverandre. Tenk på det som plantegningen for et hus – hvor er kjøkkenet, hvor er soverommene, og hvordan henger de sammen?

**Eksempel på enkel struktur:**

```
/src
  /components    (gjenbrukbare UI-elementer)
  /pages         (ulike skjermbilder)
  /api           (kommunikasjon med server)
  /utils         (hjelpefunksjoner)
  /styles        (utseende)
```

**Hvorfor er dette viktig?** God struktur gjør koden lettere å forstå, vedlikeholde, og utvide. Dårlig struktur fører til at ingen finner noe, endringer ett sted ødelegger ting et annet sted, og prosjektet blir stadig vanskeligere å jobbe med.

**Hvordan løse det?** Be AI-assistenten foreslå en mappestruktur basert på teknologivalgene og prosjektets størrelse. Hold det enkelt – kompleksitet kan legges til senere hvis nødvendig.

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Lav          | Moderat      | Viktig     | Kritisk    |

Små prosjekter kan ha alt i få filer. Større prosjekter trenger tydelig organisering fra start.

**Annen viktig forståelse:** "Separering av ansvar" betyr at hver del av koden har én jobb. Kode som viser ting på skjermen skal ikke også håndtere databasekall. Dette gjør feil lettere å finne og fikse.

------

## 🔴 Trusselmodellering (Threat Modeling)

**Hva betyr dette?** En systematisk gjennomgang av hvordan systemet kan angripes eller misbrukes. Du identifiserer "angrepsvektorer" – veier en angriper kan bruke for å gjøre skade.

**STRIDE er en vanlig metode:**

- **S**poofing: Kan noen late som de er en annen bruker?
- **T**ampering: Kan noen endre data de ikke burde kunne endre?
- **R**epudiation: Kan noen nekte for handlinger de har gjort?
- **I**nformation disclosure: Kan sensitiv data lekke?
- **D**enial of service: Kan noen gjøre systemet utilgjengelig?
- **E**levation of privilege: Kan noen få tilgang de ikke skal ha?

**Hvorfor er dette viktig?** Det er mye billigere å tenke gjennom sikkerhet nå enn å fikse det etter et angrep. Trusselmodellering hjelper deg identifisere de største risikoene slik at du kan prioritere beskyttelse der det trengs mest.

**Hvordan løse det?** Gå gjennom systemet med AI-assistenten og still spørsmål som:

- Hva skjer hvis noen prøver å logge inn som en annen?
- Hva skjer hvis noen manipulerer dataene som sendes til serveren?
- Hvilken skade kan en ondsinnet bruker gjøre?

Dokumenter truslene og hvordan dere planlegger å beskytte mot dem.

**Viktighet per prosjektkategori:**

| Lite internt     | Internt m/DB | Kundevendt | Stor skala |
| ---------------- | ------------ | ---------- | ---------- |
| Enkel sjekkliste | Ja           | Ja         | Grundig    |

For små interne verktøy holder en enkel gjennomgang. For kundevendte systemer med sensitive data trengs grundig analyse.

**Annen viktig forståelse:** Du trenger ikke være sikkerhetsekspert. Bare det å stille spørsmålene systematisk avdekker problemer. AI-assistenten kan hjelpe med å identifisere vanlige sårbarheter.

------

## 🔴 Autentisering/Autorisering-design

**Hva betyr dette?** To relaterte, men forskjellige konsepter:

- **Autentisering**: Bekrefter *hvem* brukeren er (innlogging)
- **Autorisering**: Bestemmer *hva* brukeren har lov til å gjøre

**Eksempel:**

- Autentisering: "Ja, dette er faktisk Kari fordi hun skrev riktig passord"
- Autorisering: "Kari er vanlig bruker, så hun kan se egne data, men ikke slette andre brukeres kontoer"

**Hvorfor er dette viktig?** Feil her er blant de vanligste sikkerhetsproblemene. Hvis autentiseringen er svak, kan uvedkommende late som de er legitime brukere. Hvis autoriseringen er feil, kan brukere gjøre ting de ikke skal ha tilgang til.

**Hvordan løse det?** Bestem:

- Hvordan logger brukere inn? (e-post/passord, Google-innlogging, etc.)
- Hvilke brukerroller finnes? (admin, vanlig bruker, etc.)
- Hva kan hver rolle gjøre?
- Hvordan håndteres "glemt passord"?

Bruk etablerte løsninger – ikke finn opp egen autentisering. Tjenester som Auth0, Supabase Auth, eller Firebase Auth er testet og sikret av eksperter.

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Enkel        | Standard     | Robust     | Enterprise |

Alt med brukerkontoer trenger dette. Kompleksiteten øker med sensitiviteten til dataene.

**Annen viktig forståelse:** "Least privilege"-prinsippet: Gi brukere bare tilgang til det de faktisk trenger. Det er lettere å gi mer tilgang senere enn å ta den tilbake.

------

## 🔴 Datahåndtering

**Hva betyr dette?** Hvordan data beskyttes gjennom hele livssyklusen – når den sendes over nettet, når den lagres, og når den brukes.

**Hovedkonsepter:**

- **Kryptering i transit**: Data beskyttes mens den sendes (HTTPS)
- **Kryptering i hvile**: Data beskyttes der den lagres (kryptert database)
- **Input-validering**: Sjekke at data fra brukere er gyldig og trygg før den brukes

**Hvorfor er dette viktig?** Ukryptert data kan avlyttes. Uvalidert input er hovedårsaken til sikkerhetshull som SQL-injection og XSS (der angripere kan kjøre skadelig kode).

**Hvordan løse det?**

- Bruk alltid HTTPS (de fleste moderne hostingløsninger gjør dette automatisk)
- Velg database som støtter kryptering
- Be AI-assistenten implementere input-validering fra start – sjekk at data er riktig type, lengde, og format før den brukes

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Moderat      | Viktig       | Kritisk    | Kritisk    |

Input-validering er viktig for alt. Kryptering blir viktigere jo mer sensitiv dataen er.

**Annen viktig forståelse:** "Aldri stol på input fra brukeren" er et grunnleggende sikkerhetsprinsipp. Alt som kommer fra brukeren – skjemaer, URL-parametere, cookies – må valideres og renses.

------

## 🟡 API-design

**Hva betyr dette?** API (Application Programming Interface) er måten frontend-en (det brukeren ser) kommuniserer med backend-en (serveren). API-design handler om hvilke "endepunkter" som finnes og hvordan de fungerer.

**Eksempel:**

- `GET /api/users/123` – Hent informasjon om bruker 123
- `POST /api/posts` – Opprett et nytt innlegg
- `DELETE /api/posts/456` – Slett innlegg 456

**Hvorfor er dette viktig?** Et godt designet API er:

- Konsistent (like ting fungerer likt)
- Sikkert (sjekker tilgang, begrenser antall kall)
- Enkelt å forstå og bruke

Et dårlig API fører til forvirring, sikkerhetshull, og vanskelig vedlikehold.

**Hvordan løse det?**

- Definer hvilke operasjoner som trengs basert på brukerhistoriene
- Inkluder rate limiting (begrense antall kall per tidsenhet) for å forhindre misbruk
- Sørg for at hvert endepunkt sjekker at brukeren har tilgang

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Lav          | Moderat      | Viktig     | Kritisk    |

Enklere apper kan ha få endepunkter. Større systemer trenger gjennomtenkt API-design.

**Annen viktig forståelse:** Rate limiting beskytter mot både ondsinnede angrep og utilsiktede feil (som en bug som sender tusenvis av forespørsler).

------

## 🟡 Database-skjema

**Hva betyr dette?** Den tekniske strukturen for hvordan data lagres i databasen. Dette bygger på datamodellen fra Fase 2, men går i mer detalj: eksakte feltnavn, datatyper, og regler.

**Eksempel:**

```
Tabell: brukere
- id (unikt nummer, genereres automatisk)
- e-post (tekst, må være unik, påkrevd)
- passord_hash (tekst, påkrevd) – aldri lagre passord i klartekst!
- opprettet (dato/tid, settes automatisk)
```

**Hvorfor er dette viktig?** Databaseskjemaet er fundamentet. Feil her – manglende regler, feil datatyper, dårlige relasjoner – skaper problemer som er vanskelige å fikse etter at systemet har data.

**Hvordan løse det?**

- Start med datamodellen fra Fase 2
- Definer hvilke felt som er påkrevd
- Legg til regler (constraints) som forhindrer ugyldig data
- Tenk gjennom indekser for data du ofte søker i

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Lav          | Viktig       | Viktig     | Kritisk    |

Alt med database trenger et gjennomtenkt skjema.

**Annen viktig forståelse:** Passord skal ALDRI lagres i klartekst – alltid som "hash" (en enveis-kryptert versjon). AI-assistenten vet dette, men det er verdt å dobbeltsjekke.

------

## 🟡 Tredjepartstjenester

**Hva betyr dette?** Eksterne tjenester du bruker i produktet ditt: betalingsleverandør (Stripe), e-posttjeneste (SendGrid), autentisering (Auth0), hosting (Vercel), og lignende.

**Hvorfor er dette viktig?** Hver tredjepartstjeneste du bruker blir en del av sikkerheten din. Hvis de har problemer, har du problemer. Du må også vurdere personvern – deler du brukerdata med dem?

**Hvordan løse det?** For hver tjeneste, vurder:

- Er de pålitelige og etablerte?
- Hvordan håndterer de sikkerhet?
- Hvilke data deler du med dem?
- Hva skjer hvis de går ned eller forsvinner?
- Overholder de GDPR (hvis relevant)?

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Lav          | Moderat      | Viktig     | Kritisk    |

Jo mer du stoler på eksterne tjenester, jo viktigere er det å velge gode partnere.

**Annen viktig forståelse:** Etablerte tjenester som Stripe og Auth0 er ofte sikrere enn å bygge selv. De har team som jobber kun med sikkerhet.

------

## 🟡 CI/CD-plan

**Hva betyr dette?** CI/CD står for Continuous Integration / Continuous Deployment. Det betyr at kode automatisk testes og publiseres når du gjør endringer, i stedet for manuelle prosesser.

**Tenk på det som:**

- Du lagrer koden → Automatiske tester kjører → Hvis alt er grønt, publiseres endringen automatisk

**Hvorfor er dette viktig?** Manuell publisering er feilutsatt og tidkrevende. Med CI/CD:

- Feil fanges opp automatisk før de når brukere
- Endringer kommer raskere ut
- Du kan rulle tilbake enkelt hvis noe går galt

**Hvordan løse det?** Moderne plattformer som Vercel og Netlify har CI/CD innebygd – du kobler til koden din, og publisering skjer automatisk. For mer kontroll kan du sette opp GitHub Actions eller lignende.

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Valgfritt    | Anbefalt     | Viktig     | Kritisk    |

For vibekoding er CI/CD en stor fordel – det lar deg iterere raskt med sikkerhet.

**Annen viktig forståelse:** CI/CD er oppgradert fra "kan ha" til "bør ha" i den forbedrede malen. Det er en av de viktigste endringene for moderne utvikling.

------

## 🟢 Skalerbarhetsstrategi

**Hva betyr dette?** En plan for hvordan systemet vil håndtere vekst. Hva skjer når du går fra 100 til 10 000 brukere? Eller fra 10 000 til 1 million?

**Hvorfor er dette viktig?** Systemer som ikke er designet for skalering kan bryte sammen under last. Men for tidlig optimalisering for skalering er bortkastet tid hvis du aldri får mange brukere.

**Hvordan løse det?** For de fleste vibekoding-prosjekter: Ikke tenk for mye på dette i starten. Velg teknologi som *kan* skalere (de fleste moderne løsninger gjør det), men bygg for dagens behov. Optimaliser når du faktisk trenger det.

**Viktighet per prosjektkategori:**

| Lite internt  | Internt m/DB | Kundevendt | Stor skala |
| ------------- | ------------ | ---------- | ---------- |
| Ikke relevant | Lav          | Moderat    | Kritisk    |

For de fleste prosjekter er dette en "senere"-oppgave. Bare stor skala trenger dette fra start.

**Annen viktig forståelse:** "Premature optimization is the root of all evil" – ikke løs problemer du ikke har ennå. Men vær bevisst på valg som gjør fremtidig skalering unødvendig vanskelig.

------

## 📄 Leveranse: Teknisk spesifikasjon + Trusselmodell + Arkitekturdiagram

Når Fase 3 er fullført, skal du ha:

**Teknisk spesifikasjon:**

- Valgt tech stack med begrunnelse
- Prosjektstruktur/mappeorganisering
- Database-skjema
- API-design (endepunkter)
- Autentisering/autorisering-løsning
- Tredjepartstjenester som brukes
- CI/CD-oppsett

**Trusselmodell:**

- Identifiserte trusler (bruk gjerne STRIDE)
- Tiltak for hver trussel
- Prioritering basert på risiko

**Arkitekturdiagram:**

- Visuell oversikt over hvordan delene henger sammen
- Kan være enkelt – bokser og piler som viser frontend, backend, database, eksterne tjenester

------

Klar for Fase 4: MVP/Prototype (med Sikker Koding)?
