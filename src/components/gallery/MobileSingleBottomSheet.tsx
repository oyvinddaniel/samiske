/**
 * Mobile Single Bottom Sheet
 * Bottom sheet for single image view showing per-image engagement
 *
 * Features:
 * - Per-image likes and comments (not post-level)
 * - Engagement data caching (5-minute TTL)
 * - Optimistic UI for likes
 * - Comment input and list
 * - Auto-updates when image changes
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Heart, MessageCircle, Send, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import type { GalleryImage, GalleryContext, MediaComment } from '@/lib/types/gallery'
import {
  getMediaComments,
  addMediaComment,
  toggleMediaLike,
  getMediaLikeCount,
  hasUserLikedMedia,
  type ImageType
} from '@/lib/mediaComments'
import { toast } from 'sonner'

interface MobileSingleBottomSheetProps {
  image: GalleryImage
  postData: NonNullable<GalleryContext['post_data']>
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface EngagementCache {
  comments: MediaComment[]
  likeCount: number
  hasLiked: boolean
  timestamp: number
}

export function MobileSingleBottomSheet({
  image,
  postData,
  open,
  onOpenChange
}: MobileSingleBottomSheetProps) {
  const [comments, setComments] = useState<MediaComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [likeCount, setLikeCount] = useState(image.like_count || 0)
  const [hasLiked, setHasLiked] = useState(image.has_liked || false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [isLoadingEngagement, setIsLoadingEngagement] = useState(false)

  // Cache for engagement data (per image) - 5 minute TTL
  const engagementCacheRef = useRef<Map<string, EngagementCache>>(new Map())

  // Determine image type based on available IDs
  const imageType: ImageType = image.post_image_id ? 'post_image' : 'media'
  const imageId = image.post_image_id || image.id

  // Load engagement data when image changes or sheet opens
  useEffect(() => {
    if (imageId && open) {
      loadImageEngagement(imageId)
    }
  }, [imageId, open])

  const loadImageEngagement = async (id: string) => {
    // Check cache first (5 min TTL)
    const cached = engagementCacheRef.current.get(id)
    if (cached && Date.now() - cached.timestamp < 300000) {
      setComments(cached.comments)
      setLikeCount(cached.likeCount)
      setHasLiked(cached.hasLiked)
      return
    }

    // Fetch fresh data
    setIsLoadingEngagement(true)
    try {
      const [commentsData, likeCountData, hasLikedData] = await Promise.all([
        getMediaComments(id, imageType),
        getMediaLikeCount(id, imageType),
        hasUserLikedMedia(id, imageType)
      ])

      // Update cache
      engagementCacheRef.current.set(id, {
        comments: commentsData,
        likeCount: likeCountData,
        hasLiked: hasLikedData,
        timestamp: Date.now()
      })

      setComments(commentsData)
      setLikeCount(likeCountData)
      setHasLiked(hasLikedData)
    } catch (error) {
      console.error('Error loading image engagement:', error)
      toast.error('Kunne ikke laste engagement-data')
    } finally {
      setIsLoadingEngagement(false)
    }
  }

  const handleToggleLike = async () => {
    if (isLiking || !imageId) return

    // Optimistic update
    const newHasLiked = !hasLiked
    const newLikeCount = hasLiked ? likeCount - 1 : likeCount + 1

    setHasLiked(newHasLiked)
    setLikeCount(newLikeCount)
    setIsLiking(true)

    try {
      await toggleMediaLike(imageId, imageType)

      // Update cache
      const cached = engagementCacheRef.current.get(imageId)
      if (cached) {
        cached.hasLiked = newHasLiked
        cached.likeCount = newLikeCount
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      // Revert on error
      setHasLiked(!newHasLiked)
      setLikeCount(hasLiked ? likeCount + 1 : likeCount - 1)
      toast.error('Kunne ikke like bilde')
    } finally {
      setIsLiking(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting || !imageId) return

    setIsSubmitting(true)
    try {
      const comment = await addMediaComment(imageId, newComment.trim(), imageType)

      if (comment) {
        // Add to local state
        setComments(prev => [...prev, comment])
        setNewComment('')

        // Update cache
        const cached = engagementCacheRef.current.get(imageId)
        if (cached) {
          cached.comments = [...cached.comments, comment]
        }

        toast.success('Kommentar lagt til')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Kunne ikke legge til kommentar')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Nå nettopp'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}t`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}u`
    return `${Math.floor(diffInSeconds / 2592000)}mnd`
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => onOpenChange(false)}
      title="Kommentarer"
    >
      <div className="pb-4">
        {/* Profile Section (from post) */}
        <div className="flex items-center gap-3 p-4 border-b border-white/[0.08]">
          <Avatar className="w-10 h-10">
            <AvatarImage src={postData.user.avatar_url || undefined} alt={postData.user.full_name} />
            <AvatarFallback>{postData.user.full_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-white">{postData.user.full_name}</p>
            <p className="text-xs text-zinc-500 truncate">Fra {postData.title || 'innlegg'}</p>
          </div>
        </div>

        {/* Per-image Engagement Summary */}
        <div className="px-4 py-3 flex items-center gap-6 border-b border-white/[0.08] bg-white/[0.02]">
          <button
            onClick={handleToggleLike}
            disabled={isLiking}
            className={`flex items-center gap-2 transition-colors ${
              hasLiked ? 'text-rose-500' : 'text-zinc-400 hover:text-rose-500'
            } ${isLiking ? 'opacity-50' : ''}`}
          >
            <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
            {likeCount > 0 && <span className="text-sm font-semibold">{likeCount}</span>}
          </button>
          <div className="flex items-center gap-2 text-zinc-400">
            <MessageCircle className="w-5 h-5" />
            {comments.length > 0 && <span className="text-sm font-semibold">{comments.length}</span>}
          </div>
        </div>

        {/* Comment Input */}
        <div className="px-4 py-3 border-b border-white/[0.08] sticky top-0 bg-black z-10">
          <form onSubmit={handleAddComment} className="flex items-center gap-2">
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Legg til en kommentar..."
              className="flex-1 px-4 py-2 bg-white/[0.06] rounded-full text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </form>
        </div>

        {/* Comments List */}
        <div className="px-4 py-3 max-h-[50vh] overflow-y-auto">
          {isLoadingEngagement ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 text-zinc-400 mx-auto mb-2 animate-spin" />
              <p className="text-sm text-zinc-500">Laster kommentarer...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="py-12 text-center">
              <MessageCircle className="w-12 h-12 text-zinc-300 mx-auto mb-2" />
              <p className="text-zinc-500 text-sm">Ingen kommentarer ennå</p>
              <p className="text-zinc-400 text-xs mt-1">Vær den første til å kommentere!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-2">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage
                      src={comment.user?.avatar_url || undefined}
                      alt={comment.user?.full_name || 'Bruker'}
                    />
                    <AvatarFallback>
                      {comment.user?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">
                      <span className="font-semibold">{comment.user?.full_name || 'Ukjent bruker'}</span>
                      {' '}
                      {comment.content}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {formatRelativeTime(comment.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  )
}
