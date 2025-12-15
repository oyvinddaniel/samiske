'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Comment, LikeUser, CommentLikeUser, PostData } from '@/components/posts/types'
import type { GeographySelection } from '@/components/geography'

interface UsePostCardProps {
  post: PostData
  currentUserId?: string | null
}

export function usePostCard({ post, currentUserId }: UsePostCardProps) {
  const supabase = useMemo(() => createClient(), [])

  // Like state
  const [liked, setLiked] = useState(post.user_has_liked || false)
  const [likeCount, setLikeCount] = useState(post.like_count)
  const [isLiking, setIsLiking] = useState(false)
  const [likeUsers, setLikeUsers] = useState<LikeUser[]>([])

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

  // Computed values
  const isOwner = currentUserId === postData.user.id
  const isBlurred = postData.visibility === 'members' && !currentUserId

  // Like handlers
  const handleLike = async () => {
    if (!currentUserId || isLiking) return
    setIsLiking(true)

    if (liked) {
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', currentUserId)

      setLiked(false)
      setLikeCount((prev) => prev - 1)
      setLikeUsers((prev) => prev.filter((u) => u.id !== currentUserId))
    } else {
      await supabase.from('likes').insert({
        post_id: post.id,
        user_id: currentUserId,
      })

      setLiked(true)
      setLikeCount((prev) => prev + 1)
      fetchLikeUsers()
    }

    setIsLiking(false)
  }

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

  const fetchLikeUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('likes')
      .select(`
        user:profiles!likes_user_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('post_id', post.id)
      .limit(10)

    if (!error && data) {
      const users = data.map((like) => {
        const userData = Array.isArray(like.user) ? like.user[0] : like.user
        return userData as LikeUser
      }).filter(Boolean)
      setLikeUsers(users)
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
    if (!showComments && comments.length === 0) {
      fetchComments()
    }
    setShowComments(!showComments)
  }

  const handleSubmitComment = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault()
    if (!currentUserId) return

    const content = parentId ? replyContent : newComment
    if (!content.trim()) return

    setSubmitting(true)

    const { error } = await supabase.from('comments').insert({
      post_id: post.id,
      user_id: currentUserId,
      content: content.trim(),
      parent_id: parentId,
    })

    if (!error) {
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
    if (!confirm('Slett kommentar?')) return

    await supabase.from('comments').delete().eq('id', commentId)
    setCommentCount((prev) => prev - 1)
    fetchComments()
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
    if (!confirm('Er du sikker på at du vil slette dette innlegget? Dette kan ikke angres.')) return

    setDeleting(true)

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postData.id)

    if (!error) {
      setIsDeleted(true)
      setShowDialog(false)
    } else {
      alert('Kunne ikke slette innlegget. Prøv igjen.')
    }

    setDeleting(false)
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

  // Effects
  useEffect(() => {
    if (post.like_count > 0) {
      fetchLikeUsers()
    }
  }, [post.id, post.like_count, fetchLikeUsers])

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
    liked,
    likeCount,
    likeUsers,
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
    handleLike,
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
    fetchComments,
  }
}
