# SETUP.md - Oppsett og Deployment

> Hvordan sette opp og deploye samiske.no  
> Sist oppdatert: 2025-12-26

---

## Forutsetninger

- Node.js 18+
- npm eller yarn
- Git
- Supabase-konto
- Vercel-konto
- Bunny.net-konto (for video)

---

## Lokal utvikling

### 1. Klon repo
```bash
git clone [repo-url]
cd samiske-no
```

### 2. Installer avhengigheter
```bash
npm install
```

### 3. Sett opp miljøvariabler
```bash
cp .env.example .env.local
```

Fyll inn følgende i `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[prosjekt-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Bunny.net (video)
BUNNY_API_KEY=[api-key]
BUNNY_LIBRARY_ID=567838

# Tenor (GIFs)
NEXT_PUBLIC_TENOR_API_KEY=[tenor-api-key]

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Start utviklingsserver
```bash
npm run dev
```

Åpne http://localhost:3000

---

## Database-oppsett

### Supabase Dashboard
1. Gå til [supabase.com/dashboard](https://supabase.com/dashboard)
2. Velg prosjektet
3. Gå til **SQL Editor**

### Kjør migrasjoner
Migrasjoner ligger i `supabase/migrations/`. Kjør dem i rekkefølge:

```sql
-- I SQL Editor, kjør hver fil i kronologisk rekkefølge
-- 20241211_*.sql
-- 20241212_*.sql
-- osv.
```

⚠️ **VIKTIG:** Ikke bruk Supabase CLI for migrasjoner. Bruk Dashboard.

### Verifiser oppsett
```sql
-- Sjekk at alle tabeller eksisterer
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Sjekk at RLS er aktivert
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

---

## Supabase Storage

### Buckets
Følgende buckets må opprettes:
- `media` - Hovedbucket for alle bilder
- `geography-images` - Legacy (kan migreres)

### RLS Policies for Storage
```sql
-- Public read
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'media');

-- Authenticated upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media');

-- Owner delete
CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[2] = auth.uid()::text
);
```

---

## Bunny.net (Video)

### Stream Library
1. Logg inn på bunny.net
2. Gå til **Stream** > **Video Libraries**
3. Library ID: `567838`
4. Verifiser at disse resolusjoner er aktivert:
   - 240p, 360p, 480p, 720p, 1080p

### API Key
1. Gå til **Account** > **API Keys**
2. Kopier Stream API key
3. Legg til i miljøvariabler

---

## Vercel Deployment

### Koble til GitHub
1. Gå til [vercel.com](https://vercel.com)
2. **Add New Project**
3. Importer fra GitHub
4. Velg repository

### Miljøvariabler
Legg til disse i Vercel:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
BUNNY_API_KEY
BUNNY_LIBRARY_ID
NEXT_PUBLIC_TENOR_API_KEY
NEXT_PUBLIC_APP_URL
```

### Deploy
- **Main branch** → Produksjon (samiske.no)
- **Andre branches** → Preview deploys

### Automatisk deploy
Hver push til `main` trigger automatisk deploy.

---

## Cron Jobs

### Supabase Cron
Følgende cron jobs må være aktive:

| Job | Schedule | Funksjon |
|-----|----------|----------|
| `publish-scheduled-posts` | Hvert minutt | Publiserer planlagte innlegg |
| `cleanup-expired-drafts` | Daglig 03:00 | Sletter gamle drafts |

### Verifiser i Supabase
```sql
SELECT jobid, jobname, schedule, active 
FROM cron.job 
WHERE active = true;
```

---

## Testing

### Kjør tester lokalt
```bash
# Unit + component tests
npm run test

# Med UI
npm run test:ui

# Med coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

### Før deploy
```bash
# Sjekk at alt kompilerer
npm run build

# Sjekk TypeScript
npx tsc --noEmit

# Kjør linting
npm run lint
```

---

## Pre-deploy sjekkliste

- [ ] `npm run build` - Ingen feil
- [ ] `npm run lint` - Ingen feil
- [ ] `npm run test` - Tester passerer
- [ ] `npx tsc --noEmit` - Ingen TypeScript-feil
- [ ] Ingen secrets i koden
- [ ] Dokumentasjon oppdatert
- [ ] CHANGELOG.md oppdatert

---

## Rollback

### Vercel
1. Gå til Vercel Dashboard
2. **Deployments**
3. Finn tidligere deployment
4. **Promote to Production**

### Git
```bash
# Reverter siste commit
git revert HEAD
git push

# Eller gå tilbake til spesifikk commit
git reset --hard [commit-hash]
git push --force  # ⚠️ Forsiktig!
```

### Database
1. Gå til Supabase Dashboard
2. **Database** > **Backups**
3. Velg backup
4. Restore

---

## Feilsøking

### "Unable to acquire lock"
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

### "RLS policy error"
1. Sjekk at bruker er autentisert
2. Sjekk policy i Supabase Dashboard
3. Verifiser at `auth.uid()` matcher

### "Hydration mismatch"
- Bruk `'use client'` directive
- Eller `suppressHydrationWarning`
- Eller flytt til useEffect

### Build feiler
```bash
# Rens cache
rm -rf .next
npm run build
```

---

## Nyttige lenker

| Ressurs | URL |
|---------|-----|
| Supabase Docs | [supabase.com/docs](https://supabase.com/docs) |
| Next.js Docs | [nextjs.org/docs](https://nextjs.org/docs) |
| Vercel Docs | [vercel.com/docs](https://vercel.com/docs) |
| Tailwind Docs | [tailwindcss.com/docs](https://tailwindcss.com/docs) |
| shadcn/ui | [ui.shadcn.com](https://ui.shadcn.com) |

---

**Sist oppdatert:** 2025-12-26  
**Oppdatert av:** Claude (migrering)
