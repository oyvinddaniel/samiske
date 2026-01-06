# PRD: Media Service

> **Status:** Implementert - Venter på manuell testing  
> **Opprettet:** 18. desember 2025  
> **Sist oppdatert:** 2025-12-26

---

## Oversikt

**Hva:** Sentralisert bildebehandlingssystem for all bildeopplasting i samiske.no

**Hvorfor:** 
- Fragmentert bildehåndtering på tvers av komponenter
- Ingen metadata-sporing
- Ingen slettefunksjon
- GDPR/copyright-risiko

**For hvem:** Alle brukere som laster opp bilder

---

## Status

| Element | Status |
|---------|--------|
| Implementering | ✅ Fullført |
| Komponenter migrert | 7/11 |
| Automatisert testing | 154 tester (121 passed) |
| Manuell testing | 2/7 fullført |
| Produksjonsklar | ⏳ Etter manuell testing |

---

## Arkitektur

### Kodestruktur
```
src/lib/media/
├── index.ts              # Eksporter
├── mediaService.ts       # Hovedservice
├── mediaTypes.ts         # TypeScript types
├── mediaUrls.ts          # URL-generering
├── mediaValidation.ts    # Validering
└── mediaCompression.ts   # Komprimering
```

### Database
```sql
-- Hovedtabell
CREATE TABLE media (
  id UUID PRIMARY KEY,
  storage_path TEXT NOT NULL UNIQUE,
  original_filename TEXT,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  original_uploader_id UUID NOT NULL,  -- Copyright (permanent)
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  caption TEXT,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log (3 års retention)
CREATE TABLE media_audit_log (
  id UUID PRIMARY KEY,
  media_id UUID NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Entity Types (11)

| Type | Maks bilder | Komprimering |
|------|-------------|--------------|
| `post` | 30 | 200KB, 1920px |
| `profile_avatar` | 1 | 100KB, 400x400px |
| `profile_cover` | 1 | 200KB, 1920px |
| `geography_language_area` | 100 | 300KB, 1920px |
| `geography_municipality` | 100 | 300KB, 1920px |
| `geography_place` | 100 | 300KB, 1920px |
| `group_avatar` | 1 | 100KB, 400x400px |
| `group_cover` | 1 | 200KB, 1920px |
| `community_logo` | 1 | 100KB, 400x400px |
| `event_cover` | 1 | 200KB, 1920px |
| `bug_report` | 5 | 500KB |

---

## API

### Upload
```typescript
const media = await MediaService.upload(file, {
  entityType: 'post',
  entityId: postId,
  userId: user.id,
  caption: 'Beskrivelse',
  altText: 'Alt-tekst',
})
```

### Upload Multiple
```typescript
const mediaList = await MediaService.uploadMultiple(files, options)
```

### Get URL
```typescript
const url = MediaService.getUrl(storagePath, 'medium')
// Sizes: 'small' (200px), 'medium' (800px), 'large' (1920px)
```

### Delete
```typescript
await MediaService.delete(mediaId, userId)
```

### GDPR Export
```typescript
const data = await MediaService.exportUserMedia(userId)
```

---

## Gjenstående arbeid

### Manuell testing (5 gjenstår)
- [ ] Profile avatar
- [ ] Geography images
- [ ] Bug reports
- [ ] Group avatar
- [ ] Geography suggestions

### Komponenter å migrere (3 gjenstår)
- [ ] NewPostSheet.tsx
- [ ] InlineCreatePost.tsx
- [ ] usePostComposer.ts

### Etter produksjon
- [ ] Migrere eksisterende bilder
- [ ] Overvåke storage-bruk
- [ ] Bunny.net video fullføring

---

## GDPR Compliance

- `uploaded_by` → NULL ved brukersletting
- `original_uploader_id` beholdes (copyright)
- Audit log 3 år
- Soft delete pattern

---

**Se full dokumentasjon:** Tidligere `agent_docs/media-service.md`
