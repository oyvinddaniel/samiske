# Fase 2: Kravspesifikasjon (inkl. Sikkerhetskrav)

Denne fasen handler om å oversette visjonen din til konkrete, byggbare krav. Her definerer du *hva* som skal bygges – ikke *hvordan*.

------

## 🔴 Brukerhistorier med akseptkriterier

**Hva betyr dette?** En brukerhistorie beskriver en funksjon fra brukerens perspektiv, i formatet: *"Som [type bruker] vil jeg [gjøre noe] for å [oppnå et mål]."* Akseptkriteriene er sjekklisten som bekrefter at funksjonen faktisk fungerer som tiltenkt.

**Eksempel:**

- Brukerhistorie: "Som kunde vil jeg kunne nullstille passordet mitt for å få tilgang til kontoen min hvis jeg glemmer det."
- Akseptkriterier:
  - Bruker mottar e-post innen 2 minutter
  - Lenken utløper etter 24 timer
  - Nytt passord må oppfylle sikkerhetskravene
  - Bruker blir logget inn automatisk etter vellykket nullstilling

**Hvorfor er dette viktig?** Brukerhistorier tvinger deg til å tenke fra brukerens ståsted, ikke teknologiens. Akseptkriteriene fjerner tvetydighet – alle vet når funksjonen er "ferdig". Uten dette får du diskusjoner som "men jeg trodde den skulle..." langt ut i prosjektet.

**Hvordan løse det?** For hver funksjon du planlegger, skriv brukerhistorien og deretter 3-5 akseptkriterier. Still spørsmålet: "Hvordan ville jeg demonstrert at dette fungerer for en kollega?"

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Moderat      | Viktig       | Kritisk    | Kritisk    |

For et lite script kan du ha det i hodet. For alt annet bør det dokumenteres.

**Annen viktig forståelse:** Gode akseptkriterier er testbare. "Systemet skal være raskt" er dårlig. "Siden skal laste på under 2 sekunder" er bra.

------

## 🔴 Sikkerhetskrav

**Hva betyr dette?** Eksplisitte krav til hvordan systemet skal beskytte seg selv og brukernes data. Dette inkluderer hvem som kan gjøre hva (autorisering), hvordan brukere beviser hvem de er (autentisering), hvordan data beskyttes (kryptering), og hvordan hendelser spores (logging).

**Eksempler på sikkerhetskrav:**

- Brukere må logge inn med e-post og passord
- Passord må ha minst 12 tegn
- Bare administratorer kan slette andre brukere
- All datatrafikk skal være kryptert (HTTPS)
- Feilet innlogging skal logges

**Hvorfor er dette viktig?** Sikkerhet som legges til etterpå blir ofte hullete – som å prøve å legge til en kjeller etter at huset er bygget. Ved å definere sikkerhetskravene nå, kan AI-assistenten bygge det riktig fra starten.

**Hvordan løse det?** Gå gjennom dataklassifiseringen fra Fase 1. For hver sensitiv datatype, spør:

- Hvem skal ha tilgang?
- Hvordan bekrefter vi identiteten deres?
- Hva skal logges?
- Hvordan beskyttes dataen?

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Lav          | Viktig       | Kritisk    | Kritisk    |

Et internt verktøy uten sensitive data trenger minimalt. Alt med brukerkontoer eller persondata MÅ ha dette.

**Annen viktig forståelse:** De vanligste sikkerhetsbruddene skyldes grunnleggende feil: svake passord, manglende tilgangskontroll, data som sendes ukryptert. Du trenger ikke være sikkerhetsekspert – du trenger å dekke det grunnleggende.

------

## 🔴 Funksjonsliste (prioritert)

**Hva betyr dette?** En komplett liste over alle funksjoner produktet skal ha, rangert etter viktighet. Vanlig metode er MoSCoW:

- **Must have**: Produktet fungerer ikke uten dette
- **Should have**: Viktig, men kan lanseres uten
- **Could have**: Fint å ha hvis tid
- **Won't have (nå)**: Bevisst utelatt fra denne versjonen

