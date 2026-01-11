/**
 * Media Compression
 * Komprimerer bilder på klient-siden før opplasting
 */

import imageCompression from 'browser-image-compression'
import { MediaEntityType, MEDIA_SIZES } from './mediaTypes'

export interface CompressionOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  quality?: number
}

/**
 * Komprimerer et bilde basert på entity type
 * Forskjellige innstillinger for forskjellige bruksområder
 */
export async function compressForEntity(
  file: File,
  entityType: MediaEntityType
): Promise<File> {
  const options = getCompressionOptionsForEntity(entityType)
  return compressMedia(file, options)
}

/**
 * Hent kompresjonsinnstillinger basert på entity type
 */
function getCompressionOptionsForEntity(entityType: MediaEntityType): CompressionOptions {
  switch (entityType) {
    // Profilbilder - små og kompakte
    case 'profile_avatar':
    case 'group_avatar':
    case 'community_logo':
      return {
        maxSizeMB: 0.1,       // 100KB
        maxWidthOrHeight: 400,
        quality: 0.8,
      }

    // Cover-bilder - større men fortsatt kompakte
    case 'profile_cover':
    case 'group_cover':
    case 'event_cover':
      return {
        maxSizeMB: 0.3,       // 300KB
        maxWidthOrHeight: 1200,
        quality: 0.8,
      }

    // Innleggsbilder - balanse mellom kvalitet og størrelse
    case 'post':
      return {
        maxSizeMB: 0.2,       // 200KB
        maxWidthOrHeight: 1200,
        quality: 0.75,
      }

    // Geografiske bilder - høyere kvalitet for landskap
    case 'geography_language_area':
    case 'geography_municipality':
    case 'geography_place':
      return {
        maxSizeMB: 0.3,       // 300KB
        maxWidthOrHeight: 1600,
        quality: 0.8,
      }

    // Bug reports - kan trenge detaljer
    case 'bug_report':
      return {
        maxSizeMB: 0.5,       // 500KB
        maxWidthOrHeight: 1920,
        quality: 0.85,
      }

    // Default
    default:
      return {
        maxSizeMB: 0.3,
        maxWidthOrHeight: MEDIA_SIZES.original || 1920,
        quality: 0.8,
      }
  }
}

/**
 * Hovedfunksjon for bildekomprimering
 */
export async function compressMedia(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxSizeMB = 0.3,
    maxWidthOrHeight = 1920,
    quality = 0.8,
  } = options

  // Sjekk om filen allerede er liten nok
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file
  }

  // Sjekk om det er et bilde
  if (!file.type.startsWith('image/')) {
    console.warn('Not an image file, skipping compression:', file.type)
    return file
  }

  // GIF-filer komprimeres ikke (beholder animasjon)
  if (file.type === 'image/gif') {
    console.log('GIF detected, skipping compression to preserve animation')
    return file
  }

  const compressionOptions = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    initialQuality: quality,
    preserveExif: false,
    fileType: 'image/jpeg' as const,
  }

  try {
    const compressedFile = await imageCompression(file, compressionOptions)

    console.log(
      `Compressed ${file.name}: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB`
    )

    return compressedFile
  } catch (error) {
    console.error('Image compression failed:', error)
    // Returner original fil hvis komprimering feiler
    return file
  }
}

/**
 * Komprimer flere bilder parallelt
 */
export async function compressMultiple(
  files: File[],
  entityType: MediaEntityType,
  onProgress?: (completed: number, total: number) => void
): Promise<File[]> {
  const options = getCompressionOptionsForEntity(entityType)
  const results: File[] = []

  for (let i = 0; i < files.length; i++) {
    const compressed = await compressMedia(files[i], options)
    results.push(compressed)
    onProgress?.(i + 1, files.length)
  }

  return results
}

/**
 * Hent bildedimensjoner
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not load image'))
    }

    img.src = url
  })
}

/**
 * Beregn optimal størrelse mens aspektforhold bevares
 */
export function calculateResizedDimensions(
  originalWidth: number,
  originalHeight: number,
  maxDimension: number
): { width: number; height: number } {
  if (originalWidth <= maxDimension && originalHeight <= maxDimension) {
    return { width: originalWidth, height: originalHeight }
  }

  const aspectRatio = originalWidth / originalHeight

  if (originalWidth > originalHeight) {
    return {
      width: maxDimension,
      height: Math.round(maxDimension / aspectRatio),
    }
  } else {
    return {
      width: Math.round(maxDimension * aspectRatio),
      height: maxDimension,
    }
  }
}
