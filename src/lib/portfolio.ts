/**
 * Portfolio management functions for artists and craftspeople
 */

import { createClient } from '@/lib/supabase/client'

export type MediaType = 'image' | 'video' | 'audio' | 'link'

export interface PortfolioItem {
  id: string
  community_id: string
  title: string
  description: string | null
  media_type: MediaType
  media_url: string
  thumbnail_url: string | null
  external_link: string | null
  sort_order: number
  created_at: string
  is_active: boolean
}

/**
 * Get portfolio items for a community
 */
export async function getPortfolioItems(communityId: string): Promise<PortfolioItem[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_portfolio_items')
    .select('*')
    .eq('community_id', communityId)
    .eq('is_active', true)
    .order('sort_order')

  if (error) {
    console.error('Error fetching portfolio items:', error)
    return []
  }

  return data || []
}

/**
 * Create a new portfolio item
 */
export async function createPortfolioItem(
  communityId: string,
  item: {
    title: string
    description?: string
    media_type: MediaType
    media_url: string
    thumbnail_url?: string
    external_link?: string
  }
): Promise<PortfolioItem | null> {
  const supabase = createClient()

  // Get the highest sort order
  const { data: existing } = await supabase
    .from('community_portfolio_items')
    .select('sort_order')
    .eq('community_id', communityId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSortOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { data, error } = await supabase
    .from('community_portfolio_items')
    .insert({
      community_id: communityId,
      title: item.title,
      description: item.description || null,
      media_type: item.media_type,
      media_url: item.media_url,
      thumbnail_url: item.thumbnail_url || null,
      external_link: item.external_link || null,
      sort_order: nextSortOrder
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating portfolio item:', error)
    return null
  }

  return data
}

/**
 * Update a portfolio item
 */
export async function updatePortfolioItem(
  id: string,
  updates: {
    title?: string
    description?: string
    media_url?: string
    thumbnail_url?: string
    external_link?: string
  }
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('community_portfolio_items')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error updating portfolio item:', error)
    return false
  }

  return true
}

/**
 * Delete a portfolio item (soft delete)
 */
export async function deletePortfolioItem(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('community_portfolio_items')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    console.error('Error deleting portfolio item:', error)
    return false
  }

  return true
}

/**
 * Reorder portfolio items
 */
export async function reorderPortfolioItems(
  items: { id: string; sort_order: number }[]
): Promise<boolean> {
  const supabase = createClient()

  const updates = items.map(item =>
    supabase
      .from('community_portfolio_items')
      .update({ sort_order: item.sort_order })
      .eq('id', item.id)
  )

  try {
    await Promise.all(updates)
    return true
  } catch (error) {
    console.error('Error reordering portfolio items:', error)
    return false
  }
}

/**
 * Upload portfolio media file
 */
export async function uploadPortfolioMedia(
  communityId: string,
  file: File,
  mediaType: MediaType
): Promise<string | null> {
  const supabase = createClient()

  // Generate unique filename
  const timestamp = Date.now()
  const extension = file.name.split('.').pop()
  const filename = `${communityId}/${timestamp}.${extension}`

  const { data, error } = await supabase.storage
    .from('community-portfolio')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Error uploading portfolio media:', error)
    return null
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('community-portfolio')
    .getPublicUrl(data.path)

  return publicUrl
}

/**
 * Get media type icon
 */
export function getMediaTypeIcon(mediaType: MediaType): string {
  const icons: Record<MediaType, string> = {
    image: '🖼️',
    video: '🎥',
    audio: '🎵',
    link: '🔗'
  }
  return icons[mediaType]
}

/**
 * Validate media URL
 */
export function isValidMediaUrl(url: string, mediaType: MediaType): boolean {
  if (!url.trim()) return false

  try {
    new URL(url)

    // For images, check common extensions
    if (mediaType === 'image') {
      return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)
    }

    // For videos, check common extensions or platforms
    if (mediaType === 'video') {
      return /\.(mp4|webm|mov)$/i.test(url) ||
             url.includes('youtube.com') ||
             url.includes('youtu.be') ||
             url.includes('vimeo.com')
    }

    // For audio, check common extensions
    if (mediaType === 'audio') {
      return /\.(mp3|wav|ogg|m4a)$/i.test(url)
    }

    return true
  } catch {
    return false
  }
}
