// Event RSVP Functions
// Phase 8: Arrangementer med RSVP

import { createClient } from '@/lib/supabase/client'
import type { RSVPStatus, RSVPCounts, RSVPUser, EventRSVP } from '@/lib/types/events'

const supabase = createClient()

/**
 * Event capacity info
 */
export interface EventCapacity {
  max_participants: number | null
  going_count: number
  spots_remaining: number | null
  is_full: boolean
}

/**
 * Get event capacity info
 */
export async function getEventCapacity(postId: string): Promise<EventCapacity | null> {
  const { data, error } = await supabase.rpc('get_event_capacity', {
    p_post_id: postId
  })

  if (error) {
    console.error('Error getting event capacity:', error)
    return null
  }

  return data
}

/**
 * Set or update RSVP status for an event
 * Returns { success: true, data: EventRSVP } or { success: false, error: string }
 */
export async function setEventRSVP(
  postId: string,
  status: RSVPStatus
): Promise<{ success: true, data: EventRSVP } | { success: false, error: string }> {
  const { data, error } = await supabase.rpc('set_event_rsvp', {
    p_post_id: postId,
    p_status: status
  })

  if (error) {
    console.error('Error setting RSVP:', error)
    // Check if this is a capacity error
    if (error.message?.includes('fullt') || error.message?.includes('full')) {
      return { success: false, error: 'Arrangementet er fullt' }
    }
    return { success: false, error: 'Kunne ikke oppdatere RSVP' }
  }

  return { success: true, data }
}

/**
 * Remove RSVP from an event
 */
export async function removeEventRSVP(postId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('remove_event_rsvp', {
    p_post_id: postId
  })

  if (error) {
    console.error('Error removing RSVP:', error)
    return false
  }

  return data
}

/**
 * Get user's RSVP status for an event
 */
export async function getUserRSVPStatus(
  postId: string
): Promise<RSVPStatus | null> {
  const { data, error } = await supabase.rpc('get_user_rsvp_status', {
    p_post_id: postId
  })

  if (error) {
    console.error('Error getting RSVP status:', error)
    return null
  }

  return data as RSVPStatus | null
}

/**
 * Get RSVP counts for an event
 */
export async function getEventRSVPCounts(postId: string): Promise<RSVPCounts> {
  const { data, error } = await supabase.rpc('get_event_rsvp_counts', {
    p_post_id: postId
  })

  if (error) {
    console.error('Error getting RSVP counts:', error)
    return { interested_count: 0, going_count: 0 }
  }

  // RPC returns array with single row
  const result = Array.isArray(data) ? data[0] : data
  return {
    interested_count: result?.interested_count ?? 0,
    going_count: result?.going_count ?? 0
  }
}

/**
 * Get list of users who RSVPed to an event
 */
export async function getEventRSVPUsers(
  postId: string,
  status?: RSVPStatus,
  limit: number = 50,
  offset: number = 0
): Promise<RSVPUser[]> {
  const { data, error } = await supabase.rpc('get_event_rsvp_users', {
    p_post_id: postId,
    p_status: status ?? null,
    p_limit: limit,
    p_offset: offset
  })

  if (error) {
    console.error('Error getting RSVP users:', error)
    return []
  }

  return data || []
}

/**
 * Get RSVPs for multiple posts at once (for feed optimization)
 */
export async function getEventRSVPCountsBatch(
  postIds: string[]
): Promise<Map<string, RSVPCounts>> {
  const result = new Map<string, RSVPCounts>()

  if (postIds.length === 0) return result

  const { data, error } = await supabase
    .from('event_rsvps')
    .select('post_id, status')
    .in('post_id', postIds)

  if (error) {
    console.error('Error getting batch RSVP counts:', error)
    return result
  }

  // Initialize all posts with zero counts
  for (const id of postIds) {
    result.set(id, { interested_count: 0, going_count: 0 })
  }

  // Count RSVPs per post
  for (const rsvp of data || []) {
    const counts = result.get(rsvp.post_id)!
    if (rsvp.status === 'interested') {
      counts.interested_count++
    } else if (rsvp.status === 'going') {
      counts.going_count++
    }
  }

  return result
}

/**
 * Get user's RSVP statuses for multiple posts at once (for feed optimization)
 */
export async function getUserRSVPStatusBatch(
  postIds: string[],
  userId: string
): Promise<Map<string, RSVPStatus>> {
  const result = new Map<string, RSVPStatus>()

  if (postIds.length === 0 || !userId) return result

  const { data, error } = await supabase
    .from('event_rsvps')
    .select('post_id, status')
    .eq('user_id', userId)
    .in('post_id', postIds)

  if (error) {
    console.error('Error getting batch user RSVP statuses:', error)
    return result
  }

  for (const rsvp of data || []) {
    result.set(rsvp.post_id, rsvp.status as RSVPStatus)
  }

  return result
}
