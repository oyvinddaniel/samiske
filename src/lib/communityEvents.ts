/**
 * Community event management functions for dedicated event calendars
 * Note: This is separate from event_rsvps which are for event posts
 */

import { createClient } from '@/lib/supabase/client'

export interface CommunityEvent {
  id: string
  community_id: string
  title: string
  description: string | null
  location: string | null
  starts_at: string
  ends_at: string | null
  is_all_day: boolean
  external_url: string | null
  image_url: string | null
  recurrence_rule: string | null
  recurrence_end: string | null
  parent_event_id: string | null
  timezone: string
  attendee_limit: number | null
  registration_required: boolean
  registration_url: string | null
  price: number | null
  currency: string
  created_by: string
  created_at: string
  is_active: boolean
}

export interface EventRegistration {
  id: string
  event_id: string
  user_id: string
  status: 'registered' | 'cancelled' | 'attended'
  registered_at: string
}

/**
 * Get events for a community
 */
export async function getCommunityEvents(
  communityId: string,
  options?: {
    includeInactive?: boolean
    startDate?: Date
    endDate?: Date
    limit?: number
  }
): Promise<CommunityEvent[]> {
  const supabase = createClient()

  let query = supabase
    .from('community_events')
    .select('*')
    .eq('community_id', communityId)

  if (!options?.includeInactive) {
    query = query.eq('is_active', true)
  }

  if (options?.startDate) {
    query = query.gte('starts_at', options.startDate.toISOString())
  }

  if (options?.endDate) {
    query = query.lte('starts_at', options.endDate.toISOString())
  }

  query = query.order('starts_at', { ascending: true })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching community events:', error)
    return []
  }

  return data || []
}

/**
 * Get a single event by ID
 */
export async function getCommunityEvent(eventId: string): Promise<CommunityEvent | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (error) {
    console.error('Error fetching community event:', error)
    return null
  }

  return data
}

/**
 * Create a new community event
 */
export async function createCommunityEvent(
  communityId: string,
  userId: string,
  event: {
    title: string
    description?: string
    location?: string
    starts_at: string
    ends_at?: string
    is_all_day?: boolean
    external_url?: string
    image_url?: string
    attendee_limit?: number
    registration_required?: boolean
    registration_url?: string
    price?: number
    currency?: string
    timezone?: string
  }
): Promise<CommunityEvent | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_events')
    .insert({
      community_id: communityId,
      created_by: userId,
      title: event.title,
      description: event.description || null,
      location: event.location || null,
      starts_at: event.starts_at,
      ends_at: event.ends_at || null,
      is_all_day: event.is_all_day || false,
      external_url: event.external_url || null,
      image_url: event.image_url || null,
      attendee_limit: event.attendee_limit || null,
      registration_required: event.registration_required || false,
      registration_url: event.registration_url || null,
      price: event.price || null,
      currency: event.currency || 'NOK',
      timezone: event.timezone || 'Europe/Oslo'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating community event:', error)
    return null
  }

  return data
}

/**
 * Update a community event
 */
export async function updateCommunityEvent(
  eventId: string,
  updates: Partial<Omit<CommunityEvent, 'id' | 'community_id' | 'created_by' | 'created_at'>>
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('community_events')
    .update(updates)
    .eq('id', eventId)

  if (error) {
    console.error('Error updating community event:', error)
    return false
  }

  return true
}

/**
 * Delete a community event (soft delete)
 */
export async function deleteCommunityEvent(eventId: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('community_events')
    .update({ is_active: false })
    .eq('id', eventId)

  if (error) {
    console.error('Error deleting community event:', error)
    return false
  }

  return true
}

/**
 * Register user for a community event
 */
export async function registerForCommunityEvent(
  eventId: string,
  userId: string
): Promise<EventRegistration | null> {
  const supabase = createClient()

  // Check if user is already registered
  const { data: existing } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    // Already registered, just update status if cancelled
    if (existing.status === 'cancelled') {
      const { data, error } = await supabase
        .from('event_registrations')
        .update({ status: 'registered' })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Error re-registering for community event:', error)
        return null
      }

      return data
    }
    return existing
  }

  // Check capacity
  const event = await getCommunityEvent(eventId)
  if (event?.attendee_limit) {
    const registrations = await getCommunityEventRegistrations(eventId)
    if (registrations.length >= event.attendee_limit) {
      console.error('Event is full')
      return null
    }
  }

  // Create new registration
  const { data, error } = await supabase
    .from('event_registrations')
    .insert({
      event_id: eventId,
      user_id: userId,
      status: 'registered'
    })
    .select()
    .single()

  if (error) {
    console.error('Error registering for community event:', error)
    return null
  }

  return data
}

