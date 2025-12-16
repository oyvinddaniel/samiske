// Post helper functions

import { createClient } from '@/lib/supabase/client'

// Toggle pin status for a post (admin/moderator only)
export async function togglePinPost(
  postId: string,
  pinned: boolean
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('posts')
    .update({ pinned })
    .eq('id', postId)

  if (error) {
    console.error('Error toggling pin:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

// Count pinned posts in a group
export async function countPinnedPostsInGroup(groupId: string): Promise<number> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('created_for_group_id', groupId)
    .eq('pinned', true)

  if (error) {
    console.error('Error counting pinned posts:', error)
    return 0
  }

  return count || 0
}
