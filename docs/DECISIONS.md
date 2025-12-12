# Beslutningslogg: samiske.no

## Sist oppdatert: 2025-12-11

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

---

## Fremtidige beslutninger å ta
- SMS-tjenesteleverandør (Twilio, MessageBird, etc.)
- Bildehåndtering (Supabase Storage vs Cloudinary)
- PWA-konfigurasjon