/**
 * Cancel community event registration
 */
export async function cancelCommunityEventRegistration(
  eventId: string,
  userId: string
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('event_registrations')
    .update({ status: 'cancelled' })
    .eq('event_id', eventId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error cancelling community event registration:', error)
    return false
  }

  return true
}

/**
 * Get community event registrations
 */
export async function getCommunityEventRegistrations(
  eventId: string
): Promise<EventRegistration[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'registered')

  if (error) {
    console.error('Error fetching community event registrations:', error)
    return []
  }

  return data || []
}

/**
 * Check if user is registered for community event
 */
export async function isUserRegisteredForCommunityEvent(
  eventId: string,
  userId: string
): Promise<boolean> {
  const supabase = createClient()

  const { data } = await supabase
    .from('event_registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .eq('status', 'registered')
    .single()

  return !!data
}

/**
 * Format event date for display
 */
export function formatCommunityEventDate(
  startsAt: string,
  endsAt: string | null,
  isAllDay: boolean
): string {
  const start = new Date(startsAt)
  const end = endsAt ? new Date(endsAt) : null

  const dateFormat: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }

  const timeFormat: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit'
  }

  if (isAllDay) {
    if (end && end.toDateString() !== start.toDateString()) {
      return `${start.toLocaleDateString('nb-NO', dateFormat)} - ${end.toLocaleDateString('nb-NO', dateFormat)}`
    }
    return start.toLocaleDateString('nb-NO', dateFormat)
  }

  const startStr = `${start.toLocaleDateString('nb-NO', dateFormat)} kl. ${start.toLocaleTimeString('nb-NO', timeFormat)}`

  if (end) {
    if (end.toDateString() === start.toDateString()) {
      return `${startStr} - ${end.toLocaleTimeString('nb-NO', timeFormat)}`
    }
    return `${startStr} - ${end.toLocaleDateString('nb-NO', dateFormat)} kl. ${end.toLocaleTimeString('nb-NO', timeFormat)}`
  }

  return startStr
}

/**
 * Check if event is happening now
 */
export function isCommunityEventHappeningNow(event: CommunityEvent): boolean {
  const now = new Date()
  const start = new Date(event.starts_at)
  const end = event.ends_at ? new Date(event.ends_at) : null

  if (end) {
    return now >= start && now <= end
  }

  return false
}

/**
 * Check if event is upcoming (within next 7 days)
 */
export function isCommunityEventUpcoming(event: CommunityEvent): boolean {
  const now = new Date()
  const start = new Date(event.starts_at)
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  return start > now && start <= sevenDaysFromNow
}

/**
 * Check if event is in the past
 */
export function isCommunityEventPast(event: CommunityEvent): boolean {
  const now = new Date()
  const end = event.ends_at ? new Date(event.ends_at) : new Date(event.starts_at)

  return end < now
}

/**
 * Upload event image
 */
export async function uploadCommunityEventImage(
  communityId: string,
  file: File
): Promise<string | null> {
  const supabase = createClient()

  // Generate unique filename
  const timestamp = Date.now()
  const extension = file.name.split('.').pop()
  const filename = `${communityId}/${timestamp}.${extension}`

  const { data, error } = await supabase.storage
    .from('community-events')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Error uploading community event image:', error)
    return null
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('community-events')
    .getPublicUrl(data.path)

  return publicUrl
}

/**
 * Get available spots for event
 */
export async function getCommunityEventAvailableSpots(
  eventId: string
): Promise<number | null> {
  const event = await getCommunityEvent(eventId)
  if (!event?.attendee_limit) return null

  const registrations = await getCommunityEventRegistrations(eventId)
  return Math.max(0, event.attendee_limit - registrations.length)
}
