-- Media Service Database Migration
-- Sentralisert bildebehandlingssystem for samiske.no
-- Opprettet: 2025-12-18

-- ============================================
-- 1. MEDIA TABELL
-- ============================================
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Filinfo
  storage_path TEXT NOT NULL UNIQUE,
  original_filename TEXT,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,

  -- Eierskap (kan nullstilles ved brukersletting - GDPR)
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Copyright/juridisk (slettes ALDRI - juridisk ansvar)
  original_uploader_id UUID NOT NULL,
  upload_ip INET,

  -- Hva tilhører bildet?
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,

  -- Metadata
  caption TEXT,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,

  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id),
  deletion_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Validering av entity_type
  CONSTRAINT valid_entity_type CHECK (entity_type IN (
    'post',
    'profile_avatar',
    'profile_cover',
    'geography_language_area',
    'geography_municipality',
    'geography_place',
    'group_avatar',
    'group_cover',
    'community_logo',
    'event_cover',
    'bug_report'
  ))
);

-- Indexes for media tabell
CREATE INDEX IF NOT EXISTS idx_media_entity ON media(entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media(uploaded_by) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_media_original_uploader ON media(original_uploader_id);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at);
CREATE INDEX IF NOT EXISTS idx_media_storage_path ON media(storage_path);

-- ============================================
-- 2. MEDIA AUDIT LOG TABELL
-- ============================================
CREATE TABLE IF NOT EXISTS media_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'uploaded', 'deleted', 'updated', 'reported', 'copyright_claim', 'gdpr_export', 'gdpr_delete'
  actor_id UUID REFERENCES profiles(id),
  actor_ip INET,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit log
CREATE INDEX IF NOT EXISTS idx_media_audit_media_id ON media_audit_log(media_id);
CREATE INDEX IF NOT EXISTS idx_media_audit_created_at ON media_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_media_audit_action ON media_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_media_audit_actor ON media_audit_log(actor_id);

-- ============================================
-- 3. APP SETTINGS FOR MEDIA (admin-konfigurerbart)
-- ============================================
-- Legg til media-innstillinger i app_settings
INSERT INTO app_settings (key, value) VALUES
  ('media_max_file_size_mb', '20'),
  ('media_max_images_per_post', '30'),
  ('media_max_images_per_geography', '100'),
  ('media_max_image_dimension', '1920'),
  ('media_allowed_types', '["image/jpeg", "image/png", "image/webp", "image/gif"]')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 4. RLS POLICIES FOR MEDIA
-- ============================================
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_audit_log ENABLE ROW LEVEL SECURITY;

-- Media: Alle kan se ikke-slettede bilder
CREATE POLICY "Anyone can view active media"
ON media FOR SELECT
TO public
USING (deleted_at IS NULL);

-- Media: Innloggede brukere kan se egne slettede bilder
CREATE POLICY "Users can view own deleted media"
ON media FOR SELECT
TO authenticated
USING (
  uploaded_by = auth.uid()
  OR original_uploader_id = auth.uid()
);

-- Media: Innloggede brukere kan laste opp
CREATE POLICY "Authenticated users can upload media"
ON media FOR INSERT
TO authenticated
WITH CHECK (uploaded_by = auth.uid());

-- Media: Brukere kan oppdatere egne bilder
CREATE POLICY "Users can update own media"
ON media FOR UPDATE
TO authenticated
USING (uploaded_by = auth.uid())
WITH CHECK (uploaded_by = auth.uid());

-- Media: Brukere kan soft-delete egne bilder
CREATE POLICY "Users can soft delete own media"
ON media FOR UPDATE
TO authenticated
USING (uploaded_by = auth.uid());

-- Media: Admins har full tilgang
CREATE POLICY "Admins have full media access"
ON media FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Audit log: Kun admins kan se
CREATE POLICY "Only admins can view audit log"
ON media_audit_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Audit log: System kan legge til (via service role)
CREATE POLICY "Authenticated can insert audit log"
ON media_audit_log FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- 5. TRIGGER FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS media_updated_at ON media;
CREATE TRIGGER media_updated_at
  BEFORE UPDATE ON media
  FOR EACH ROW
  EXECUTE FUNCTION update_media_updated_at();

-- ============================================
-- 6. FUNKSJON FOR GDPR DATAEKSPORT
-- ============================================
CREATE OR REPLACE FUNCTION export_user_media(user_id UUID)
RETURNS TABLE (
  media_id UUID,
  storage_path TEXT,
  original_filename TEXT,
  file_size INTEGER,
  entity_type TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.storage_path,
    m.original_filename,
    m.file_size,
    m.entity_type,
    m.caption,
    m.created_at
  FROM media m
  WHERE m.original_uploader_id = user_id
    OR m.uploaded_by = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. FUNKSJON FOR MEDIA AUDIT LOG OPPRYDDING (3 år)
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_media_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM media_audit_log
  WHERE created_at < NOW() - INTERVAL '3 years';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. KOMMENTARER FOR DOKUMENTASJON
-- ============================================
COMMENT ON TABLE media IS 'Sentralisert media-tabell for alle bilder på samiske.no';
COMMENT ON COLUMN media.uploaded_by IS 'Nåværende eier - settes NULL ved GDPR-sletting';
COMMENT ON COLUMN media.original_uploader_id IS 'Original opplaster - slettes ALDRI (copyright/juridisk)';
COMMENT ON COLUMN media.entity_type IS 'Type entitet bildet tilhører (post, profile_avatar, geography_*, etc.)';
COMMENT ON COLUMN media.deleted_at IS 'Soft delete timestamp - bildet vises ikke men beholdes';

COMMENT ON TABLE media_audit_log IS 'Audit trail for alle media-handlinger - oppbevares 3 år';
COMMENT ON FUNCTION export_user_media IS 'GDPR dataeksport - returnerer alle bilder for en bruker';
COMMENT ON FUNCTION cleanup_media_audit_logs IS 'Sletter media audit logs eldre enn 3 år';

-- ============================================
-- 9. STORAGE BUCKET
-- ============================================
-- Opprett media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  20971520, -- 20MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies

-- Alle kan se offentlige bilder
CREATE POLICY "Public read access for media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

-- Innloggede brukere kan laste opp
CREATE POLICY "Authenticated users can upload to media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Brukere kan slette fra egen mappe
CREATE POLICY "Users can delete own media files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'media'
  AND (
    -- Brukere kan slette fra users/{userId}/ mappen
    (storage.foldername(name))[1] = 'users'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
);

-- Admins kan slette alt
CREATE POLICY "Admins can delete any media files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'media'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
