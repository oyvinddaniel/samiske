# Neste steg: samiske.no

## Sist oppdatert: 2025-12-11

---

## Umiddelbare oppgaver

### 1. Sett opp Supabase
- [ ] Opprett Supabase-prosjekt på supabase.com
- [ ] Hent API-nøkler (SUPABASE_URL og SUPABASE_ANON_KEY)
- [ ] Installer @supabase/supabase-js
- [ ] Opprett /src/lib/supabase.ts med klientkonfigurasjon
- [ ] Legg til miljøvariabler i .env.local

### 2. Design databaseskjema
- [ ] Opprett tabell: users (profiler)
- [ ] Opprett tabell: posts (innlegg)
- [ ] Opprett tabell: categories (kategorier)
- [ ] Opprett tabell: comments (kommentarer)
- [ ] Opprett tabell: likes
- [ ] Sett opp Row Level Security (RLS)

### 3. Implementer autentisering
- [ ] Registreringsside
- [ ] Innloggingsside
- [ ] Utloggingsfunksjon
- [ ] Beskyttet ruting

### 4. Bygg hovedfeed
- [ ] Feed-komponent med innleggsliste
- [ ] Innleggskort-komponent
- [ ] Kategorifilter
- [ ] Responsivt design

---

## Forutsetninger
Før du starter, sørg for at:
1. Du har en Supabase-konto
2. Du har lest /docs/PRD.md for full kontekst
3. Du har lest /docs/PROGRESS.md for nåværende status

---

## Tips
- Start utviklingsserver med `npm run dev`
- Bruk eksisterende Shadcn/ui-komponenter i /src/components/ui/
- Følg designprinsippene i CLAUDE.md
