// Shared types for post components

import type { GeographyScope } from '@/lib/types/geography'
import type { Product } from '@/lib/types/products'
import type { Service } from '@/lib/types/services'

export interface CommentLikeUser {
  id: string
  full_name: string | null
}

export interface Comment {
  id: string
  content: string
  created_at: string
  parent_id: string | null
  like_count: number
  user_has_liked?: boolean
  like_users?: CommentLikeUser[]
  user: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  replies?: Comment[]
  // New fields
  edited_at?: string | null
  deleted_at?: string | null
}

export interface LikeUser {
  id: string
  full_name: string | null
  avatar_url: string | null
}

// Post image from post_images table
export interface PostImage {
  id: string
  url: string
  thumbnail_url?: string | null
  width?: number | null
  height?: number | null
  sort_order: number
  title?: string | null
  caption?: string | null
  alt_text?: string | null
}

// Post video from post_videos table (Bunny Stream)
export interface PostVideo {
  id: string
  bunny_video_id: string
  thumbnail_url?: string | null
  playback_url?: string | null
  hls_url?: string | null
  duration?: number | null
  width?: number | null
  height?: number | null
  status: string
}

export interface PostData {
  id: string
  title: string
  content: string
  image_url?: string | null
  images?: PostImage[] // Multi-image support from post_images table
  video?: PostVideo | null // Video from Bunny Stream
  type: 'standard' | 'event'
  visibility: 'public' | 'friends' | 'circles'
  pinned?: boolean
  is_archived?: boolean
  event_date?: string | null
  event_time?: string | null
  event_location?: string | null
  created_at: string
  user: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  category: {
    name: string
    slug: string
    color: string
  } | null
  comment_count: number
  like_count: number
  user_has_liked?: boolean
  // Geography fields
  municipality_id?: string | null
  place_id?: string | null
  geography_scope?: GeographyScope
  municipality?: {
    id: string
    name: string
    slug: string
  } | null
  place?: {
    id: string
    name: string
    slug: string
  } | null
  // Display fields from RPC - hvor innlegget er publisert
  posted_from_name?: string
  posted_from_type?: 'group' | 'community' | 'place' | 'municipality' | 'private'
  posted_from_id?: string
  // Community context
  created_for_community_id?: string | null
  community?: {
    id: string
    name: string
    slug: string
    category?: string
  } | null
  // Product/Service promotion
  product_id?: string | null
  service_id?: string | null
  product?: Product | null
  service?: Service | null
  // New fields - soft delete and edit tracking
  deleted_at?: string | null
  deleted_by?: string | null
  deletion_reason?: string | null
  edited_at?: string | null
  edit_count?: number
  // Repost tracking
  user_has_reposted?: boolean
  repost_count?: number
}

export interface PostCardProps {
  post: PostData
  currentUserId?: string | null
  onClick?: () => void
  // Pin functionality for group admins/moderators
  canPin?: boolean
  onPin?: (postId: string, pinned: boolean) => Promise<void>
}

// Repost interface
export interface Repost {
  id: string
  post_id: string
  user_id: string
  repost_comment?: string | null
  created_at: string
  user: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

export const categoryColors: Record<string, string> = {
  arrangement: '#EF4444',
  aktivitet: '#3B82F6',
  nyhet: '#10B981',
  mote: '#F59E0B',
  sporsmal: '#8B5CF6',
  kunngjoring: '#EC4899',
  generelt: '#6B7280',
}
