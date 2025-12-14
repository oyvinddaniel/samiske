// Industry (Bransje) helper functions

import { createClient } from '@/lib/supabase/client'
import type { Industry } from '@/lib/types/industries'

/**
 * Get all approved and active industries
 */
export async function getIndustries(): Promise<Industry[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('industries')
    .select('*')
    .eq('is_approved', true)
    .eq('is_active', true)
    .order('name_no', { ascending: true })

  if (error) {
    console.error('Error fetching industries:', error)
    return []
  }

  return data || []
}

/**
 * Get all industries (including unapproved) - for platform admins
 */
export async function getAllIndustries(): Promise<Industry[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('industries')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all industries:', error)
    return []
  }

  return data || []
}

/**
 * Get industry by ID
 */
export async function getIndustryById(id: string): Promise<Industry | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('industries')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching industry:', error)
    return null
  }

  return data
}

/**
 * Get industry by slug
 */
export async function getIndustryBySlug(slug: string): Promise<Industry | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('industries')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching industry:', error)
    return null
  }

  return data
}

/**
 * Get industries for a specific community
 */
export async function getCommunityIndustries(communityId: string): Promise<Industry[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('community_industries')
    .select(`
      industry:industries(*)
    `)
    .eq('community_id', communityId)

  if (error) {
    console.error('Error fetching community industries:', error)
    return []
  }

  return (data?.map((item: any) => item.industry).filter(Boolean) as Industry[]) || []
}

/**
 * Create new industry (user suggestion, needs approval)
 */
export async function createIndustry(
  nameNo: string,
  userId: string
): Promise<{ success: boolean; industry?: Industry; error?: string }> {
  const supabase = createClient()

  // Generate slug from Norwegian name
  const slug = nameNo
    .toLowerCase()
    .replace(/[æÆ]/g, 'ae')
    .replace(/[øØ]/g, 'o')
    .replace(/[åÅ]/g, 'a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const { data, error } = await supabase
    .from('industries')
    .insert({
      slug,
      name_no: nameNo,
      created_by: userId,
      is_approved: false,
      is_active: true
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating industry:', error)
    return { success: false, error: error.message }
  }

  return { success: true, industry: data }
}

/**
 * Update industry (platform admins only)
 */
export async function updateIndustry(
  industryId: string,
  updates: Partial<{
    name_no: string
    name_sma: string | null
    name_sju: string | null
    name_sje: string | null
    name_smj: string | null
    name_se: string | null
    is_active: boolean
  }>
): Promise<{ success: boolean; industry?: Industry; error?: string }> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('industries')
    .update(updates)
    .eq('id', industryId)
    .select()
    .single()

  if (error) {
    console.error('Error updating industry:', error)
    return { success: false, error: error.message }
  }

  return { success: true, industry: data }
}

/**
 * Approve industry (platform admins only)
 */
export async function approveIndustry(
  industryId: string,
  userId: string
): Promise<{ success: boolean; industry?: Industry; error?: string }> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('industries')
    .update({
      is_approved: true,
      approved_by: userId,
      approved_at: new Date().toISOString()
    })
    .eq('id', industryId)
    .select()
    .single()

  if (error) {
    console.error('Error approving industry:', error)
    return { success: false, error: error.message }
  }

  return { success: true, industry: data }
}

/**
 * Reject/deactivate industry (platform admins only)
 */
export async function rejectIndustry(
  industryId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('industries')
    .update({
      is_active: false
    })
    .eq('id', industryId)

  if (error) {
    console.error('Error rejecting industry:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Add industries to community
 */
export async function addCommunityIndustries(
  communityId: string,
  industryIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const records = industryIds.map(industryId => ({
    community_id: communityId,
    industry_id: industryId
  }))

  const { error } = await supabase
    .from('community_industries')
    .insert(records)

  if (error) {
    console.error('Error adding community industries:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Remove industry from community
 */
export async function removeCommunityIndustry(
  communityId: string,
  industryId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('community_industries')
    .delete()
    .eq('community_id', communityId)
    .eq('industry_id', industryId)

  if (error) {
    console.error('Error removing community industry:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Set all industries for a community (replaces existing)
 */
export async function setCommunityIndustries(
  communityId: string,
  industryIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  // First, remove all existing industries
  const { error: deleteError } = await supabase
    .from('community_industries')
    .delete()
    .eq('community_id', communityId)

  if (deleteError) {
    console.error('Error removing existing industries:', deleteError)
    return { success: false, error: deleteError.message }
  }

  // Then add new industries
  if (industryIds.length > 0) {
    return addCommunityIndustries(communityId, industryIds)
  }

  return { success: true }
}
