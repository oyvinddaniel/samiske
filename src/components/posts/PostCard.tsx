'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { createClient } from '@/lib/supabase/client'
import { ProfileOverlay } from '@/components/profile/ProfileOverlay'

interface CommentLikeUser {
  id: string
  full_name: string | null
}

interface Comment {
  id: string
  content: string
  created_at: string
  parent_id: string | null
  like_count: number
  user_has_liked?: boolean
  like_users?: CommentLikeUser[]
  user: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  replies?: Comment[]
}

interface LikeUser {
  id: string
  full_name: string | null
  avatar_url: string | null
}

interface PostCardProps {
  post: {
    id: string
    title: string
    content: string
    image_url?: string | null
    type: 'standard' | 'event'
    visibility: 'public' | 'members'
    event_date?: string | null
    event_time?: string | null
    event_location?: string | null
    created_at: string
    user: {
      id: string
      full_name: string | null
      avatar_url: string | null
    }
    category: {
      name: string
      slug: string
      color: string
    } | null
    comment_count: number
    like_count: number
    user_has_liked?: boolean
  }
  currentUserId?: string
}

const categoryColors: Record<string, string> = {
  arrangement: '#EF4444',
  aktivitet: '#3B82F6',
  nyhet: '#10B981',
  mote: '#F59E0B',
  sporsmal: '#8B5CF6',
  kunngjoring: '#EC4899',
  generelt: '#6B7280',
}

