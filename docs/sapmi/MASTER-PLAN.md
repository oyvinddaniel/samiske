# Sapmi-plattformen: Master Plan

> **Sist oppdatert:** 2025-12-13
> **Sikkerhetskopi:** `v1.0-pre-sapmi-transform` (tag i git)

---

## Prosjektoversikt

Transformere samiske.no fra en enkel community-tavle til en fullverdig sosial plattform for hele Sapmi.

### Designprinsipper
- Ingen emojis - Bruk kun Lucide React-ikoner
- Norsk UI - All brukersynlig tekst på norsk
- Engelsk kode - Variabelnavn og funksjoner på engelsk

### Mål-tilstand
- Geografisk hierarki: Sapmi > Land > Sprakområder > Kommuner > Steder
- Innhold bobler oppover i geografien
- 3 gruppetyper (åpen/lukket/skjult)
- Samfunn/bedriftssider med følgere og produkter
- Vennesirkler for synlighetsstyring
- Tilpassbare feed-filtre
- Arrangementer med RSVP
- Universelt søk

---

## Faser

| Fase | Navn | Status | Avhengigheter |
|------|------|--------|---------------|
| 1 | Geografi-grunnmur (Database) | FULLFORT | Ingen |
| 2 | Geografi i UI | FULLFORT | Fase 1 |
| 3 | Innleggsbobling | FULLFORT | Fase 1, 2 |
| 4 | Grupper | FULLFORT | Fase 1, 3 |
| 5 | Samfunn/Organisasjoner | FULLFORT | Fase 1 |
| 6 | Vennesirkler og synlighet | FULLFORT | Fase 4, 5 |
| 7 | Feed-redesign | FULLFORT | Fase 3, 4, 5, 6 |
| 8 | Arrangementer med RSVP | FULLFORT | Fase 1, 3 |
| 9 | Universelt søk | PENDING | Alle |

---

## Avhengighetsmatrise

```
Fase 1 ──> Fase 2 ──> Fase 3 ──> Fase 7 ──> Fase 9
   │                     │
   ├──> Fase 4 ──────────┤
   │         │           │
   ├──> Fase 5 ──> Fase 6
   │
   └──> Fase 8
```

---

## Migreringsbeslutninger

- **Geografisk data:** Manuell liste i seed-data
- **Eksisterende innlegg:** Migrer til Trondheim
- **Eksisterende brukere:** Behold alle

---

## Fil-struktur (ny)

```
src/app/
  sapmi/[...geografiske-sider]
  grupper/
  samfunn/
  arrangementer/

src/components/
  geography/    # Geografiske komponenter
  groups/       # Gruppekomponenter
  communities/  # Samfunnskomponenter
  circles/      # Vennesirkler
  events/       # RSVP-komponenter

src/lib/
  geography.ts
  groups.ts
  communities.ts
  circles.ts
  bubbling.ts
```

---

## Kritiske filer å modifisere

1. `supabase/schema.sql` - Utvides med nye tabeller
2. `src/components/feed/Feed.tsx` - Bobling og filtre
3. `src/components/layout/Sidebar.tsx` - Geografisk navigasjon
4. `src/components/posts/PostCard.tsx` - Geografisk info, RSVP
5. `src/components/search/SearchModal.tsx` - Universelt søk

---

## Rollback

Ved kritiske feil, gå tilbake til stabil versjon:
```bash
git checkout v1.0-pre-sapmi-transform
```
