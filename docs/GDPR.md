# GDPR-analyse for samiske.no

## Sist oppdatert: 2025-12-13

---

## 1. PERSONDATA SOM SAMLES INN

### 1.1 Brukerprofildata (profiles-tabellen)
| Felt | Type | Formål | Rettslig grunnlag |
|------|------|--------|-------------------|
| email | TEXT | Innlogging, varsler | Kontrakt (nødvendig for tjenesten) |
| full_name | TEXT | Identifikasjon | Samtykke |
| avatar_url | TEXT | Profilering | Samtykke |
| bio | TEXT | Sosial funksjon | Samtykke |
| location | TEXT | Sosial kontekst | Samtykke |
| phone | TEXT | Kontakt | Samtykke |
| phone_public | BOOLEAN | Synlighet | Samtykke |
| home_municipality_id | UUID | Tilhørighet | Samtykke |
| current_municipality_id | UUID | Geografisk filtrering | Samtykke |

### 1.2 Innhold skapt av brukeren
| Tabell | Data | Formål |
|--------|------|--------|
| posts | Innlegg med tittel, tekst, bilder | Kjernetjeneste |
| comments | Kommentarer | Kjernetjeneste |
| likes | Likes på innlegg | Sosial funksjon |
| messages | Direktemeldinger | Kommunikasjon |
| feedback | Tilbakemeldinger | Forbedring av tjenesten |

### 1.3 Metadata og preferanser
| Tabell | Data | Formål |
|--------|------|--------|
| notification_preferences | E-post/push innstillinger | Brukervalg |
| push_subscriptions | Push-token (JSONB) | Push-varsler |
| friendships | Venneforespørsler/-forhold | Sosial funksjon |
| user_starred_municipalities | Favorittommuner | Personalisering |
| user_starred_places | Favorittsteder | Personalisering |

### 1.4 Systemdata
| Tabell | Data | Oppbevaring |
|--------|------|-------------|
| email_queue | E-postadresse, navn | 30 dager (sendte), 7 dager (feilede) |
| email_digest_items | Referanser til innhold | 30 dager |
| notification_log | Varslingshistorikk | Ikke definert |

---

## 2. EKSISTERENDE GDPR-FUNKSJONER

### 2.1 Rett til sletting (Artikkel 17)
- [x] Bruker kan slette egen konto fra /profil
- [x] CASCADE-delete fjerner all tilknyttet data automatisk
- [x] Passordbekreftelse kreves før sletting
- [x] Admin kan ikke se brukerdata etter sletting

### 2.2 Rett til retting (Artikkel 16)
- [x] Bruker kan redigere profilinformasjon
- [x] Bruker kan redigere egne innlegg
- [x] Bruker kan slette egne kommentarer

### 2.3 Tilgangskontroll (Sikkerhet - Artikkel 32)
- [x] Row Level Security (RLS) på alle tabeller
- [x] Passordkrav: min 10 tegn, stor/liten bokstav, tall
- [x] Service Role Key kun på server-side
- [x] E-post kø kun tilgjengelig for system

### 2.4 Dataminimering
- [x] Automatisk opprydding av e-postkø (30/7 dager)
- [x] Bilder komprimeres før opplasting

---

## 3. GDPR-MANGLER

### 3.1 KRITISK - Juridisk påkrevd

#### P1: Personvernerklæring
**Status:** LØST (2025-12-13)
**Krav:** Artikkel 13/14 - Informasjonsplikt
**Løsning:** Opprettet `/personvern` side med full personvernerklæring som dekker:
- Behandlingsansvarlig og kontaktinfo
- Hvilke data som samles inn
- Formål og rettslig grunnlag
- Tredjeparter (Supabase, Vercel)
- Oppbevaringstider
- Brukerens rettigheter
- Klageadgang (Datatilsynet)

#### P2: Samtykke ved registrering
**Status:** LØST (2025-12-13)
**Krav:** Artikkel 6/7 - Lovlig behandling
**Løsning:**
- Checkbox med lenke til personvernerklæring på registreringssiden
- Samtykke-tidspunkt lagres i `profiles.privacy_consent_at`
- Eksisterende brukere fikk satt samtykke til registreringstidspunkt (implisitt)
- Database-migrasjon: `20241213_gdpr_consent.sql`

#### P3: Cookie-informasjon
**Status:** LØST (2025-12-13)
**Krav:** ePrivacy-direktivet
**Løsning:** Informasjon om cookies/local storage er inkludert i personvernerklæringen (seksjon 7)

### 3.2 HØY PRIORITET

