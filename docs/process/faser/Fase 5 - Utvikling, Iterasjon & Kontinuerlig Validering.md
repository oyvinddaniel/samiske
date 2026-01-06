# Fase 5: Utvikling, Iterasjon & Kontinuerlig Validering

Nå har du en fungerende prototype. Denne fasen handler om å bygge ut resten, polere produktet, og hele tiden sjekke at du bygger riktig ting.

------

## 🔴 Fullføre MVP-funksjoner med sikkerhet

**Hva betyr dette?** Implementere alle funksjonene som ble definert som "må ha" i kravspesifikasjonen – ikke bare happy path, men full funksjonalitet med sikkerhet innebygd.

**Dette inkluderer:**

- Alle brukerhistoriene markert som "må ha"
- Edge cases for hver funksjon
- Tilgangskontroll (hvem kan gjøre hva)
- Input-validering på alle nye funksjoner

**Hvorfor er dette viktig?** MVP-en fra Fase 4 var beviset på at konseptet fungerer. Nå bygger du noe som faktisk kan brukes. Sikkerhet må følge med – hver ny funksjon er en potensiell ny sårbarhet.

**Hvordan løse det?** Jobb systematisk gjennom funksjonslisten fra Fase 2. For hver funksjon:

1. Implementer kjernelogikken
2. Legg til input-validering
3. Sjekk tilgangskontroll
4. Håndter feil og edge cases
5. Skriv tester

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Viktig       | Viktig       | Kritisk    | Kritisk    |

Dette er hovedarbeidet – å bygge det produktet du planla.

**Annen viktig forståelse:** Hold deg til MVP-listen. Det er fristende å legge til "bare én ting til", men det er scope creep. Fullført MVP først, utvidelser etterpå.

------

## 🔴 Kodegjennomgang (Code Review)

**Hva betyr dette?** At noen andre enn den som skrev koden ser over den før den blir en del av produktet. I vibekoding-kontekst betyr dette ofte at du selv gjennomgår det AI-assistenten har laget, eller at AI-en gjennomgår tidligere kode.

**Hva man ser etter:**

- Fungerer koden som tiltenkt?
- Er det sikkerhetsproblemer?
- Er koden forståelig?
- Følger den etablerte mønstre i prosjektet?
- Er det åpenbare feil eller mangler?

**Hvorfor er dette viktig?** Fire øyne ser mer enn to. Code review fanger feil, sikkerhetshull, og dårlige løsninger før de blir problemer i produksjon. Det er en av de mest effektive kvalitetssikringsmetodene.

**Hvordan løse det?** For vibekoding:

- Be AI-assistenten gjennomgå kode den har skrevet tidligere med friske øyne
- Les gjennom koden selv og still spørsmål om ting du ikke forstår
- Spør spesifikt: "Er det noen sikkerhetsproblemer i denne koden?"
- Bruk automatiske verktøy som finner vanlige problemer

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Lav          | Moderat      | Viktig     | Kritisk    |

For kundevendte apper er dette et minimum av kvalitetssikring.

**Annen viktig forståelse:** Ikke vær redd for å spørre "dumme" spørsmål om koden. Hvis du ikke forstår hva den gjør, er det enten for komplisert eller dårlig forklart – begge deler bør fikses.

------

## 🔴 Løpende brukervalidering

**Hva betyr dette?** Å teste produktet med ekte brukere *underveis* i utviklingen, ikke bare på slutten. Få feedback tidlig og ofte.

**Måter å gjøre det på:**

- Vis prototypen til noen i målgruppen og observer
- Spør om første inntrykk og hva som er forvirrende
- La noen prøve å fullføre hovedoppgaven uten hjelp
- Samle feedback og juster basert på den

**Hvorfor er dette viktig?** Du bygger produktet for brukerne, ikke for deg selv. Det du tror er intuitivt, kan være forvirrende for andre. Jo tidligere du oppdager misforståelser, jo billigere er de å fikse.

**Hvordan løse det?** Sett av tid regelmessig (f.eks. hver uke eller etter hver større funksjon) til å vise produktet til noen. Det trenger ikke være formelt – en 15-minutters demo og samtale gir mye innsikt.

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Moderat      | Viktig       | Kritisk    | Kritisk    |

For kundevendte produkter er dette essensielt for å bygge noe folk faktisk vil bruke.

**Annen viktig forståelse:** Observer hva folk *gjør*, ikke bare hva de *sier*. Folk sier ofte at noe er greit, men handlingene deres avslører forvirring eller frustrasjon.

------

## 🔴 SAST (Static Analysis)

**Hva betyr dette?** SAST står for "Static Application Security Testing". Det er automatiske verktøy som skanner koden din og finner potensielle sikkerhetsproblemer uten å kjøre koden.

**Hva SAST-verktøy finner:**

