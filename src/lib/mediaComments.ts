/**
 * Media Comments and Likes API
 * Functions for social features on individual media items
 *
 * Supports both media table (geography images) and post_images table (post images)
 * via polymorphic reference using imageType parameter
 */

import { createClient } from '@/lib/supabase/client'
import type { MediaComment, MediaLike } from '@/lib/types/gallery'

export type ImageType = 'media' | 'post_image'

// =====================================================
// COMMENTS
// =====================================================

/**
 * Organize flat comment array into nested structure
 */
function organizeCommentsIntoTree(comments: MediaComment[]): MediaComment[] {
  const commentMap = new Map<string, MediaComment>()
  const rootComments: MediaComment[] = []

  // First pass: Create map and initialize replies array
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] })
  })

  // Second pass: Build tree structure
  comments.forEach(comment => {
    const commentWithReplies = commentMap.get(comment.id)!

    if (comment.parent_id) {
      // This is a reply - add to parent's replies array
      const parent = commentMap.get(comment.parent_id)
      if (parent) {
        parent.replies = parent.replies || []
        parent.replies.push(commentWithReplies)
      }
    } else {
      // This is a top-level comment
      rootComments.push(commentWithReplies)
    }
  })

  return rootComments
}

/**
 * Get comments for a media item or post_image with nested replies
 */
