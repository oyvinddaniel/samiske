# DECISIONS.md - Arkitekturbeslutninger

> Viktige valg og hvorfor de ble tatt  
> Sist oppdatert: 2025-12-26

---

## Format

Hver beslutning dokumenteres med:
- **Dato:** Når beslutningen ble tatt
- **Kontekst:** Situasjonen som krevde en beslutning
- **Beslutning:** Hva vi valgte
- **Rationale:** Hvorfor vi valgte dette
- **Konsekvenser:** Hva dette betyr for prosjektet
- **Status:** Aktiv / Erstattet / Deprecated

---

## ADR-001: Tech Stack

**Dato:** 2025 (prosjektstart)

**Kontekst:** Valg av teknologier for samisk community-plattform

**Beslutning:**
- Frontend: Next.js 15 (App Router)
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth
- Hosting: Vercel
- Video: Bunny.net Stream

**Rationale:**
- Next.js 15 gir beste DX og SSR/SSG fleksibilitet
- Supabase gir rask utvikling med innebygd auth, realtime, storage
- Vercel har sømløs Next.js-integrasjon
- Bunny.net er kostnadseffektiv for video

**Konsekvenser:**
- Lock-in til Supabase økosystem
- Avhengig av Vercel for deploy
- Må håndtere Supabase-spesifikke mønstre

**Status:** ✅ Aktiv

---

## ADR-002: Auto-confirm brukere

**Dato:** 2025

**Kontekst:** Skal vi kreve e-postbekreftelse ved registrering?

**Beslutning:** Nei, auto-confirm er aktivert

**Rationale:**
- Lavere friksjon for nye brukere
- Samisk community er relativt lite - spam er ikke et stort problem
- Kan aktiveres senere hvis nødvendig

**Konsekvenser:**
- Potensielt spam-risiko (akseptert)
- Ingen verifisering av e-postadresser
- Må implementere alternative spam-tiltak ved behov

**Status:** ✅ Aktiv (med dokumentert risiko)

---

## ADR-003: Kun norsk UI

**Dato:** 2025

**Kontekst:** Hvilket språk skal UI være på?

**Beslutning:** Kun norsk i UI. Engelsk i kode.

**Rationale:**
- Målgruppen er primært norsktalende samer
- Forenkler utviklingen (ingen i18n)
- Samisk kan legges til senere som eget prosjekt

**Konsekvenser:**
- Ekskluderer ikke-norsktalende
- Enklere kodebase
- Fremtidig i18n vil kreve refaktorering

**Status:** ✅ Aktiv

---

## ADR-004: RLS på alle tabeller

**Dato:** 2025

**Kontekst:** Hvordan sikre databasetilgang?

**Beslutning:** Row Level Security (RLS) aktivert på ALLE tabeller

**Rationale:**
- Defense in depth - selv om frontend har bugs, er data sikret
- Supabase anbefaler dette sterkt
- Enklere å resonnere om tilgangskontroll

**Konsekvenser:**
- Alle queries må gå gjennom RLS
- Må være forsiktig med policy-design
- Noe overhead på queries

**Status:** ✅ Aktiv

---

## ADR-005: SPA-navigasjon med pathname

**Dato:** 16. desember 2025

**Kontekst:** Hvordan implementere SPA-opplevelse?

**Beslutning:** Pathname-basert navigasjon, ikke query params

**Før:**
```
/?panel=community-page&slug=samisk-kultur&tab=produkter
```

**Etter:**
```
/samfunn/samisk-kultur?tab=produkter
```

**Rationale:**
- Bedre SEO (søkemotorer forstår pathname bedre)
- Mer standard URL-struktur
- Bedre for deling på sosiale medier
- Beholder page.tsx for initial SSR

**Konsekvenser:**
- Mer kompleks routing-logikk
- Må vedlikeholde både page.tsx og SPA-panels
- URL-er er deling-vennlige

**Status:** ✅ Aktiv (Fase 1/6 fullført)

---

## ADR-006: Sentralisert Media Service

**Dato:** 18-19. desember 2025

**Kontekst:** Fragmentert bildehåndtering på tvers av komponenter

**Beslutning:** Én sentralisert MediaService for alle bilder

**Rationale:**
- Konsistent håndtering (komprimering, validering)
- GDPR-compliance (audit logging, soft delete)
- Enklere vedlikehold
- Bedre kontroll over storage-bruk

**Konsekvenser:**
- Må migrere alle eksisterende komponenter
- Ny `media` tabell med 11 entity types
- Copyright-sporing for alle bilder

**Status:** ✅ Aktiv (7/11 komponenter migrert)

---

## ADR-007: Geografisk hierarki

**Dato:** 13. desember 2025

**Kontekst:** Hvordan strukturere samisk geografi?

**Beslutning:** 5-nivå hierarki:
1. Region (Sápmi)
2. Land (Norge, Sverige, Finland, Russland)
3. Språkområder (7 stk)
4. Kommuner
5. Steder

**Rationale:**
- Reflekterer faktisk samisk geografisk struktur
- Tillater innhold å "boble opp" til høyere nivåer
- Brukere kan stjernemerke favoritter på alle nivåer

**Konsekvenser:**
- Kompleks database-struktur
- Må håndtere dyp nesting i UI
- Content aggregation på tvers av nivåer

**Status:** ✅ Aktiv

---

## ADR-008: Migrasjoner via Dashboard

**Dato:** 2025

**Kontekst:** Hvordan kjøre database-migrasjoner?

**Beslutning:** Via Supabase Dashboard SQL Editor, IKKE CLI

**Rationale:**
- Mer kontroll over hva som kjøres
- Unngår problemer med CLI-konfigurasjon
- Enklere for ikke-kodere å følge med

**Konsekvenser:**
- Manuell prosess
- Må kopiere SQL inn i dashboard
- Ingen automatisk migrering ved deploy

**Status:** ✅ Aktiv

---

## ADR-009: Lucide icons, ingen emojis

**Dato:** 2025

**Kontekst:** Hvilke ikoner skal brukes i UI?

**Beslutning:** Lucide icons overalt, ingen emojis i UI

**Rationale:**
- Konsistent visuelt språk
- Skalerbare SVG-ikoner
- Profesjonelt utseende
- Emojis renderes ulikt på ulike OS

**Konsekvenser:**
- Må importere ikoner fra lucide-react
- Litt større bundle
- Konsistent på tvers av plattformer

**Status:** ✅ Aktiv

---

## ADR-010: shadcn/ui komponentbibliotek

**Dato:** 2025

**Kontekst:** Hvilke UI-komponenter skal brukes?

**Beslutning:** shadcn/ui med Tailwind

**Rationale:**
- Copy-paste komponenter (ikke npm dependency)
- Full kontroll over styling
- Bygget på Radix UI (tilgjengelighet)
- Tailwind-native

**Konsekvenser:**
- Komponenter ligger i `src/components/ui/`
- Må ikke redigere disse direkte (oppdatering)
- Konsistent design system

**Status:** ✅ Aktiv

---

## Fremtidige beslutninger å ta

| Tema | Kontekst | Tentativ dato |
|------|----------|---------------|
| PWA | Skal vi legge til offline-støtte? | Q1 2026 |
| i18n | Skal vi støtte samisk/engelsk? | Q2 2026 |
| Gruppechat | 1-1 vs. mange-til-mange meldinger | Q1 2026 |

---

**Sist oppdatert:** 2025-12-26  
**Oppdatert av:** Claude (migrering)
