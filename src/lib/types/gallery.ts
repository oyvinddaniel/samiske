/**
 * Gallery System Types
 * Global types for advanced gallery functionality
 */

export interface GalleryImage {
  id: string
  // Support both storage_path (media table) and url (post_images table)
  storage_path?: string
  url?: string
  post_image_id?: string // For engagement queries on post_images
  thumbnail_url?: string | null
  caption?: string | null
  alt_text?: string | null
  width?: number | null
  height?: number | null
  sort_order: number
  created_at?: string

  // Uploader info
  uploaded_by?: string | null
  original_uploader_id?: string
  uploader?: {
    id: string
    full_name: string
    avatar_url?: string | null
  }

  // Social features (IMAGE-level engagement)
  comment_count?: number
  like_count?: number
  has_liked?: boolean
}

export interface MediaComment {
  id: string
  media_id?: string | null // Nullable - polymorphic reference
  post_image_id?: string | null // Nullable - polymorphic reference
  user_id: string
  content: string
  created_at: string
  updated_at: string
  deleted_at?: string | null

  // Nested comments
  parent_id?: string | null
  reply_count?: number

  // Comment engagement
  like_count?: number
  has_liked?: boolean

  // User info
  user?: {
    id: string
    full_name: string
    avatar_url?: string | null
  }

  // Nested replies (populated client-side)
  replies?: MediaComment[]
}

export interface MediaLike {
  id: string
  media_id?: string | null // Nullable - polymorphic reference
  post_image_id?: string | null // Nullable - polymorphic reference
  user_id: string
  created_at: string
}

export interface GalleryContext {
  type: 'geography' | 'post' | 'profile' | 'community' | 'group' | 'event'
  entity_id: string
  entity_name?: string

  // Post-specific context (only for type='post')
  post_data?: {
    id: string
    title: string
    content: string
    user: {
      id: string
      full_name: string
      avatar_url?: string | null
    }
    created_at: string

    // POST-level engagement (different from image-level)
    like_count: number
    comment_count: number
    user_has_liked?: boolean

    // Geographic context (optional)
    geography?: {
      type: 'municipality' | 'place' | 'language_area'
      id: string
      name: string
      description?: string | null
    }
  }

  can_comment?: boolean
  can_like?: boolean
}

export type GalleryViewMode = 'masonry' | 'single'