- Hardkodede hemmeligheter (API-nøkler i koden)
- Vanlige sikkerhetsfeil (SQL-injection, XSS)
- Usikre avhengigheter (biblioteker med kjente sårbarheter)
- Dårlige sikkerhetspraksiser

**Hvorfor er dette viktig?** Mennesker overser ting – spesielt i kode de selv har skrevet. Automatiske verktøy er tirreløse og sjekker systematisk. De fanger problemer som erfarne utviklere også ville oversett.

**Hvordan løse det?**

- GitHub har innebygd "Dependabot" som varsler om usikre avhengigheter
- "CodeQL" kan legges til for dypere analyse (gratis for åpen kildekode)
- Verktøy som Snyk eller SonarQube finnes også
- Be AI-assistenten sette opp et slikt verktøy i CI/CD-pipelinen

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Valgfritt    | Anbefalt     | Viktig     | Kritisk    |

For kundevendte apper er automatisk sikkerhetssjekk et minimum.

**Annen viktig forståelse:** SAST er ikke perfekt – det gir noen ganger falske alarmer og fanger ikke alt. Men det er et godt sikkerhetsnett som fanger de åpenbare feilene.

------

## 🔴 Feilhåndtering (komplett)

**Hva betyr dette?** Å utvide den grunnleggende feilhåndteringen fra Fase 4 til å dekke alle scenarioer – ikke bare happy path, men alle måter ting kan gå galt på.

**Komplett feilhåndtering inkluderer:**

- Nettverksfeil (serveren svarer ikke)
- Validiseringsfeil (brukeren skrev noe ugyldig)
- Autorisasjonsfeil (brukeren har ikke tilgang)
- Serverfeil (noe gikk galt på backend)
- Tredjepartsfeil (ekstern tjeneste er nede)

**Hvorfor er dette viktig?** Brukere vil oppleve feil. Spørsmålet er om de får en forståelig melding og kan fortsette, eller om appen bare henger eller viser kryptiske feilmeldinger. God feilhåndtering er forskjellen mellom et profesjonelt produkt og et amatørmessig.

**Hvordan løse det?** For hver funksjon, tenk gjennom: "Hva kan gå galt?" Implementer håndtering for hver situasjon:

- Brukervennlig melding som forklarer problemet
- Forslag til hva brukeren kan gjøre
- Logging av feilen for feilsøking

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Moderat      | Viktig       | Kritisk    | Kritisk    |

God feilhåndtering er et tegn på kvalitet og profesjonalitet.

**Annen viktig forståelse:** Tenk på feilmeldinger som en samtale med brukeren. "Feil: 500" er ikke en samtale. "Vi kunne ikke lagre endringene dine. Sjekk internettforbindelsen og prøv igjen." er en samtale.

------

## 🟡 Polert UI/UX

**Hva betyr dette?** Å forbedre utseende og brukeropplevelse fra "fungerer" til "fungerer og føles bra". Design, farger, spacing, animasjoner, og generell polish.

**Elementer i polert UI/UX:**

- Konsistent design (samme farger, fonter, spacing overalt)
- Responsivt design (fungerer på mobil og desktop)
- Visuell feedback (knapper som reagerer på klikk)
- Lesbar tekst og god kontrast
- Intuitivt layout

**Hvorfor er dette viktig?** Førsteinntrykk teller. Et produkt som ser uprofesjonelt ut, skaper mindre tillit – selv om funksjonaliteten er god. God UX reduserer forvirring og frustrasjon.

**Hvordan løse det?**

- Bruk et designsystem eller komponentbibliotek (f.eks. Tailwind, Shadcn/ui)
- Vær konsistent – ikke mikse stiler
- Test på ulike skjermstørrelser
- Be noen andre se på det med friske øyne

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Lav          | Moderat      | Viktig     | Kritisk    |

Interne verktøy kan være mer spartanske. Kundevendte produkter trenger polish.

**Annen viktig forståelse:** "Polert" betyr ikke "fancy". Enkel og ren er ofte bedre enn komplisert og flashy. Fokuser på klarhet og brukervennlighet.

------

## 🟡 Ytelsesoptimalisering

**Hva betyr dette?** Å gjøre produktet raskere – kortere lastetider, raskere respons på brukerhandlinger, mer effektiv bruk av ressurser.

**Vanlige optimaliseringer:**

- **Lazy loading**: Laste innhold bare når det trengs
- **Caching**: Huske data i stedet for å hente på nytt
- **Bildekomprimering**: Mindre bilder = raskere lasting
- **Effektive databasespørringer**: Hente bare det som trengs

**Hvorfor er dette viktig?** Trege apper frustrerer brukere. Studier viser at selv én sekunds forsinkelse kan redusere konvertering betydelig. Ytelse påvirker også søkemotorrangeringer.

**Hvordan løse det?**

1. Mål først – bruk verktøy som Lighthouse for å se hvor problemene er
2. Fokuser på de største flaskehalsene
3. Implementer løsninger
4. Mål igjen for å verifisere forbedring

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Lav          | Moderat      | Viktig     | Kritisk    |

