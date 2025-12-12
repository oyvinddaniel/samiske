# Problemlogg: samiske.no

## Sist oppdatert: 2025-12-12

---

## Aktive problemer

### [2025-12-12] MobileNav viser ikke sosial-seksjon (UNDER FEILSOKING)

**Problem:**
Sosial-seksjonen (Venner/Meldinger) vises i Sidebar på desktop, men IKKE i MobileNav på mobil, selv for innloggede brukere.

**Symptomer:**
- Desktop Sidebar: Viser "Venner" og "Meldinger" korrekt for innloggede brukere
- MobileNav: Viser IKKE "Venner" og "Meldinger" selv når brukeren er innlogget
- Debug-boks som ble lagt til i MobileNav vises heller ikke

**Hva som er testet:**
1. Supabase auth fungerer - `getSession()` og `getUser()` returnerer riktig bruker-ID
2. Sidebar-komponenten viser sosial-seksjon korrekt
3. MobileNav-komponenten har identisk auth-logikk som Sidebar
4. Hard refresh i nettleser gjort
5. Testet i helt ny nettleser (inkognito/annen browser)

**Mulige årsaker:**
1. React createPortal rendrer ikke innholdet riktig
2. CSS-problemer (komponenten er skjult)
3. Hot reload/caching-problemer - gammel kode kjøres
4. MobileNav sin state oppdateres ikke

**Filer involvert:**
- `/src/components/layout/MobileNav.tsx` - Har sosial-seksjon som skal vises
- `/src/components/layout/Sidebar.tsx` - Fungerer korrekt (referanse)

**Debug-kode som er lagt til:**
I MobileNav.tsx linje 321-324:
```tsx
{/* Debug - always show */}
<div className="p-2 bg-red-100 text-xs border-b">
  Debug: userId={currentUserId || 'NULL'}
</div>
```

**Neste feilsøkingssteg:**
1. Sjekk at MobileNav faktisk rendres (ikke Sidebar på mobil)
2. Sjekk om createPortal fungerer riktig
3. Prøv å fjerne createPortal og render direkte
4. Sjekk dev server output for feil

---

## Løste problemer

### [2025-12-12] Auth-tilstand ikke synkronisert mellom komponenter

**Problem:** Utlogging oppdaterte knapper i Header, men resten av siden viste fortsatt innlogget tilstand.

**Løsning:**
- Byttet fra `router.push()` + `router.refresh()` til `window.location.href = '/'`
- Hard page reload sikrer at all klient-side state nullstilles

**Filer endret:**
- `/src/components/layout/Header.tsx` - handleLogout()
- `/src/app/(auth)/login/page.tsx` - etter vellykket login

### [2025-12-12] Supabase-klient ustabil referanse

**Problem:** Auth-tilstand var inkonsistent mellom renders.

**Løsning:**
- Bruker `useMemo(() => createClient(), [])` for stabil referanse
- Bruker `getSession()` først (cached), deretter `getUser()` som fallback

**Filer endret:**
- `/src/components/layout/MobileNav.tsx`
- `/src/components/layout/Sidebar.tsx`
- `/src/components/layout/Header.tsx`
- `/src/components/layout/BottomNav.tsx`
- `/src/components/profile/ProfileOverlay.tsx`

### [2025-12-12] Vercel miljøvariabler med linjeskift

**Problem:** Registrering feilet med "Failed to execute 'fetch' on 'Window': Invalid value"

**Årsak:** NEXT_PUBLIC_SUPABASE_ANON_KEY ble limt inn med linjeskift i Vercel

**Løsning:** Slettet variabelen og la den inn på nytt som én sammenhengende linje

### [2025-12-12] Card spacing i RightSidebar

**Problem:** For mye avstand mellom CardHeader og CardContent

**Løsning:** La til `className="gap-0"` på Card-komponentene

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
cd /path/to/samiske
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

### Endringer vises ikke i dev
- Sjekk at dev-serveren kjører (`npm run dev`)
- Sjekk terminal for kompileringsfeil
- Restart dev-server ved behov
- Slett `.next` mappen og start på nytt
