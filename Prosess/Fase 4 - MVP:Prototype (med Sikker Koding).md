# Fase 4: MVP/Prototype (med Sikker Koding)

Nå begynner byggingen. Denne fasen handler om å få en fungerende versjon ut så raskt som mulig – men med sikkerhet bakt inn fra starten.

------

## 🔴 Prosjekt-setup med sikkerhet

**Hva betyr dette?** Å sette opp utviklingsmiljøet riktig fra dag én, med verktøy og innstillinger som hjelper deg unngå vanlige feil og sikkerhetsproblemer.

**Dette inkluderer:**

- **Linting**: Verktøy som automatisk finner feil og dårlig praksis i koden
- **Sikre defaults**: Standardinnstillinger som er trygge (f.eks. at cookies er sikre som standard)
- **.env-håndtering**: Hemmeligheter (API-nøkler, databasepassord) lagres i egne filer som aldri lastes opp til kodelageret

**Hvorfor er dette viktig?** Det er mye lettere å starte riktig enn å fikse senere. Linting fanger feil før de blir problemer. .env-filer forhindrer at hemmeligheter ved et uhell deles med verden.

**Hvordan løse det?** Be AI-assistenten sette opp prosjektet med:

- ESLint eller lignende for kodekvalitet
- En `.env`-fil for hemmeligheter
- En `.gitignore`-fil som sørger for at .env aldri lastes opp
- Sikre standardinnstillinger for valgt rammeverk

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Moderat      | Viktig       | Kritisk    | Kritisk    |

Selv for små prosjekter er .env-håndtering viktig hvis du bruker noen form for API-nøkler.

**Annen viktig forståelse:** En vanlig nybegynnerfeil er å legge API-nøkler direkte i koden og laste opp til GitHub. Dette skjer oftere enn du tror, og hackere har roboter som søker etter akkurat dette.

------

## 🔴 CI/CD-oppsett

**Hva betyr dette?** Sette opp automatisert bygg og publisering fra dag 1, slik at hver gang du gjør endringer, testes og publiseres de automatisk.

**Hvorfor er dette viktig?** I den forbedrede malen er CI/CD flyttet til MVP-fasen (fra Fase 7). Grunnen er at:

- Du får rask feedback på om koden fungerer
- Publisering blir trygg og repeterbar fra start
- Du slipper "det funket på min maskin"-problemer
- Feil fanges opp tidlig

**Hvordan løse det?** For de fleste moderne prosjekter:

1. Bruk GitHub (eller GitLab/Bitbucket) for kode
2. Koble til Vercel, Netlify, eller lignende
3. Konfigurer at hovedgrenen automatisk publiseres

AI-assistenten kan hjelpe deg sette dette opp steg for steg.

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Valgfritt    | Anbefalt     | Viktig     | Kritisk    |

For vibekoding er dette spesielt nyttig – du kan iterere raskt og se endringer live.

**Annen viktig forståelse:** Selv et enkelt oppsett der koden automatisk publiseres når du pusher til GitHub er mye bedre enn manuell publisering. Start enkelt.

------

## 🔴 Kjernefunksjonalitet med input-validering

**Hva betyr dette?** Bygge de mest essensielle funksjonene – det som må til for at brukeren kan gjøre hovedoppgaven – med sikker håndtering av all input fra brukeren.

**Input-validering betyr:**

- Sjekke at data er av riktig type (tall er faktisk tall)
- Sjekke at data er innenfor akseptable grenser (alder mellom 0 og 150)
- Rense data for skadelig innhold (fjerne eller escape spesialtegn som kan brukes til angrep)

**Hvorfor er dette viktig?** Kjernefunksjonaliteten er det brukeren faktisk kommer for. Input-validering beskytter mot de vanligste angrepene – SQL-injection og XSS-angrep starter begge med manipulert brukerinput.

**Hvordan løse det?** Når du ber AI-assistenten bygge en funksjon, spesifiser alltid:

- Hvilke felt som er påkrevd
- Hvilke grenser som gjelder (min/maks lengde, tillatte verdier)
- At input skal valideres både i frontend (for god brukeropplevelse) og backend (for sikkerhet)

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Viktig       | Kritisk      | Kritisk    | Kritisk    |

Input-validering er viktig for ALT som tar imot data fra brukere.

**Annen viktig forståelse:** Frontend-validering er for brukeropplevelse (rask feedback). Backend-validering er for sikkerhet (kan ikke omgås). Du trenger begge.

------

## 🔴 Autentisering implementert

**Hva betyr dette?** Innloggingssystemet er på plass og fungerer – brukere kan registrere seg, logge inn, og logge ut på en sikker måte.

**Hvorfor er dette viktig?** Autentisering er grunnmuren for all sikkerhet. Hvis den er svak, spiller det ingen rolle hvor sikker resten av systemet er. Ved å implementere dette tidlig, bygger du alt annet oppå et sikkert fundament.

**Hvordan løse det?** **Ikke bygg eget autentiseringssystem.** Bruk etablerte løsninger:

