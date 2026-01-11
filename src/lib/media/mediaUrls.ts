/**
 * Media URL Generation
 * Genererer URLs med Supabase Image Transformation
 */

import { MediaSize, MEDIA_SIZES } from './mediaTypes'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

// Bucket name
export const MEDIA_BUCKET = 'media'

/**
 * Generer URL for et bilde med valgfri størrelse
 * Bruker Supabase Image Transformation for thumbnails
 */
export function getMediaUrl(
  storagePath: string,
  size: MediaSize = 'original'
): string {
  if (!SUPABASE_URL) {
    console.error('NEXT_PUBLIC_SUPABASE_URL is not defined')
    return ''
  }

  const baseUrl = `${SUPABASE_URL}/storage/v1`

  // Original - ingen transform
  if (size === 'original') {
    return `${baseUrl}/object/public/${MEDIA_BUCKET}/${storagePath}`
  }

  // Medium og thumb - bruk Image Transform
  const width = MEDIA_SIZES[size]
  if (!width) {
    return `${baseUrl}/object/public/${MEDIA_BUCKET}/${storagePath}`
  }

  // Supabase Image Transformation URL
  // Krever Supabase Pro plan
  return `${baseUrl}/render/image/public/${MEDIA_BUCKET}/${storagePath}?width=${width}&resize=contain&quality=80`
}

/**
 * Generer alle størrelser for et bilde
 * Nyttig for srcset/responsive images
 */
export function getMediaUrls(storagePath: string): Record<MediaSize, string> {
  return {
    original: getMediaUrl(storagePath, 'original'),
    medium: getMediaUrl(storagePath, 'medium'),
    thumb: getMediaUrl(storagePath, 'thumb'),
  }
}

/**
 * Generer srcset for responsive images
 */
export function getMediaSrcSet(storagePath: string): string {
  const urls = getMediaUrls(storagePath)
  return `${urls.thumb} 200w, ${urls.medium} 800w, ${urls.original} 1920w`
}

/**
 * Generer sizes attributt for responsive images
 */
export function getMediaSizes(defaultSize: 'thumb' | 'medium' | 'full' = 'medium'): string {
  switch (defaultSize) {
    case 'thumb':
      return '200px'
    case 'medium':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px'
    case 'full':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1920px'
    default:
      return '800px'
  }
}

/**
 * Sjekk om en URL er en media-URL fra vårt system
 */
export function isMediaUrl(url: string): boolean {
  if (!SUPABASE_URL) return false
  return url.startsWith(`${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/`)
    || url.startsWith(`${SUPABASE_URL}/storage/v1/render/image/public/${MEDIA_BUCKET}/`)
}

/**
 * Ekstraher storage path fra en full media-URL
 */
export function extractStoragePath(url: string): string | null {
  if (!SUPABASE_URL) return null

  // Object URL
  const objectPrefix = `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/`
  if (url.startsWith(objectPrefix)) {
    return url.slice(objectPrefix.length).split('?')[0]
  }

  // Render URL (med transform)
  const renderPrefix = `${SUPABASE_URL}/storage/v1/render/image/public/${MEDIA_BUCKET}/`
  if (url.startsWith(renderPrefix)) {
    return url.slice(renderPrefix.length).split('?')[0]
  }

  return null
}

/**
 * Konverter gammel bucket-URL til ny media-URL
 * Brukes under migrering
 */
export function convertLegacyUrl(oldUrl: string, newStoragePath: string): string {
  return getMediaUrl(newStoragePath, 'original')
}

/**
 * Generer placeholder URL for bilder som ikke finnes
 */
export function getPlaceholderUrl(width = 400, height = 300): string {
  return `https://placehold.co/${width}x${height}/e2e8f0/64748b?text=Bilde+mangler`
}

/**
 * Generer avatar placeholder
 */
export function getAvatarPlaceholder(name?: string): string {
  const initial = name?.charAt(0)?.toUpperCase() || '?'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=0D8ABC&color=fff&size=200`
}