**Hvorfor er dette viktig?** Tid og ressurser er alltid begrenset. Uten prioritering risikerer du å bruke uker på en "nice-to-have"-funksjon mens kjernefunksjonaliteten forblir uferdig.

**Hvordan løse det?** List opp alle funksjoner, deretter still spørsmålet for hver: "Hvis vi bare kunne lansere med 3 funksjoner, ville denne vært en av dem?" De som får "ja" er Must have. Resten fordeler du basert på verdi for brukeren.

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Moderat      | Viktig       | Kritisk    | Kritisk    |

Jo flere funksjoner du vurderer, jo viktigere er prioritering.

**Annen viktig forståelse:** Prioriteringen bør styres av brukerverdi, ikke hva som er teknisk interessant eller lett å bygge. Spør: "Hva gir mest verdi for målgruppen?"

------

## 🔴 MVP-definisjon

**Hva betyr dette?** MVP (Minimum Viable Product) er den enkleste versjonen av produktet som fortsatt gir verdi til brukeren. Det er det absolutte minimum du kan lansere med for å teste om ideen fungerer i praksis.

**Hvorfor er dette viktig?** Jo lenger du venter med å lansere, jo lenger venter du med å lære fra ekte brukere. MVP-tankegangen sikrer at du ikke overbygger før du vet hva som faktisk trengs. Mange funksjoner du tror er essensielle, viser seg å være unødvendige.

**Hvordan løse det?** Se på funksjonslisten og spør: "Hva er det absolutt minste som lar en bruker fullføre kjerneoppgaven og få verdi?" Alt annet er ikke MVP. Vær brutal – de fleste definerer MVP altfor bredt.

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Moderat      | Viktig       | Kritisk    | Kritisk    |

For kundevendte produkter er MVP-tenkning essensielt for å unngå å bygge feil ting.

**Annen viktig forståelse:** MVP betyr ikke "dårlig kvalitet". Det som er med skal fungere godt. Du bare utelater funksjoner, ikke kvalitet.

------

## 🔴 Brukerflyt

**Hva betyr dette?** En steg-for-steg beskrivelse av hvordan brukeren navigerer gjennom produktet for å fullføre hovedoppgavene. Fra de lander på siden til de har oppnådd målet sitt.

**Eksempel (enkel nettbutikk):**

1. Bruker lander på forsiden
2. Søker etter produkt
3. Klikker på produkt for detaljer
4. Legger i handlekurv
5. Går til kassen
6. Logger inn eller oppretter konto
7. Fyller inn leveringsadresse
8. Betaler
9. Mottar bekreftelse

**Hvorfor er dette viktig?** Brukerflyten avdekker kompleksitet du ikke ser ellers. Den viser hvor brukeren kan bli forvirret, hvor det trengs flere skjermer enn du trodde, og hvilke tilstander systemet må håndtere.

**Hvordan løse det?** For hver hovedoppgave i produktet, skriv ned hvert steg brukeren tar. Vær konkret – inkluder klikk, valg, og overganger mellom skjermer.

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Moderat      | Viktig       | Kritisk    | Kritisk    |

Jo flere brukere og jo viktigere brukeropplevelsen er, jo viktigere er det å planlegge flyten nøye.

**Annen viktig forståelse:** Tenk også på "ulykkelig" flyt: Hva skjer hvis brukeren skriver feil passord? Hvis betalingen feiler? Disse situasjonene trenger også design.

------

## 🔴 Edge cases og feilhåndtering

**Hva betyr dette?** Edge cases er uvanlige, men mulige situasjoner som systemet må håndtere. Feilhåndtering er hva som skjer når noe går galt.

**Eksempler på edge cases:**

- Bruker prøver å registrere seg med en e-post som allerede finnes
- Bruker skriver inn et negativt tall i et mengdefelt
- Bruker laster opp en fil som er for stor
- Bruker har JavaScript slått av i nettleseren
- To brukere redigerer samme dokument samtidig