- **Supabase Auth**: Gratis, enkelt å sette opp
- **Auth0**: Robust, mange funksjoner
- **Firebase Auth**: Googles løsning
- **Clerk**: Moderne alternativ
- **NextAuth.js**: For Next.js-prosjekter

Be AI-assistenten integrere en av disse i stedet for å kode innlogging fra scratch.

**Viktighet per prosjektkategori:**

| Lite internt    | Internt m/DB | Kundevendt | Stor skala |
| --------------- | ------------ | ---------- | ---------- |
| Enkel/valgfritt | Standard     | Robust     | Enterprise |

Hvis systemet ikke trenger brukerkontoer, er dette ikke relevant. Alt annet trenger det.

**Annen viktig forståelse:** Etablerte autentiseringsløsninger håndterer komplekse ting du ikke vil tenke på: sikker passordlagring, beskyttelse mot brute-force, token-håndtering, "glemt passord"-flyt, osv.

------

## 🔴 Happy path fungerer og er sikret

**Hva betyr dette?** "Happy path" er hovedscenariet der alt går bra – brukeren gjør det du forventer, og systemet responderer korrekt. Dette skal fungere fra ende til ende, med grunnleggende sikkerhet på plass.

**Eksempel for en oppgaveliste-app:**

1. Bruker logger inn ✓
2. Bruker ser sine oppgaver ✓
3. Bruker legger til ny oppgave ✓
4. Oppgaven vises i listen ✓
5. Bruker markerer oppgave som fullført ✓

**Hvorfor er dette viktig?** Happy path er det minimum som må fungere for at produktet har verdi. Alt annet (feilhåndtering, edge cases) bygger på dette. Sikring av happy path betyr at en bruker ikke kan se andres data, manipulere systemet, osv.

**Hvordan løse det?** Bruk brukerflyten fra Fase 2 og implementer hvert steg. Test at det fungerer. Sjekk at sikkerheten er på plass (kan bruker A se bruker Bs data?).

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Viktig       | Viktig       | Kritisk    | Kritisk    |

Dette er kjernen i MVP – det absolutte minimum.

**Annen viktig forståelse:** "Fungerer" er ikke nok – det må også fungere sikkert. Test alltid: "Hva om jeg prøver å få tilgang til noe jeg ikke skal?"

------

## 🔴 Grunnleggende tester

**Hva betyr dette?** Automatiske tester som verifiserer at kritisk funksjonalitet fungerer som forventet. Ikke full testdekning, men tester for det viktigste.

**Typer tester:**

- **Unit-tester**: Tester små deler av koden isolert
- **Integrasjonstester**: Tester at deler fungerer sammen
- **Ende-til-ende-tester**: Tester hele flyten som en bruker ville opplevd det

**Hvorfor er dette viktig?** Tester fanger feil før brukerne gjør det. Enda viktigere: de lar deg gjøre endringer uten frykt for å ødelegge noe. Uten tester blir hver endring et sjansespill.

**Hvordan løse det?** Start med tester for:

- Autentisering (innlogging fungerer, feil passord avvises)
- Kjernefunksjonalitet (hovedoppgaven kan fullføres)
- Tilgangskontroll (brukere kan ikke se andres data)

Be AI-assistenten skrive tester når den implementerer funksjoner.

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Valgfritt    | Anbefalt     | Viktig     | Kritisk    |

For kundevendte apper er tester essensielt. For små interne verktøy kan manuell testing være nok.

**Annen viktig forståelse:** Tester er oppgradert til "må ha" i den forbedrede malen for alle prosjekter med database. Grunnen er at feil i datahåndtering kan være katastrofale.

------

## 🟡 Feilhåndtering (sikker)

**Hva betyr dette?** Hva systemet gjør når noe går galt – på en måte som er nyttig for brukeren uten å avsløre sensitiv informasjon til potensielle angripere.

**Dårlig feilmelding:**

```
Error: Database connection failed at row 47 in file /app/src/db.js
Connection string: postgres://admin:secretpassword@db.example.com:5432/myapp
```

**God feilmelding:**

```
Beklager, noe gikk galt. Prøv igjen om litt. Hvis problemet vedvarer, kontakt support.
```

**Hvorfor er dette viktig?** Detaljerte feilmeldinger er gull for hackere – de avslører teknologi, filstier, og noen ganger sensitive data. Men for utviklere trengs detaljene for å fikse problemet.

**Hvordan løse det?**

- Vis generiske, brukervennlige feilmeldinger til brukeren
- Logg detaljerte feil til et sted bare utviklere har tilgang (server-logger)
- Aldri vis stacktraces, filstier, eller databasedetaljer til brukeren

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Moderat      | Viktig       | Kritisk    | Kritisk    |

For kundevendte apper er dette både sikkerhet og profesjonalitet.

**Annen viktig forståelse:** Feilhåndtering handler også om å forhindre at systemet krasjer helt. En god app degraderer elegant – viser feilmelding i stedet for blank skjerm.

------

## 🟡 Logging (uten sensitiv data)

**Hva betyr dette?** Å registrere hva som skjer i systemet – hvem gjorde hva, når, og hva var resultatet. Men uten å logge sensitiv informasjon som passord, personnummer, eller betalingsdetaljer.

