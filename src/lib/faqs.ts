/**
 * FAQ (Frequently Asked Questions) management functions
 */

import { createClient } from '@/lib/supabase/client'

export interface FAQ {
  id: string
  community_id: string
  question: string
  answer: string
  sort_order: number
  is_active: boolean
  created_at: string
}

/**
 * Get FAQs for a community
 */
export async function getFAQs(communityId: string): Promise<FAQ[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_faqs')
    .select('*')
    .eq('community_id', communityId)
    .eq('is_active', true)
    .order('sort_order')

  if (error) {
    console.error('Error fetching FAQs:', error)
    return []
  }

  return data || []
}

/**
 * Create a new FAQ
 */
export async function createFAQ(
  communityId: string,
  question: string,
  answer: string
): Promise<FAQ | null> {
  const supabase = createClient()

  // Get the highest sort order
  const { data: existing } = await supabase
    .from('community_faqs')
    .select('sort_order')
    .eq('community_id', communityId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSortOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { data, error } = await supabase
    .from('community_faqs')
    .insert({
      community_id: communityId,
      question,
      answer,
      sort_order: nextSortOrder
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating FAQ:', error)
    return null
  }

  return data
}

/**
 * Update a FAQ
 */
export async function updateFAQ(
  id: string,
  question: string,
  answer: string
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('community_faqs')
    .update({ question, answer })
    .eq('id', id)

  if (error) {
    console.error('Error updating FAQ:', error)
    return false
  }

  return true
}

/**
 * Delete a FAQ
 */
export async function deleteFAQ(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('community_faqs')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    console.error('Error deleting FAQ:', error)
    return false
  }

  return true
}

/**
 * Reorder FAQs
 */
export async function reorderFAQs(
  faqs: { id: string; sort_order: number }[]
): Promise<boolean> {
  const supabase = createClient()

  const updates = faqs.map(faq =>
    supabase
      .from('community_faqs')
      .update({ sort_order: faq.sort_order })
      .eq('id', faq.id)
  )

  try {
    await Promise.all(updates)
    return true
  } catch (error) {
    console.error('Error reordering FAQs:', error)
    return false
  }
}
