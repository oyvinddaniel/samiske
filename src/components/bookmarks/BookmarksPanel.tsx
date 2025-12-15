'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { PostDialogContent } from '@/components/posts/PostDialogContent'
import { usePostCard } from '@/hooks/usePostCard'
import { Bookmark, MessageCircle, Heart, Calendar, BookmarkX } from 'lucide-react'

interface BookmarkedPost {
  id: string
  title: string
  content: string
  type: 'standard' | 'event'
  visibility: 'public' | 'members'
  image_url: string | null
  event_date: string | null
  event_time: string | null
  event_location: string | null
  created_at: string
  user: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  category: {
    id: string
    name: string
    slug: string
    color: string
  } | null
  like_count: number
  comment_count: number
  user_has_liked: boolean
}

interface BookmarksPanelProps {
  onClose: () => void
}

// Compact bookmark card component
function CompactBookmarkCard({
  post,
  onClick,
  onRemoveBookmark
}: {
  post: BookmarkedPost
  onClick: () => void
  onRemoveBookmark: (e: React.MouseEvent) => void
}) {
  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'I dag'
    if (diffDays === 1) return 'I går'
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
  }

  return (
    <Card
      className="overflow-hidden hover:shadow-md transition-all cursor-pointer group relative"
      onClick={onClick}
    >
      {/* Remove bookmark button */}
      <button
        onClick={onRemoveBookmark}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/80 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Fjern bokmerke"
      >
        <BookmarkX className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
      </button>

      {/* Image or colored header */}
      {post.image_url ? (
        <div className="h-24 overflow-hidden">
          <img
            src={post.image_url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>
      ) : (
        <div
          className="h-8"
          style={{ backgroundColor: post.category?.color || '#1472E6' }}
        />
      )}

      <div className="p-3">
        {/* Category badge */}
        {post.category && (
          <Badge
            style={{ backgroundColor: post.category.color, color: 'white' }}
            className="text-[9px] px-1.5 py-0 mb-1.5"
          >
            {post.category.name}
          </Badge>
        )}

        {/* Title */}
        <h4 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1.5 group-hover:text-blue-600 transition-colors">
          {post.title}
        </h4>

        {/* Event date if applicable */}
        {post.type === 'event' && post.event_date && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1.5">
            <Calendar className="w-3 h-3" />
            <span>{new Date(post.event_date).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })}</span>
          </div>
        )}

        {/* Footer: user + stats */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <Avatar className="w-4 h-4">
              <AvatarImage src={post.user.avatar_url || undefined} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-[8px]">
                {getInitials(post.user.full_name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-500 truncate max-w-[60px]">
              {post.user.full_name?.split(' ')[0] || 'Ukjent'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="flex items-center gap-0.5">
              <Heart className="w-3 h-3" />
              {post.like_count}
            </span>
            <span className="flex items-center gap-0.5">
              <MessageCircle className="w-3 h-3" />
              {post.comment_count}
            </span>
          </div>
        </div>

        {/* Time ago */}
        <div className="text-[10px] text-gray-400 mt-1.5">
          {formatDate(post.created_at)}
        </div>
      </div>
    </Card>
  )
}

// Expanded post view using the existing hook
function ExpandedPostView({
  post,
  currentUserId,
  onClose
}: {
  post: BookmarkedPost
  currentUserId: string
  onClose: () => void
}) {
  const postCardData = {
    ...post,
    posted_from_name: undefined,
    posted_from_type: undefined as 'group' | 'community' | 'place' | 'municipality' | 'private' | undefined,
    posted_from_id: undefined,
    created_for_group_id: undefined,
    created_for_community_id: undefined,
  }

  const {
    liked,
    likeCount,
    comments,
    commentCount,
    loadingComments,
    newComment,
    replyingTo,
    replyContent,
    submitting,
    commentLikes,
    postData,
    isOwner,
    setNewComment,
    setReplyingTo,
    setReplyContent,
    handleLike,
    handleCommentLike,
    handleSubmitComment,
    handleDeleteComment,
    fetchComments,
  } = usePostCard({ post: postCardData, currentUserId })

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  return (
    <BottomSheet
      open={true}
      onClose={onClose}
      title={postData.title}
    >
      <div className="py-4 pb-[100px]">
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
          onEdit={() => {}}
        />
      </div>
    </BottomSheet>
  )
}

export function BookmarksPanel({ onClose }: BookmarksPanelProps) {
  const [posts, setPosts] = useState<BookmarkedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [expandedPost, setExpandedPost] = useState<BookmarkedPost | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const fetchBookmarks = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        onClose()
        return
      }

      setUserId(user.id)

      // Fetch bookmarked posts
      const { data: bookmarks, error } = await supabase
        .from('bookmarks')
        .select(`
          post_id,
          posts (
            id,
            title,
            content,
            type,
            visibility,
            image_url,
            event_date,
            event_time,
            event_location,
            created_at,
            user:profiles!posts_user_id_fkey (
              id,
              full_name,
              avatar_url
            ),
            category:categories (
              id,
              name,
              slug,
              color
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching bookmarks:', error)
        setLoading(false)
        return
      }

      if (bookmarks) {
        const postIds = bookmarks.map(b => b.post_id)

        // Fetch counts
        const [{ data: likeCounts }, { data: commentCounts }, { data: userLikes }] = await Promise.all([
          supabase.from('likes').select('post_id').in('post_id', postIds),
          supabase.from('comments').select('post_id').in('post_id', postIds),
          supabase.from('likes').select('post_id').eq('user_id', user.id).in('post_id', postIds)
        ])

        const likeCountMap = new Map<string, number>()
        const commentCountMap = new Map<string, number>()
        const userLikeSet = new Set<string>()

        likeCounts?.forEach(l => {
          likeCountMap.set(l.post_id, (likeCountMap.get(l.post_id) || 0) + 1)
        })
        commentCounts?.forEach(c => {
          commentCountMap.set(c.post_id, (commentCountMap.get(c.post_id) || 0) + 1)
        })
        userLikes?.forEach(l => userLikeSet.add(l.post_id))

        const formattedPosts: BookmarkedPost[] = bookmarks
          .filter(b => b.posts)
          .map(b => {
            const post = b.posts as unknown as {
              id: string
              title: string
              content: string
              type: 'standard' | 'event'
              visibility: 'public' | 'members'
              image_url: string | null
              event_date: string | null
              event_time: string | null
              event_location: string | null
              created_at: string
              user: { id: string; full_name: string | null; avatar_url: string | null } | { id: string; full_name: string | null; avatar_url: string | null }[]
              category: { id: string; name: string; slug: string; color: string } | { id: string; name: string; slug: string; color: string }[] | null
            }
            const userData = Array.isArray(post.user) ? post.user[0] : post.user
            const categoryData = Array.isArray(post.category) ? post.category[0] : post.category

            return {
              id: post.id,
              title: post.title,
              content: post.content,
              type: post.type,
              visibility: post.visibility,
              image_url: post.image_url,
              event_date: post.event_date,
              event_time: post.event_time,
              event_location: post.event_location,
              created_at: post.created_at,
              user: userData,
              category: categoryData,
              like_count: likeCountMap.get(post.id) || 0,
              comment_count: commentCountMap.get(post.id) || 0,
              user_has_liked: userLikeSet.has(post.id),
            }
          })

        setPosts(formattedPosts)
      }

      setLoading(false)
    }

    fetchBookmarks()
  }, [supabase, onClose])

  const handleRemoveBookmark = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation()
    if (!userId) return

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId)

    if (!error) {
      setPosts(prev => prev.filter(p => p.id !== postId))
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200">
        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
          <Bookmark className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Mine bokmerker</h2>
          <p className="text-xs text-gray-500">{posts.length} lagret</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl animate-pulse">
                <div className="h-24 bg-gray-200 rounded-t-xl" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ingen bokmerker ennå</h3>
            <p className="text-gray-500 text-sm">
              Klikk på bokmerke-ikonet på innlegg du vil lagre til senere.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {posts.map((post) => (
              <CompactBookmarkCard
                key={post.id}
                post={post}
                onClick={() => setExpandedPost(post)}
                onRemoveBookmark={(e) => handleRemoveBookmark(e, post.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Expanded post view */}
      {expandedPost && userId && (
        <ExpandedPostView
          post={expandedPost}
          currentUserId={userId}
          onClose={() => setExpandedPost(null)}
        />
      )}
    </div>
  )
}