**Hvorfor er dette viktig?** Edge cases er der de fleste bugs og sikkerhetshull oppstår. Hackere utnytter nettopp disse situasjonene. Brukere som møter ubehandlede feil mister tilliten til produktet.

**Hvordan løse det?** For hver brukerhistorie, spør: "Hva kan gå galt?" og "Hva hvis brukeren gjør noe uventet?" Dokumenter hva systemet skal gjøre i hver situasjon.

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Moderat      | Viktig       | Kritisk    | Kritisk    |

Edge cases er oppgradert fra "bør ha" til "må ha" i den forbedrede malen – nettopp fordi de er så viktige for sikkerhet og stabilitet.

**Annen viktig forståelse:** Feilmeldinger til brukeren bør være nyttige ("E-postadressen er allerede registrert") uten å avsløre sensitiv informasjon ("Feil: Databasespørring feilet på rad 47").

------

## 🟡 Ikke-funksjonelle krav

**Hva betyr dette?** Krav som handler om *hvordan* systemet oppfører seg, ikke *hva* det gjør. Dette inkluderer ytelse (hastighet), tilgjengelighet (oppetid), skalerbarhet (kapasitet), og vedlikeholdbarhet.

**Eksempler:**

- Siden skal laste på under 3 sekunder
- Systemet skal tåle 1000 samtidige brukere
- Oppetid på minimum 99,5%
- Skal fungere på mobil og desktop

**Hvorfor er dette viktig?** Et produkt kan ha alle riktige funksjoner og fortsatt feile fordi det er for tregt, krasjer ofte, eller ikke fungerer på mobil. Disse kravene påvirker tekniske valg som er vanskelige å endre senere.

**Hvordan løse det?** Tenk gjennom: Hvor raskt må det være? Hvor mange brukere samtidig? Hvor kritisk er oppetid? Hvilke enheter skal støttes? Definer konkrete tall der mulig.

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Lav          | Moderat      | Viktig     | Kritisk    |

For et lite internt verktøy er "det fungerer" nok. For stor skala må dette planlegges nøye.

**Annen viktig forståelse:** Ikke-funksjonelle krav styrer ofte teknologivalg. Hvis du trenger ekstrem ytelse, påvirker det hvilke verktøy og arkitektur som velges.

------

## 🟡 Wireframes/Skisser

**Hva betyr dette?** Enkle visuelle skisser av hvordan skjermbildene i produktet vil se ut. Ikke ferdig design, men grove tegninger som viser layout og elementer.

**Hvorfor er dette viktig?** En skisse sier mer enn tusen ord. Det avdekker misforståelser tidlig: "Å, jeg trodde det var én skjerm, ikke tre." Det hjelper alle få samme mentale bilde av produktet.

**Hvordan løse det?** Tegn på papir eller bruk enkle verktøy. Hold det simpelt – bokser og tekst. Unngå farger og visuelt design på dette stadiet. Fokuser på: Hva er på hver skjerm? Hvordan henger skjermene sammen?

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Lav          | Moderat      | Viktig     | Viktig     |

For kundevendte produkter er visuelle skisser verdifulle for å kommunisere visjon. For enkle interne verktøy kan en god beskrivelse være nok.

**Annen viktig forståelse:** Wireframes er kommunikasjonsverktøy, ikke designdokumenter. De hjelper deg og AI-assistenten snakke om det samme.

------

## 🟡 Datamodell

**Hva betyr dette?** En oversikt over hvilke typer informasjon systemet skal lagre, og hvordan de henger sammen. Tenk på det som en liste over "ting" i systemet og deres egenskaper.

**Eksempel (bloggplattform):**

- **Bruker**: navn, e-post, passord, opprettelsesdato
- **Innlegg**: tittel, innhold, forfatter, publiseringsdato
- **Kommentar**: innhold, forfatter, hvilket innlegg det tilhører

