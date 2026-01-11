/**
 * Media Service Types
 * Sentrale typer for bildebehandlingssystemet
 */

// Entity types som bilder kan tilhøre
export type MediaEntityType =
  | 'post'
  | 'profile_avatar'
  | 'profile_cover'
  | 'profile_featured'
  | 'geography_language_area'
  | 'geography_municipality'
  | 'geography_place'
  | 'group_avatar'
  | 'group_cover'
  | 'community_logo'
  | 'event_cover'
  | 'bug_report'

// Bildestørrelser for Supabase Image Transform
export type MediaSize = 'original' | 'medium' | 'thumb'

// Bildedimensjoner
export const MEDIA_SIZES: Record<MediaSize, number | null> = {
  original: 1920,  // Maks 1920px
  medium: 800,     // 800px for feed/visning
  thumb: 200,      // 200px for thumbnails
}

// Database media record
export interface MediaRecord {
  id: string
  storage_path: string
  original_filename: string | null
  mime_type: string
  file_size: number
  width: number | null
  height: number | null
  uploaded_by: string | null
  original_uploader_id: string
  upload_ip: string | null
  entity_type: MediaEntityType
  entity_id: string
  caption: string | null
  alt_text: string | null
  sort_order: number
  deleted_at: string | null
  deleted_by: string | null
  deletion_reason: string | null
  created_at: string
  updated_at: string
}

// Opplastingsalternativer
export interface UploadOptions {
  entityType: MediaEntityType
  entityId: string
  caption?: string
  altText?: string
  sortOrder?: number
}

// Opplastingsresultat
export interface UploadResult {
  success: boolean
  media?: MediaRecord
  error?: string
}

// Multi-opplastingsresultat
export interface MultiUploadResult {
  successful: MediaRecord[]
  failed: Array<{
    filename: string
    error: string
  }>
  totalUploaded: number
  totalFailed: number
}

// Media-innstillinger fra app_settings
export interface MediaSettings {
  maxFileSizeMb: number
  maxImagesPerPost: number
  maxImagesPerGeography: number
  maxImageDimension: number
  allowedTypes: string[]
}

// Standard innstillinger
export const DEFAULT_MEDIA_SETTINGS: MediaSettings = {
  maxFileSizeMb: 20,
  maxImagesPerPost: 30,
  maxImagesPerGeography: 100,
  maxImageDimension: 1920,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
}

// Audit log action types
export type MediaAuditAction =
  | 'uploaded'
  | 'deleted'
  | 'updated'
  | 'reported'
  | 'copyright_claim'
  | 'gdpr_export'
  | 'gdpr_delete'

// Audit log entry
export interface MediaAuditEntry {
  id: string
  media_id: string
  action: MediaAuditAction
  actor_id: string | null
  actor_ip: string | null
  details: Record<string, unknown>
  created_at: string
}

// GDPR eksport
export interface MediaExport {
  userId: string
  exportedAt: string
  totalFiles: number
  totalSizeBytes: number
  files: Array<{
    id: string
    storagePath: string
    originalFilename: string | null
    fileSize: number
    entityType: MediaEntityType
    caption: string | null
    createdAt: string
    downloadUrl: string
  }>
}

// Valideringsfeil
export interface MediaValidationError {
  field: string
  message: string
  code: 'file_too_large' | 'invalid_type' | 'limit_exceeded' | 'invalid_dimensions'
}

// Storage path helpers
export function getStoragePath(
  entityType: MediaEntityType,
  entityId: string,
  userId: string,
  filename: string
): string {
  const timestamp = Date.now()
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg'
  const safeFilename = `${timestamp}.${ext}`

  // Bruker-eid innhold (GDPR: kan slettes med hele mappen)
  if (entityType === 'post') {
    return `users/${userId}/posts/${entityId}/${safeFilename}`
  }
  if (entityType === 'profile_avatar') {
    return `users/${userId}/avatar/${safeFilename}`
  }
  if (entityType === 'profile_cover') {
    return `users/${userId}/cover/${safeFilename}`
  }
  if (entityType === 'profile_featured') {
    return `users/${userId}/featured/${safeFilename}`
  }

  // Community-innhold (anonymiseres ved brukersletting)
  if (entityType.startsWith('geography_')) {
    const geoType = entityType.replace('geography_', '')
    return `community/geography/${geoType}/${entityId}/${safeFilename}`
  }
  if (entityType === 'group_avatar' || entityType === 'group_cover') {
    const type = entityType.replace('group_', '')
    return `community/groups/${entityId}/${type}.${ext}`
  }
  if (entityType === 'community_logo') {
    return `community/communities/${entityId}/logo.${ext}`
  }
  if (entityType === 'event_cover') {
    return `community/events/${entityId}/cover.${ext}`
  }

  // System
  if (entityType === 'bug_report') {
    return `system/bug-reports/${entityId}/${safeFilename}`
  }

  // Fallback
  return `misc/${entityId}/${safeFilename}`
}
