// Group types

export type GroupType = 'open' | 'closed' | 'hidden'
export type MemberRole = 'member' | 'moderator' | 'admin'
export type MemberStatus = 'pending' | 'approved' | 'rejected'
export type InviteStatus = 'pending' | 'accepted' | 'declined'

export interface Group {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  group_type: GroupType
  municipality_id: string | null
  place_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  member_count: number
  post_count: number
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: MemberRole
  status: MemberStatus
  joined_at: string
  approved_by: string | null
  approved_at: string | null
  // Joined user data
  user?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

export interface GroupInvite {
  id: string
  group_id: string
  invited_user_id: string
  invited_by: string
  status: InviteStatus
  created_at: string
  responded_at: string | null
  // Joined data
  group?: Group
  invited_user?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

export interface UserGroup extends Group {
  user_role: MemberRole
  user_status: MemberStatus
}

// Labels for UI
export const groupTypeLabels: Record<GroupType, string> = {
  open: 'Åpen',
  closed: 'Lukket',
  hidden: 'Skjult',
}

export const groupTypeDescriptions: Record<GroupType, string> = {
  open: 'Alle kan se gruppen og bli med',
  closed: 'Alle kan se gruppen, men må godkjennes for å bli med',
  hidden: 'Kun medlemmer kan se at gruppen eksisterer',
}

export const memberRoleLabels: Record<MemberRole, string> = {
  member: 'Medlem',
  moderator: 'Moderator',
  admin: 'Administrator',
}
