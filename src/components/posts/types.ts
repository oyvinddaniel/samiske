// Shared types for post components

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
}

export interface PostCardProps {
  post: PostData
  currentUserId?: string
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
