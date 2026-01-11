'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MentionText, MentionTextarea } from '@/components/mentions'
import {
  Heart,
  MessageCircle,
  Pin,
  Trash2,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Types
interface CommentUser {
  id: string
  full_name: string | null
  avatar_url: string | null
}

interface Comment {
  id: string
  content: string
  parent_id: string | null
  created_at: string
  updated_at: string
  edited_at?: string | null
  like_count: number
  reply_count: number
  is_pinned: boolean
  depth: number
  user: CommentUser
  user_has_liked: boolean
}

interface NestedCommentsProps {
  postId: string
  postOwnerId?: string
  currentUserId?: string | null
  initialCommentCount?: number
}

export function NestedComments({
  postId,
  postOwnerId,
  currentUserId,
  initialCommentCount = 0,
}: NestedCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [collapsedComments, setCollapsedComments] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const supabase = createClient()

  // Fetch comments using the RPC function
  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_nested_comments', {
      p_post_id: postId,
      p_current_user_id: currentUserId || null,
    })

    if (error) {
      console.error('Error fetching comments:', error)
      toast.error('Kunne ikke laste kommentarer')
    } else {
      setComments(data || [])
    }
    setLoading(false)
  }, [postId, currentUserId, supabase])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  // Add new root comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId || !newComment.trim()) return

    setSubmitting(true)

    const { data, error } = await supabase.rpc('add_comment', {
      p_post_id: postId,
      p_content: newComment.trim(),
      p_parent_id: null,
    })

    if (error) {
      console.error('Error adding comment:', error)
      toast.error('Kunne ikke legge til kommentar')
    } else {
      // Send mention notifications
      await sendMentionNotifications(newComment, data, null)
      setNewComment('')
      fetchComments()
      toast.success('Kommentar lagt til')
    }

    setSubmitting(false)
  }

  // Add reply to a comment
  const handleSubmitReply = async (parentId: string) => {
    if (!currentUserId || !replyContent.trim()) return

    setSubmitting(true)

    const { data, error } = await supabase.rpc('add_comment', {
      p_post_id: postId,
      p_content: replyContent.trim(),
      p_parent_id: parentId,
    })

    if (error) {
      console.error('Error adding reply:', error)
      toast.error('Kunne ikke legge til svar')
    } else {
      await sendMentionNotifications(replyContent, data, parentId)
      setReplyContent('')
      setReplyingTo(null)
      fetchComments()
    }

    setSubmitting(false)
  }

  // Send mention notifications
  const sendMentionNotifications = async (
    content: string,
    commentId: string,
    _parentId: string | null
  ) => {
    const mentionPattern = /@\[([^\]]+)\]\(([^:]+):([^)]+)\)/g
    let match
    while ((match = mentionPattern.exec(content)) !== null) {
      const mentionType = match[2]
      const mentionId = match[3]

      if (mentionType === 'user') {
        await supabase.rpc('create_mention_notification', {
          p_actor_id: currentUserId,
          p_mentioned_user_id: mentionId,
          p_post_id: postId,
          p_comment_id: commentId,
        })
      }
    }
  }

  // Toggle like on comment
  const handleToggleLike = async (commentId: string) => {
    if (!currentUserId) {
      toast.error('Du må være innlogget for å like')
      return
    }

    const { data, error } = await supabase.rpc('toggle_comment_like', {
      p_comment_id: commentId,
    })

    if (error) {
      console.error('Error toggling like:', error)
      toast.error('Kunne ikke oppdatere like')
    } else {
      // Optimistically update the comment
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, like_count: data.like_count, user_has_liked: data.liked }
            : c
        )
      )
    }
  }

  // Delete comment
  const handleDelete = async (commentId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne kommentaren?')) return

    const { error } = await supabase.rpc('delete_comment', {
      p_comment_id: commentId,
    })

    if (error) {
      console.error('Error deleting comment:', error)
      toast.error('Kunne ikke slette kommentar')
    } else {
      fetchComments()
      toast.success('Kommentar slettet')
    }
  }

  // Toggle pin comment
  const handleTogglePin = async (commentId: string) => {
    const { data: isPinned, error } = await supabase.rpc('toggle_pin_comment', {
      p_comment_id: commentId,
    })

    if (error) {
      console.error('Error toggling pin:', error)
      toast.error('Kunne ikke oppdatere festet kommentar')
    } else {
      fetchComments()
      toast.success(isPinned ? 'Kommentar festet' : 'Kommentar løsnet')
    }
  }

  // Toggle collapse replies
  const toggleCollapse = (commentId: string) => {
    setCollapsedComments((prev) => {
      const next = new Set(prev)
      if (next.has(commentId)) {
        next.delete(commentId)
      } else {
        next.add(commentId)
      }
      return next
    })
  }

  // Edit comment handlers
  const handleStartEditComment = (id: string, content: string) => {
    setEditingId(id)
    setEditContent(content)
  }

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return

    const { error } = await supabase
      .from('comments')
      .update({ content: editContent.trim() })
      .eq('id', commentId)

    if (!error) {
      setEditingId(null)
      setEditContent('')
      fetchComments()
      toast.success('Kommentar oppdatert')
    } else {
      toast.error('Kunne ikke oppdatere kommentar')
    }
  }

  // Build tree structure
  const buildCommentTree = (comments: Comment[]) => {
    const rootComments: Comment[] = []
    const childrenMap = new Map<string, Comment[]>()

    comments.forEach((comment) => {
      if (comment.parent_id === null) {
        rootComments.push(comment)
      } else {
        const children = childrenMap.get(comment.parent_id) || []
        children.push(comment)
        childrenMap.set(comment.parent_id, children)
      }
    })

    return { rootComments, childrenMap }
  }

  const { rootComments, childrenMap } = buildCommentTree(comments)

  // Helper functions
  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: nb,
      })
    } catch {
      return dateString
    }
  }

  // Render a single comment
  const renderComment = (comment: Comment, children: Comment[]) => {
    const isCollapsed = collapsedComments.has(comment.id)
    const canDelete = currentUserId === comment.user.id
    const canPin = currentUserId === postOwnerId
    const hasChildren = children.length > 0

    return (
      <div key={comment.id} className="relative">
        {/* Thread line for nested comments */}
        {comment.depth > 0 && (
          <div
            className="absolute left-0 top-0 bottom-0 w-px bg-gray-200"
            style={{ left: `${(comment.depth - 1) * 24 + 20}px` }}
          />
        )}

        <div
          className={cn(
            'flex gap-2 py-3',
            comment.depth > 0 && 'ml-6',
            comment.is_pinned && 'bg-amber-50 -mx-3 px-3 rounded-lg'
          )}
          style={{ marginLeft: `${comment.depth * 24}px` }}
        >
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={comment.user.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-500 text-white text-xs">
              {getInitials(comment.user.full_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Comment Bubble - Complete Feed Card Design */}
            <div className="bg-gray-50 rounded-2xl px-3 py-2 relative">
              <div className="flex items-center gap-2 mb-1">
                {comment.is_pinned && (
                  <Pin className="w-3 h-3 text-amber-600" />
                )}
                <span className="font-semibold text-gray-900 text-sm">
                  {comment.user.full_name || 'Ukjent'}
                </span>
              </div>

              {/* Content */}
              {editingId === comment.id ? (
                <div className="space-y-2">
                  <MentionTextarea
                    value={editContent}
                    onChange={setEditContent}
                    rows={3}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSaveEdit(comment.id)}>
                      Lagre
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Avbryt
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-700 text-sm whitespace-pre-wrap break-words">
                  <MentionText content={comment.content} />
                </div>
              )}
            </div>

            {/* Actions below bubble - Complete Feed Card Design */}
            <div className="flex items-center gap-4 mt-1 px-3">
              <button
                onClick={() => handleToggleLike(comment.id)}
                className="text-xs font-medium flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                {comment.user_has_liked ? '❤️' : '🤍'} {comment.like_count > 0 && comment.like_count}
              </button>

              {currentUserId && (
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Svar
                </button>
              )}

              {currentUserId === comment.user.id && (
                <button
                  onClick={() => handleStartEditComment(comment.id, comment.content)}
                  className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Rediger
                </button>
              )}

              {hasChildren && (
                <button
                  onClick={() => toggleCollapse(comment.id)}
                  className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
                >
                  {isCollapsed ? (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Vis {children.length}
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Skjul
                    </>
                  )}
                </button>
              )}

              <span className="text-xs text-gray-500">
                {formatDate(comment.created_at)}
              </span>

              {comment.edited_at && (
                <span className="text-xs text-gray-400 italic">
                  (redigert)
                </span>
              )}

              {canPin && (
                <button
                  onClick={() => handleTogglePin(comment.id)}
                  className={cn(
                    'text-xs font-medium transition-colors flex items-center gap-1',
                    comment.is_pinned
                      ? 'text-amber-600'
                      : 'text-gray-600 hover:text-amber-600'
                  )}
                >
                  <Pin className="w-3 h-3" />
                  {comment.is_pinned ? 'Løsne' : 'Fest'}
                </button>
              )}

              {canDelete && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-xs font-medium text-gray-600 hover:text-red-500 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Slett
                </button>
              )}
            </div>

            {/* Reply form */}
            {replyingTo === comment.id && (
              <div className="mt-3 flex gap-2 items-start">
                <CornerDownRight className="w-4 h-4 text-gray-400 mt-2" />
                <div className="flex-1 space-y-2">
                  <MentionTextarea
                    value={replyContent}
                    onChange={(value) => setReplyContent(value)}
                    placeholder={`Svar til ${comment.user.full_name || 'Ukjent'}...`}
                    rows={2}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSubmitReply(comment.id)}
                      disabled={submitting || !replyContent.trim()}
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Svar'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setReplyingTo(null)
                        setReplyContent('')
                      }}
                    >
                      Avbryt
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Children (replies) */}
        {!isCollapsed &&
          children.map((child) =>
            renderComment(child, childrenMap.get(child.id) || [])
          )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Kommentarer ({comments.length || initialCommentCount})
      </h3>

      {/* New comment form */}
      {currentUserId ? (
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <MentionTextarea
            value={newComment}
            onChange={(value) => setNewComment(value)}
            placeholder="Skriv en kommentar... Bruk @ for å nevne"
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting || !newComment.trim()}>
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Kommenter
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
          Du må være innlogget for å kommentere.
        </p>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="w-24 h-4 bg-gray-200 rounded" />
                <div className="w-full h-4 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : rootComments.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          Ingen kommentarer ennå. Vær den første!
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {rootComments.map((comment) =>
            renderComment(comment, childrenMap.get(comment.id) || [])
          )}
        </div>
      )}
    </div>
  )
}