#### P4: Dataeksport (portabilitet)
**Status:** LØST (2025-12-13)
**Krav:** Artikkel 20 - Rett til dataportabilitet
**Løsning:**
- API-endepunkt: `/api/export-data` (GET)
- "Last ned mine data" knapp på profilsiden
- Eksporterer: profil, innlegg, kommentarer, likes, meldinger, venner, preferanser
- Format: JSON med GDPR-metadata

#### P5: Sletting av bilder fra storage
**Status:** LØST (2025-12-13)
**Krav:** Artikkel 17 - Rett til sletting
**Løsning:**
- Oppdatert `/api/delete-account` til å slette bilder før bruker
- Sletter avatar og alle innleggsbilder fra Supabase Storage
- Logging ved sletting for verifisering

#### P6: CASCADE-delete verifisert
**Status:** LØST (2025-12-13)
**Beskrivelse:** Verifisert at all brukerdata slettes ved kontosletting
**Resultat:**
- 30 tabeller sjekket
- Alle bruker-relaterte tabeller har CASCADE til profiles
- profiles har CASCADE til auth.users
- SET NULL brukes korrekt for created_by/approved_by referanser
- reports.reviewed_by fikset fra NO ACTION til SET NULL

### 3.3 MEDIUM PRIORITET

#### P7: Logging av samtykke
**Status:** MANGLER
**Krav:** Artikkel 7(1) - Dokumentasjon av samtykke
**Beskrivelse:** Ingen logg over når bruker ga samtykke
**Løsning:** consent_log tabell med tidspunkt og versjon av policy

#### P8: Oppbevaringstider ikke dokumentert
**Status:** DELVIS
**Beskrivelse:** Ikke alle tabeller har definert oppbevaringstid
**Løsning:** Dokumenter og implementer automatisk sletting

#### P9: Tredjeparter ikke dokumentert
**Status:** MANGLER
**Beskrivelse:** Ingen oversikt over tredjeparter (Supabase, Vercel, SMTP)
**Løsning:** Inkluder i personvernerklæring

### 3.4 LAV PRIORITET

#### P10: Rett til begrensning
**Status:** MANGLER
**Krav:** Artikkel 18
**Beskrivelse:** Bruker kan ikke "fryse" data (kun slette)
**Løsning:** Vurder om dette er relevant for tjenesten

---

## 4. TREDJEPARTER OG DATABEHANDLERE

| Tjeneste | Formål | Lokasjon | Databehandleravtale |
|----------|--------|----------|---------------------|
| Supabase | Database, auth, storage | EU (Frankfurt) | Inkludert i ToS |
| Vercel | Hosting | Global CDN | DPA tilgjengelig |
| SMTP (cPanel) | E-post | ? | Sjekk med hosting |

---

## 5. IMPLEMENTERINGSPLAN

### Fase 1: Juridisk minimum (FULLFØRT 2025-12-13)
1. [x] Opprett /personvern side med personvernerklæring
2. [x] Legg til samtykke-checkbox ved registrering
3. [x] Lagre samtykke med tidspunkt i database (`profiles.privacy_consent_at`)

### Fase 2: Tekniske krav (FULLFØRT 2025-12-13)
4. [x] Implementer dataeksport-funksjon (`/api/export-data`)
5. [x] Fiks sletting av bilder fra storage (oppdatert `/api/delete-account`)
6. [x] Verifiser at all data slettes ved kontosletting (30 tabeller verifisert)

### Fase 3: Dokumentasjon
7. [x] Dokumenter alle databehandlere (i personvernerklæring)
8. [x] Definer oppbevaringstider (i personvernerklæring)
9. [ ] Opprett intern GDPR-prosedyre

---

## 6. PERSONVERNERKLÆRING (UTKAST)

Se `/src/app/personvern/page.tsx` for full tekst.

Hovedpunkter:
1. Behandlingsansvarlig: [Øyvind Paulsen / samiske.no]
2. Kontakt: [e-post]
3. Formål: Sosial plattform for samisk miljø
4. Rettslig grunnlag: Samtykke og kontrakt
5. Data som samles: Se seksjon 1 over
6. Oppbevaring: Så lenge kontoen eksisterer + 30 dager
7. Rettigheter: Innsyn, retting, sletting, portabilitet
8. Tredjeparter: Supabase, Vercel
9. Klage: Datatilsynet

---

## 7. DATABASE-MIGRASJONER FOR GDPR

```sql
-- Se /supabase/migrations/gdpr_*.sql for implementering
```

---

## REFERANSER

- [GDPR - EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- [Datatilsynet veileder](https://www.datatilsynet.no/)
- [Supabase DPA](https://supabase.com/docs/company/dpa)
- [Vercel DPA](https://vercel.com/legal/dpa)
