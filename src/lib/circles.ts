import { createClient } from '@/lib/supabase/client'
import type { FriendCircle, FriendCircleMember } from '@/lib/types/circles'

const supabase = createClient()

// Create a new circle
export async function createCircle(
  name: string,
  color = '#3B82F6',
  icon = 'users'
): Promise<string | null> {
  const { data, error } = await supabase
    .rpc('create_friend_circle', {
      p_name: name,
      p_color: color,
      p_icon: icon
    })

  if (error) {
    console.error('Error creating circle:', error)
    return null
  }

  return data
}

// Get user's circles
export async function getUserCircles(): Promise<(FriendCircle & { member_count: number })[]> {
  const { data, error } = await supabase
    .rpc('get_user_circles')

  if (error) {
    console.error('Error fetching circles:', error)
    return []
  }

  return data || []
}

// Get a specific circle by ID
export async function getCircleById(circleId: string): Promise<FriendCircle | null> {
  const { data, error } = await supabase
    .from('friend_circles')
    .select('*')
    .eq('id', circleId)
    .single()

  if (error) {
    console.error('Error fetching circle:', error)
    return null
  }

  return data
}

// Update a circle
export async function updateCircle(
  circleId: string,
  updates: Partial<Pick<FriendCircle, 'name' | 'color' | 'icon'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('friend_circles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', circleId)

  if (error) {
    console.error('Error updating circle:', error)
    return false
  }

  return true
}

// Delete a circle
export async function deleteCircle(circleId: string): Promise<boolean> {
  const { error } = await supabase
    .from('friend_circles')
    .delete()
    .eq('id', circleId)

  if (error) {
    console.error('Error deleting circle:', error)
    return false
  }

  return true
}

// Get members of a circle
export async function getCircleMembers(circleId: string): Promise<FriendCircleMember[]> {
  const { data, error } = await supabase
    .rpc('get_circle_members', { p_circle_id: circleId })

  if (error) {
    console.error('Error fetching circle members:', error)
    return []
  }

  return data || []
}

// Add friend to circle
export async function addFriendToCircle(
  circleId: string,
  friendId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('add_friend_to_circle', {
      p_circle_id: circleId,
      p_friend_id: friendId
    })

  if (error) {
    console.error('Error adding friend to circle:', error)
    return false
  }

  return data
}

// Remove friend from circle
export async function removeFriendFromCircle(
  circleId: string,
  friendId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('remove_friend_from_circle', {
      p_circle_id: circleId,
      p_friend_id: friendId
    })

  if (error) {
    console.error('Error removing friend from circle:', error)
    return false
  }

  return data
}

// Get circles a friend is in
export async function getFriendCircles(friendId: string): Promise<{
  circle_id: string
  circle_name: string
  circle_color: string
  circle_icon: string
}[]> {
  const { data, error } = await supabase
    .rpc('get_friend_circles', { p_friend_id: friendId })

  if (error) {
    console.error('Error fetching friend circles:', error)
    return []
  }

  return data || []
}

// Set post visibility to specific circles
export async function setPostCircleVisibility(
  postId: string,
  circleIds: string[]
): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('set_post_circle_visibility', {
      p_post_id: postId,
      p_circle_ids: circleIds
    })

  if (error) {
    console.error('Error setting post visibility:', error)
    return false
  }

  return data
}

// Get circles a post is visible to
export async function getPostCircles(postId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('post_circle_visibility')
    .select('circle_id')
    .eq('post_id', postId)

  if (error) {
    console.error('Error fetching post circles:', error)
    return []
  }

  return data?.map(d => d.circle_id) || []
}

// Update circle positions (for drag-and-drop reordering)
export async function updateCirclePositions(
  circlePositions: { id: string; position: number }[]
): Promise<boolean> {
  // Update each circle's position
  const updates = circlePositions.map(({ id, position }) =>
    supabase
      .from('friend_circles')
      .update({ position })
      .eq('id', id)
  )

  const results = await Promise.all(updates)
  const hasError = results.some(r => r.error)

  if (hasError) {
    console.error('Error updating circle positions')
    return false
  }

  return true
}

// Add multiple friends to a circle at once (batch operation)
export async function addFriendsToCircle(
  circleId: string,
  friendIds: string[]
): Promise<number> {
  if (friendIds.length === 0) return 0

  // Run all operations in parallel instead of sequentially (fixes N+1)
  const results = await Promise.all(
    friendIds.map(friendId => addFriendToCircle(circleId, friendId))
  )

  return results.filter(success => success).length
}

// Remove a friend from all circles
export async function removeFriendFromAllCircles(friendId: string): Promise<boolean> {
  const { error } = await supabase
    .from('friend_circle_members')
    .delete()
    .eq('friend_id', friendId)

  if (error) {
    console.error('Error removing friend from all circles:', error)
    return false
  }

  return true
}