**Hvorfor er dette viktig?** Datamodellen er grunnlaget for databasen. Feil her er dyre å fikse senere. En god datamodell gjør det lett å bygge funksjoner; en dårlig gjør alt vanskelig.

**Hvordan løse det?** List opp "tingene" i systemet ditt. For hver, noter hvilken informasjon som må lagres. Tenk gjennom relasjonene: Kan en bruker ha mange innlegg? Kan et innlegg ha mange kommentarer?

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Lav          | Viktig       | Viktig     | Kritisk    |

Alt med database trenger gjennomtenkt datamodell.

**Annen viktig forståelse:** Tenk fremover: Vil du trenge å lagre mer informasjon senere? Det er enklere å planlegge for utvidelse nå enn å omstrukturere senere.

------

## 🟡 Personvern (GDPR)

**Hva betyr dette?** Spesifikke krav for å overholde personvernlovgivning, spesielt GDPR. Dette inkluderer brukersamtykke, rett til å slette egne data, rett til innsyn, og informasjonsplikt.

**Hovedkrav i GDPR:**

- Brukere må samtykke til datainnsamling
- Brukere kan be om å se hvilke data du har om dem
- Brukere kan be om å få slettet sine data
- Du må fortelle brukere hvordan dataene brukes
- Du må beskytte data mot uautorisert tilgang

**Hvorfor er dette viktig?** GDPR-brudd kan gi bøter på opptil 20 millioner euro eller 4% av global omsetning. Men viktigere: det handler om respekt for brukernes rettigheter.

**Hvordan løse det?**

- Lag personvernerklæring som forklarer databruken
- Implementer samtykkeløsning (cookie-banner, etc.)
- Bygg funksjonalitet for dataeksport og sletting
- Ikke samle inn mer data enn du trenger

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Lav          | Moderat      | Kritisk    | Kritisk    |

Alt som samler personopplysninger fra brukere utenfor organisasjonen må overholde GDPR.

**Annen viktig forståelse:** "Personopplysninger" er bredere enn du kanskje tror – det inkluderer e-post, IP-adresser, og alt som kan identifisere en person.

------

## 🟢 Internasjonalisering

**Hva betyr dette?** Planlegging for å støtte flere språk og regionale tilpasninger (valuta, datoformat, etc.).

**Hvorfor er dette viktig?** Å legge til språkstøtte i etterkant er arbeidskrevende. Hvis du planlegger for det fra start, kan koden struktureres for å gjøre det enkelt. Men hvis du ikke trenger det nå, er det ofte over-engineering.

**Hvordan løse det?** Bestem tidlig: Trenger vi noensinne flere språk? Hvis ja, kan AI-assistenten strukturere teksthåndteringen for dette fra start. Hvis nei, bygg uten og legg det til senere hvis behovet oppstår.

**Viktighet per prosjektkategori:**

| Lite internt | Internt m/DB | Kundevendt | Stor skala |
| ------------ | ------------ | ---------- | ---------- |
| Lav          | Lav          | Varierer   | Viktig     |

For norske interne verktøy er dette sjelden relevant. For internasjonale produkter er det kritisk.

**Annen viktig forståelse:** Selv om du bare trenger norsk nå, kan det være verdt å holde tekster atskilt fra kode – det gjør fremtidige oversettelser enklere OG gjør det lettere å redigere tekst uten å endre kode.

------

## 📄 Leveranse: Kravdokument med sikkerhetskrav + Wireframes

Når Fase 2 er fullført, skal du ha:

**Kravdokument** som inneholder:

- Alle brukerhistorier med akseptkriterier
- Sikkerhetskrav
- Prioritert funksjonsliste (MoSCoW)
- MVP-definisjon
- Brukerflyten for hovedscenarier
- Edge cases og feilhåndtering
- Ikke-funksjonelle krav
- Datamodell (oversikt)
- GDPR-krav (hvis relevant)

**Wireframes/Skisser:**

- Visuelle skisser av hovedskjermene
- Piler eller notater som viser flyten mellom dem

------

Klar for Fase 3: Teknisk Design & Trusselmodellering?
