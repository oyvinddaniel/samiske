/**
 * Media Service - Sentralisert bildebehandling for samiske.no
 *
 * Bruk:
 * import { MediaService, getMediaUrl } from '@/lib/media'
 *
 * // Last opp bilde
 * const result = await MediaService.upload(file, {
 *   entityType: 'post',
 *   entityId: postId
 * })
 *
 * // Hent thumbnail-URL
 * const thumbUrl = getMediaUrl(media.storage_path, 'thumb')
 */

// Hovedservice
export { MediaService, default } from './mediaService'

// URL-generering
export {
  getMediaUrl,
  getMediaUrls,
  getMediaSrcSet,
  getMediaSizes,
  isMediaUrl,
  extractStoragePath,
  getPlaceholderUrl,
  getAvatarPlaceholder,
  MEDIA_BUCKET,
} from './mediaUrls'

// Typer
export type {
  MediaRecord,
  MediaEntityType,
  MediaSize,
  UploadOptions,
  UploadResult,
  MultiUploadResult,
  MediaSettings,
  MediaExport,
  MediaAuditAction,
  MediaAuditEntry,
  MediaValidationError,
} from './mediaTypes'

export {
  MEDIA_SIZES,
  DEFAULT_MEDIA_SETTINGS,
  getStoragePath,
} from './mediaTypes'

// Validering
export {
  getMediaSettings,
  clearMediaSettingsCache,
  validateFile,
  validateFiles,
  canUploadMore,
} from './mediaValidation'

// Komprimering
export {
  compressMedia,
  compressForEntity,
  compressMultiple,
  getImageDimensions,
  calculateResizedDimensions,
} from './mediaCompression'