**Eksempel på god logging:**

```
2024-01-15 10:30:45 - Bruker 123 logget inn
2024-01-15 10:31:02 - Bruker 123 opprettet oppgave 456
2024-01-15 10:35:17 - Bruker 123 forsøkte å slette oppgave 789 (ikke tillatt)
```

**Eksempel på dårlig logging:**

```
2024-01-15 10:30:45 - Bruker ole@example.com logget inn med passord "hemmelig123"
```

**Hvorfor er dette viktig?** Logger er uvurderlige for feilsøking og sikkerhetsetterforskning. Hvis noe går galt, viser loggene hva som skjedde. Men logger som inneholder sensitiv data er en sikkerhetsrisiko i seg selv.

**Hvordan løse det?**

- Logg hendelser (hva skjedde), ikke innhold (hva var dataen)
- Bruk ID-er i stedet for personlig informasjon der mulig
- Aldri logg passord, tokens, eller betalingsinformasjon
- Sett opp sentralisert logging (f.eks. gjennom hosting-plattformen)

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Lav          | Moderat      | Viktig     | Kritisk    |

Jo viktigere systemet er, jo viktigere er god logging.

**Annen viktig forståelse:** Logger må også beskyttes. Tilgang til logger bør være begrenset, og logger med personopplysninger faller under GDPR.

------

## 🟡 README med sikkerhetsinstruksjoner

**Hva betyr dette?** En dokumentasjonsfil som forklarer hvordan prosjektet settes opp og kjøres lokalt – inkludert hvordan man håndterer hemmeligheter og sikkerhet.

**En god README inneholder:**

- Hva prosjektet er
- Hvordan installere avhengigheter
- Hvordan sette opp miljøvariabler (uten å avsløre faktiske verdier)
- Hvordan kjøre prosjektet lokalt
- Hvordan kjøre tester
- Sikkerhetsnotater (f.eks. "Aldri commit .env-filen")

**Hvorfor er dette viktig?** Dokumentasjon sikrer at du (eller noen andre) kan komme tilbake til prosjektet senere og forstå det. Sikkerhetsinstruksjoner forhindrer at noen ved et uhell gjør farlige ting.

**Hvordan løse det?** Be AI-assistenten lage en README når prosjektet settes opp. Oppdater den når nye ting legges til. Inkluder alltid en seksjon om hvordan hemmeligheter håndteres.

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Lav          | Moderat      | Viktig     | Kritisk    |

Selv for små prosjekter er en minimal README nyttig for fremtidig-deg.

**Annen viktig forståelse:** En vanlig feil er å inkludere et `.env.example`-fil med faktiske verdier. Eksempelfilen skal ha plassholdere: `DATABASE_URL=your_database_url_here`

------

## 🟢 Dummy-data (realistisk, ikke ekte)

**Hva betyr dette?** Testdata som ser realistisk ut, men som ikke inneholder faktisk personinformasjon. Brukes for testing og demonstrasjon.

**Eksempel på god dummy-data:**

- Navn: "Kari Nordmann" (ikke en ekte person)
- E-post: "test.bruker@example.com"
- Adresse: "Eksempelveien 123, 0000 Testby"

**Eksempel på dårlig dummy-data:**

- Kopiert fra ekte kundedatabase
- Inneholder faktiske personnummer
- Bruker ekte e-postadresser

**Hvorfor er dette viktig?** Ekte persondata i testmiljøer er et personvernbrudd og en sikkerhetsrisiko. Dummy-data lar deg teste realistisk uten risiko.

**Hvordan løse det?**

- Bruk faker-biblioteker som genererer realistiske men falske data
- Eller lag testdata manuelt med åpenbart fiktive verdier
- Aldri kopier fra produksjonsdata

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Lav          | Moderat      | Viktig     | Viktig     |

Alt som skal demonstreres eller testes med "brukere" trenger dummy-data.

**Annen viktig forståelse:** "example.com" og "example.org" er offisielt reservert for eksempler og vil aldri være ekte domener. Bruk disse for test-e-poster.

------

## 📄 Leveranse: Fungerende, sikker prototype + Automatisert build pipeline

Når Fase 4 er fullført, skal du ha:

**Fungerende prototype:**

- Prosjekt satt opp med sikre standardinnstillinger
- .env-håndtering på plass
- Autentisering fungerer
- Happy path er implementert og testet
- Input-validering på all brukerinput
- Grunnleggende feilhåndtering
- Logger på plass (uten sensitiv data)
- Grunnleggende tester for kritisk funksjonalitet
- README med oppsettsinstruksjoner

**Automatisert build pipeline:**

- Kode i versjonskontroll (GitHub e.l.)
- Automatisk publisering ved endringer
- Tester kjører automatisk

**Hva du kan gjøre nå:**

- Vise prototypen til noen og få feedback
- Teste hovedflyten selv
- Begynne å iterere basert på det du lærer

------

Klar for Fase 5: Utvikling, Iterasjon & Kontinuerlig Validering?
