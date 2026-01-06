# PRD: [Feature-navn]

> **Status:** Draft / Under utvikling / Fullført  
> **Opprettet:** [DATO]  
> **Sist oppdatert:** [DATO]

---

## Oversikt

**Hva:** [Kort beskrivelse av featuren]

**Hvorfor:** [Problemet dette løser]

**For hvem:** [Målgruppe/brukertype]

---

## Brukerhistorier

- Som [brukertype] vil jeg [handling] slik at [utbytte]
- Som [brukertype] vil jeg [handling] slik at [utbytte]
- Som [brukertype] vil jeg [handling] slik at [utbytte]

---

## Krav

### Må ha 🔴
- [ ] [Krav 1]
- [ ] [Krav 2]
- [ ] [Krav 3]

### Bør ha 🟠
- [ ] [Krav]

### Kan ha 🟢
- [ ] [Krav]

---

## Design/UX

### Brukerflyt
1. Bruker [handling]
2. System [respons]
3. Bruker [neste handling]
4. ...

### Mockups
[Lenk til Figma/bilder eller beskriv UI]

### UI-komponenter
- [ ] [Komponent 1]
- [ ] [Komponent 2]

---

## Teknisk tilnærming

### Involverte filer
```
src/
├── components/[feature]/
│   ├── [Komponent1].tsx
│   └── [Komponent2].tsx
├── lib/[feature]/
│   └── [service].ts
└── app/[route]/
    └── page.tsx
```

### Database-endringer

**Nye tabeller:**
```sql
CREATE TABLE [tabellnavn] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- kolonner
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Endringer i eksisterende tabeller:**
```sql
ALTER TABLE [tabell] ADD COLUMN [kolonne] [type];
```

**RLS Policies:**
```sql
CREATE POLICY "[policy_name]" ON [tabell]
FOR [SELECT/INSERT/UPDATE/DELETE]
USING ([betingelse]);
```

### API-endringer

**Nye endpoints:**
| Metode | Sti | Beskrivelse |
|--------|-----|-------------|
| GET | `/api/[feature]` | [Beskrivelse] |
| POST | `/api/[feature]` | [Beskrivelse] |

### Avhengigheter
- [ ] [Ekstern pakke/tjeneste]
- [ ] [Eksisterende komponent]

---

## Implementasjonsplan

### Fase 1: [Navn] (Est. X timer)
- [ ] Oppgave 1
- [ ] Oppgave 2
- [ ] Oppgave 3

### Fase 2: [Navn] (Est. X timer)
- [ ] Oppgave 1
- [ ] Oppgave 2

### Fase 3: Testing (Est. X timer)
- [ ] Unit tests
- [ ] Manuell testing
- [ ] Edge cases

---

## Akseptansekriterier

- [ ] [Kriterium 1 - Spesifikt og testbart]
- [ ] [Kriterium 2 - Spesifikt og testbart]
- [ ] [Kriterium 3 - Spesifikt og testbart]

---

## Risikoer og avhengigheter

| Risiko | Sannsynlighet | Konsekvens | Mitigering |
|--------|---------------|-----------|------------|
| [Risiko 1] | Lav/Medium/Høy | Lav/Medium/Høy | [Tiltak] |
| [Risiko 2] | | | |

**Avhengigheter:**
- [Hva må være ferdig først]
- [Eksterne faktorer]

---

## Utenfor scope

- [Ting vi eksplisitt IKKE gjør i denne featuren]
- [Fremtidige utvidelser]

---

## Referanser

- [Lenk til relatert dokumentasjon]
- [Inspirasjon/research]

---

**Godkjent av:** [Navn]  
**Godkjent dato:** [DATO]
