-- Migration: Migrate Existing Images to Media Service
-- Dato: 2025-12-19
-- Beskrivelse: Migrerer eksisterende bilder fra images bucket til media systemet
--
-- VIKTIG: Dette er en datamigrering som må kjøres med forsiktighet.
-- Anbefalt: Test i staging miljø først.

-- ============================================
-- 1. OPPRETT HJELPEFUNKSJON FOR MIGRERING
-- ============================================

CREATE OR REPLACE FUNCTION migrate_existing_images_to_media()
RETURNS TABLE (
  migrated_count INTEGER,
  failed_count INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_post RECORD;
  v_profile RECORD;
  v_migrated_count INTEGER := 0;
  v_failed_count INTEGER := 0;
  v_media_id UUID;
BEGIN
  -- ============================================
  -- A. MIGRER POST BILDER (image_url)
  -- ============================================

  FOR v_post IN
    SELECT
      id,
      user_id,
      image_url,
      created_at
    FROM posts
    WHERE image_url IS NOT NULL
      AND image_url != ''
      AND image_url LIKE '%post-images%'
      -- Kun migrer bilder som ikke allerede er i media systemet
      AND NOT EXISTS (
        SELECT 1 FROM media
        WHERE entity_type = 'post'
        AND entity_id = posts.id
        AND deleted_at IS NULL
      )
    LIMIT 1000 -- Prosesser i batches for sikkerhet
  LOOP
    BEGIN
      -- Ekstraher storage path fra URL
      -- Antar format: .../post-images/filename.jpg
      DECLARE
        v_storage_path TEXT;
        v_filename TEXT;
      BEGIN
        -- Simplifisert: Bruk hele URLen som original_filename
        v_filename := substring(v_post.image_url from '[^/]+$');
        v_storage_path := 'legacy/posts/' || v_post.user_id || '/' || v_filename;

        -- Opprett media record
        INSERT INTO media (
          storage_path,
          original_filename,
          mime_type,
          file_size,
          uploaded_by,
          original_uploader_id,
          entity_type,
          entity_id,
          created_at
        ) VALUES (
          v_post.image_url, -- Beholder gammel URL som storage_path for kompatibilitet
          v_filename,
          'image/jpeg', -- Antar JPEG
          0, -- Ukjent størrelse
          v_post.user_id,
          v_post.user_id,
          'post',
          v_post.id,
          v_post.created_at
        )
        RETURNING id INTO v_media_id;

        -- Legg til audit log entry
        INSERT INTO media_audit_log (
          media_id,
          action,
          actor_id,
          details
        ) VALUES (
          v_media_id,
          'migrated',
          v_post.user_id,
          jsonb_build_object(
            'source', 'legacy_post_images',
            'original_url', v_post.image_url
          )
        );

        v_migrated_count := v_migrated_count + 1;
      END;
    EXCEPTION WHEN OTHERS THEN
      v_failed_count := v_failed_count + 1;
      RAISE WARNING 'Failed to migrate post image for post %: %', v_post.id, SQLERRM;
    END;
  END LOOP;

  -- ============================================
  -- B. MIGRER PROFIL AVATARER
  -- ============================================

  FOR v_profile IN
    SELECT
      id,
      avatar_url
    FROM profiles
    WHERE avatar_url IS NOT NULL
      AND avatar_url != ''
      AND avatar_url LIKE '%avatars%'
      -- Kun migrer bilder som ikke allerede er i media systemet
      AND NOT EXISTS (
        SELECT 1 FROM media
        WHERE entity_type = 'profile_avatar'
        AND entity_id = profiles.id
        AND deleted_at IS NULL
      )
    LIMIT 1000 -- Prosesser i batches
  LOOP
    BEGIN
      DECLARE
        v_storage_path TEXT;
        v_filename TEXT;
      BEGIN
        v_filename := substring(v_profile.avatar_url from '[^/]+$');
        v_storage_path := 'legacy/avatars/' || v_profile.id || '/' || v_filename;

        -- Opprett media record
        INSERT INTO media (
          storage_path,
          original_filename,
          mime_type,
          file_size,
          uploaded_by,
          original_uploader_id,
          entity_type,
          entity_id
        ) VALUES (
          v_profile.avatar_url, -- Beholder gammel URL
          v_filename,
          'image/jpeg',
          0,
          v_profile.id,
          v_profile.id,
          'profile_avatar',
          v_profile.id
        )
        RETURNING id INTO v_media_id;

        -- Audit log
        INSERT INTO media_audit_log (
          media_id,
          action,
          actor_id,
          details
        ) VALUES (
          v_media_id,
          'migrated',
          v_profile.id,
          jsonb_build_object(
            'source', 'legacy_avatars',
            'original_url', v_profile.avatar_url
          )
        );

        v_migrated_count := v_migrated_count + 1;
      END;
    EXCEPTION WHEN OTHERS THEN
      v_failed_count := v_failed_count + 1;
      RAISE WARNING 'Failed to migrate avatar for profile %: %', v_profile.id, SQLERRM;
    END;
  END LOOP;

  -- Returner resultat
  RETURN QUERY SELECT
    v_migrated_count,
    v_failed_count,
    format('Migrated %s images, %s failed', v_migrated_count, v_failed_count);
END;
$$;

-- ============================================
-- 2. INFORMASJON
-- ============================================

COMMENT ON FUNCTION migrate_existing_images_to_media IS
'Migrerer eksisterende bilder fra images bucket til media systemet.
Prosesserer maks 1000 bilder per kjøring for sikkerhet.
Kan kjøres flere ganger - hopper over allerede migrerte bilder.

BRUK:
SELECT * FROM migrate_existing_images_to_media();

MERK:
- Beholder gamle URLer som storage_path for bakoverkompatibilitet
- Nye opplastinger vil bruke media bucket og nye paths
- Gammel data forblir i images bucket men er nå sporbar i media tabellen
';

-- ============================================
-- 3. NOTATER FOR MANUELL KJØRING
-- ============================================

-- Kjør denne funksjonen flere ganger til alle bilder er migrert:
-- SELECT * FROM migrate_existing_images_to_media();

-- Sjekk hvor mange bilder som gjenstår:
-- SELECT COUNT(*) FROM posts WHERE image_url IS NOT NULL AND image_url LIKE '%post-images%'
--   AND NOT EXISTS (SELECT 1 FROM media WHERE entity_type = 'post' AND entity_id = posts.id);

-- SELECT COUNT(*) FROM profiles WHERE avatar_url IS NOT NULL AND avatar_url LIKE '%avatars%'
--   AND NOT EXISTS (SELECT 1 FROM media WHERE entity_type = 'profile_avatar' AND entity_id = profiles.id);
