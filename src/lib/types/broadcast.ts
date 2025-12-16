/**
 * Broadcast Messages Types
 *
 * Types for the broadcast message system that allows
 * the owner to send informational messages to all users.
 */

export interface BroadcastMessage {
  id: string
  title: string
  content: string
  created_at: string
  created_by: string
  is_active: boolean
  priority: number
}

export interface BroadcastDismissal {
  user_id: string
  broadcast_id: string
  dismissed_at: string
}

export interface BroadcastWithProfile extends BroadcastMessage {
  profiles?: {
    full_name: string
    avatar_url?: string
  }
}