export async function getMediaComments(
  imageId: string,
  imageType: ImageType = 'media',
  nested: boolean = true
): Promise<MediaComment[]> {
  const supabase = createClient()

  const query = supabase
    .from('media_comments')
    .select(`
      *,
      user:profiles!media_comments_user_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  // Polymorphic filter based on image type
  if (imageType === 'media') {
    query.eq('media_id', imageId)
  } else {
    query.eq('post_image_id', imageId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching media comments:', error)
    return []
  }

  const comments = data as MediaComment[]

  // Organize into nested structure if requested
  if (nested) {
    return organizeCommentsIntoTree(comments)
  }

  return comments
}

/**
 * Add comment to media item or post_image (with optional parent_id for replies)
 */
export async function addMediaComment(
  imageId: string,
  content: string,
  imageType: ImageType = 'media',
  parentId?: string
): Promise<MediaComment | null> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Must be logged in to comment')
  }

  // Build insert object with correct ID field
  const insertData: any = {
    user_id: user.id,
    content: content.trim()
  }

  if (imageType === 'media') {
    insertData.media_id = imageId
  } else {
    insertData.post_image_id = imageId
  }

  // Add parent_id if this is a reply
  if (parentId) {
    insertData.parent_id = parentId
  }

  const { data, error } = await supabase
    .from('media_comments')
    .insert(insertData)
    .select(`
      *,
      user:profiles!media_comments_user_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .single()

  if (error) {
    console.error('Error adding media comment:', error)
    throw error
  }

  return data as MediaComment
}

/**
 * Edit comment (only own comments)
 */
export async function editMediaComment(
  commentId: string,
  newContent: string
): Promise<MediaComment | null> {
  const supabase = createClient()

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Must be logged in to edit comments')
  }

  // Update comment WITH authorization check
  const { data, error } = await supabase
    .from('media_comments')
    .update({
      content: newContent.trim(),
      updated_at: new Date().toISOString()
    })
    .eq('id', commentId)
    .eq('user_id', user.id)  // Only edit if user owns the comment
    .select(`
      *,
      user:profiles!media_comments_user_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .single()

  if (error) {
    console.error('Error editing media comment:', error)
    throw error
  }

  if (!data) {
    throw new Error('Comment not found or unauthorized')
  }

  return data as MediaComment
}

/**
 * Delete comment (soft delete)
 */
export async function deleteMediaComment(commentId: string): Promise<boolean> {
  const supabase = createClient()

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Must be logged in to delete comments')
  }

  // Soft delete WITH authorization check
  const { data, error } = await supabase
    .from('media_comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', commentId)
    .eq('user_id', user.id)  // Only delete if user owns the comment
    .select()

  if (error) {
    console.error('Error deleting media comment:', error)
    throw error
  }

  // Check if anything was deleted
  if (!data || data.length === 0) {
    throw new Error('Comment not found or unauthorized')
  }

  return true
}

/**
 * Get comment count for media item or post_image
 */
export async function getMediaCommentCount(
  imageId: string,
  imageType: ImageType = 'media'
): Promise<number> {
  const supabase = createClient()

  const query = supabase
    .from('media_comments')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)

  // Polymorphic filter
  if (imageType === 'media') {
    query.eq('media_id', imageId)
  } else {
    query.eq('post_image_id', imageId)
  }

  const { count, error } = await query

  if (error) {
    console.error('Error getting comment count:', error)
    return 0
  }

  return count || 0
}

// =====================================================
// LIKES
// =====================================================

/**
 * Toggle like on media item or post_image
 */
export async function toggleMediaLike(
  imageId: string,
  imageType: ImageType = 'media'
): Promise<boolean> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Must be logged in to like')
  }

  // Check if already liked
  const likeQuery = supabase
    .from('media_likes')
    .select('id')
    .eq('user_id', user.id)

  if (imageType === 'media') {
    likeQuery.eq('media_id', imageId)
  } else {
    likeQuery.eq('post_image_id', imageId)
  }

  const { data: existingLike } = await likeQuery.single()

  if (existingLike) {
    // Unlike
    const { error } = await supabase
      .from('media_likes')
      .delete()
      .eq('id', existingLike.id)

    if (error) {
      console.error('Error unliking media:', error)
      throw error
    }

    return false // Unliked
  } else {
    // Like - build insert object with correct ID field
    const insertData: any = {
      user_id: user.id
    }

    if (imageType === 'media') {
      insertData.media_id = imageId
    } else {
      insertData.post_image_id = imageId
    }

    const { error } = await supabase
      .from('media_likes')
      .insert(insertData)

    if (error) {
      console.error('Error liking media:', error)
      throw error
    }

    return true // Liked
  }
}

/**
 * Get like count for media item or post_image
 */
export async function getMediaLikeCount(
  imageId: string,
  imageType: ImageType = 'media'
): Promise<number> {
  const supabase = createClient()

  const query = supabase
    .from('media_likes')
    .select('*', { count: 'exact', head: true })

  // Polymorphic filter
  if (imageType === 'media') {
    query.eq('media_id', imageId)
  } else {
    query.eq('post_image_id', imageId)
  }

  const { count, error } = await query

  if (error) {
    console.error('Error getting like count:', error)
    return 0
  }

  return count || 0
}

/**
 * Check if current user has liked media or post_image
 */
export async function hasUserLikedMedia(
  imageId: string,
  imageType: ImageType = 'media'
): Promise<boolean> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const query = supabase
    .from('media_likes')
    .select('id')
    .eq('user_id', user.id)

  // Polymorphic filter
  if (imageType === 'media') {
    query.eq('media_id', imageId)
  } else {
    query.eq('post_image_id', imageId)
  }

  const { data, error } = await query.single()

  if (error) {
    return false
  }

  return !!data
}

// =====================================================
// COMMENT LIKES
// =====================================================

/**
 * Toggle like on a comment
 */
export async function toggleCommentLike(commentId: string): Promise<boolean> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Must be logged in to like comments')
  }

  // Check if already liked
  const { data: existingLike } = await supabase
    .from('media_comment_likes')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .single()

  if (existingLike) {
    // Unlike
    const { error } = await supabase
      .from('media_comment_likes')
      .delete()
      .eq('id', existingLike.id)

    if (error) {
      console.error('Error unliking comment:', error)
      throw error
    }

    return false // Unliked
  } else {
    // Like
    const { error } = await supabase
      .from('media_comment_likes')
      .insert({
        comment_id: commentId,
        user_id: user.id
      })

    if (error) {
      console.error('Error liking comment:', error)
      throw error
    }

    return true // Liked
  }
}

/**
 * Get like count for a comment
 */
export async function getCommentLikeCount(commentId: string): Promise<number> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('media_comment_likes')
    .select('*', { count: 'exact', head: true })
    .eq('comment_id', commentId)

  if (error) {
    console.error('Error getting comment like count:', error)
    return 0
  }

  return count || 0
}

/**
 * Check if current user has liked a comment
 */
export async function hasUserLikedComment(commentId: string): Promise<boolean> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from('media_comment_likes')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    return false
  }

  return !!data
}

// =====================================================
// REACTIONS (10 types)
// =====================================================

export type ReactionType = 'elsker' | 'haha' | 'wow' | 'trist' | 'sint' | 'tommel' | 'ild' | 'feiring' | 'hundre' | 'takk'

export interface ReactionResult {
  action: 'added' | 'changed' | 'removed'
  reaction_type: ReactionType
  previous?: ReactionType
}

/**
 * React to media or post_image (add, change, or remove reaction)
 */
export async function reactToMedia(
  imageId: string,
  reactionType: ReactionType,
  imageType: ImageType = 'media'
): Promise<ReactionResult> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Must be logged in to react')
  }

  // Check for existing reaction
  const likeQuery = supabase
    .from('media_likes')
    .select('id, reaction_type')
    .eq('user_id', user.id)

  if (imageType === 'media') {
    likeQuery.eq('media_id', imageId)
  } else {
    likeQuery.eq('post_image_id', imageId)
  }

  const { data: existingReaction } = await likeQuery.single()

  if (existingReaction) {
    if (existingReaction.reaction_type === reactionType) {
      // Same reaction - remove it
      const { error } = await supabase
        .from('media_likes')
        .delete()
        .eq('id', existingReaction.id)

      if (error) {
        console.error('Error removing reaction:', error)
        throw error
      }

      return { action: 'removed', reaction_type: reactionType }
    } else {
      // Different reaction - update it
      const { error } = await supabase
        .from('media_likes')
        .update({ reaction_type: reactionType })
        .eq('id', existingReaction.id)

      if (error) {
        console.error('Error updating reaction:', error)
        throw error
      }

      return {
        action: 'changed',
        reaction_type: reactionType,
        previous: existingReaction.reaction_type as ReactionType
      }
    }
  } else {
    // New reaction
    const insertData: any = {
      user_id: user.id,
      reaction_type: reactionType
    }

    if (imageType === 'media') {
      insertData.media_id = imageId
    } else {
      insertData.post_image_id = imageId
    }

    const { error } = await supabase
      .from('media_likes')
      .insert(insertData)

    if (error) {
      console.error('Error adding reaction:', error)
      throw error
    }

    return { action: 'added', reaction_type: reactionType }
  }
}

/**
 * Get reactions summary for media or post_image
 */
export async function getMediaReactions(
  imageId: string,
  imageType: ImageType = 'media'
): Promise<{
  total_count: number
  user_reaction: ReactionType | null
  reactions: Record<ReactionType, number>
  recent_users: Array<{
    id: string
    full_name: string
    avatar_url?: string
    reaction_type: ReactionType
  }>
}> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Get all reactions
  const query = supabase
    .from('media_likes')
    .select(`
      id,
      reaction_type,
      created_at,
      user:profiles!media_likes_user_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)

  if (imageType === 'media') {
    query.eq('media_id', imageId)
  } else {
    query.eq('post_image_id', imageId)
  }

  const { data: reactions, error } = await query

  if (error) {
    console.error('Error fetching reactions:', error)
    return {
      total_count: 0,
      user_reaction: null,
      reactions: {} as Record<ReactionType, number>,
      recent_users: []
    }
  }

  if (!reactions || reactions.length === 0) {
    return {
      total_count: 0,
      user_reaction: null,
      reactions: {} as Record<ReactionType, number>,
      recent_users: []
    }
  }

  // Aggregate reactions
  const reactionCounts: Record<string, number> = {}
  let userReaction: ReactionType | null = null

  reactions.forEach((r: any) => {
    const type = r.reaction_type as ReactionType
    reactionCounts[type] = (reactionCounts[type] || 0) + 1

    if (user && r.user_id === user.id) {
      userReaction = type
    }
  })

  // Get recent users (last 5)
  const recentUsers = reactions
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map((r: any) => ({
      id: r.user.id,
      full_name: r.user.full_name,
      avatar_url: r.user.avatar_url || undefined,
      reaction_type: r.reaction_type as ReactionType
    }))

  return {
    total_count: reactions.length,
    user_reaction: userReaction,
    reactions: reactionCounts as Record<ReactionType, number>,
    recent_users: recentUsers
  }
}

/**
 * Get media with social data (comments + likes)
 */
export async function getMediaWithSocialData(mediaIds: string[]) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Get comment counts
  const { data: commentCounts } = await supabase
    .from('media_comments')
    .select('media_id')
    .in('media_id', mediaIds)
    .is('deleted_at', null)

  // Get like counts
  const { data: likeCounts } = await supabase
    .from('media_likes')
    .select('media_id')
    .in('media_id', mediaIds)

  // Get user's likes
  const { data: userLikes } = user ? await supabase
    .from('media_likes')
    .select('media_id')
    .in('media_id', mediaIds)
    .eq('user_id', user.id) : { data: null }

  // Count occurrences
  const commentCountMap: Record<string, number> = {}
  commentCounts?.forEach(c => {
    commentCountMap[c.media_id] = (commentCountMap[c.media_id] || 0) + 1
  })

  const likeCountMap: Record<string, number> = {}
  likeCounts?.forEach(l => {
    likeCountMap[l.media_id] = (likeCountMap[l.media_id] || 0) + 1
  })

  const userLikesSet = new Set(userLikes?.map(l => l.media_id) || [])

  return {
    commentCounts: commentCountMap,
    likeCounts: likeCountMap,
    userLikes: userLikesSet
  }
}
