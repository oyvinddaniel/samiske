# Problemlogg: samiske.no

## Sist oppdatert: 2025-12-12

---

## Aktive problemer
Ingen aktive problemer for øyeblikket.

---

## Løste problemer

### [2025-12-12] Vercel miljøvariabler med linjeskift
**Problem:** Registrering feilet med "Failed to execute 'fetch' on 'Window': Invalid value"
**Årsak:** NEXT_PUBLIC_SUPABASE_ANON_KEY ble limt inn med linjeskift i Vercel
**Løsning:** Slettet variabelen og la den inn på nytt som én sammenhengende linje
**Forebygging:** Sjekk alltid at lange nøkler limes inn uten linjeskift

### [2025-12-12] Card spacing i RightSidebar
**Problem:** For mye avstand mellom CardHeader og CardContent (~60px i stedet for ønsket minimal)
**Årsak:** Shadcn/ui Card-komponent har default `gap-6` mellom flex-children
**Løsning:** La til `className="gap-0"` på Card-komponentene
**Forebygging:** Sjekk UI-komponenters default styling ved layout-problemer

---

## Kjente begrensninger
- SMS-varsling er ikke implementert (fremtidig funksjon)
- E-postvarsling er ikke implementert (fremtidig funksjon)
- Søkefunksjon tas i senere versjon
- Kalendervisning tas i senere versjon
- Sletting av egne innlegg ikke implementert ennå

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

### Vercel deploy feiler
- Sjekk at miljøvariabler er riktig satt (ingen linjeskift!)
- Kjør `npm run build` lokalt for å finne feil
- Se deploy-logg i Vercel dashboard

### Endringer vises ikke på produksjon
- Sjekk at du har pushet til GitHub
- Vent 1-2 minutter på Vercel deploy
- Sjekk Vercel dashboard for deploy-status
- Hard refresh i nettleser (Cmd+Shift+R / Ctrl+Shift+R)
