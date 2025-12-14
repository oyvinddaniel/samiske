# Pre-deploy sjekkliste

Du skal verifisere at det er TRYGT å deploye til produksjon.

## Steg 1: Sjekk endringer

Kjør `git status` og `git diff` for å se alle endringer siden siste commit.

## Steg 2: Automatiske sjekker

Kjør disse kommandoene og rapporter resultat:

```bash
# TypeScript-kompilering
npm run build

# Linting
npm run lint
```

## Steg 3: Sikkerhetsskanning

### Secrets-søk
Søk i ALLE endrede filer etter:
- `sk_` (API-nøkler)
- `password`
- `secret`
- `key`
- Hardkodede tokens

### RLS-sjekk
Hvis det er endringer i `supabase/`:
- Har nye tabeller RLS aktivert?
- Krever policies autentisering der nødvendig?

### API-ruter
Hvis det er endringer i `src/app/api/`:
- Valideres input?
- Sjekkes autentisering?

## Steg 4: Kvalitetssjekk

- [ ] Ingen `console.log` i produksjonskode (unntatt feilhåndtering)
- [ ] Ingen `any`-typer uten god grunn
- [ ] Feilhåndtering med toast på Supabase-queries
- [ ] Nye komponenter under 300 linjer

## Steg 5: Gi klart svar

Basert på sjekkene, gi ETT av disse svarene:

### Hvis TRYGT:
```
✅ TRYGT Å DEPLOYE

Sjekker utført:
- npm run build: OK
- npm run lint: OK
- Secrets-søk: Ingen funn
- RLS policies: OK

Endringer i denne deployen:
- [liste over endringer]
```

### Hvis IKKE TRYGT:
```
❌ IKKE TRYGT Å DEPLOYE

Problemer funnet:
1. [problem 1]
2. [problem 2]

Må fikses før deploy:
- [konkret handling]
```

## VIKTIG

- Vær STRENG. Hellre ett falsk positivt enn å slippe gjennom en sårbarhet.
- Hvis du er usikker, si NEI og forklar hvorfor.
- Prosjektet har ekte brukere - konsekvensene av feil er reelle.
