# Demo-prosjekt: TaskFlow - Todo-app med Prosess A-Å

**Komplett walkthrough fra idé til produksjon**

---

## 📋 Prosjektoversikt

**Prosjektnavn:** TaskFlow
**Type:** SaaS Todo/oppgavehåndtering
**Målgruppe:** Freelancere og småbedrifter
**Tidsbruk:** 3 uker (del tid)
**Tech stack:** Next.js, Supabase, Vercel, Tailwind CSS

**Formål med denne demoen:**
Vise NØYAKTIG hvordan du bruker Prosess A-Å fra start til slutt, med faktiske prompts, agent-responser, og leveranser.

---

## 🎯 Innholdsfortegnelse

- [Fase 1: Idé, Visjon & Risikovurdering](#fase-1-idé-visjon--risikovurdering)
- [Fase 2: Kravspesifikasjon](#fase-2-kravspesifikasjon)
- [Fase 3: Teknisk Design](#fase-3-teknisk-design)
- [Fase 4: MVP/Prototype](#fase-4-mvpprototype)
- [Fase 5: Utvikling & Iterasjon](#fase-5-utvikling--iterasjon)
- [Fase 6: Testing & Kvalitetssikring](#fase-6-testing--kvalitetssikring)
- [Fase 7: Publisering](#fase-7-publisering)
- [Lærdom & Refleksjon](#lærdom--refleksjon)

---

# Fase 1: Idé, Visjon & Risikovurdering

## 📅 Tidspunkt: Dag 1, Formiddag (2 timer)

### **Prompt brukt:**

```
Aktiver OPPSTART-agent.

Jeg vil bygge en todo-app for freelancere som sliter med å holde oversikt
over oppgaver fra flere klienter. Appen skal være enkel, rask og fokusert.

Hjelp meg med:
1. Problemdefinisjon
2. Målgruppe
3. Dataklassifisering
4. Risikovurdering

Lagre leveranser i:
- docs/vision.md
- docs/security/risikovurdering.md
- docs/security/dataklassifisering.md
```

---

### **Agent-respons (simulert, men realistisk):**

```
[OPPSTART-agent aktivert]

Jeg vil guide deg gjennom Fase 1. La meg starte med oppklarende spørsmål:

SPØRSMÅL 1: Hvem er primærmålgruppen?
- Er dette freelancere generelt, eller spesifikke bransjer?
- Jobber de alene eller i små team?

SPØRSMÅL 2: Hva er den kritiske smerten?
- Er hovedproblemet å huske oppgaver, eller å prioritere dem?
- Bruker de noe i dag som ikke fungerer?

SPØRSMÅL 3: Hvilken data vil du lagre?
- Kun oppgaver og titler?
- Eller også klient-informasjon, tidslogging, etc?

Vennligst svar på disse, så lager jeg dokumentene.
```

---

### **Brukerens svar:**

```
1. Primært freelance designere og utviklere, jobber alene
2. Hovedproblemet er at de glemmer oppgaver fra mindre klienter når de fokuserer på store prosjekter
3. Oppgaver (tittel, beskrivelse, deadline), prosjekter (navn, klient), brukerkonto (email, navn)
```

---

### **Agent genererer dokumenter:**

#### **Fil: docs/vision.md**

```markdown
# Vision for TaskFlow

**Opprettet:** 2026-01-06
**Fase:** 1 - Idé, Visjon & Risikovurdering
**Agent:** OPPSTART-agent

---

## Problemdefinisjon

Freelance designere og utviklere som jobber med flere klienter samtidig
sliter med å holde oversikt over oppgaver, spesielt for mindre klienter.

Når de fokuserer på store prosjekter, glemmer de ofte småoppgaver som:
- Mindre design-endringer
- Vedlikeholdsoppgaver
- Oppfølging på feedback

Dette fører til:
- Misfornøyde klienter
- Tapte inntekter (glemte faktureringer)
- Stress og dårlig samvittighet

Eksisterende verktøy som Asana og Trello er:
- For komplekse (mange funksjoner de ikke trenger)
- For dyre for freelancere
- Krever for mye oppsett

## Målgruppe

**Primær:**
- Freelance designere og utviklere
- 3-10 aktive klienter
- Jobber alene (ikke team)
- Tech-savvy, men vil ha enkle verktøy

**Persona:**
- Navn: Sarah, 32 år
- Jobb: Freelance webdesigner
- Utfordring: Har 2 store klienter + 5 små. Glemmer ofte små oppgaver.
- Mål: Enkel oversikt uten kompleksitet

## Verdiforslag

TaskFlow lar freelancere holde oversikt over alle oppgaver på én plass,
uten unødvendig kompleksitet. Fokuser på arbeidet, ikke verktøyet.

**Hovedfordel vs. konkurrenter:**
- Asana/Trello: TaskFlow er 10x enklere, kun det du trenger
- Notisapper: TaskFlow har deadlines og prosjekt-struktur
- Excel: TaskFlow er moderne og tilgjengelig overalt

## Suksesskriterier

1. **Brukbarhet:** 90% av nye brukere skal kunne legge til sin første oppgave innen 2 minutter
2. **Engagement:** 70% av brukerne skal logge inn minst 3 ganger per uke
3. **Retention:** 60% av brukerne skal fortsatt være aktive etter 1 måned
4. **Tidssparing:** Brukere rapporterer 1-2 timer spart per uke

## Scope

**I MVP:**
- Brukerautentisering (email/passord)
- Opprett/rediger/slett prosjekter
- Opprett/rediger/slett oppgaver
- Sett deadlines
- Marker oppgaver som fullført
- Dashboard med oversikt

**IKKE i MVP:**
- Team-funksjoner
- Tidsregistrering
- Fakturering
- Integrasjoner (Google Calendar, etc.)
- Mobile app (kun web)
- Gjentakende oppgaver

---

Neste fase: Kravspesifikasjon
```

---

#### **Fil: docs/security/dataklassifisering.md**

```markdown
# Dataklassifisering for TaskFlow

**Opprettet:** 2026-01-06
**Fase:** 1 - Idé, Visjon & Risikovurdering
**Agent:** OPPSTART-agent

---

## Hvilke data lagres?

| Datatype | Eksempel | Klassifisering | GDPR-relevant |
|----------|----------|----------------|---------------|
| **Brukerkonto** | Email, navn, passord (hashet) | Konfidensiell | ✅ Ja (personopplysning) |
| **Prosjekter** | Prosjektnavn, klientnavn | Konfidensiell | ⚠️ Mulig (hvis navn på person) |
| **Oppgaver** | Tittel, beskrivelse, deadline | Intern | ⚠️ Mulig (hvis inneholder persondata) |
| **Metadata** | Opprettet dato, sist oppdatert | Intern | ❌ Nei |

## Klassifikasjonsnivåer

### **Offentlig**
- Ingen data er offentlig tilgjengelig

### **Intern**
- Oppgaver (uten persondata)
- Metadata

### **Konfidensiell**
- Brukerkonto-info
- Prosjektnavn (kan inneholde klientnavn)
- Oppgaver (kan inneholde persondata i beskrivelse)

### **Strengt konfidensiell**
- Passord (hashet med bcrypt/Argon2)
- Auth tokens
- Session cookies

## GDPR-vurdering

**Behandler vi personopplysninger?** ✅ Ja

**Hvilke:**
- Email (brukeridentifikasjon)
- Navn (valgfritt)
- Eventuelt klientnavn i prosjekter/oppgaver

**Lovlig grunnlag:**
- Samtykke ved registrering
- Kontraktsoppfyllelse (levere tjenesten)

**Brukerrettigheter som må støttes:**
1. Rett til innsyn (eksporter data)
2. Rett til sletting (slett konto + all data)
3. Rett til dataportabilitet (eksporter JSON)

---

Neste: Risikovurdering
```

---

#### **Fil: docs/security/risikovurdering.md**

```markdown
# Risikovurdering for TaskFlow

**Opprettet:** 2026-01-06
**Fase:** 1 - Idé, Visjon & Risikovurdering
**Agent:** OPPSTART-agent

---

## Identifiserte risikoer

| # | Risiko | Sannsynlighet | Konsekvens | Tiltak |
|---|--------|---------------|------------|--------|
| 1 | Databr udd (svak autentisering) | Middels | Høy | Bruk etablert auth (Supabase Auth), 2FA i fremtiden |
| 2 | Ingen brukere (dårlig product-market fit) | Middels | Høy | Valider med 5-10 brukere før full lansering |
| 3 | For kompleks (scope creep) | Høy | Middels | Streng MVP-definisjon, si nei til features |
| 4 | Dårlig ytelse (langsom app) | Lav | Middels | Optimalisere database queries, bruk caching |
| 5 | Tapte data (manglende backup) | Lav | Høy | Supabase har auto-backup, test restore-prosedyre |
| 6 | GDPR-brudd (manglende compliance) | Lav | Høy | Implementer sletting/eksport fra start |
| 7 | Konkurrent lanserer før oss | Middels | Lav | Fokuser på nisje (freelancere), ikke generell todo-app |

## Høyrisiko-områder (krever ekstra fokus)

### **R1: Databrudd**
**Mitigering:**
- Bruk Supabase Auth (battle-tested)
- Alle passord hashes med bcrypt
- Row Level Security (RLS) i database
- HTTPS only
- Security headers (CSP, HSTS, etc.)

### **R2: Ingen brukere**
**Mitigering:**
- Intervju 10 freelancere før vi bygger
- MVP ferdig på 3 uker, test raskt
- Få 20 beta-brukere før offentlig lansering

### **R6: GDPR-brudd**
**Mitigering:**
- Slett-funksjon implementeres i MVP
- Eksport-funksjon implementeres i MVP
- Personvernerklæring laget før lansering
- Kun lagre nødvendig data

---

## Akseptkriterier før lansering

- ✅ OWASP Top 10 testing gjennomført
- ✅ RLS policies testet
- ✅ Backup/restore testet
- ✅ GDPR sletting/eksport fungerer
- ✅ Security headers A+ rating
- ✅ 10 beta-brukere har testet uten kritiske bugs

Neste: Fase 2 - Kravspesifikasjon
```

---

### **Lærdom fra Fase 1:**

✅ **Hva gikk bra:**
- OPPSTART-agent stilte oppklarende spørsmål (forhindret antagelser)
- Dataklassifisering tvang oss til å tenke på sikkerhet tidlig
- Risikovurdering identifiserte product-market fit som kritisk

⚠️ **Utfordringer:**
- Vanskelig å være konkret på målbare suksesskriterier så tidlig
- Fristende å legge til funksjoner i scope (måtte disiplinere seg)

💡 **Tips:**
- Bruk minst 2 timer på Fase 1, ikke rusk gjennom den
- De oppklarende spørsmålene fra agenten er gull, ikke hopp over dem

---

# Fase 2: Kravspesifikasjon

## 📅 Tidspunkt: Dag 1, Ettermiddag (3 timer)

### **Prompt brukt:**

```
Aktiver KRAV-agent.

Les docs/vision.md og lag komplett kravspesifikasjon.

Inkluder:
1. Brukerhistorier (MoSCoW-prioritert)
2. Datamodell (database-tabeller)
3. Sikkerhetskrav
4. MVP-definisjon
5. Edge cases

Lagre i:
- docs/krav/brukerhistorier.md
- docs/krav/datamodell.md
- docs/krav/sikkerhetskrav.md
- docs/krav/mvp-definition.md
- docs/krav/edge-cases.md
```

---

### **Agent-respons (utdrag):**

```
[KRAV-agent aktivert]

Jeg har lest docs/vision.md. La meg lage brukerhistorier.

MUST HAVE (Kritisk):
- Som freelancer vil jeg kunne registrere konto
- Som bruker vil jeg kunne logge inn
- Som bruker vil jeg kunne opprette prosjekt
- Som bruker vil jeg kunne legge til oppgave under prosjekt
- Som bruker vil jeg kunne sette deadline på oppgave
- Som bruker vil jeg kunne markere oppgave som fullført
- Som bruker vil jeg kunne se alle oppgaver med kommende deadlines

SHOULD HAVE (Viktig):
- Som bruker vil jeg kunne søke i oppgaver
- Som bruker vil jeg kunne filtrere oppgaver (fullført/aktive)

[...fortsetter med datamodell]

Jeg ser at vi trenger 3 hovedtabeller:
1. users (brukerkonto)
2. projects (prosjekter)
3. tasks (oppgaver)

Skal jeg lage wireframe for dashboard?
```

---

### **Leveranse: docs/krav/brukerhistorier.md (utdrag)**

```markdown
# Brukerhistorier for TaskFlow

**Opprettet:** 2026-01-06
**Fase:** 2 - Kravspesifikasjon
**Agent:** KRAV-agent

---

## MoSCoW-prioritering

### **MUST HAVE** (Kritisk for MVP)

#### Autentisering
- **US-001:** Som freelancer vil jeg kunne registrere konto med email/passord
  - **Akseptkriterier:**
    - Email-validering (gyldig format)
    - Passord minimum 8 tegn
    - Bekreftelse-email sendes
  - **Estimat:** 4 timer

- **US-002:** Som bruker vil jeg kunne logge inn
  - **Akseptkriterier:**
    - Feil email/passord gir tydelig feilmelding
    - Session varer i 7 dager
    - "Husk meg"-funksjon
  - **Estimat:** 2 timer

- **US-003:** Som bruker vil jeg kunne resette passord
  - **Akseptkriterier:**
    - Reset-link sendes til email
    - Link utløper etter 1 time
  - **Estimat:** 3 timer

#### Prosjekthåndtering
- **US-004:** Som bruker vil jeg kunne opprette prosjekt
  - **Akseptkriterier:**
    - Navn er required (maks 100 tegn)
    - Klient er optional
    - Farge-valg for visuell oversikt
  - **Estimat:** 2 timer

- **US-005:** Som bruker vil jeg kunne redigere prosjekt
  - **Estimat:** 1 time

- **US-006:** Som bruker vil jeg kunne slette prosjekt
  - **Akseptkriterier:**
    - Bekreftelse-dialog før sletting
    - Sletter også alle oppgaver under prosjektet
  - **Estimat:** 2 timer

#### Oppgavehåndtering
- **US-007:** Som bruker vil jeg kunne legge til oppgave under prosjekt
  - **Akseptkriterier:**
    - Tittel required (maks 200 tegn)
    - Beskrivelse optional
    - Deadline optional
    - Status default = "todo"
  - **Estimat:** 3 timer

- **US-008:** Som bruker vil jeg kunne markere oppgave som fullført
  - **Akseptkriterier:**
    - Toggle checkbox
    - Visuell indikator (gjennomstreking)
    - Tidsstempel når fullført
  - **Estimat:** 1 time

- **US-009:** Som bruker vil jeg kunne redigere oppgave
  - **Estimat:** 2 timer

- **US-010:** Som bruker vil jeg kunne slette oppgave
  - **Akseptkriterier:**
    - Bekreftelse-dialog
  - **Estimat:** 1 time

#### Dashboard
- **US-011:** Som bruker vil jeg se oversikt over aktive prosjekter
  - **Akseptkriterier:**
    - Viser antall aktive oppgaver per prosjekt
    - Viser kommende deadlines
  - **Estimat:** 4 timer

- **US-012:** Som bruker vil jeg se oppgaver med deadline neste 7 dager
  - **Akseptkriterier:**
    - Sortert etter dato (nærmest først)
    - Visuell indikator for overskredet deadline
  - **Estimat:** 2 timer

### **SHOULD HAVE** (Viktig, men ikke MVP-kritisk)

- **US-013:** Som bruker vil jeg kunne søke i oppgaver
  - **Akseptkriterier:**
    - Søk i tittel og beskrivelse
    - Real-time søk (debounced)
  - **Estimat:** 3 timer

- **US-014:** Som bruker vil jeg kunne filtrere oppgaver
  - **Akseptkriterier:**
    - Filtrer på status (todo/in_progress/done)
    - Filtrer på prosjekt
  - **Estimat:** 2 timer

### **COULD HAVE** (Fint å ha)

- **US-015:** Som bruker vil jeg kunne eksportere oppgaver som PDF
  - **Estimat:** 4 timer

### **WON'T HAVE** (Ikke i MVP)

- Team-funksjoner
- Tidsregistrering
- Fakturering
- Mobile app
- Integrasjoner
- Notifikasjoner (push/SMS)

---

**Total estimat MUST HAVE:** ~30 timer utviklingstid
**Total estimat med SHOULD HAVE:** ~35 timer
```

---

### **Leveranse: docs/krav/datamodell.md**

```markdown
# Datamodell for TaskFlow

**Opprettet:** 2026-01-06
**Fase:** 2 - Kravspesifikasjon
**Agent:** KRAV-agent

---

## ER-diagram (tekstformat)

```
users (1) ----< (∞) projects
projects (1) ----< (∞) tasks
```

---

## Tabeller

### **users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Felt:**
- `id`: Primærnøkkel (UUID)
- `email`: Unik email for innlogging
- `password_hash`: Hashet passord (ALDRI plain text)
- `full_name`: Brukerens navn (optional)
- `created_at`: Registreringsdato
- `updated_at`: Sist oppdatert

**Indekser:**
- `email` (UNIQUE)

---

### **projects**
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client_name TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Felt:**
- `id`: Primærnøkkel
- `user_id`: Foreign key til users (eier av prosjektet)
- `name`: Prosjektnavn (required, maks 100 tegn)
- `client_name`: Klientnavn (optional)
- `color`: Hex-farge for visuell identifikasjon
- Timestamps

**Indekser:**
- `user_id` (for rask lookup av brukerens prosjekter)

**Constraints:**
- ON DELETE CASCADE: Sletting av bruker sletter alle prosjekter

---

### **tasks**
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  deadline TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Felt:**
- `id`: Primærnøkkel
- `project_id`: Foreign key til projects
- `user_id`: Foreign key til users (for RLS)
- `title`: Oppgavetittel (required, maks 200 tegn)
- `description`: Detaljert beskrivelse (optional)
- `status`: Enum ('todo', 'in_progress', 'done')
- `deadline`: Når oppgaven skal være ferdig (optional)
- `completed_at`: Tidsstempel når markert som ferdig
- Timestamps

**Indekser:**
- `project_id` (for rask lookup av oppgaver i prosjekt)
- `user_id` (for RLS)
- `status` (for filtrering)
- `deadline` (for sortering)

**Constraints:**
- ON DELETE CASCADE: Sletting av prosjekt sletter alle oppgaver

---

## Row Level Security (RLS) Policies

### **users**
```sql
-- Brukere kan bare se sin egen konto
CREATE POLICY "Users can view own account"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Brukere kan oppdatere sin egen konto
CREATE POLICY "Users can update own account"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

### **projects**
```sql
-- Brukere kan bare se egne prosjekter
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

-- Brukere kan opprette prosjekter
CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Brukere kan oppdatere egne prosjekter
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Brukere kan slette egne prosjekter
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);
```

### **tasks**
```sql
-- Brukere kan bare se egne oppgaver
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

-- Brukere kan opprette oppgaver
CREATE POLICY "Users can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Brukere kan oppdatere egne oppgaver
CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

-- Brukere kan slette egne oppgaver
CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);
```

---

Neste: Sikkerhetskrav
```

---

### **Lærdom fra Fase 2:**

✅ **Hva gikk bra:**
- MoSCoW-prioritering ga krystallklar MVP-scope
- Datamodellen avdekket behov for RLS tidlig
- Estimater hjalp oss forstå hvor lang tid MVP tar

⚠️ **Utfordringer:**
- Fristende å legge til "bare én feature til" i MUST HAVE
- Datamodell tok lengre tid enn forventet (1.5 timer)

💡 **Tips:**
- Lag datamodell FØR wireframes - det hjelper å forstå relasjoner
- Vær brutal på MoSCoW - hvis du er usikker, legg i SHOULD/COULD

---

*[Fortsettelse følger for Fase 3-7 i neste seksjon av filen...]*

---

# Fase 3: Teknisk Design

## 📅 Tidspunkt: Dag 2, Formiddag (4 timer)

### **Prompt brukt:**

```
Aktiver ARKITEKTUR-agent.

Les docs/krav/ og lag komplett teknisk design.

Tech stack preferences:
- Frontend: Next.js 14 (App Router)
- Styling: Tailwind CSS
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth
- Hosting: Vercel
- TypeScript

Inkluder:
1. Tech stack-valg og begrunnelse
2. Database-design (fra datamodell.md)
3. API-design (endpoints)
4. Trusselmodellering (STRIDE)

Kall TRUSSELMODELLERINGS-ekspert for STRIDE-analyse.

Lagre i:
- docs/teknisk-spec.md
- docs/api-design.md
- docs/security/trusselmodell.md
```

---

### **Leveranse: docs/teknisk-spec.md (utdrag)**

```markdown
# Teknisk Spesifikasjon for TaskFlow

**Opprettet:** 2026-01-06
**Fase:** 3 - Teknisk Design
**Agent:** ARKITEKTUR-agent

---

## Tech Stack

| Layer | Teknologi | Versjon | Begrunnelse |
|-------|-----------|---------|-------------|
| **Frontend** | Next.js | 14.x | Server Components, RSC, best DX |
| **Styling** | Tailwind CSS | 3.x | Rapid prototyping, small bundle |
| **Backend** | Next.js API Routes | 14.x | Collocated with frontend |
| **Database** | Supabase (PostgreSQL) | Latest | RLS, real-time, auto-API |
| **Auth** | Supabase Auth | Latest | Battle-tested, social logins |
| **Hosting** | Vercel | Latest | Seamless Next.js integration |
| **Language** | TypeScript | 5.x | Type safety, better DX |

---

## Arkitektur-oversikt

```
┌─────────────────────────────────────────┐
│         VERCEL (Edge Network)           │
└────────────────┬────────────────────────┘
                 │
┌────────────────┴────────────────────────┐
│      NEXT.JS 14 (App Router)            │
│  ┌─────────────────────────────────┐   │
│  │  Server Components (RSC)        │   │
│  │  - app/page.tsx (Dashboard)     │   │
│  │  - app/projects/page.tsx        │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Client Components              │   │
│  │  - TaskList (interactive)       │   │
│  │  - CreateTaskForm               │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  API Routes                     │   │
│  │  - /api/tasks                   │   │
│  │  - /api/projects                │   │
│  └─────────────────────────────────┘   │
└────────────────┬────────────────────────┘
                 │
┌────────────────┴────────────────────────┐
│        SUPABASE                         │
│  ┌─────────────────────────────────┐   │
│  │  PostgreSQL Database            │   │
│  │  - users, projects, tasks       │   │
│  │  - RLS policies                 │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Supabase Auth                  │   │
│  │  - Email/Password               │   │
│  │  - JWT tokens                   │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## Sikkerhetstiltak

1. **Autentisering:**
   - Supabase Auth med JWT
   - Tokens lagres i httpOnly cookies
   - Session varer 7 dager

2. **Autorisasjon:**
   - Row Level Security (RLS) på alle tabeller
   - Brukere ser kun egne data

3. **Input-validering:**
   - Zod for TypeScript validation
   - Validering både frontend og backend

4. **Output-sanitering:**
   - DOMPurify for bruker-generert HTML
   - Escape all user input

5. **HTTPS:**
   - Enforced av Vercel
   - HSTS header

6. **Security Headers:**
   - CSP (Content Security Policy)
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff

---

Neste: API Design
```

---

### **Leveranse: docs/security/trusselmodell.md (utdrag)**

```markdown
# Trusselmodellering (STRIDE) for TaskFlow

**Opprettet:** 2026-01-06
**Fase:** 3 - Teknisk Design
**Agent:** TRUSSELMODELLERINGS-ekspert

---

## STRIDE-analyse

### **S - Spoofing (Identitetstyv)**

| Trussel | Sannsynlighet | Konsekvens | Mitigering |
|---------|---------------|------------|------------|
| Angriper late som en annen bruker | Middels | Høy | Supabase Auth med sikre sessions, httpOnly cookies |
| Phishing-angrep (falsk innloggingsside) | Middels | Høy | HTTPS, brukeopplæring, 2FA (fremtidig) |
| Session hijacking | Lav | Høy | httpOnly cookies, short-lived tokens, HTTPS |

**Konklusjon:** Supabase Auth + httpOnly cookies + HTTPS reduserer risiko til akseptabelt nivå.

---

### **T - Tampering (Manipulering av data)**

| Trussel | Sannsynlighet | Konsekvens | Mitigering |
|---------|---------------|------------|------------|
| Bruker endrer andres oppgaver | Middels | Høy | RLS policies (users can only update own tasks) |
| SQL injection | Lav | Høy | Supabase client saniterer, prepared statements |
| XSS (bruker injiserer script) | Middels | Middels | DOMPurify, CSP headers |

**Konklusjon:** RLS + Input validation + CSP gir solid beskyttelse.

---

### **R - Repudiation (Fornekte handlinger)**

| Trussel | Sannsynlighet | Konsekvens | Mitigering |
|---------|---------------|------------|------------|
| Bruker benekter å ha slettet oppgave | Lav | Lav | Logging av kritiske handlinger (fremtidig) |

**Konklusjon:** Lav prioritet for MVP, legg til audit log i v2.

---

### **I - Information Disclosure (Datalekkasje)**

| Trussel | Sannsynlighet | Konsekvens | Mitigering |
|---------|---------------|------------|------------|
| Bruker ser andres oppgaver | Middels | Høy | RLS policies på alle tabeller |
| API leaker sensitive data | Lav | Middels | Valider output, ikke returner passord/tokens |
| Database backup lekker | Lav | Høy | Supabase krypterer backups, access control |

**Konklusjon:** RLS er kritisk - må testes grundig.

---

### **D - Denial of Service (Tjenestestopp)**

| Trussel | Sannsynlighet | Konsekvens | Mitigering |
|---------|---------------|------------|------------|
| Angriper lager millioner av oppgaver | Middels | Middels | Rate limiting (Vercel Edge), database quotas |
| DDoS-angrep | Lav | Middels | Vercel DDoS protection |

**Konklusjon:** Vercel + Supabase håndterer basis DoS-beskyttelse.

---

### **E - Elevation of Privilege (Utvidede rettigheter)**

| Trussel | Sannsynlighet | Konsekvens | Mitigering |
|---------|---------------|------------|------------|
| Bruker får admin-tilgang | Lav | Høy | Ingen admin-rolle i MVP, alle brukere er like |
| JWT token manipulation | Lav | Høy | Supabase verifiserer tokens server-side |

**Konklusjon:** Ingen admin i MVP reduserer angrepsflate.

---

## Prioriterte tiltak før lansering

1. ✅ **RLS policies på alle tabeller** (kritisk)
2. ✅ **Input validation med Zod** (kritisk)
3. ✅ **CSP headers** (viktig)
4. ✅ **Rate limiting** (viktig)
5. ⚠️ **2FA** (fremtidig, ikke MVP)

---

Neste: Fase 4 - MVP
```

---

### **Lærdom fra Fase 3:**

✅ **Hva gikk bra:**
- STRIDE-analysen avdekket RLS som kritisk tidlig
- Valg av Supabase eliminerte mye sikkerhetskompleksitet
- Arkitektur-diagram gjorde systemet forståelig

⚠️ **Utfordringer:**
- STRIDE tok 2 timer (lengre enn forventet)
- Måtte lære STRIDE-metodikk underveis

💡 **Tips:**
- TRUSSELMODELLERINGS-ekspert er gull - bruk den!
- Tegn arkitektur-diagram selv om det tar tid, det hjelper senere

---

*[Filen fortsetter med Fase 4-7... men viser utdrag her pga lengde]*

---

# Fase 4-7: Sammendrag

## Fase 4: MVP/Prototype (Dag 3-5, 3 dager)

**Nøkkelpunkt:**
- MVP-agent setter opp Next.js + Supabase + Vercel
- Database migrasjoner med RLS policies
- Supabase Auth integrert
- Én kjernefunksjon: Opprett prosjekt + oppgave
- CI/CD pipeline med GitHub Actions
- Deploy til staging

**Tidsbruk:** 16 timer (spredt over 3 dager)

---

## Fase 5: Utvikling & Iterasjon (Uke 2-3, 10 dager)

**Nøkkelpunkt:**
- ITERASJONS-agent koordinerer alle features
- For hver feature:
  1. PLANLEGGER lager PRD
  2. BYGGER implementerer
  3. REVIEWER gjør code review
  4. SIKKERHETS-agent gjør security review
- Totalt 8 features implementert
- 3 runder med brukertest-feedback

**Tidsbruk:** ~40 timer

---

## Fase 6: Testing & Kvalitetssikring (Dag 15-17, 3 dager)

**Nøkkelpunkt:**
- E2E-tester med Playwright
- OWASP-ekspert fant 2 issues (fikset)
- TILGJENGELIGHETS-ekspert → WCAG AA oppnådd
- HEMMELIGHETSSJEKK-ekspert → ingen secrets i kode
- Cross-browser testing

**Tidsbruk:** 12 timer

---

## Fase 7: Publisering (Dag 18, 1 dag)

**Nøkkelpunkt:**
- Produksjonsmiljø på Vercel
- Custom domene (taskflow.app)
- SSL/TLS A+ rating
- Security headers A+ rating
- Sentry for error logging
- PostHog for analytics
- Smoke tests i produksjon

**Tidsbruk:** 6 timer

**Resultat:** 🎉 **TaskFlow er live!**

---

# Lærdom & Refleksjon

## 📊 Totale Stats

| Metric | Verdi |
|--------|-------|
| **Total tid** | 3 uker (del tid) |
| **Faktisk utviklingstid** | ~80 timer |
| **Ant faser** | 7 |
| **Ant agenter brukt** | 12 (av 21) |
| **Ant dokumenter laget** | 23 |
| **Ant bugs funnet i testing** | 8 (alle fikset) |
| **Ant sikkerhetsissues** | 2 (fikset før lansering) |
| **Lighthouse score** | 98/100 |
| **Security headers rating** | A+ |

---

## ✅ Hva fungerte eksepsjonelt bra

### **1. Sikkerhet fra start**
- RLS identifisert i Fase 3 (design), ikke Fase 6 (testing)
- STRIDE avdekket potensielle issues vi ikke hadde tenkt på
- Ingen kritiske sikkerhetshull ved lansering

### **2. Agent-orkestrering**
- ITERASJONS-agent kalte automatisk andre agenter
- Reduserte kognitiv belastning (ikke huske alle steg)
- Ingen glemt steg (testing, dokumentasjon, etc.)

### **3. Dokumentasjon**
- 23 dokumenter = full kontekst til enhver tid
- Kunne starte ny Claude-chat og fortsette umiddelbart
- Dokumentasjon hjalp med onboarding av beta-tester

### **4. MVP-disiplin**
- MoSCoW i Fase 2 forhindret scope creep
- Lanserte på 3 uker (som planlagt)
- Kunne legge til SHOULD HAVE features etter lansering

---

## ⚠️ Utfordringer underveis

### **1. Tidsestimater var optimistiske**
- **Problem:** Estimerte 30 timer MUST HAVE, brukte 50 timer
- **Årsak:** Undervurderte testing og bugfixing
- **Løsning:** Buffer inn 50% ekstra tid i fremtidige prosjekter

### **2. Fristelse til å legge til features**
- **Problem:** Ville legge til "bare én feature til" konstant
- **Løsning:** Holdt fast på MVP-definisjon fra Fase 2
- **Resultat:** Lanserte i tide, features kommer i v1.1

### **3. STRIDE tok lang tid første gang**
- **Problem:** Måtte lære STRIDE-metodikk
- **Tid:** 2 timer (forventet 1 time)
- **Verdi:** Absolutt verdt det - fant reelle trusler

---

## 💡 Tips til andre som bruker Prosess A-Å

### **Før du starter:**
1. **Sett av nok tid til Fase 1-3** (planlegging)
   - Ikke rusk gjennom disse, de sparer uker senere
   - Vårt case: 2 dager planlegging → 3 uker total

2. **Velg enkelt første prosjekt**
   - Ikke start med kompleks multi-tenant SaaS
   - Start med noe som TaskFlow (CRUD + auth)

3. **Bruk alle agenter, selv de som virker overflødige**
   - Vi skeptisk til TRUSSELMODELLERINGS-ekspert, brukte den, fant 3 trusler
   - Alle agenter er der av en grunn

### **Under utvikling:**
4. **Hold fast på MVP-scope**
   - Legg til en "Backlog for v1.1"-fil
   - Skriv ned alle "ville hatt"-features der, implementer ETTER lansering

5. **Dokumenter alt**
   - Virker overveldende, men betalte seg 10x
   - Kunne onboarde beta-tester med docs/

6. **Test tidlig og ofte**
   - Ikke vent til Fase 6 for første test
   - Vi testet hver feature umiddelbart etter bygging

### **Testing & lansering:**
7. **Ikke skippe sikkerhetstesting**
   - OWASP-ekspert fant 2 reelle issues
   - Hadde disse vært i prod = databrudd

8. **Start med staging-miljø**
   - Test i produksjonslignende miljø før faktisk prod
   - Fant 3 miljø-spesifikke bugs i staging

---

## 🎯 Neste steg for TaskFlow

### **v1.1 (neste 2 uker):**
- Søk og filtrering (SHOULD HAVE fra Fase 2)
- Email-notifikasjoner (1 dag før deadline)
- Mørk modus

### **v1.2 (neste måned):**
- Gjentakende oppgaver
- Tags for oppgaver
- Eksport til PDF

### **v2.0 (neste 3 måneder):**
- Team-funksjoner (hvis brukere ber om det)
- Mobile app (React Native)
- Integrasjoner (Google Calendar, etc.)

---

## 🙏 Takk til Prosess A-Å

**Uten dette systemet:**
- Ville hoppet rett til koding (Fase 4)
- Glemt sikkerhet til sist
- Ikke hatt dokumentasjon
- Scope creep → aldri lansert

**Med Prosess A-Å:**
- Strukturert progresjon
- Sikkerhet innbakt fra start
- Komplett dokumentasjon
- Lanserte i tide

**Anbefaling:** ⭐⭐⭐⭐⭐ (5/5)

Dette er ikke bare en prosess, det er en **mindset-shift** for hvordan man bygger software med AI.

---

**Sist oppdatert:** 2026-01-06
**Versjon:** 1.0
**Av:** Demo-bruker (for instruksjonsformål)
