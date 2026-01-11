'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Comment, CommentLikeUser, PostData } from '@/components/posts/types'
import type { GeographySelection } from '@/components/geography'
import type { ReactionType } from '@/components/posts/composer/constants'

interface ReactionUser {
  id: string
  full_name: string | null
  avatar_url: string | null
  reaction_type: ReactionType
}

export interface ReactionData {
  total_count: number
  user_reaction: ReactionType | null
  reactions: Partial<Record<ReactionType, number>> | null
  recent_users: ReactionUser[] | null
}

interface UsePostCardProps {
  post: PostData
  currentUserId?: string | null
}

export function usePostCard({ post, currentUserId }: UsePostCardProps) {
  const supabase = useMemo(() => createClient(), [])

  // Reaction state (replaces old like state)
  const [reactionData, setReactionData] = useState<ReactionData>({
    total_count: post.like_count || 0,
    user_reaction: post.user_has_liked ? 'elsker' : null,
    reactions: post.like_count > 0 ? { elsker: post.like_count } : null,
    recent_users: null,
  })

  // Comment state
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentCount, setCommentCount] = useState(post.comment_count)
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [commentLikes, setCommentLikes] = useState<Record<string, { count: number; liked: boolean; users: CommentLikeUser[] }>>({})
  const [previewComments, setPreviewComments] = useState<Comment[]>([])

  // Edit comment state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentContent, setEditCommentContent] = useState('')

  // UI state
  const [profileOverlayUserId, setProfileOverlayUserId] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)

  // Edit state
  const [editTitle, setEditTitle] = useState(post.title)
  const [editContent, setEditContent] = useState(post.content)
  const [editEventDate, setEditEventDate] = useState(post.event_date || '')
  const [editEventTime, setEditEventTime] = useState(post.event_time || '')
  const [editEventLocation, setEditEventLocation] = useState(post.event_location || '')
  const [editGeography, setEditGeography] = useState<GeographySelection | null>(null)
  const [saving, setSaving] = useState(false)
  const [postData, setPostData] = useState(post)
  const [isDeleted, setIsDeleted] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Bookmark state
  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarking, setBookmarking] = useState(false)

  // Archive state
  const [archived, setArchived] = useState(post.is_archived || false)
  const [archiving, setArchiving] = useState(false)

  // Repost state
  const [reposted, setReposted] = useState(post.user_has_reposted || false)
  const [reposting, setReposting] = useState(false)

  // New comments badge
  const [commentsSinceOpened, setCommentsSinceOpened] = useState(0)

  // Computed values
  const isOwner = currentUserId === postData.user.id
  const isBlurred = postData.visibility !== 'public' && !currentUserId

  // Reaction handler - updates local state when ReactionPicker changes
  const handleReactionChange = useCallback((newData: ReactionData) => {
    setReactionData(newData)
  }, [])

  const handleCommentLike = async (commentId: string) => {
    if (!currentUserId) return

    const current = commentLikes[commentId] || { count: 0, liked: false, users: [] }

    if (current.liked) {
      await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', currentUserId)

      setCommentLikes((prev) => ({
        ...prev,
        [commentId]: {
          count: Math.max(0, current.count - 1),
          liked: false,
          users: current.users.filter((u) => u.id !== currentUserId),
        },
      }))
    } else {
      await supabase.from('comment_likes').insert({
        comment_id: commentId,
        user_id: currentUserId,
      })

      setCommentLikes((prev) => ({
        ...prev,
        [commentId]: {
          count: current.count + 1,
          liked: true,
          users: current.users,
        },
      }))
    }
  }

  // Fetch functions
  const fetchCommentLikesForIds = useCallback(async (commentIds: string[]) => {
    const { data: likesData } = await supabase
      .from('comment_likes')
      .select(`
        comment_id,
        user:profiles!comment_likes_user_id_fkey (
          id,
          full_name
        )
      `)
      .in('comment_id', commentIds)

    if (likesData) {
      const likesMap: Record<string, { count: number; liked: boolean; users: CommentLikeUser[] }> = {}

      likesData.forEach((like) => {
        const userData = Array.isArray(like.user) ? like.user[0] : like.user
        if (!likesMap[like.comment_id]) {
          likesMap[like.comment_id] = { count: 0, liked: false, users: [] }
        }
        likesMap[like.comment_id].count++
        if (userData) {
          likesMap[like.comment_id].users.push(userData as CommentLikeUser)
          if ((userData as CommentLikeUser).id === currentUserId) {
            likesMap[like.comment_id].liked = true
          }
        }
      })

      setCommentLikes(likesMap)
    }
  }, [supabase, currentUserId])

  const fetchComments = useCallback(async () => {
    setLoadingComments(true)
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        parent_id,
        user:profiles!comments_user_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })

    if (!error && data) {
      const commentMap = new Map<string, Comment>()
      const rootComments: Comment[] = []

      data.forEach((comment) => {
        const userData = Array.isArray(comment.user) ? comment.user[0] : comment.user
        const formattedComment: Comment = {
          ...comment,
          user: userData as Comment['user'],
          like_count: 0,
          replies: [],
        }
        commentMap.set(comment.id, formattedComment)
      })

      data.forEach((comment) => {
        const formattedComment = commentMap.get(comment.id)!
        if (comment.parent_id && commentMap.has(comment.parent_id)) {
          commentMap.get(comment.parent_id)!.replies!.push(formattedComment)
        } else {
          rootComments.push(formattedComment)
        }
      })

      setComments(rootComments)

      const commentIds = data.map((c) => c.id)
      if (commentIds.length > 0) {
        fetchCommentLikesForIds(commentIds)
      }
    }
    setLoadingComments(false)
  }, [supabase, post.id, fetchCommentLikesForIds])

  // Fetch reaction data from database
  const fetchReactionData = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_post_reactions', {
      p_post_id: post.id,
    })

    if (!error && data) {
      setReactionData({
        total_count: data.total_count || 0,
        user_reaction: data.user_reaction || null,
        reactions: data.reactions || null,
        recent_users: data.recent_users || null,
      })
    }
  }, [supabase, post.id])

  const fetchPreviewComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        parent_id,
        user:profiles!comments_user_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('post_id', post.id)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(2)

    if (!error && data) {
      const formatted = data.map((comment) => {
        const userData = Array.isArray(comment.user) ? comment.user[0] : comment.user
        return {
          ...comment,
          user: userData as Comment['user'],
          like_count: 0,
          replies: [],
        }
      }).reverse()
      setPreviewComments(formatted)
    }

    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id)

    if (count !== null) {
      setCommentCount(count)
    }
  }, [supabase, post.id])

  const fetchBookmarkStatus = useCallback(async () => {
    if (!currentUserId) return

    const { data } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', currentUserId)
      .eq('post_id', post.id)
      .maybeSingle()

    setBookmarked(!!data)
  }, [supabase, currentUserId, post.id])

  // Comment handlers
  const handleToggleComments = () => {
    const willOpen = !showComments

    if (willOpen) {
      setCommentsSinceOpened(0) // Reset badge
      if (comments.length === 0) {
        fetchComments()
      }
    }

    setShowComments(willOpen)
  }

  const handleSubmitComment = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault()
    if (!currentUserId) return

    const content = parentId ? replyContent : newComment
    if (!content.trim()) return

    setSubmitting(true)

    const { data: newCommentData, error } = await supabase
      .from('comments')
      .insert({
        post_id: post.id,
        user_id: currentUserId,
        content: content.trim(),
        parent_id: parentId,
      })
      .select('id')
      .single()

    if (!error && newCommentData) {
      // Parse mentions from content and send notifications
      const mentionPattern = /@\[([^\]]+)\]\(([^:]+):([^)]+)\)/g
      let match
      while ((match = mentionPattern.exec(content)) !== null) {
        const mentionType = match[2]
        const mentionId = match[3]

        // Only notify users
        if (mentionType === 'user') {
          await supabase.rpc('create_mention_notification', {
            p_actor_id: currentUserId,
            p_mentioned_user_id: mentionId,
            p_post_id: post.id,
            p_comment_id: newCommentData.id,
          })
        }
      }

      if (parentId) {
        setReplyContent('')
        setReplyingTo(null)
      } else {
        setNewComment('')
      }
      setCommentCount((prev) => prev + 1)
      fetchComments()
    }

    setSubmitting(false)
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUserId) return
    if (!confirm('Slett kommentar?')) return

    // Verifiser eierskap før sletting
    const { data: comment } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single()

    if (!comment || comment.user_id !== currentUserId) {
      toast.error('Du kan ikke slette denne kommentaren')
      return
    }

    const { error } = await supabase.from('comments').delete().eq('id', commentId)

    if (error) {
      toast.error('Kunne ikke slette kommentar')
      return
    }

    setCommentCount((prev) => prev - 1)
    fetchPreviewComments()
    fetchComments()
    toast.success('Kommentar slettet')
  }

  const handleStartEditComment = (commentId: string, currentContent: string) => {
    setEditingCommentId(commentId)
    setEditCommentContent(currentContent)
  }

  const handleSaveEditComment = async (commentId: string) => {
    if (!editCommentContent.trim()) return

    setSubmitting(true)
    const { error } = await supabase
      .from('comments')
      .update({ content: editCommentContent.trim() })
      .eq('id', commentId)

    if (!error) {
      setEditingCommentId(null)
      setEditCommentContent('')
      fetchComments()
      toast.success('Kommentar oppdatert')
    } else {
      toast.error('Kunne ikke oppdatere kommentar')
    }
    setSubmitting(false)
  }

  const handleCancelEditComment = () => {
    setEditingCommentId(null)
    setEditCommentContent('')
  }

  // Edit handlers
  const handleSaveEdit = async () => {
    if (!isOwner) return
    setSaving(true)

    const updateData: Record<string, string | null> = {
      title: editTitle,
      content: editContent,
      // Geography - clear all first, then set the selected one
      language_area_id: null,
      municipality_id: null,
      place_id: null,
    }

    // Set the selected geography
    if (editGeography) {
      if (editGeography.type === 'language_area') {
        updateData.language_area_id = editGeography.id
      } else if (editGeography.type === 'municipality') {
        updateData.municipality_id = editGeography.id
      } else if (editGeography.type === 'place') {
        updateData.place_id = editGeography.id
      }
    }

    if (postData.type === 'event') {
      updateData.event_date = editEventDate || null
      updateData.event_time = editEventTime || null
      updateData.event_location = editEventLocation || null
    }

    const { error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postData.id)

    if (!error) {
      setPostData({
        ...postData,
        title: editTitle,
        content: editContent,
        event_date: editEventDate || null,
        event_time: editEventTime || null,
        event_location: editEventLocation || null,
        municipality_id: editGeography?.type === 'municipality' ? editGeography.id : null,
        place_id: editGeography?.type === 'place' ? editGeography.id : null,
      })
      setIsEditing(false)
    }
    setSaving(false)
  }

  // Helper to get geography from post data
  const getGeographyFromPost = useCallback((): GeographySelection | null => {
    if (postData.place_id && postData.place) {
      return {
        type: 'place',
        id: postData.place_id,
        name: postData.place.name
      }
    }
    if (postData.municipality_id && postData.municipality) {
      return {
        type: 'municipality',
        id: postData.municipality_id,
        name: postData.municipality.name
      }
    }
    return null
  }, [postData])

  const handleCancelEdit = () => {
    setEditTitle(postData.title)
    setEditContent(postData.content)
    setEditEventDate(postData.event_date || '')
    setEditEventTime(postData.event_time || '')
    setEditEventLocation(postData.event_location || '')
    setEditGeography(getGeographyFromPost())
    setIsEditing(false)
  }

  const handleStartEdit = () => {
    setEditTitle(postData.title)
    setEditContent(postData.content)
    setEditEventDate(postData.event_date || '')
    setEditEventTime(postData.event_time || '')
    setEditEventLocation(postData.event_location || '')
    setEditGeography(getGeographyFromPost())
    setIsEditing(true)
  }

  const handleDeletePost = async () => {
    if (!isOwner) return
    if (!confirm('Er du sikker på at du vil slette dette innlegget? Du kan gjenopprette det senere fra arkivet.')) return

    setDeleting(true)

    const { error } = await supabase.rpc('soft_delete_post', {
      p_post_id: postData.id,
      p_reason: null
    })

    if (!error) {
      setIsDeleted(true)
      setShowDialog(false)
      toast.success('Innlegg slettet. Du finner det i arkivet.')
    } else {
      toast.error('Kunne ikke slette innlegget. Prøv igjen.')
    }

    setDeleting(false)
  }

  const handleRestorePost = async () => {
    if (!isOwner) return

    const { error } = await supabase.rpc('restore_post', {
      p_post_id: postData.id
    })

    if (!error) {
      setIsDeleted(false)
      toast.success('Innlegg gjenopprettet')
    } else {
      toast.error('Kunne ikke gjenopprette innlegget')
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/innlegg/${postData.id}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: postData.title,
          text: postData.content.substring(0, 100) + (postData.content.length > 100 ? '...' : ''),
          url: url,
        })
        return
      } catch {
        // User cancelled or error, fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      toast.success('Lenke kopiert!')
    } catch {
      toast.error('Kunne ikke kopiere lenke')
    }
  }

  const handleBookmark = async () => {
    if (!currentUserId || bookmarking) return
    setBookmarking(true)

    if (bookmarked) {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', currentUserId)
        .eq('post_id', postData.id)

      if (!error) {
        setBookmarked(false)
        toast.success('Bokmerke fjernet')
      }
    } else {
      const { error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: currentUserId,
          post_id: postData.id,
        })

      if (!error) {
        setBookmarked(true)
        toast.success('Innlegg bokmerket!')
      }
    }

    setBookmarking(false)
  }

  const handleArchivePost = async () => {
    if (!isOwner || archiving) return
    setArchiving(true)

    const { data, error } = await supabase.rpc('toggle_archive_post', {
      p_post_id: postData.id,
    })

    if (!error && data) {
      setArchived(data.is_archived)
      toast.success(data.is_archived ? 'Innlegg arkivert' : 'Innlegg gjenopprettet')
    } else {
      toast.error('Kunne ikke arkivere innlegget')
    }

    setArchiving(false)
  }

  const handleRepost = async () => {
    if (!currentUserId || reposting) return
    setReposting(true)

    if (reposted) {
      // Unrepost
      const { error } = await supabase.rpc('unrepost_post', {
        p_post_id: postData.id
      })

      if (!error) {
        setReposted(false)
        toast.success('Repost fjernet')
      }
    } else {
      // Repost
      const { error } = await supabase.rpc('repost_post', {
        p_post_id: postData.id,
        p_comment: null
      })

      if (!error) {
        setReposted(true)
        toast.success('Innlegg repostet til din feed!')
      }
    }

    setReposting(false)
  }

  // Effects
  useEffect(() => {
    // Fetch reaction data when component mounts
    fetchReactionData()
  }, [fetchReactionData])

  useEffect(() => {
     
    fetchPreviewComments()
  }, [fetchPreviewComments])

  useEffect(() => {
     
    fetchBookmarkStatus()
  }, [fetchBookmarkStatus])

  // Real-time subscription for comments
  useEffect(() => {
    const channel = supabase
      .channel(`post-comments-${post.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${post.id}`
        },
        () => {
          fetchPreviewComments()
          if (showComments) {
            fetchComments()
          } else {
            // Count new comments when panel is closed
            setCommentsSinceOpened(prev => prev + 1)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, post.id, showComments, fetchPreviewComments, fetchComments])

  return {
    // State
    reactionData,
    showComments,
    comments,
    commentCount,
    loadingComments,
    newComment,
    replyingTo,
    replyContent,
    submitting,
    commentLikes,
    previewComments,
    profileOverlayUserId,
    showDialog,
    isEditing,
    showReportDialog,
    editTitle,
    editContent,
    editEventDate,
    editEventTime,
    editEventLocation,
    editGeography,
    saving,
    postData,
    isDeleted,
    deleting,
    bookmarked,
    bookmarking,
    isOwner,
    isBlurred,
    editingCommentId,
    editCommentContent,

    // Setters
    setNewComment,
    setReplyingTo,
    setReplyContent,
    setEditCommentContent,
    setProfileOverlayUserId,
    setShowDialog,
    setIsEditing,
    setShowReportDialog,
    setEditTitle,
    setEditContent,
    setEditEventDate,
    setEditEventTime,
    setEditEventLocation,
    setEditGeography,

    // Handlers
    handleReactionChange,
    handleCommentLike,
    handleToggleComments,
    handleSubmitComment,
    handleDeleteComment,
    handleStartEditComment,
    handleSaveEditComment,
    handleCancelEditComment,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleDeletePost,
    handleShare,
    handleBookmark,
    handleArchivePost,
    archived,
    archiving,
    fetchComments,
    // New exports
    reposted,
    reposting,
    handleRepost,
    handleRestorePost,
    commentsSinceOpened,
  }
}
