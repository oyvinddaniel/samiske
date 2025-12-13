'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Pencil, Trash2, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ProfileOverlay } from '@/components/profile/ProfileOverlay'

// Import child components
import { PostActions } from './PostActions'
import { PostComments } from './PostComments'
import { EditPostDialog } from './EditPostDialog'
import { PostDialogContent } from './PostDialogContent'

// Import types and utils
import {
  PostCardProps,
  Comment,
  LikeUser,
  CommentLikeUser,
  categoryColors,
} from './types'
import { getInitials, formatDate, formatEventDate } from './utils'

export function PostCard({ post, currentUserId, onClick }: PostCardProps) {
  const [liked, setLiked] = useState(post.user_has_liked || false)
  const [likeCount, setLikeCount] = useState(post.like_count)
  const [isLiking, setIsLiking] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentCount, setCommentCount] = useState(post.comment_count)
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [likeUsers, setLikeUsers] = useState<LikeUser[]>([])
  const [commentLikes, setCommentLikes] = useState<Record<string, { count: number; liked: boolean; users: CommentLikeUser[] }>>({})
  const [previewComments, setPreviewComments] = useState<Comment[]>([])
  const [profileOverlayUserId, setProfileOverlayUserId] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(post.title)
  const [editContent, setEditContent] = useState(post.content)
  const [editEventDate, setEditEventDate] = useState(post.event_date || '')
  const [editEventTime, setEditEventTime] = useState(post.event_time || '')
  const [editEventLocation, setEditEventLocation] = useState(post.event_location || '')
  const [saving, setSaving] = useState(false)
  const [postData, setPostData] = useState(post)
  const [isDeleted, setIsDeleted] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Use useMemo for stable supabase client reference
  const supabase = useMemo(() => createClient(), [])

  // Check if content should be blurred (members-only and not logged in)
  const isBlurred = postData.visibility === 'members' && !currentUserId
  const isOwner = currentUserId === postData.user.id
  const categoryColor = postData.category?.color || categoryColors[postData.category?.slug || ''] || '#6B7280'

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
      // Build hierarchical structure
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
        fetchCommentLikes(commentIds)
      }
    }
    setLoadingComments(false)
  }, [supabase, post.id])

  const fetchCommentLikes = async (commentIds: string[]) => {
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
  }

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

  // Effects
  useEffect(() => {
    if (post.like_count > 0) {
      fetchLikeUsers()
    }
  }, [post.id, post.like_count, fetchLikeUsers])

  useEffect(() => {
    fetchPreviewComments()
  }, [fetchPreviewComments])

  // Real-time subscription for comments - with proper cleanup
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

  // Edit handlers
  const handleSaveEdit = async () => {
    if (!isOwner) return
    setSaving(true)

    const updateData: Record<string, string | null> = {
      title: editTitle,
      content: editContent,
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
      })
      setIsEditing(false)
    }
    setSaving(false)
  }

  const handleCancelEdit = () => {
    setEditTitle(postData.title)
    setEditContent(postData.content)
    setEditEventDate(postData.event_date || '')
    setEditEventTime(postData.event_time || '')
    setEditEventLocation(postData.event_location || '')
    setIsEditing(false)
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

  const openDialog = () => {
    if (onClick) {
      onClick()
    } else {
      setShowDialog(true)
    }
  }

  // If post is deleted, show nothing
  if (isDeleted) {
    return null
  }

  return (
    <>
      <Card id={`post-${postData.id}`} className={`overflow-hidden hover:shadow-md transition-shadow max-w-lg mx-auto ${isBlurred ? 'relative' : ''} !pt-0 !pb-0 !gap-0`}>
        {/* Blue accent bar at top */}
        <div className="h-3" style={{ backgroundColor: '#1472E6' }} />
        <CardContent className="p-4">
          {/* Blur overlay for members-only content */}
          {isBlurred && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
              <div className="text-center p-3">
                <div className="text-xl mb-1">🔒</div>
                <p className="text-sm font-medium text-gray-700">Kun for medlemmer</p>
                <Link href="/login">
                  <Button size="sm" className="mt-1.5 h-7 text-xs">Logg inn</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Top row: avatar, name, time, category */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <button onClick={() => setProfileOverlayUserId(postData.user.id)} className="focus:outline-none">
              <Avatar className="w-5 h-5 cursor-pointer hover:ring-2 hover:ring-blue-200 transition-all">
                <AvatarImage src={postData.user.avatar_url || undefined} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-[9px]">
                  {getInitials(postData.user.full_name)}
                </AvatarFallback>
              </Avatar>
            </button>
            <button
              onClick={() => setProfileOverlayUserId(postData.user.id)}
              className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors focus:outline-none"
            >
              {postData.user.full_name || 'Ukjent'}
            </button>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500">{formatDate(postData.created_at)}</span>
            {postData.posted_from_name && postData.posted_from_type !== 'sapmi' && (
              <>
                <span className="text-xs text-gray-400">·</span>
                <span className="flex items-center gap-0.5 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  {postData.posted_from_name}
                </span>
              </>
            )}
            <div className="flex-1" />

            {/* Edit and delete buttons for owner */}
            {isOwner && (
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => { setShowDialog(true); setIsEditing(true); }}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                  title="Rediger innlegg"
                >
                  <Pencil className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                </button>
                <button
                  onClick={handleDeletePost}
                  disabled={deleting}
                  className="p-1 rounded hover:bg-red-50 transition-colors"
                  title="Slett innlegg"
                >
                  <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            )}

            {/* Visibility icon */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    <img
                      src={postData.visibility === 'members' ? '/images/lock.png' : '/images/globe.png'}
                      alt={postData.visibility === 'members' ? 'Kun for medlemmer' : 'Offentlig'}
                      className="w-3.5 h-3.5"
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {postData.visibility === 'members' ? 'Kun for medlemmer' : 'Offentlig synlig'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {postData.category && (
              <Badge
                style={{ backgroundColor: categoryColor, color: 'white' }}
                className="text-[9px] px-1 py-0"
              >
                {postData.category.name}
              </Badge>
            )}
          </div>

          {/* Title - opens dialog */}
          <button onClick={openDialog} className="text-left w-full">
            <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-1">
              {postData.title}
            </h3>
          </button>

          {/* Event info (compact) */}
          {postData.type === 'event' && postData.event_date && (
            <div className="flex items-center gap-2 text-xs text-gray-600 mb-1.5 bg-gray-50 rounded px-1.5 py-1">
              <span>📅 {formatEventDate(postData.event_date, postData.event_time)}</span>
              {postData.event_location && <span>📍 {postData.event_location}</span>}
            </div>
          )}

          {/* Content preview */}
          <p className="text-gray-600 text-sm line-clamp-2 mb-1.5">{postData.content}</p>

          {/* Image */}
          {postData.image_url && (
            <button onClick={openDialog} className="w-full overflow-hidden rounded-md bg-gray-100 mb-1.5">
              <img
                src={postData.image_url}
                alt={postData.title}
                className="w-full h-auto"
              />
            </button>
          )}

          {/* Actions */}
          <PostActions
            liked={liked}
            likeCount={likeCount}
            commentCount={commentCount}
            likeUsers={likeUsers}
            currentUserId={currentUserId}
            onLike={handleLike}
            onToggleComments={handleToggleComments}
            onOpenDialog={openDialog}
          />

          {/* Comments */}
          <PostComments
            comments={comments}
            previewComments={previewComments}
            commentCount={commentCount}
            showComments={showComments}
            loadingComments={loadingComments}
            newComment={newComment}
            replyingTo={replyingTo}
            replyContent={replyContent}
            submitting={submitting}
            currentUserId={currentUserId}
            commentLikes={commentLikes}
            onToggleComments={handleToggleComments}
            onNewCommentChange={setNewComment}
            onReplyContentChange={setReplyContent}
            onReplyingToChange={setReplyingTo}
            onSubmitComment={handleSubmitComment}
            onDeleteComment={handleDeleteComment}
            onCommentLike={handleCommentLike}
            onProfileClick={setProfileOverlayUserId}
          />
        </CardContent>

        {/* Profile overlay */}
        {profileOverlayUserId && (
          <ProfileOverlay
            userId={profileOverlayUserId}
            onClose={() => setProfileOverlayUserId(null)}
          />
        )}
      </Card>

      {/* Post BottomSheet */}
      {!onClick && (
        <BottomSheet
          open={showDialog}
          onClose={() => { setShowDialog(false); if (isEditing) handleCancelEdit(); }}
          onOpen={() => { if (comments.length === 0) fetchComments(); }}
          title={isEditing ? 'Rediger innlegg' : postData.title}
          confirmClose={isEditing}
          confirmMessage="Er du sikker på at du vil avbryte? Endringer vil gå tapt."
        >
          <div className="py-4 pb-[100px]">
            {isEditing ? (
              <EditPostDialog
                postData={postData}
                editTitle={editTitle}
                editContent={editContent}
                editEventDate={editEventDate}
                editEventTime={editEventTime}
                editEventLocation={editEventLocation}
                saving={saving}
                onEditTitleChange={setEditTitle}
                onEditContentChange={setEditContent}
                onEditEventDateChange={setEditEventDate}
                onEditEventTimeChange={setEditEventTime}
                onEditEventLocationChange={setEditEventLocation}
                onSave={handleSaveEdit}
                onCancel={handleCancelEdit}
              />
            ) : (
              <PostDialogContent
                postData={postData}
                liked={liked}
                likeCount={likeCount}
                commentCount={commentCount}
                comments={comments}
                loadingComments={loadingComments}
                newComment={newComment}
                replyingTo={replyingTo}
                replyContent={replyContent}
                submitting={submitting}
                currentUserId={currentUserId}
                isOwner={isOwner}
                commentLikes={commentLikes}
                onLike={handleLike}
                onNewCommentChange={setNewComment}
                onReplyContentChange={setReplyContent}
                onReplyingToChange={setReplyingTo}
                onSubmitComment={handleSubmitComment}
                onDeleteComment={handleDeleteComment}
                onCommentLike={handleCommentLike}
                onEdit={() => setIsEditing(true)}
              />
            )}
          </div>
        </BottomSheet>
      )}
    </>
  )
}
