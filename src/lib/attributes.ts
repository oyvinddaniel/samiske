/**
 * Community Attributes lib functions
 */

import { createClient } from '@/lib/supabase/client'
import type { Attribute, AttributeCategory } from '@/lib/types/communities'

/**
 * Hent alle godkjente attributter
 */
export async function getAttributes(): Promise<Attribute[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('attributes')
    .select('*')
    .eq('is_active', true)
    .eq('is_approved', true)
    .order('category')
    .order('name_no')

  if (error) {
    console.error('Error fetching attributes:', error)
    return []
  }

  return data || []
}

/**
 * Hent attributter etter kategori
 */
export async function getAttributesByCategory(
  category: AttributeCategory
): Promise<Attribute[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('attributes')
    .select('*')
    .eq('is_active', true)
    .eq('is_approved', true)
    .eq('category', category)
    .order('name_no')

  if (error) {
    console.error('Error fetching attributes by category:', error)
    return []
  }

  return data || []
}

/**
 * Hent attributter gruppert etter kategori
 */
export async function getAttributesGroupedByCategory(): Promise<
  Record<AttributeCategory, Attribute[]>
> {
  const attributes = await getAttributes()

  const grouped: Record<AttributeCategory, Attribute[]> = {
    accessibility: [],
    ownership: [],
    sustainability: [],
    language: [],
    certification: [],
    other: []
  }

  for (const attr of attributes) {
    if (grouped[attr.category]) {
      grouped[attr.category].push(attr)
    }
  }

  return grouped
}

/**
 * Hent attributt etter ID
 */
export async function getAttributeById(id: string): Promise<Attribute | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('attributes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching attribute:', error)
    return null
  }

  return data
}

/**
 * Hent community's attributter
 */
export async function getCommunityAttributes(
  communityId: string
): Promise<Attribute[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_attributes')
    .select(`
      attribute:attributes(*)
    `)
    .eq('community_id', communityId)

  if (error) {
    console.error('Error fetching community attributes:', error)
    return []
  }

  return data?.map(item => item.attribute as unknown as Attribute).filter(Boolean) || []
}

/**
 * Legg til attributt til community
 */
export async function addCommunityAttribute(
  communityId: string,
  attributeId: string
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('community_attributes')
    .insert({
      community_id: communityId,
      attribute_id: attributeId
    })

  if (error) {
    // Ignore duplicate error
    if (error.code === '23505') return true
    console.error('Error adding community attribute:', error)
    return false
  }

  return true
}

/**
 * Fjern attributt fra community
 */
export async function removeCommunityAttribute(
  communityId: string,
  attributeId: string
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('community_attributes')
    .delete()
    .eq('community_id', communityId)
    .eq('attribute_id', attributeId)

  if (error) {
    console.error('Error removing community attribute:', error)
    return false
  }

  return true
}

/**
 * Oppdater alle attributter for en community
 */
export async function setCommunityAttributes(
  communityId: string,
  attributeIds: string[]
): Promise<boolean> {
  const supabase = createClient()

  // Slett eksisterende
  const { error: deleteError } = await supabase
    .from('community_attributes')
    .delete()
    .eq('community_id', communityId)

  if (deleteError) {
    console.error('Error clearing community attributes:', deleteError)
    return false
  }

  // Legg til nye
  if (attributeIds.length === 0) return true

  const { error: insertError } = await supabase
    .from('community_attributes')
    .insert(
      attributeIds.map(attributeId => ({
        community_id: communityId,
        attribute_id: attributeId
      }))
    )

  if (insertError) {
    console.error('Error setting community attributes:', insertError)
    return false
  }

  return true
}

/**
 * Foreslå ny attributt (hybrid system)
 */
export async function suggestAttribute(data: {
  name_no: string
  name_se?: string
  category: AttributeCategory
  icon?: string
}): Promise<Attribute | null> {
  const supabase = createClient()

  // Generer slug
  const slug = data.name_no
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'o')
    .replace(/[å]/g, 'a')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  const { data: attribute, error } = await supabase
    .from('attributes')
    .insert({
      slug,
      name_no: data.name_no,
      name_se: data.name_se,
      category: data.category,
      icon: data.icon,
      is_approved: false  // Må godkjennes av admin
    })
    .select()
    .single()

  if (error) {
    console.error('Error suggesting attribute:', error)
    return null
  }

  return attribute
}

/**
 * Hent attributt display-navn (med språkstøtte)
 */
export function getAttributeDisplayName(
  attribute: Attribute,
  language: 'no' | 'se' | 'sma' | 'smj' = 'no'
): string {
  switch (language) {
    case 'se':
      return attribute.name_se || attribute.name_no
    case 'sma':
      return attribute.name_sma || attribute.name_no
    case 'smj':
      return attribute.name_smj || attribute.name_no
    default:
      return attribute.name_no
  }
}

// ============================================
// Admin functions (krever platform_admin rolle)
// ============================================

/**
 * Hent alle attributter (inkl. ikke-godkjente) for admin
 */
export async function getAllAttributesAdmin(): Promise<Attribute[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('attributes')
    .select('*')
    .eq('is_active', true)
    .order('is_approved')
    .order('category')
    .order('name_no')

  if (error) {
    console.error('Error fetching all attributes:', error)
    return []
  }

  return data || []
}

/**
 * Godkjenn foreslått attributt
 */
export async function approveAttribute(id: string): Promise<boolean> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('attributes')
    .update({
      is_approved: true,
      approved_by: user?.id
    })
    .eq('id', id)

  if (error) {
    console.error('Error approving attribute:', error)
    return false
  }

  return true
}

/**
 * Avvis/slett foreslått attributt
 */
export async function rejectAttribute(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('attributes')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    console.error('Error rejecting attribute:', error)
    return false
  }

  return true
}

/**
 * Opprett ny attributt (admin)
 */
export async function createAttribute(data: {
  slug: string
  name_no: string
  name_se?: string
  name_sma?: string
  name_smj?: string
  icon?: string
  category: AttributeCategory
  description?: string
}): Promise<Attribute | null> {
  const supabase = createClient()

  const { data: attribute, error } = await supabase
    .from('attributes')
    .insert({
      ...data,
      is_approved: true,
      is_active: true
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating attribute:', error)
    return null
  }

  return attribute
}

/**
 * Oppdater attributt (admin)
 */
export async function updateAttribute(
  id: string,
  data: Partial<Omit<Attribute, 'id' | 'created_at'>>
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('attributes')
    .update(data)
    .eq('id', id)

  if (error) {
    console.error('Error updating attribute:', error)
    return false
  }

  return true
}
