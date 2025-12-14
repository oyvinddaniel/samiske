// Event RSVP Types
// Phase 8: Arrangementer med RSVP

export type RSVPStatus = 'interested' | 'going'

export interface EventRSVP {
  id: string
  post_id: string
  user_id: string
  status: RSVPStatus
  created_at: string
  updated_at: string
}

export interface RSVPCounts {
  interested_count: number
  going_count: number
}

export interface RSVPUser {
  user_id: string
  username: string
  avatar_url: string | null
  status: RSVPStatus
  created_at: string
}

// Labels for UI
export const rsvpStatusLabels: Record<RSVPStatus, string> = {
  interested: 'Interessert',
  going: 'Skal delta'
}
