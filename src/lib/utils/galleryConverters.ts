/**
 * Gallery Converters
 * Utilities for converting PostData to Gallery format with engagement data
 */

import { createClient } from '@/lib/supabase/client'
import type { GalleryContext, GalleryImage } from '@/lib/types/gallery'
import type { PostData } from '@/components/posts/types'

/**
 * Extract geographic context from post data
 */
function extractGeographyContext(post: PostData): NonNullable<GalleryContext['post_data']>['geography'] | undefined {
  // Check for municipality
  if (post.municipality_id && post.municipality) {
    return {
      type: 'municipality',
      id: post.municipality_id,
      name: typeof post.municipality === 'string' ? post.municipality : post.municipality.name,
      description: null, // Municipality objects don't have descriptions in the current schema
    }
  }

  // Check for place
  if (post.place_id && post.place) {
    return {
      type: 'place',
      id: post.place_id,
      name: typeof post.place === 'string' ? post.place : post.place.name,
      description: null, // Place objects don't have descriptions in the current schema
    }
  }

  // Note: language_area support is not yet implemented in PostData type

  return undefined
}

/**
 * Batch-fetch engagement data for multiple post_images
 * Returns a map of post_image_id -> engagement data
 */
async function fetchPostImageEngagement(
  postImageIds: string[],
  userId?: string
): Promise<Record<string, { comment_count: number; like_count: number; has_liked: boolean }>> {
  if (postImageIds.length === 0) {
    return {}
  }

  const supabase = createClient()

  // Use the database function for efficient batch fetching
  const { data, error } = await supabase.rpc('get_post_images_engagement', {
    p_post_image_ids: postImageIds,
    p_user_id: userId || null,
  })

  if (error) {
    console.error('Error fetching post image engagement:', error)
    return {}
  }

  // Convert array to map
  const engagementMap: Record<string, { comment_count: number; like_count: number; has_liked: boolean }> = {}

  if (data) {
    data.forEach((row: any) => {
      engagementMap[row.post_image_id] = {
        comment_count: row.comment_count || 0,
        like_count: row.like_count || 0,
        has_liked: row.user_has_liked || false,
      }
    })
  }

  return engagementMap
}

/**
 * Convert PostData to Gallery format (GalleryContext + GalleryImage[])
 * This is the main conversion function used by PostCard to prepare data for AdvancedGalleryViewer
 */
export async function convertPostToGalleryFormat(
  post: PostData,
  currentUserId?: string
): Promise<{
  context: GalleryContext
  images: GalleryImage[]
}> {
  // 1. Build GalleryContext with post metadata
  const context: GalleryContext = {
    type: 'post',
    entity_id: post.id,
    post_data: {
      id: post.id,
      title: post.title,
      content: post.content,
      user: {
        id: post.user.id,
        full_name: post.user.full_name || 'Ukjent bruker',
        avatar_url: post.user.avatar_url,
      },
      created_at: post.created_at,
      like_count: post.like_count || 0,
      comment_count: post.comment_count || 0,
      user_has_liked: post.user_has_liked,
      geography: extractGeographyContext(post),
    },
    can_comment: !!currentUserId,
    can_like: !!currentUserId,
  }

  // 2. Convert post_images to GalleryImage format
  const images: GalleryImage[] = (post.images || []).map((img) => ({
    id: img.id,
    url: img.url,
    post_image_id: img.id, // For engagement queries
    thumbnail_url: img.thumbnail_url || undefined,
    width: img.width || null,
    height: img.height || null,
    sort_order: img.sort_order,
  }))

  // 3. Batch-fetch engagement for all images (if user is logged in)
  if (images.length > 0 && currentUserId) {
    const imageIds = images.map((img) => img.post_image_id!)
    const engagement = await fetchPostImageEngagement(imageIds, currentUserId)

    // Attach engagement data to each image
    images.forEach((img) => {
      const data = engagement[img.post_image_id!]
      if (data) {
        img.comment_count = data.comment_count
        img.like_count = data.like_count
        img.has_liked = data.has_liked
      } else {
        // Default to zero if no engagement found
        img.comment_count = 0
        img.like_count = 0
        img.has_liked = false
      }
    })
  } else {
    // No user or no images - set defaults
    images.forEach((img) => {
      img.comment_count = 0
      img.like_count = 0
      img.has_liked = false
    })
  }

  return { context, images }
}

/**
 * Synchronous version for cases where engagement data is not needed immediately
 * (e.g., when opening masonry mode - engagement loaded on-demand)
 */
export function convertPostToGalleryFormatSync(
  post: PostData,
  currentUserId?: string
): {
  context: GalleryContext
  images: GalleryImage[]
} {
  const context: GalleryContext = {
    type: 'post',
    entity_id: post.id,
    post_data: {
      id: post.id,
      title: post.title,
      content: post.content,
      user: {
        id: post.user.id,
        full_name: post.user.full_name || 'Ukjent bruker',
        avatar_url: post.user.avatar_url,
      },
      created_at: post.created_at,
      like_count: post.like_count || 0,
      comment_count: post.comment_count || 0,
      user_has_liked: post.user_has_liked,
      geography: extractGeographyContext(post),
    },
    can_comment: !!currentUserId,
    can_like: !!currentUserId,
  }

  const images: GalleryImage[] = (post.images || []).map((img) => ({
    id: img.id,
    url: img.url,
    post_image_id: img.id,
    thumbnail_url: img.thumbnail_url || undefined,
    width: img.width || null,
    height: img.height || null,
    sort_order: img.sort_order,
    comment_count: 0, // Will be loaded on-demand
    like_count: 0,
    has_liked: false,
  }))

  return { context, images }
}
