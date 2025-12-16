// Post helper functions

import { createClient } from '@/lib/supabase/client'

// Toggle pin status for a post (admin only)
// Kaller API-rute som verifiserer admin-status og bruker service role
export async function togglePinPost(
  postId: string,
  pinned: boolean
): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch('/api/admin/pin-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, pinned })
    })

    if (!response.ok) {
      const data = await response.json()
      return { success: false, error: data.error || 'Kunne ikke oppdatere innlegg' }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Error toggling pin:', error)
    return { success: false, error: 'Nettverksfeil' }
  }
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
