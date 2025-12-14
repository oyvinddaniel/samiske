// Service (Tjeneste) helper functions

import { createClient } from '@/lib/supabase/client'
import type { Service, ServiceWithCommunity, ServicePriceType } from '@/lib/types/services'

/**
 * Get all active services
 */
export async function getServices(): Promise<ServiceWithCommunity[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      community:communities(
        id,
        name,
        slug,
        logo_url
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching services:', error)
    return []
  }

  return data || []
}

/**
 * Get featured services
 */
export async function getFeaturedServices(limit = 12): Promise<ServiceWithCommunity[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      community:communities(
        id,
        name,
        slug,
        logo_url
      )
    `)
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching featured services:', error)
    return []
  }

  return data || []
}

/**
 * Get services for a specific community
 */
export async function getServicesByCommunity(communityId: string): Promise<Service[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('community_id', communityId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching community services:', error)
    return []
  }

  return data || []
}

/**
 * Get service by ID
 */
export async function getServiceById(id: string): Promise<ServiceWithCommunity | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      community:communities(
        id,
        name,
        slug,
        logo_url
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching service:', error)
    return null
  }

  return data
}

/**
 * Get service by slug
 */
export async function getServiceBySlug(
  communitySlug: string,
  serviceSlug: string
): Promise<ServiceWithCommunity | null> {
  const supabase = createClient()

  const { data: community, error: communityError } = await supabase
    .from('communities')
    .select('id')
    .eq('slug', communitySlug)
    .single()

  if (communityError || !community) {
    console.error('Error fetching community:', communityError)
    return null
  }

  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      community:communities(
        id,
        name,
        slug,
        logo_url
      )
    `)
    .eq('community_id', community.id)
    .eq('slug', serviceSlug)
    .single()

  if (error) {
    console.error('Error fetching service:', error)
    return null
  }

  return data
}

/**
 * Create service
 */
export async function createService(
  communityId: string,
  userId: string,
  service: {
    name: string
    description?: string
    images?: string[]
    price?: number
    currency?: string
    price_type?: ServicePriceType
    contact_email?: string
    contact_phone?: string
    booking_url?: string
    search_tags?: string[]
    is_online?: boolean
  }
): Promise<{ success: boolean; service?: Service; error?: string }> {
  const supabase = createClient()

  // Generate slug from name
  const slug = service.name
    .toLowerCase()
    .replace(/[æÆ]/g, 'ae')
    .replace(/[øØ]/g, 'o')
    .replace(/[åÅ]/g, 'a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const { data, error } = await supabase
    .from('services')
    .insert({
      community_id: communityId,
      created_by: userId,
      slug,
      name: service.name,
      description: service.description || null,
      images: service.images || [],
      price: service.price || null,
      currency: service.currency || 'NOK',
      price_type: service.price_type || 'contact',
      contact_email: service.contact_email || null,
      contact_phone: service.contact_phone || null,
      booking_url: service.booking_url || null,
      search_tags: service.search_tags || [],
      is_online: service.is_online || false,
      is_active: true,
      is_featured: false
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating service:', error)
    return { success: false, error: error.message }
  }

  return { success: true, service: data }
}

/**
 * Update service
 */
export async function updateService(
  serviceId: string,
  updates: Partial<{
    name: string
    description: string | null
    images: string[]
    price: number | null
    currency: string
    price_type: ServicePriceType
    contact_email: string | null
    contact_phone: string | null
    booking_url: string | null
    search_tags: string[]
    is_online: boolean
    is_active: boolean
    is_featured: boolean
  }>
): Promise<{ success: boolean; service?: Service; error?: string }> {
  const supabase = createClient()

  // If name is being updated, regenerate slug
  if (updates.name) {
    const slug = updates.name
      .toLowerCase()
      .replace(/[æÆ]/g, 'ae')
      .replace(/[øØ]/g, 'o')
      .replace(/[åÅ]/g, 'a')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const { data, error } = await supabase
      .from('services')
      .update({ ...updates, slug })
      .eq('id', serviceId)
      .select()
      .single()

    if (error) {
      console.error('Error updating service:', error)
      return { success: false, error: error.message }
    }

    return { success: true, service: data }
  }

  const { data, error } = await supabase
    .from('services')
    .update(updates)
    .eq('id', serviceId)
    .select()
    .single()

  if (error) {
    console.error('Error updating service:', error)
    return { success: false, error: error.message }
  }

  return { success: true, service: data }
}

/**
 * Delete service (soft delete)
 */
export async function deleteService(
  serviceId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('services')
    .update({ is_active: false })
    .eq('id', serviceId)

  if (error) {
    console.error('Error deleting service:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Toggle service featured status
 */
export async function toggleServiceFeatured(
  serviceId: string,
  featured: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('services')
    .update({ is_featured: featured })
    .eq('id', serviceId)

  if (error) {
    console.error('Error toggling service featured:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
