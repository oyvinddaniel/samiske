/**
 * Opening Hours management functions
 */

import { createClient } from '@/lib/supabase/client'

export interface OpeningHours {
  id: string
  community_id: string
  day_of_week: number // 0=Søndag, 1=Mandag, etc.
  opens_at: string | null // HH:MM format
  closes_at: string | null // HH:MM format
  is_closed: boolean
  note: string | null
}

const dayNames = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag']
const dayNamesShort = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør']

/**
 * Get opening hours for a community
 */
export async function getOpeningHours(communityId: string): Promise<OpeningHours[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_opening_hours')
    .select('*')
    .eq('community_id', communityId)
    .order('day_of_week')

  if (error) {
    console.error('Error fetching opening hours:', error)
    return []
  }

  return data || []
}

/**
 * Set opening hours for a community (replaces all)
 */
export async function setOpeningHours(
  communityId: string,
  hours: Omit<OpeningHours, 'id' | 'community_id'>[]
): Promise<boolean> {
  const supabase = createClient()

  // Delete existing hours
  const { error: deleteError } = await supabase
    .from('community_opening_hours')
    .delete()
    .eq('community_id', communityId)

  if (deleteError) {
    console.error('Error deleting opening hours:', deleteError)
    return false
  }

  // Insert new hours
  if (hours.length === 0) return true

  const { error: insertError } = await supabase
    .from('community_opening_hours')
    .insert(
      hours.map(h => ({
        community_id: communityId,
        ...h
      }))
    )

  if (insertError) {
    console.error('Error inserting opening hours:', insertError)
    return false
  }

  return true
}

/**
 * Get day name
 */
export function getDayName(dayOfWeek: number, short = false): string {
  return short ? dayNamesShort[dayOfWeek] : dayNames[dayOfWeek]
}

/**
 * Format opening hours for display
 */
export function formatOpeningHours(hours: OpeningHours): string {
  if (hours.is_closed) {
    return 'Stengt'
  }

  if (!hours.opens_at || !hours.closes_at) {
    return 'Ikke oppgitt'
  }

  let text = `${hours.opens_at} - ${hours.closes_at}`

  if (hours.note) {
    text += ` (${hours.note})`
  }

  return text
}

/**
 * Check if currently open
 */
export function isCurrentlyOpen(hours: OpeningHours[]): boolean {
  const now = new Date()
  const currentDay = now.getDay()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const todayHours = hours.find(h => h.day_of_week === currentDay)

  if (!todayHours || todayHours.is_closed || !todayHours.opens_at || !todayHours.closes_at) {
    return false
  }

  return currentTime >= todayHours.opens_at && currentTime <= todayHours.closes_at
}

/**
 * Get today's opening hours text
 */
export function getTodayHours(hours: OpeningHours[]): string | null {
  const now = new Date()
  const currentDay = now.getDay()
  const todayHours = hours.find(h => h.day_of_week === currentDay)

  if (!todayHours) return null

  return formatOpeningHours(todayHours)
}

/**
 * Group consecutive days with same hours
 */
export function groupOpeningHours(hours: OpeningHours[]): Array<{
  days: string
  hours: string
}> {
  if (hours.length === 0) return []

  const grouped: Array<{ days: string; hours: string }> = []
  let currentGroup: { startDay: number; endDay: number; hours: string } | null = null

  for (const hour of hours) {
    const hoursText = formatOpeningHours(hour)

    if (!currentGroup) {
      currentGroup = {
        startDay: hour.day_of_week,
        endDay: hour.day_of_week,
        hours: hoursText
      }
    } else if (currentGroup.hours === hoursText && currentGroup.endDay === hour.day_of_week - 1) {
      // Same hours and consecutive day - extend group
      currentGroup.endDay = hour.day_of_week
    } else {
      // Different hours or not consecutive - save current group and start new
      grouped.push({
        days: currentGroup.startDay === currentGroup.endDay
          ? getDayName(currentGroup.startDay)
          : `${getDayName(currentGroup.startDay, true)} - ${getDayName(currentGroup.endDay, true)}`,
        hours: currentGroup.hours
      })
      currentGroup = {
        startDay: hour.day_of_week,
        endDay: hour.day_of_week,
        hours: hoursText
      }
    }
  }

  // Add last group
  if (currentGroup) {
    grouped.push({
      days: currentGroup.startDay === currentGroup.endDay
        ? getDayName(currentGroup.startDay)
        : `${getDayName(currentGroup.startDay, true)} - ${getDayName(currentGroup.endDay, true)}`,
      hours: currentGroup.hours
    })
  }

  return grouped
}
