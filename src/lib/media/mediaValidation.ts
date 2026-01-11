/**
 * Media Validation
 * Validerer filer før opplasting basert på app_settings
 */

import { createClient } from '@/lib/supabase/client'
import {
  MediaSettings,
  DEFAULT_MEDIA_SETTINGS,
  MediaValidationError,
  MediaEntityType,
} from './mediaTypes'

// Cache for settings (oppdateres hver 5 min)
let settingsCache: MediaSettings | null = null
let settingsCacheTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutter

/**
 * Hent media-innstillinger fra database
 */
export async function getMediaSettings(): Promise<MediaSettings> {
  // Returner cache hvis gyldig
  if (settingsCache && Date.now() - settingsCacheTime < CACHE_TTL) {
    return settingsCache
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', [
      'media_max_file_size_mb',
      'media_max_images_per_post',
      'media_max_images_per_geography',
      'media_max_image_dimension',
      'media_allowed_types',
    ])

  if (error) {
    console.error('Failed to fetch media settings:', error)
    return DEFAULT_MEDIA_SETTINGS
  }

  // Parse settings
  const settings: MediaSettings = { ...DEFAULT_MEDIA_SETTINGS }

  for (const row of data || []) {
    switch (row.key) {
      case 'media_max_file_size_mb':
        settings.maxFileSizeMb = Number(row.value) || DEFAULT_MEDIA_SETTINGS.maxFileSizeMb
        break
      case 'media_max_images_per_post':
        settings.maxImagesPerPost = Number(row.value) || DEFAULT_MEDIA_SETTINGS.maxImagesPerPost
        break
      case 'media_max_images_per_geography':
        settings.maxImagesPerGeography = Number(row.value) || DEFAULT_MEDIA_SETTINGS.maxImagesPerGeography
        break
      case 'media_max_image_dimension':
        settings.maxImageDimension = Number(row.value) || DEFAULT_MEDIA_SETTINGS.maxImageDimension
        break
      case 'media_allowed_types':
        try {
          settings.allowedTypes = JSON.parse(row.value as string)
        } catch {
          settings.allowedTypes = DEFAULT_MEDIA_SETTINGS.allowedTypes
        }
        break
    }
  }

  // Oppdater cache
  settingsCache = settings
  settingsCacheTime = Date.now()

  return settings
}

/**
 * Tøm settings cache (f.eks. etter admin-endring)
 */
export function clearMediaSettingsCache(): void {
  settingsCache = null
  settingsCacheTime = 0
}

/**
 * Valider en enkelt fil
 */
export async function validateFile(
  file: File,
  settings?: MediaSettings
): Promise<MediaValidationError[]> {
  const errors: MediaValidationError[] = []
  const s = settings || await getMediaSettings()

  // Sjekk filstørrelse
  const maxSizeBytes = s.maxFileSizeMb * 1024 * 1024
  if (file.size > maxSizeBytes) {
    errors.push({
      field: 'size',
      message: `Filen er for stor. Maks ${s.maxFileSizeMb} MB.`,
      code: 'file_too_large',
    })
  }

  // Sjekk filtype
  if (!s.allowedTypes.includes(file.type)) {
    const allowedFormats = s.allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')
    const fileFormat = file.type.split('/')[1]?.toUpperCase() || 'ukjent'
    errors.push({
      field: 'type',
      message: `Filformatet ${fileFormat} er ikke støttet. Tillatte formater: ${allowedFormats}`,
      code: 'invalid_type',
    })
  }

  return errors
}

/**
 * Valider bildedimensjoner (krever at bildet lastes inn)
 */
export async function validateImageDimensions(
  file: File,
  settings?: MediaSettings
): Promise<MediaValidationError[]> {
  const errors: MediaValidationError[] = []
  const s = settings || await getMediaSettings()

  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // Vi validerer ikke dimensjoner her - vi komprimerer i stedet
      // Dette er bare for informasjon
      resolve(errors)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      errors.push({
        field: 'dimensions',
        message: 'Kunne ikke lese bildedimensjoner',
        code: 'invalid_dimensions',
      })
      resolve(errors)
    }

    img.src = url
  })
}

/**
 * Sjekk om bruker kan laste opp flere bilder til en entitet
 */
export async function canUploadMore(
  entityType: MediaEntityType,
  entityId: string,
  filesToUpload: number,
  settings?: MediaSettings
): Promise<{ allowed: boolean; currentCount: number; maxCount: number; message?: string }> {
  const s = settings || await getMediaSettings()
  const supabase = createClient()

  // Hent nåværende antall
  const { count, error } = await supabase
    .from('media')
    .select('*', { count: 'exact', head: true })
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .is('deleted_at', null)

  if (error) {
    console.error('Failed to count media:', error)
    return {
      allowed: true, // La det gå gjennom, server vil validere
      currentCount: 0,
      maxCount: getMaxCount(entityType, s),
    }
  }

  const currentCount = count || 0
  const maxCount = getMaxCount(entityType, s)
  const wouldHave = currentCount + filesToUpload

  if (wouldHave > maxCount) {
    return {
      allowed: false,
      currentCount,
      maxCount,
      message: `Du kan laste opp ${maxCount - currentCount} flere bilder. Maks ${maxCount} totalt.`,
    }
  }

  return {
    allowed: true,
    currentCount,
    maxCount,
  }
}

/**
 * Hent maks antall bilder for en entitetstype
 */
function getMaxCount(entityType: MediaEntityType, settings: MediaSettings): number {
  if (entityType === 'post') {
    return settings.maxImagesPerPost
  }
  if (entityType.startsWith('geography_')) {
    return settings.maxImagesPerGeography
  }
  // Avatar og cover er alltid 1
  if (entityType.includes('avatar') || entityType.includes('cover') || entityType.includes('logo')) {
    return 1
  }
  // Default
  return 10
}

/**
 * Valider alle filer før opplasting
 */
export async function validateFiles(
  files: File[],
  entityType: MediaEntityType,
  entityId: string
): Promise<{
  valid: File[]
  invalid: Array<{ file: File; errors: MediaValidationError[] }>
  canUpload: boolean
  message?: string
}> {
  const settings = await getMediaSettings()

  // Sjekk om vi kan laste opp flere
  const uploadCheck = await canUploadMore(entityType, entityId, files.length, settings)
  if (!uploadCheck.allowed) {
    return {
      valid: [],
      invalid: files.map(file => ({
        file,
        errors: [{
          field: 'count',
          message: uploadCheck.message || 'For mange bilder',
          code: 'limit_exceeded',
        }],
      })),
      canUpload: false,
      message: uploadCheck.message,
    }
  }

  // Valider hver fil
  const valid: File[] = []
  const invalid: Array<{ file: File; errors: MediaValidationError[] }> = []

  for (const file of files) {
    const errors = await validateFile(file, settings)
    if (errors.length === 0) {
      valid.push(file)
    } else {
      invalid.push({ file, errors })
    }
  }

  // Begrens til tillatt antall
  const remainingSlots = uploadCheck.maxCount - uploadCheck.currentCount
  if (valid.length > remainingSlots) {
    const excess = valid.splice(remainingSlots)
    for (const file of excess) {
      invalid.push({
        file,
        errors: [{
          field: 'count',
          message: `Bare ${remainingSlots} bilder kan lastes opp`,
          code: 'limit_exceeded',
        }],
      })
    }
  }

  return {
    valid,
    invalid,
    canUpload: valid.length > 0,
    message: invalid.length > 0
      ? `${invalid.length} fil(er) ble ikke godkjent`
      : undefined,
  }
}
