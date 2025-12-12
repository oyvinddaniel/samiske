# Beslutningslogg: samiske.no

## Sist oppdatert: 2025-12-12

---

## Beslutninger tatt

### 1. Tech Stack (2025-12-11)
**Beslutning:** Next.js + Supabase + Vercel
**Begrunnelse:**
- Next.js: Best integrasjon med Vercel, stort økosystem
- Supabase: Alt-i-ett løsning for database og auth, sikker, gratis tier
- Vercel: Enkel hosting, automatisk deploy

### 2. UI-bibliotek (2025-12-11)
**Beslutning:** Tailwind CSS + Shadcn/ui
**Begrunnelse:**
- Moderne, minimalistisk design
- Lett å tilpasse med samiske farger
- God støtte for responsivt design

### 3. Innleggsstruktur (2025-12-11)
**Beslutning:** Forenklet modell med to typer innlegg
**Begrunnelse:**
- Standard innlegg: Bilde, tittel, tekst, dato (valgfritt), kategori
- Arrangement: Ekstra felter for dato, klokkeslett, sted
- Holder det enkelt og intuitivt

### 4. Synlighet (2025-12-11)
**Beslutning:** Todelt synlighet per innlegg
**Begrunnelse:**
- Offentlige innlegg: Synlig for alle
- Medlemsinnlegg: Kun for innloggede
- Kommentering/liking krever innlogging

### 5. Brukerregistrering (2025-12-11)
**Beslutning:** Åpen registrering først, godkjenning senere
**Begrunnelse:**
- Start enkelt
- Legg til godkjenningskrav når/hvis nødvendig

### 6. Språk (2025-12-11)
**Beslutning:** Kun norsk grensesnitt
**Begrunnelse:**
- Enklere å vedlikeholde
- Målgruppen er norsktalende

### 7. Fargepalett (2025-12-11)
**Beslutning:** Samiske flaggfarger som aksentfarger
**Begrunnelse:**
- Rød, blå, grønn, gul fra det samiske flagget
- Gir kulturell identitet
- Moderne minimalistisk base med fargerike aksenter

### 8. Ikoner (2025-12-12)
**Beslutning:** Lucide React i stedet for emojis
**Begrunnelse:**
- Profesjonelt utseende
- Konsistent stil gjennom appen
- Bedre tilgjengelighet

### 9. Innleggsvisning (2025-12-12)
**Beslutning:** Popup/dialog i stedet for egen side
**Begrunnelse:**
- Raskere navigasjon
- Brukeren forblir i feeden
- Bedre brukeropplevelse

### 10. Redigering (2025-12-12)
**Beslutning:** In-place redigering i popup
**Begrunnelse:**
- Enklere enn egen redigeringsside
- Umiddelbar tilbakemelding
- Kun synlig for innleggets eier

### 11. Varslingssystem (2025-12-12)
**Beslutning:** Timestamp-basert varsling (last_seen_at)
**Begrunnelse:**
- Enklere enn full notifikasjons-tabell
- Viser alt nytt siden sist besøk
- Teller nye innlegg, kommentarer og likes

### 12. Hosting/Domene (2025-12-12)
**Beslutning:** Vercel med samiske.no
**Begrunnelse:**
- Automatisk deploy fra GitHub
- Gratis SSL
- God ytelse globalt

### 13. Vennefunksjon (2025-12-12)
**Beslutning:** Enkel vennefunksjon med forespørsler
**Begrunnelse:**
- Kan sende venneforespørsler
- Kan godta/avslå forespørsler
- Venner kan sende direktemeldinger til hverandre
- Gir sosial funksjonalitet uten å bli for komplisert

### 14. Meldingssystem (2025-12-12)
**Beslutning:** Enkel en-til-en chat mellom venner
**Begrunnelse:**
- Kun direktemeldinger mellom godkjente venner
- Sanntidsoppdatering med Supabase Realtime
- Holder det enkelt - ingen gruppechat eller avanserte funksjoner ennå

### 15. Sosial-meny plassering (2025-12-12)
**Beslutning:** Flytende bobler i høyre hjørne
**Begrunnelse:**
- Alltid tilgjengelig uansett hvor på siden du er
- Åpner panel som overlay
- Fungerer på både mobil og desktop

### 16. Auth-håndtering i klient-komponenter (2025-12-12)
**Beslutning:** useMemo for Supabase-klient + getSession() først
**Begrunnelse:**
- `useMemo(() => createClient(), [])` gir stabil referanse
- `getSession()` bruker cached session og er raskere
- `getUser()` som fallback hvis session ikke finnes
- Mer pålitelig auth-tilstand på tvers av komponenter

### 17. Slett konto-funksjon (2025-12-12)
**Beslutning:** Brukere kan slette egen konto med bekreftelse
**Begrunnelse:**
- GDPR-krav om rett til sletting
- Service Role Key brukes på server-side for å slette fra auth.users
- CASCADE-delete fjerner automatisk all tilknyttet data
- AlertDialog for bekreftelse før permanent sletting

### 18. Feedback-system (2025-12-12)
**Beslutning:** Lilla chatboble i venstre hjørne
**Begrunnelse:**
- Enkel måte for brukere å gi tilbakemelding
- Auto-åpner etter 10 sekunder for å oppfordre til deltakelse
- Kun synlig for innloggede brukere
- Admin kan se og slette tilbakemeldinger i admin-panel

### 19. E-postvarsling for admin (2025-12-12)
**Beslutning:** E-post til admin ved nye brukerregistreringer
**Begrunnelse:**
- Holder admin informert om nye brukere
- Bruker eksisterende SMTP-oppsett (cPanel)
- Database-trigger legger e-post i kø
- Cron-jobb sender hvert 5. minutt

---

## Fremtidige beslutninger å ta
- SMS-tjenesteleverandør (Twilio, MessageBird, etc.)
- Utvidet e-postvarsling (digest, varsler til brukere)
- PWA-konfigurasjon og offline-støtte
