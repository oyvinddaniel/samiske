import { createClient } from '@/lib/supabase/client'
import type { Community, CommunityAdmin, CommunityFollower, CommunityCategory, AdminRole } from '@/lib/types/communities'

const supabase = createClient()

// Generate URL-friendly slug
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'o')
    .replace(/[å]/g, 'a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Create a new community
export async function createCommunity(
  params: {
    name: string
    description?: string
    category?: CommunityCategory
    municipalityId?: string
    placeId?: string
    email?: string
    phone?: string
    address?: string
    websiteUrl?: string
    logoUrl?: string
    coverImageUrl?: string
    images?: string[]
    industryIds?: string[]
  }
): Promise<string | null> {
  const slug = generateSlug(params.name)

  // First create the community via RPC
  // Note: municipality_id and place_id are no longer part of communities table
  // Location is handled via community_places table (many-to-many)
  const { data: communityId, error } = await supabase
    .rpc('create_community', {
      p_name: params.name,
      p_slug: slug,
      p_description: params.description || null,
      p_category: params.category || 'organization'
    })

  if (error) {
    console.error('Error creating community:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return null
  }

  // Update with additional fields if provided
  if (params.email || params.phone || params.address || params.websiteUrl ||
      params.logoUrl || params.coverImageUrl || params.images) {
    const updateData: Record<string, unknown> = {}

    if (params.email) updateData.email = params.email
    if (params.phone) updateData.phone = params.phone
    if (params.address) updateData.address = params.address
    if (params.websiteUrl) updateData.website_url = params.websiteUrl
    if (params.logoUrl) updateData.logo_url = params.logoUrl
    if (params.coverImageUrl) updateData.cover_image_url = params.coverImageUrl
    if (params.images) updateData.images = params.images

    const { error: updateError } = await supabase
      .from('communities')
      .update(updateData)
      .eq('id', communityId)

    if (updateError) {
      console.error('Error updating community fields:', updateError)
    }
  }

  // Add industries if provided
  if (params.industryIds && params.industryIds.length > 0) {
    const industryRecords = params.industryIds.map(industryId => ({
      community_id: communityId,
      industry_id: industryId
    }))

    const { error: industryError } = await supabase
      .from('community_industries')
      .insert(industryRecords)

    if (industryError) {
      console.error('Error adding community industries:', industryError)
      console.error('Industry error details:', JSON.stringify(industryError, null, 2))
    }
  }

  return communityId
}

// Get community by slug
export async function getCommunityBySlug(slug: string): Promise<Community | null> {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching community:', error)
    return null
  }

  return data
}

// Get community by ID
export async function getCommunityById(id: string): Promise<Community | null> {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching community:', error)
    return null
  }

  return data
}

// Follow a community
export async function followCommunity(communityId: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('follow_community', { p_community_id: communityId })

  if (error) {
    console.error('Error following community:', error)
    return false
  }

  return data
}

// Unfollow a community
export async function unfollowCommunity(communityId: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('unfollow_community', { p_community_id: communityId })

  if (error) {
    console.error('Error unfollowing community:', error)
    return false
  }

  return data
}

// Check if current user is following
export async function isFollowingCommunity(communityId: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('is_following_community', { p_community_id: communityId })

  if (error) {
    console.error('Error checking follow status:', error)
    return false
  }

  return data
}

// Check if current user is admin
export async function isCommunityAdmin(communityId: string): Promise<{ isAdmin: boolean; role: AdminRole | null }> {
  const { data, error } = await supabase
    .rpc('is_community_admin', { p_community_id: communityId })

  if (error) {
    console.error('Error checking admin status:', error)
    return { isAdmin: false, role: null }
  }

  if (data && data.length > 0) {
    return { isAdmin: data[0].is_admin, role: data[0].role as AdminRole }
  }

  return { isAdmin: false, role: null }
}

// Get communities the user follows
export async function getFollowedCommunities(): Promise<Community[]> {
  const { data, error } = await supabase
    .rpc('get_followed_communities')

  if (error) {
    console.error('Error fetching followed communities:', error)
    return []
  }

  return data || []
}

// Get communities the user administers
export async function getAdminCommunities(): Promise<(Community & { admin_role: AdminRole })[]> {
  const { data, error } = await supabase
    .rpc('get_admin_communities')

  if (error) {
    console.error('Error fetching admin communities:', error)
    return []
  }

  return data || []
}

// Get all communities (with pagination)
export async function getCommunities(
  limit = 20,
  offset = 0,
  category?: CommunityCategory
): Promise<Community[]> {
  let query = supabase
    .from('communities')
    .select('*')
    .eq('is_active', true)
    .order('follower_count', { ascending: false })
    .range(offset, offset + limit - 1)

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching communities:', error)
    return []
  }

  return data || []
}

// Search communities
export async function searchCommunities(searchTerm: string, limit = 10): Promise<Community[]> {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .eq('is_active', true)
    .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    .order('follower_count', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error searching communities:', error)
    return []
  }

  return data || []
}

// Get community admins
export async function getCommunityAdmins(communityId: string): Promise<CommunityAdmin[]> {
  const { data, error } = await supabase
    .from('community_admins')
    .select(`
      *,
      user:profiles(id, full_name, avatar_url)
    `)
    .eq('community_id', communityId)
    .order('role')

  if (error) {
    console.error('Error fetching community admins:', error)
    return []
  }

  return data || []
}

// Get community followers (with pagination)
export async function getCommunityFollowers(
  communityId: string,
  limit = 20,
  offset = 0
): Promise<CommunityFollower[]> {
  const { data, error } = await supabase
    .from('community_followers')
    .select(`
      *,
      user:profiles(id, full_name, avatar_url)
    `)
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching community followers:', error)
    return []
  }

  return data || []
}

// Update community
export async function updateCommunity(
  communityId: string,
  updates: Partial<Pick<Community, 'name' | 'description' | 'logo_url' | 'cover_image_url' | 'website_url' | 'email' | 'phone' | 'address' | 'category'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('communities')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', communityId)

  if (error) {
    console.error('Error updating community:', error)
    return false
  }

  return true
}

// Add admin to community
export async function addCommunityAdmin(
  communityId: string,
  userId: string,
  role: AdminRole = 'admin'
): Promise<boolean> {
  const { error } = await supabase
    .from('community_admins')
    .insert({
      community_id: communityId,
      user_id: userId,
      role
    })

  if (error) {
    console.error('Error adding community admin:', error)
    return false
  }

  return true
}

// Remove admin from community
export async function removeCommunityAdmin(communityId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('community_admins')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error removing community admin:', error)
    return false
  }

  return true
}

// Update admin role
export async function updateAdminRole(
  communityId: string,
  userId: string,
  newRole: AdminRole
): Promise<boolean> {
  const { error } = await supabase
    .from('community_admins')
    .update({ role: newRole })
    .eq('community_id', communityId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating admin role:', error)
    return false
  }

  return true
}
