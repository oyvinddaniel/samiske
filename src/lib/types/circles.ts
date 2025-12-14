// Friend circles and visibility types

export type PostVisibility = 'public' | 'members' | 'friends' | 'circles' | 'only_me'

export interface FriendCircle {
  id: string
  user_id: string
  name: string
  color: string
  icon: string
  position: number
  created_at: string
  updated_at: string
  member_count?: number
}

export interface FriendCircleMember {
  id: string
  circle_id: string
  friend_id: string
  added_at: string
  // Joined data
  full_name?: string
  avatar_url?: string | null
}

export interface PostCircleVisibility {
  id: string
  post_id: string
  circle_id: string
  created_at: string
}

// For UI display
export interface CircleWithMembers extends FriendCircle {
  members: FriendCircleMember[]
}

// Labels for visibility options
export const visibilityLabels: Record<PostVisibility, string> = {
  public: 'Alle',
  members: 'Medlemmer',
  friends: 'Venner',
  circles: 'Utvalgte sirkler',
  only_me: 'Kun meg'
}

// Icons for visibility options (Lucide icon names)
export const visibilityIcons: Record<PostVisibility, string> = {
  public: 'Globe',
  members: 'Users',
  friends: 'UserCheck',
  circles: 'CircleDot',
  only_me: 'Lock'
}

// Default circle colors
export const circleColors = [
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
]

// Default circle icons (Lucide icon names)
export const circleIcons = [
  'users',
  'heart',
  'star',
  'briefcase',
  'home',
  'graduation-cap',
  'music',
  'gamepad-2',
]
