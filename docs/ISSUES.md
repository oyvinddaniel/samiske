# Problemlogg: samiske.no

## Sist oppdatert: 2025-12-12

---

## Aktive problemer

Ingen kjente aktive problemer.

---

## Løste problemer

### [2025-12-12] Manglende profiler for brukere

**Problem:** Statistikk i admin viste 8 brukere, men auth.users hadde 23.

**Årsak:** 15 brukere manglet profil i profiles-tabellen. Triggeren `on_auth_user_created` hadde ikke kjørt for disse.

**Løsning:**
```sql
INSERT INTO public.profiles (id, email, full_name)
SELECT u.id, u.email, u.raw_user_meta_data->>'full_name'
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
```

### [2025-12-12] Auth-tilstand ikke synkronisert mellom komponenter

**Problem:** Utlogging oppdaterte knapper i Header, men resten av siden viste fortsatt innlogget tilstand.

**Løsning:**
- Byttet fra `router.push()` + `router.refresh()` til `window.location.href = '/'`
- Hard page reload sikrer at all klient-side state nullstilles

### [2025-12-12] Supabase-klient ustabil referanse

**Problem:** Auth-tilstand var inkonsistent mellom renders.

**Løsning:**
- Bruker `useMemo(() => createClient(), [])` for stabil referanse
- Bruker `getSession()` først (cached), deretter `getUser()` som fallback

### [2025-12-12] Vercel miljøvariabler med linjeskift

**Problem:** Registrering feilet med "Failed to execute 'fetch' on 'Window': Invalid value"

**Årsak:** NEXT_PUBLIC_SUPABASE_ANON_KEY ble limt inn med linjeskift i Vercel

**Løsning:** Slettet variabelen og la den inn på nytt som én sammenhengende linje

---

## Kjente begrensninger

- SMS-varsling er ikke implementert (fremtidig funksjon)
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

### E-post sendes ikke
- Sjekk at SMTP-variabler er satt i Supabase Edge Functions Secrets
- Test Edge Function manuelt via Supabase Dashboard
- Sjekk email_queue tabellen for feilede e-poster:
  ```sql
  SELECT * FROM email_queue WHERE status = 'failed';
  ```
