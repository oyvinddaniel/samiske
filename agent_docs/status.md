# Prosjektstatus - samiske.no

> Sist oppdatert: 2025-12-13

## Nåværende status

**LIVE på samiske.no** med ekte brukere

### Scores
- **Sikkerhet:** 8/10
- **Kodekvalitet:** 7/10

---

## Fullførte funksjoner

### Kjernefunksjonalitet
- [x] Hovedfeed med kronologisk visning
- [x] Innlegg (standard og arrangement)
- [x] Bildeopplasting med komprimering
- [x] Kategorifiltrering
- [x] Offentlig/privat synlighet
- [x] Popup-visning av innlegg
- [x] Redigering av egne innlegg
- [x] Sletting av egne innlegg

### Brukerinteraksjon
- [x] Kommentarer med sanntidsoppdatering
- [x] Like på innlegg og kommentarer
- [x] Dele innlegg (Web Share API)
- [x] Bokmerke innlegg
- [x] Søkefunksjon (Cmd+K)

### Sosiale funksjoner
- [x] Vennefunksjon med forespørsler
- [x] Direktemeldinger mellom venner
- [x] Brukerprofiler

### System
- [x] Varslingssystem (bjelle-ikon)
- [x] E-postvarsling til admin
- [x] Feedback-system
- [x] Admin-panel med moderering
- [x] Onboarding for nye brukere
- [x] Mine steder (lokasjoner)

### Sikkerhet (løst)
- [x] RLS policies på alle tabeller
- [x] Service Role Key rotert
- [x] Passordbekreftelse på kontosletting
- [x] Input-validering med lengdegrenser
- [x] N+1 query fikset

---

## Gjenstående oppgaver

### Lav prioritet
- [ ] E-postbekreftelse (når spam blir problem)
- [ ] Rate limiting på API-ruter
- [ ] Tilgjengelighet (aria-labels, keyboard nav)
- [ ] Rapportere upassende innhold
- [ ] PWA offline-støtte

---

## Kjente begrensninger

1. Auto-confirm brukere (dokumentert risiko)
2. Ingen kalendervisning ennå
3. Ingen gruppechat

---

## Viktige beslutninger

Se `docs/DECISIONS.md` for full logg. Nøkkelbeslutninger:

1. **Tech stack:** Next.js + Supabase + Vercel
2. **Autentisering:** Supabase Auth med auto-confirm
3. **RLS:** Alle tabeller har policies
4. **UI-språk:** Kun norsk
5. **Farger:** Samiske flaggfarger som aksenter
