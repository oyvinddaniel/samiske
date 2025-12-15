# Versjonssystem - samiske.no

## Oversikt

Samiske.no bruker et automatisk versjonssystem som genererer en ny versjon ved hver build/deploy.

## Hvordan det fungerer

### 1. Build-tid versjonering

Ved hver `npm run build`:
1. **Prebuild script** (`scripts/generate-build-info.js`) kjører automatisk
2. Genererer timestamp i ISO 8601 format
3. Oppdaterer `.env.local` med:
   - `NEXT_PUBLIC_APP_VERSION` (fra package.json)
   - `NEXT_PUBLIC_BUILD_TIME` (nåværende timestamp)

### 2. Vercel Integration

I produksjon brukes Vercel sine environment variables:
- `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` - Git commit hash
- `NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF` - Branch navn

### 3. Visning i UI

Versjonsinformasjon vises i footer på alle sider:
- Format: `v{version} ({dato} {tid}) • {commit}`
- Eksempel: `v0.1.0 (15.12.2025 20:04) • abc1234`

## Oppdatere versjon

### Manuelt oppdatere versjonsnummer

```bash
# Oppdater version i package.json
npm version patch  # 0.1.0 -> 0.1.1
npm version minor  # 0.1.0 -> 0.2.0
npm version major  # 0.1.0 -> 1.0.0
```

### Automatisk ved build

```bash
# Lokal utvikling
npm run build

# Produksjon (Vercel)
# Versjonering skjer automatisk ved deploy
```

## Filstruktur

```
samiske/
├── package.json                      # Versjonsnummer (semver)
├── scripts/
│   └── generate-build-info.js       # Genererer build-info
├── src/
│   ├── lib/
│   │   └── version.ts               # Versjonshåndtering
│   └── components/
│       └── layout/
│           └── Footer.tsx           # Viser versjon i UI
└── .env.local                       # Build timestamp (auto-generert)
```

## Environment Variables

### Development

```bash
# .env.local (auto-generert)
NEXT_PUBLIC_APP_VERSION=0.1.0
NEXT_PUBLIC_BUILD_TIME=2025-12-15T19:04:35.850Z
```

### Production (Vercel)

```bash
# Automatisk tilgjengelig fra Vercel
NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA=abc1234567890
NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF=main
```

## API

### `getVersionInfo()`

```typescript
import { getVersionInfo } from '@/lib/version'

const info = getVersionInfo()
// {
//   version: "0.1.0",
//   buildTime: "2025-12-15T19:04:35.850Z",
//   gitCommit: "abc1234",
//   gitBranch: "main"
// }
```

### `formatVersionString()`

```typescript
import { formatVersionString } from '@/lib/version'

const versionString = formatVersionString()
// "v0.1.0 (15.12.2025 20:04) • abc1234"
```

## Changelog

Se [CHANGELOG.md](../CHANGELOG.md) for fullstendig endringslogg.

## Versjoneringsfilosofi

Samiske.no følger **ikke** semantisk versjonering (semver) strengt siden det er en webapplikasjon med kontinuerlig deployment. I stedet:

- **package.json version**: Brukes for referanse (følger semver-format)
- **Build timestamp**: Unik identifikator for hver deploy
- **Git commit**: Sporer eksakt kodeversjon

Alle endringer deployes direkte til produksjon via Vercel uten staging-miljø.