For kundevendte apper er hastighet viktig for brukeropplevelse og SEO.

**Annen viktig forståelse:** Prematur optimalisering er bortkastet tid. Optimaliser først når du har et problem, og basert på målinger – ikke antagelser om hva som er tregt.

------

## 🟡 Loading/tomme tilstander

**Hva betyr dette?** Hva brukeren ser mens data lastes, og hva de ser når det ikke er noe data å vise. Disse "mellomtilstandene" er ofte oversett, men viktige for brukeropplevelsen.

**Eksempler:**

- **Loading-tilstand**: Spinner eller skeleton-elementer mens data hentes
- **Tom tilstand**: "Du har ingen oppgaver ennå. Opprett din første!" i stedet for bare en tom side
- **Feil-tilstand**: "Kunne ikke laste data. Prøv igjen." med en knapp for å prøve igjen

**Hvorfor er dette viktig?** Brukere som ser en blank skjerm vet ikke om appen laster, har krasjet, eller om det bare ikke finnes data. Klare tilstander reduserer forvirring og gjør appen føles mer responsiv.

**Hvordan løse det?** For hver skjerm/komponent som viser data, tenk gjennom tre tilstander:

1. Laster (vis indikator)
2. Tom (vis hjelpsom melding)
3. Har data (vis dataen)

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Lav          | Moderat      | Viktig     | Kritisk    |

En liten ting som gjør stor forskjell for profesjonelt inntrykk.

**Annen viktig forståelse:** Tomme tilstander er også muligheter. "Du har ingen prosjekter ennå" kan bli "Du har ingen prosjekter ennå – opprett ditt første prosjekt" med en tydelig knapp.

------

## 🟢 Sekundære funksjoner

**Hva betyr dette?** Funksjonene som ble markert som "bør ha" eller "kan ha" i kravspesifikasjonen. Nice-to-have som forbedrer produktet, men ikke er essensielle.

**Eksempler:**

- Sortering og filtrering
- Tema-valg (lys/mørk modus)
- Tastatursnarmveier
- Avanserte innstillinger
- Integrasjoner med andre tjenester

**Hvorfor er dette viktig?** Sekundære funksjoner kan være det som gjør produktet fra "greit" til "elsker det". Men de bør bare implementeres etter at kjernen er solid og testet.

**Hvordan løse det?** Prioriter basert på bruker-feedback. Hvilke "bør ha"-funksjoner spør brukerne mest om? Start med de som gir mest verdi for innsatsen.

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Lav          | Moderat      | Varierer   | Varierer   |

Avhenger helt av produktet og brukernes behov.

**Annen viktig forståelse:** Det er fristende å legge til funksjoner, men hver funksjon har vedlikeholdskostnad. Vær selektiv og legg til det som faktisk brukes.

------

## 🟢 Eksport/import

**Hva betyr dette?** Muligheten for brukere å få ut sine data (eksport) eller hente inn data fra andre kilder (import). Data-portabilitet.

**Eksempler:**

- Eksportere oppgaver til CSV
- Eksportere rapport til PDF
- Importere kontakter fra annet system
- Backup av egne data

**Hvorfor er dette viktig?** Brukere vil ha kontroll over sine egne data. Eksport-mulighet bygger tillit ("mine data er ikke låst inne"). Import gjør onboarding enklere. GDPR krever også at brukere kan få ut sine data.

**Hvordan løse det?** Start med enkel eksport til vanlige formater (CSV, JSON). Import er mer komplekst – krev klart definert format og valider grundig.

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt    | Stor skala |
| ------------ | ------------ | ------------- | ---------- |
| Lav          | Moderat      | Viktig (GDPR) | Kritisk    |

GDPR-krav gjør dataeksport relevant for alle som håndterer persondata.

**Annen viktig forståelse:** Import er en sikkerhetsrisiko – du tar inn data fra ukjent kilde. Valider alt, begrens filstørrelser, og håndter feil elegant.

------

## 📄 Leveranse: Feature-komplett, sikker applikasjon + Testdekning

Når Fase 5 er fullført, skal du ha:

**Feature-komplett applikasjon:**

- Alle MVP-funksjoner implementert
- Sikkerhet innebygd i alle funksjoner
- Komplett feilhåndtering
- Polert brukergrensesnitt
- Gode loading/tomme tilstander
- Sekundære funksjoner (basert på prioritet og tid)

**Kvalitetssikring:**

- Code review gjennomført
- SAST-verktøy kjører i pipeline
- Bruker-feedback innhentet og adressert

**Testdekning:**

- Tester for all kritisk funksjonalitet
- Tester for sikkerhetskritiske deler
- Automatiske tester kjører ved hver endring

------

Klar for Fase 6: Testing, Sikkerhet & Kvalitetssikring?
