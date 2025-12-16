# Admin-funksjonalitet

## Oversikt

Admin-panelet er tilgjengelig på `/admin` for brukere med `role = 'admin'` i profiles-tabellen.

## Komponenter

```
src/components/admin/
├── BugReportsTab.tsx      # Håndtering av bug-rapporter
├── ContentReportsTab.tsx  # Moderering av innhold
├── StatsCards.tsx         # Statistikk-visning
└── utils.ts               # Hjelpefunksjoner (formatDate, etc.)
```

---

## Bug-rapporter

### Innsamling (`BugReportDialog.tsx`)

Brukere kan rapportere bugs via bug-boblen (nederst høyre). Følgende data samles inn:

| Felt | Beskrivelse |
|------|-------------|
| `category` | bug, improvement, question, other |
| `title` | Kort beskrivelse (5-100 tegn) |
| `description` | Detaljert beskrivelse (10-2000 tegn) |
| `url` | Automatisk: Nåværende URL |
| `user_agent` | Automatisk: Nettleser-info |
| `screen_size` | Automatisk: Skjermoppløsning |
| `screenshot_url` | Valgfritt: Opplastet bilde |
| `user_id` | Automatisk eller null (anonym) |

**Anonym innsending**: Innloggede brukere kan velge å sende anonymt via avkryssningsboks.

### Admin-behandling (`BugReportsTab.tsx`)

**Filtrering:**
- Status: new, in_progress, resolved, dismissed
- Prioritet: critical, high, medium, low

**Handlinger per rapport:**
1. **Endre status** - Dropdown i listen
2. **Endre prioritet** - Dropdown i listen
3. **Se detaljer** - Åpner dialog med all info
4. **Admin-notater** - Interne notater (ikke synlig for bruker)
5. **Svar til bruker** - Send melding direkte fra rapporten

### Direkte melding til bruker

Admin kan skrive og sende melding rett fra bug-rapport-dialogen:

```typescript
// Flyt:
1. Finn/opprett samtale mellom admin og bruker
2. Insert melding i messages-tabellen
3. Database-trigger oppretter notifikasjon automatisk
4. Bruker får melding i innboks + varsel
```

**Viktig:** Kun tilgjengelig for ikke-anonyme rapporter.

---

## Meldingssystemet (integrasjon)

### Custom events

```typescript
// Åpne chat med bruker (brukes flere steder)
window.dispatchEvent(
  new CustomEvent('start-conversation-with-user', {
    detail: { userId: 'uuid-her' }
  })
)
```

### Database-tabeller

```sql
-- Samtaler
conversations (id)
conversation_participants (conversation_id, user_id)
messages (conversation_id, sender_id, content)

-- Automatisk varsling (trigger)
notify_new_message() -> notifications
```

---

## Statistikk

`StatsCards.tsx` viser:
- Totalt antall brukere
- Aktive brukere (siste 24t)
- Antall innlegg
- Ventende rapporter

---

## Tilgang

Admin-tilgang settes direkte i databasen:

```sql
UPDATE profiles SET role = 'admin' WHERE id = 'bruker-uuid';
```

Frontend sjekker rolle via:
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

if (profile?.role === 'admin') {
  // Vis admin-innhold
}
```