export function PostCard({ post, currentUserId }: PostCardProps) {
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
  const [loadingLikes, setLoadingLikes] = useState(false)
  const [commentLikes, setCommentLikes] = useState<Record<string, { count: number; liked: boolean; users: CommentLikeUser[] }>>({})
  const [previewComments, setPreviewComments] = useState<Comment[]>([])
  const [profileOverlayUserId, setProfileOverlayUserId] = useState<string | null>(null)
  const supabase = createClient()

  // Check if content should be blurred (members-only and not logged in)
  const isBlurred = post.visibility === 'members' && !currentUserId

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

  const formatEventDate = (date: string, time?: string | null) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }
    const dateObj = new Date(date)
    let formatted = dateObj.toLocaleDateString('nb-NO', options)
    if (time) {
      formatted += ` kl. ${time.slice(0, 5)}`
    }
    return formatted
  }

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

  const fetchComments = async () => {
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

      // First pass: create all comments
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

      // Second pass: build hierarchy
      data.forEach((comment) => {
        const formattedComment = commentMap.get(comment.id)!
        if (comment.parent_id && commentMap.has(comment.parent_id)) {
          commentMap.get(comment.parent_id)!.replies!.push(formattedComment)
        } else {
          rootComments.push(formattedComment)
        }
      })

      setComments(rootComments)

      // Fetch comment likes
      const commentIds = data.map((c) => c.id)
      if (commentIds.length > 0) {
        fetchCommentLikes(commentIds)
      }
    }
    setLoadingComments(false)
  }

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

  const fetchLikeUsers = async () => {
    setLoadingLikes(true)
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
    setLoadingLikes(false)
  }

  // Fetch like users on mount if there are likes
  useEffect(() => {
    if (post.like_count > 0) {
      fetchLikeUsers()
    }
  }, [post.id])

  // Fetch preview comments
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

    // Also update comment count
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id)

    if (count !== null) {
      setCommentCount(count)
    }
  }, [supabase, post.id])

  // Fetch preview comments on mount
  useEffect(() => {
    fetchPreviewComments()
  }, [fetchPreviewComments])

  // Real-time subscription for this post's comments + polling fallback
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
        async () => {
          // Refetch preview comments and count
          fetchPreviewComments()
          // Also refetch full comments if they're shown
          if (showComments) {
            fetchComments()
          }
        }
      )
      .subscribe()

    // Polling fallback every 5 seconds for preview comments
    const pollInterval = setInterval(() => {
      fetchPreviewComments()
    }, 5000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(pollInterval)
    }
  }, [supabase, post.id, showComments, fetchPreviewComments])

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

  const categoryColor = post.category?.color || categoryColors[post.category?.slug || ''] || '#6B7280'

  // Render a single comment with replies
  const renderComment = (comment: Comment, depth = 0) => {
    const likeData = commentLikes[comment.id] || { count: 0, liked: false, users: [] }

    return (
      <div key={comment.id} className={`${depth > 0 ? 'ml-4 border-l-2 border-gray-100 pl-2' : ''}`}>
        <div className="flex gap-1.5">
          <button onClick={() => setProfileOverlayUserId(comment.user.id)} className="focus:outline-none flex-shrink-0">
            <Avatar className="w-5 h-5 cursor-pointer hover:ring-2 hover:ring-blue-200 transition-all">
              <AvatarImage src={comment.user.avatar_url || undefined} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-[8px]">
                {getInitials(comment.user.full_name)}
              </AvatarFallback>
            </Avatar>
          </button>
          <div className="flex-1 min-w-0">
            <div className="bg-gray-50 rounded-md px-2 py-1">
              <button
                onClick={() => setProfileOverlayUserId(comment.user.id)}
                className="text-xs font-medium text-gray-900 hover:text-blue-600 transition-colors focus:outline-none"
              >
                {comment.user.full_name || 'Ukjent'}
              </button>
              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-0.5 px-0.5">
              <span className="text-[9px] text-gray-400">
                {formatDate(comment.created_at)}
              </span>

              {/* Comment like button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleCommentLike(comment.id)}
                      disabled={!currentUserId}
                      className={`text-[9px] hover:underline flex items-center gap-0.5 ${
                        likeData.liked ? 'text-red-500' : 'text-gray-400'
                      }`}
                    >
                      {likeData.liked ? '❤️' : '🤍'}
                      {likeData.count > 0 && <span>{likeData.count}</span>}
                    </button>
                  </TooltipTrigger>
                  {likeData.count > 0 && (
                    <TooltipContent side="top" className="p-1.5">
                      <p className="text-xs font-medium mb-0.5">Likt av:</p>
                      <div className="space-y-0.5">
                        {likeData.users.slice(0, 5).map((user) => (
                          <p key={user.id} className="text-xs">{user.full_name || 'Ukjent'}</p>
                        ))}
                        {likeData.count > 5 && (
                          <p className="text-[9px] text-gray-400">og {likeData.count - 5} andre</p>
                        )}
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

              {currentUserId && (
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="text-[9px] text-blue-500 hover:underline"
                >
                  Svar
                </button>
              )}
              {currentUserId === comment.user.id && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-[9px] text-red-500 hover:underline"
                >
                  Slett
                </button>
              )}
            </div>

            {/* Reply form */}
            {replyingTo === comment.id && (
              <form onSubmit={(e) => handleSubmitComment(e, comment.id)} className="mt-1.5 flex gap-1.5">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Svar til ${comment.user.full_name || 'Ukjent'}...`}
                  rows={1}
                  className="resize-none text-sm min-h-[28px] py-1 text-xs"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-7 text-xs px-3 text-white rounded-md font-medium disabled:opacity-50 disabled:pointer-events-none hover:brightness-110 transition-all"
                  style={{ backgroundColor: '#1472E6' }}
                >
                  Svar
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-1.5 space-y-1.5">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card id={`post-${post.id}`} className={`overflow-hidden hover:shadow-md transition-shadow max-w-lg mx-auto ${isBlurred ? 'relative' : ''} !pt-0 !pb-0 !gap-0`}>
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
          <button onClick={() => setProfileOverlayUserId(post.user.id)} className="focus:outline-none">
            <Avatar className="w-5 h-5 cursor-pointer hover:ring-2 hover:ring-blue-200 transition-all">
              <AvatarImage src={post.user.avatar_url || undefined} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-[9px]">
                {getInitials(post.user.full_name)}
              </AvatarFallback>
            </Avatar>
          </button>
          <button
            onClick={() => setProfileOverlayUserId(post.user.id)}
            className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors focus:outline-none"
          >
            {post.user.full_name || 'Ukjent'}
          </button>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500">{formatDate(post.created_at)}</span>
          <div className="flex-1" />
          {/* Visibility icon - globe for public, lock for members */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">
                  <img
                    src={post.visibility === 'members' ? '/images/lock.png' : '/images/globe.png'}
                    alt={post.visibility === 'members' ? 'Kun for medlemmer' : 'Offentlig'}
                    className="w-3.5 h-3.5"
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {post.visibility === 'members' ? 'Kun for medlemmer' : 'Offentlig synlig'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {post.category && (
            <Badge
              style={{ backgroundColor: categoryColor, color: 'white' }}
              className="text-[9px] px-1 py-0"
            >
              {post.category.name}
            </Badge>
          )}
        </div>

        {/* Title */}
        <Link href={`/innlegg/${post.id}`}>
          <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-1">
            {post.title}
          </h3>
        </Link>

        {/* Event info (compact) */}
        {post.type === 'event' && post.event_date && (
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1.5 bg-gray-50 rounded px-1.5 py-1">
            <span>📅 {formatEventDate(post.event_date, post.event_time)}</span>
            {post.event_location && <span>📍 {post.event_location}</span>}
          </div>
        )}

        {/* Content preview */}
        <p className="text-gray-600 text-sm line-clamp-2 mb-1.5">{post.content}</p>

        {/* Image - natural aspect ratio */}
        {post.image_url && (
          <div className="w-full overflow-hidden rounded-md bg-gray-100 mb-1.5">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Actions */}
        <div className="pt-1.5">
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-1.5 text-xs ${liked ? 'text-red-500' : 'text-gray-500'}`}
              onClick={handleLike}
              disabled={!currentUserId}
            >
              {liked ? '❤️' : '🤍'} {likeCount}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-1.5 text-xs text-gray-500"
              onClick={handleToggleComments}
            >
              💬 {commentCount}
            </Button>

            <div className="flex-1" />

            <Link href={`/innlegg/${post.id}`}>
              <Button variant="ghost" size="sm" className="h-7 px-1.5 text-gray-400 text-xs">
                Se mer →
              </Button>
            </Link>
          </div>

          {/* Like users sneak peek - now below the like button */}
          {likeUsers.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 mt-1 cursor-pointer">
                    <div className="flex -space-x-1">
                      {likeUsers.slice(0, 3).map((user) => (
                        <Avatar key={user.id} className="w-4 h-4 border border-white">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-gray-100 text-gray-600 text-[7px]">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-500">
                      Likt av <span className="font-medium">{likeUsers[0]?.full_name || 'Ukjent'}</span>
                      {likeCount > 1 && ` og ${likeCount - 1} andre`}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="p-1.5">
                  <p className="text-xs font-medium mb-0.5">Likt av:</p>
                  <div className="space-y-0.5">
                    {likeUsers.map((user) => (
                      <div key={user.id} className="flex items-center gap-1">
                        <Avatar className="w-3.5 h-3.5">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-gray-100 text-[7px]">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{user.full_name || 'Ukjent'}</span>
                      </div>
                    ))}
                    {likeCount > likeUsers.length && (
                      <p className="text-[9px] text-gray-400">
                        og {likeCount - likeUsers.length} andre
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Divider and comments section */}
          <div className="mx-2 mt-2 mb-[15px] border-t border-gray-100" />

          {/* Preview comments - sneak peek */}
          {previewComments.length > 0 && !showComments && (
            <div className="space-y-1.5 mb-3">
              {previewComments.map((comment) => (
                <div key={comment.id} className="flex gap-1.5">
                  <button onClick={() => setProfileOverlayUserId(comment.user.id)} className="focus:outline-none flex-shrink-0">
                    <Avatar className="w-5 h-5 cursor-pointer hover:ring-2 hover:ring-blue-200 transition-all">
                      <AvatarImage src={comment.user.avatar_url || undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-[8px]">
                        {getInitials(comment.user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setProfileOverlayUserId(comment.user.id)}
                        className="text-xs font-medium text-gray-900 hover:text-blue-600 transition-colors focus:outline-none"
                      >
                        {comment.user.full_name || 'Ukjent'}
                      </button>
                      <span className="text-[10px] text-gray-400">
                        · {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700 line-clamp-2">
                      {comment.content}
                    </span>
                  </div>
                </div>
              ))}
              {commentCount > 2 && (
                <button
                  onClick={handleToggleComments}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Se alle {commentCount} kommentarer
                </button>
              )}
            </div>
          )}

          {/* Comment input - always visible */}
          {currentUserId ? (
            <form onSubmit={(e) => handleSubmitComment(e, null)} className="flex gap-1.5 items-stretch">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Skriv en kommentar..."
                rows={1}
                className="resize-none text-sm min-h-[38px] py-2"
              />
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="h-[38px] px-4 text-xs text-white rounded-md font-medium disabled:opacity-50 disabled:pointer-events-none hover:brightness-110 transition-all"
                style={{ backgroundColor: '#1472E6' }}
              >
                {submitting ? '...' : 'Send'}
              </button>
            </form>
          ) : (
            <p className="text-xs text-gray-500 bg-gray-50 p-1.5 rounded">
              Logg inn for å kommentere
            </p>
          )}
        </div>

        {/* Expanded comments list */}
        {showComments && (
          <div className="mt-2 space-y-2">
            {loadingComments ? (
              <div className="text-xs text-gray-400">Laster kommentarer...</div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-1">
                Ingen kommentarer ennå
              </p>
            ) : (
              <div className="space-y-2">
                {comments.map((comment) => renderComment(comment))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Profile overlay */}
      {profileOverlayUserId && (
        <ProfileOverlay
          userId={profileOverlayUserId}
          onClose={() => setProfileOverlayUserId(null)}
        />
      )}
    </Card>
  )
}
