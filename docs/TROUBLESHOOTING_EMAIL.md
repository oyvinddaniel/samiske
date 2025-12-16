# Feilsøking: Bekreftelseseposter kommer ikke fram

## Problem
Brukere får ikke bekreftelseseposter når de registrerer seg på samiske.no.

## Koden er OK ✅
Registreringskoden i `src/app/(auth)/register/page.tsx` og `src/components/landing/InlineRegistrationForm.tsx` er korrekt implementert.

## Mest sannsynlige årsaker

### 1. Rate Limiting (Svært sannsynlig) ⚠️
Supabase sin standard e-postleverandør har strenge grenser:
- **3-4 e-poster per time per prosjekt**
- Hvis brukeren har forsøkt flere ganger, er grensen nådd
- **Løsning:** Vent 1 time og prøv igjen

### 2. E-postbekreftelse deaktivert
**Sjekk i Supabase Dashboard:**
1. Gå til **Authentication** → **Providers** → **Email**
2. Sjekk at **"Confirm email"** er aktivert (skal være ON)
3. Hvis deaktivert, aktiver og lagre

### 3. E-postmaler mangler eller er feil
**Sjekk i Supabase Dashboard:**
1. Gå til **Authentication** → **Email Templates** → **Confirm signup**
2. Verifiser at malen eksisterer
3. Sjekk at den inneholder `{{ .ConfirmationURL }}`
4. Hvis den mangler, bruk Supabase sin standard mal

### 4. Spam-filter
E-poster fra Supabase kan havne i spam/søppelpost.
- Be brukeren sjekke spam-mappen
- E-poster fra: `noreply@mail.app.supabase.io`

### 5. Feil e-postadresse
Brukeren kan ha skrevet inn feil e-postadresse.

## Test e-postutsending

### Metode 1: Via API-endepunkt (Enklest)
1. Start utviklingsserveren: `npm run dev`
2. Åpne i nettleseren: `http://localhost:3000/api/test-email?email=din@epost.no`
3. Sjekk responsen for status
4. Sjekk innboksen for test-e-post

### Metode 2: Via Supabase Dashboard
1. Gå til **Authentication** → **Users**
2. Klikk **"Add user"** → **"Send invite"**
3. Skriv inn en test-e-postadresse
4. Sjekk om e-posten mottas

### Metode 3: Sjekk Supabase Logs
1. Gå til **Project Settings** → **Logs**
2. Velg **Auth Logs**
3. Se etter feilmeldinger eller e-postutsending

## Løsninger

### Kortsiktig: Deaktiver e-postbekreftelse (IKKE ANBEFALT)
```
⚠️ SIKKERHETSRISIKO: Tillater falske e-postadresser
```
1. Gå til **Authentication** → **Providers** → **Email**
2. Skru av **"Confirm email"**
3. Brukere kan nå registrere seg uten bekreftelse

**Bruk kun midlertidig for testing!**

### Langsiktig: Sett opp egendefinert SMTP (ANBEFALT)
1. Gå til **Project Settings** → **Auth** → **SMTP Settings**
2. Velg e-postleverandør:
   - **SendGrid** (gratis tier: 100 eposter/dag)
   - **Mailgun** (gratis tier: 1000 eposter/måned)
   - **AWS SES** (billig, krever AWS-konto)
3. Konfigurer SMTP-innstillinger
4. Test e-postutsending

### Beste praksis: Legg til feedback i UI
Oppdater suksessmeldingen til å inkludere feilsøkingstips:

```typescript
// I InlineRegistrationForm.tsx eller register/page.tsx
<p className="text-xs text-gray-500">
  Ikke mottatt e-post? Sjekk spam-mappen eller{' '}
  <button onClick={handleResendEmail}>send på nytt</button>
</p>
```

## Verifiser at alt fungerer

1. **Sjekk Dashboard-innstillinger**
   - Authentication → Providers → Email → "Confirm email" = ON
   - Email Templates → Confirm signup = Eksisterer

2. **Test registrering**
   - Bruk en ekte e-postadresse du har tilgang til
   - Vent 2-5 minutter (e-poster kan forsinkes)
   - Sjekk både innboks og spam

3. **Sjekk Supabase Logs**
   - Verifiser at e-post ble sendt
   - Se etter feilmeldinger

4. **Hvis fortsatt problem**
   - Kontakt Supabase support
   - Vurder å sette opp egendefinert SMTP

## Etter testing
**VIKTIG:** Slett test-API-ruten for sikkerhet:
```bash
rm src/app/api/test-email/route.ts
```

## Relevante lenker
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Email Rate Limits](https://supabase.com/docs/guides/auth/auth-smtp)
- [Troubleshooting Auth](https://supabase.com/docs/guides/auth/troubleshooting)
