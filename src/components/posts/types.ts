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
}

export interface LikeUser {
  id: string
  full_name: string | null
  avatar_url: string | null
}

export interface PostData {
  id: string
  title: string
  content: string
  image_url?: string | null
  type: 'standard' | 'event'
  visibility: 'public' | 'members'
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
  // Group and community context
  created_for_group_id?: string | null
  created_for_community_id?: string | null
  group?: {
    id: string
    name: string
    slug: string
    group_type?: 'open' | 'closed' | 'hidden'
  } | null
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
}

export interface PostCardProps {
  post: PostData
  currentUserId?: string | null
  onClick?: () => void
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
