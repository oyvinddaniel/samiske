/**
 * Media Service
 * Sentralisert tjeneste for all bildebehandling
 */

import { createClient } from '@/lib/supabase/client'
import {
  MediaRecord,
  MediaEntityType,
  UploadOptions,
  UploadResult,
  MultiUploadResult,
  MediaSettings,
  MediaExport,
  getStoragePath,
  DEFAULT_MEDIA_SETTINGS,
} from './mediaTypes'
import { getMediaUrl, MEDIA_BUCKET } from './mediaUrls'
import { compressForEntity, getImageDimensions } from './mediaCompression'
import { getMediaSettings, validateFiles, clearMediaSettingsCache } from './mediaValidation'

/**
 * Hovedservice for mediabehandling
 */
export const MediaService = {
  /**
   * Last opp én fil
   */
  async upload(file: File, options: UploadOptions): Promise<UploadResult> {
    const supabase = createClient()

    // Hent bruker
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Du må være innlogget for å laste opp' }
    }

    try {
      // Komprimer basert på entity type
      const compressedFile = await compressForEntity(file, options.entityType)

      // Hent dimensjoner
      let dimensions = { width: 0, height: 0 }
      try {
        dimensions = await getImageDimensions(compressedFile)
      } catch {
        // Ignorer feil - dimensjoner er valgfritt
      }

      // Generer storage path
      const storagePath = getStoragePath(
        options.entityType,
        options.entityId,
        user.id,
        file.name
      )

      // Last opp til storage
      const { error: uploadError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(storagePath, compressedFile, {
          contentType: compressedFile.type,
          upsert: false,
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        return { success: false, error: uploadError.message }
      }

      // Lagre i database
      const { data: mediaRecord, error: dbError } = await supabase
        .from('media')
        .insert({
          storage_path: storagePath,
          original_filename: file.name,
          mime_type: compressedFile.type,
          file_size: compressedFile.size,
          width: dimensions.width || null,
          height: dimensions.height || null,
          uploaded_by: user.id,
          original_uploader_id: user.id,
          entity_type: options.entityType,
          entity_id: options.entityId,
          caption: options.caption || null,
          alt_text: options.altText || null,
          sort_order: options.sortOrder ?? 0,
        })
        .select()
        .single()

      if (dbError) {
        // Rydd opp storage hvis database feiler
        await supabase.storage.from(MEDIA_BUCKET).remove([storagePath])
        console.error('Database insert error:', dbError)
        return { success: false, error: dbError.message }
      }

      // Logg opplasting i audit log
      await supabase.from('media_audit_log').insert({
        media_id: mediaRecord.id,
        action: 'uploaded',
        actor_id: user.id,
        details: {
          filename: file.name,
          originalSize: file.size,
          compressedSize: compressedFile.size,
          entityType: options.entityType,
        },
      })

      return { success: true, media: mediaRecord as MediaRecord }
    } catch (error) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ukjent feil ved opplasting',
      }
    }
  },

  /**
   * Last opp flere filer
   */
  async uploadMultiple(
    files: File[],
    options: Omit<UploadOptions, 'sortOrder'>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<MultiUploadResult> {
    // Valider alle filer først
    const validation = await validateFiles(files, options.entityType, options.entityId)

    const result: MultiUploadResult = {
      successful: [],
      failed: validation.invalid.map(({ file, errors }) => ({
        filename: file.name,
        error: errors[0]?.message || 'Validering feilet',
      })),
      totalUploaded: 0,
      totalFailed: validation.invalid.length,
    }

    if (!validation.canUpload) {
      return result
    }

    // Last opp gyldige filer
    for (let i = 0; i < validation.valid.length; i++) {
      const file = validation.valid[i]
      const uploadResult = await this.upload(file, {
        ...options,
        sortOrder: i,
      })

      if (uploadResult.success && uploadResult.media) {
        result.successful.push(uploadResult.media)
        result.totalUploaded++
      } else {
        result.failed.push({
          filename: file.name,
          error: uploadResult.error || 'Opplasting feilet',
        })
        result.totalFailed++
      }

      onProgress?.(i + 1, validation.valid.length)
    }

    return result
  },

  /**
   * Hent alle bilder for en entitet
   */
  async getForEntity(
    entityType: MediaEntityType,
    entityId: string
  ): Promise<MediaRecord[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching media:', error)
      return []
    }

    return data as MediaRecord[]
  },

  /**
   * Hent ett bilde via ID
   */
  async getById(mediaId: string): Promise<MediaRecord | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('id', mediaId)
      .single()

    if (error) {
      console.error('Error fetching media by ID:', error)
      return null
    }

    return data as MediaRecord
  },

  /**
   * Hent URL for et bilde
   */
  getUrl: getMediaUrl,

  /**
   * Soft-delete et bilde
   */
  async delete(mediaId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Du må være innlogget' }
    }

    // Oppdater til soft delete
    const { error } = await supabase
      .from('media')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
        deletion_reason: reason,
      })
      .eq('id', mediaId)

    if (error) {
      console.error('Error deleting media:', error)
      return { success: false, error: error.message }
    }

    // Logg sletting
    await supabase.from('media_audit_log').insert({
      media_id: mediaId,
      action: 'deleted',
      actor_id: user.id,
      details: { reason },
    })

    return { success: true }
  },

  /**
   * Oppdater media-metadata
   */
  async update(
    mediaId: string,
    updates: { caption?: string; altText?: string; sortOrder?: number }
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    const { error } = await supabase
      .from('media')
      .update({
        caption: updates.caption,
        alt_text: updates.altText,
        sort_order: updates.sortOrder,
      })
      .eq('id', mediaId)

    if (error) {
      console.error('Error updating media:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  },

  /**
   * Hent media-innstillinger
   */
  getSettings: getMediaSettings,

  /**
   * Oppdater media-innstillinger (admin only)
   */
  async updateSettings(settings: Partial<MediaSettings>): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    const updates: Array<{ key: string; value: string }> = []

    if (settings.maxFileSizeMb !== undefined) {
      updates.push({ key: 'media_max_file_size_mb', value: String(settings.maxFileSizeMb) })
    }
    if (settings.maxImagesPerPost !== undefined) {
      updates.push({ key: 'media_max_images_per_post', value: String(settings.maxImagesPerPost) })
    }
    if (settings.maxImagesPerGeography !== undefined) {
      updates.push({ key: 'media_max_images_per_geography', value: String(settings.maxImagesPerGeography) })
    }
    if (settings.maxImageDimension !== undefined) {
      updates.push({ key: 'media_max_image_dimension', value: String(settings.maxImageDimension) })
    }
    if (settings.allowedTypes !== undefined) {
      updates.push({ key: 'media_allowed_types', value: JSON.stringify(settings.allowedTypes) })
    }

    for (const { key, value } of updates) {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key, value }, { onConflict: 'key' })

      if (error) {
        console.error('Error updating settings:', error)
        return { success: false, error: error.message }
      }
    }

    // Tøm cache
    clearMediaSettingsCache()

    return { success: true }
  },

  /**
   * GDPR: Eksporter alle bilder for en bruker
   */
  async exportUserMedia(userId: string): Promise<MediaExport> {
    const supabase = createClient()

    const { data, error } = await supabase
      .rpc('export_user_media', { user_id: userId })

    if (error) {
      console.error('Error exporting user media:', error)
      throw new Error('Kunne ikke eksportere brukerdata')
    }

    const files = (data || []).map((row: {
      media_id: string
      storage_path: string
      original_filename: string | null
      file_size: number
      entity_type: MediaEntityType
      caption: string | null
      created_at: string
    }) => ({
      id: row.media_id,
      storagePath: row.storage_path,
      originalFilename: row.original_filename,
      fileSize: row.file_size,
      entityType: row.entity_type,
      caption: row.caption,
      createdAt: row.created_at,
      downloadUrl: getMediaUrl(row.storage_path, 'original'),
    }))

    const totalSizeBytes = files.reduce((sum: number, f: { fileSize: number }) => sum + f.fileSize, 0)

    // Logg eksport
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      for (const file of files) {
        await supabase.from('media_audit_log').insert({
          media_id: file.id,
          action: 'gdpr_export',
          actor_id: user.id,
          details: { requestedBy: user.id },
        })
      }
    }

    return {
      userId,
      exportedAt: new Date().toISOString(),
      totalFiles: files.length,
      totalSizeBytes,
      files,
    }
  },

  /**
   * GDPR: Slett alle bilder for en bruker
   */
  async deleteUserMedia(userId: string): Promise<{ deletedCount: number }> {
    const supabase = createClient()

    // Hent alle brukerens bilder
    const { data: media } = await supabase
      .from('media')
      .select('id, storage_path')
      .or(`uploaded_by.eq.${userId},original_uploader_id.eq.${userId}`)

    if (!media || media.length === 0) {
      return { deletedCount: 0 }
    }

    const { data: { user } } = await supabase.auth.getUser()

    // Soft delete og logg
    for (const m of media) {
      await supabase
        .from('media')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id || null,
          deletion_reason: 'GDPR sletteanmodning',
          uploaded_by: null, // Anonymiser
        })
        .eq('id', m.id)

      await supabase.from('media_audit_log').insert({
        media_id: m.id,
        action: 'gdpr_delete',
        actor_id: user?.id || null,
        details: { userId },
      })
    }

    return { deletedCount: media.length }
  },

  /**
   * Rydd opp foreldreløse filer (admin)
   */
  async cleanupOrphaned(): Promise<{ deletedCount: number; errors: string[] }> {
    const supabase = createClient()
    const errors: string[] = []
    let deletedCount = 0

    // Finn filer i storage som ikke har database-oppføring
    const { data: storageFiles, error: listError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .list('', { limit: 1000 })

    if (listError) {
      errors.push(`Kunne ikke liste filer: ${listError.message}`)
      return { deletedCount, errors }
    }

    // For hver fil, sjekk om den finnes i database
    for (const file of storageFiles || []) {
      const { data: mediaRecord } = await supabase
        .from('media')
        .select('id')
        .eq('storage_path', file.name)
        .single()

      if (!mediaRecord) {
        // Foreldreløs fil - slett
        const { error: deleteError } = await supabase.storage
          .from(MEDIA_BUCKET)
          .remove([file.name])

        if (deleteError) {
          errors.push(`Kunne ikke slette ${file.name}: ${deleteError.message}`)
        } else {
          deletedCount++
        }
      }
    }

    return { deletedCount, errors }
  },

  /**
   * Rydd opp gamle audit logs (admin)
   */
  async cleanupAuditLog(): Promise<number> {
    const supabase = createClient()

    const { data, error } = await supabase.rpc('cleanup_media_audit_logs')

    if (error) {
      console.error('Error cleaning audit logs:', error)
      return 0
    }

    return data || 0
  },
}

export default MediaService
