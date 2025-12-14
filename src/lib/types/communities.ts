// Community/Samfunn types

export type CommunityCategory =
  | 'organization'  // Organisasjon
  | 'business'      // Bedrift
  | 'institution'   // Institusjon
  | 'association'   // Forening
  | 'cultural'      // Kulturinstitusjon
  | 'educational'   // Utdanning
  | 'government'    // Offentlig
  | 'other'         // Annet

export type AdminRole = 'owner' | 'admin' | 'editor'

export interface Community {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_image_url: string | null
  website_url: string | null
  email: string | null
  phone: string | null
  municipality_id: string | null
  place_id: string | null
  address: string | null
  category: CommunityCategory
  created_by: string | null
  created_at: string
  updated_at: string
  follower_count: number
  post_count: number
  is_verified: boolean
  is_active: boolean
}

export interface CommunityAdmin {
  id: string
  community_id: string
  user_id: string
  role: AdminRole
  created_at: string
  user?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

export interface CommunityFollower {
  id: string
  community_id: string
  user_id: string
  created_at: string
  notify_posts: boolean
  notify_events: boolean
  user?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

export interface CommunityWithAdmin extends Community {
  admin_role?: AdminRole
}

// Labels for UI
export const categoryLabels: Record<CommunityCategory, string> = {
  organization: 'Organisasjon',
  business: 'Bedrift',
  institution: 'Institusjon',
  association: 'Forening',
  cultural: 'Kulturinstitusjon',
  educational: 'Utdanning',
  government: 'Offentlig',
  other: 'Annet'
}

export const adminRoleLabels: Record<AdminRole, string> = {
  owner: 'Eier',
  admin: 'Administrator',
  editor: 'Redaktør'
}

// Category icons (for use with lucide-react)
export const categoryIcons: Record<CommunityCategory, string> = {
  organization: 'Building2',
  business: 'Briefcase',
  institution: 'Landmark',
  association: 'Users',
  cultural: 'Palette',
  educational: 'GraduationCap',
  government: 'Building',
  other: 'CircleDot'
}
