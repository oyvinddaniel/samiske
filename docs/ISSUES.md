# Problemlogg: samiske.no

## Sist oppdatert: 2025-12-11

---

## Aktive problemer
Ingen aktive problemer for øyeblikket.

---

## Løste problemer

### Eksempel på format:
```
### [Dato] Kort beskrivelse
**Problem:** Hva som gikk galt
**Årsak:** Hvorfor det skjedde
**Løsning:** Hvordan det ble fikset
**Forebygging:** Hvordan unngå det i fremtiden
```

---

## Kjente begrensninger
- SMS-varsling er ikke implementert (planlagt for Fase 6)
- Søkefunksjon tas i senere versjon
- Kalendervisning tas i senere versjon

---

## Feilsøkingstips

### Utviklingsserver starter ikke
```bash
# Sjekk at du er i riktig mappe
cd /path/to/samiske

# Slett node_modules og installer på nytt
rm -rf node_modules
npm install
npm run dev
```

### Supabase-tilkobling feiler
- Sjekk at .env.local har riktige verdier
- Sjekk at Supabase-prosjektet kjører
- Sjekk nettverkstilgang

### Styling vises ikke riktig
- Sjekk at Tailwind er konfigurert
- Tøm nettleser-cache
- Restart utviklingsserver
