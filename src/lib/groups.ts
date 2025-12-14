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
