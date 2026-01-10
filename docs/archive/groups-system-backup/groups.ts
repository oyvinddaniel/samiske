// Group helper functions

import { createClient } from '@/lib/supabase/client'
import type { Group, GroupMember, UserGroup, GroupType, MemberStatus } from '@/lib/types/groups'

// Create a new group
// NOTE: Geographic association is now handled separately via group_places table
// Use GroupSettingsDialog to add geography after creation
export async function createGroup(
  name: string,
  slug: string,
  description?: string,
  groupType: GroupType = 'open'
): Promise<{ id: string | null; error: string | null }> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('create_group', {
    name_param: name,
    slug_param: slug,
    description_param: description || null,
    group_type_param: groupType,
  })

  if (error) {
    console.error('Error creating group:', error)
    return { id: null, error: error.message }
  }

  return { id: data, error: null }
}

// Join a group
export async function joinGroup(
  groupId: string
): Promise<{ status: string; error: string | null }> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('join_group', {
    group_id_param: groupId,
  })

  if (error) {
    console.error('Error joining group:', error)
    return { status: 'error', error: error.message }
  }

  return { status: data, error: null }
}

// Leave a group
export async function leaveGroup(groupId: string): Promise<boolean> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user.id)

  return !error
}

// Approve a pending member
export async function approveMember(
  groupId: string,
  userId: string
): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('approve_member', {
    group_id_param: groupId,
    user_id_param: userId,
  })

  if (error) {
    console.error('Error approving member:', error)
    return false
  }

  return data === true
}

// Reject a pending member
export async function rejectMember(
  groupId: string,
  userId: string
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('group_members')
    .update({ status: 'rejected' })
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('status', 'pending')

  return !error
}

// Get user's groups
export async function getUserGroups(userId?: string): Promise<UserGroup[]> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('get_user_groups', {
    user_id_param: userId || null,
  })

  if (error) {
    console.error('Error fetching user groups:', error)
    return []
  }

  return data || []
}

// Get group by slug
export async function getGroupBySlug(slug: string): Promise<Group | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error('Error fetching group:', error.message || error)
    return null
  }

  return data
}

// Get group members
export async function getGroupMembers(
  groupId: string,
  status: 'approved' | 'pending' | 'all' = 'approved'
): Promise<GroupMember[]> {
  const supabase = createClient()

  // First get members
  let query = supabase
    .from('group_members')
    .select('id, group_id, user_id, role, status, joined_at, approved_by, approved_at')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: false })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: members, error } = await query

  if (error) {
    console.error('Error fetching group members:', error.message || error)
    return []
  }

  if (!members || members.length === 0) {
    return []
  }

  // Then get user profiles separately
  const userIds = members.map(m => m.user_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds)

  const profilesMap = (profiles || []).reduce((acc, p) => {
    acc[p.id] = p
    return acc
  }, {} as Record<string, { id: string; full_name: string | null; avatar_url: string | null }>)

  return members.map(m => ({
    ...m,
    user: profilesMap[m.user_id] || null,
  }))
}

// Check if user is member of group
export async function isGroupMember(groupId: string): Promise<{
  isMember: boolean
  role: string | null
  status: MemberStatus | null
}> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { isMember: false, role: null, status: null }

  const { data, error } = await supabase
    .from('group_members')
    .select('role, status')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return { isMember: false, role: null, status: null }
  }

  return {
    isMember: data.status === 'approved',
    role: data.role,
    status: data.status,
  }
}

// Update member role
export async function updateMemberRole(
  groupId: string,
  userId: string,
  newRole: 'member' | 'moderator' | 'admin'
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('group_members')
    .update({ role: newRole })
    .eq('group_id', groupId)
    .eq('user_id', userId)

  return !error
}

// Generate slug from name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'o')
    .replace(/[å]/g, 'a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Delete a group (admin only)
export async function deleteGroup(
  groupId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('delete_group', {
    p_group_id: groupId,
  })

  if (error) {
    console.error('Error deleting group:', error)
    return { success: false, error: error.message }
  }

  return { success: data === true, error: null }
}

// Remove a member from group (admin/moderator only)
export async function removeGroupMember(
  groupId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('remove_group_member', {
    p_group_id: groupId,
    p_user_id: userId,
  })

  if (error) {
    console.error('Error removing member:', error)
    return { success: false, error: error.message }
  }

  return { success: data === true, error: null }
}

// Transfer group ownership to another member (admin only)
export async function transferGroupOwnership(
  groupId: string,
  newOwnerId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('transfer_group_ownership', {
    p_group_id: groupId,
    p_new_owner_id: newOwnerId,
  })

  if (error) {
    console.error('Error transferring ownership:', error)
    return { success: false, error: error.message }
  }

  return { success: data === true, error: null }
}

// Get group statistics (members only)
export interface GroupStatistics {
  member_count: number
  post_count: number
  event_count: number
  members_this_week: number
  posts_this_week: number
  pending_members: number
}

export async function getGroupStatistics(
  groupId: string
): Promise<{ data: GroupStatistics | null; error: string | null }> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('get_group_statistics', {
    p_group_id: groupId,
  })

  if (error) {
    console.error('Error fetching group statistics:', error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

// Update group information (admin only)
export async function updateGroup(
  groupId: string,
  updates: {
    name?: string
    description?: string
    image_url?: string
    group_type?: GroupType
    welcome_message?: string
  }
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('update_group', {
    p_group_id: groupId,
    p_name: updates.name || null,
    p_description: updates.description || null,
    p_image_url: updates.image_url || null,
    p_group_type: updates.group_type || null,
    p_welcome_message: updates.welcome_message || null,
  })

  if (error) {
    console.error('Error updating group:', error)
    return { success: false, error: error.message }
  }

  return { success: data === true, error: null }
}

// Get/set group notification preferences
export interface GroupNotificationPreferences {
  notify_new_posts: boolean
  notify_events: boolean
  notify_comments_own_posts: boolean
  notify_mentions: boolean
  notification_frequency: 'instant' | 'daily' | 'weekly' | 'none'
}

export async function getGroupNotificationPreferences(
  groupId: string
): Promise<GroupNotificationPreferences | null> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('group_notification_preferences')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching notification preferences:', error)
    return null
  }

  // Return defaults if no preferences exist
  if (!data) {
    return {
      notify_new_posts: true,
      notify_events: true,
      notify_comments_own_posts: true,
      notify_mentions: true,
      notification_frequency: 'instant',
    }
  }

  return data
}

export async function updateGroupNotificationPreferences(
  groupId: string,
  preferences: Partial<GroupNotificationPreferences>
): Promise<boolean> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('group_notification_preferences')
    .upsert({
      group_id: groupId,
      user_id: user.id,
      ...preferences,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'group_id,user_id',
    })

  return !error
}

// Check if user has seen welcome message
export async function hasSeenWelcomeMessage(groupId: string): Promise<boolean> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return true // No user = don't show

  const { data } = await supabase
    .from('group_welcome_seen')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  return !!data
}

export async function markWelcomeMessageSeen(groupId: string): Promise<boolean> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('group_welcome_seen')
    .insert({
      group_id: groupId,
      user_id: user.id,
    })

  return !error
}
