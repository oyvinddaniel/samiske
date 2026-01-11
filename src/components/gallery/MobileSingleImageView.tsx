/**
 * Mobile Single Image View - Complete Feed Card Design
 * Fullscreen scrollable feed card with pinch-to-zoom, comments, and engagement
 *
 * Features:
 * - Pinch-to-zoom on image (2 fingers)
 * - Double-tap to zoom
 * - Title and caption display
 * - Full engagement stats (likes, comments, share)
 * - Comment input with avatar
 * - Threaded comments with like/reply
 * - Scrollable feed card layout
 */

'use client'

import { useState, useEffect } from 'react'
import { X, Heart, MessageCircle, Share2, Eye } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import type { GalleryImage, GalleryContext, MediaComment } from '@/lib/types/gallery'
import { getMediaUrl } from '@/lib/media/mediaUrls'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  getMediaComments,
  addMediaComment,
  toggleMediaLike,
  getMediaLikeCount,
  hasUserLikedMedia
} from '@/lib/mediaComments'

// Helper function to get image URL - supports both storage_path and direct URL
function getImageUrl(image: GalleryImage, sizeRequest?: 'thumb' | 'medium' | 'large' | 'original'): string {
  if (image.storage_path) {
    const mediaSize: 'thumb' | 'medium' | 'large' | 'original' = sizeRequest || 'medium'
    return getMediaUrl(image.storage_path, mediaSize as any)
  }
  if (sizeRequest === 'thumb' && image.thumbnail_url) {
    return image.thumbnail_url
  }
  return image.url || image.thumbnail_url || ''
}

interface MobileSingleImageViewProps {
  image: GalleryImage
  imageIndex: number
  totalImages: number
  context: GalleryContext
  onNext: () => void
  onPrevious: () => void
  onClose: () => void
}

export function MobileSingleImageView({
  image,
  imageIndex,
  totalImages,
  context,
  onNext,
  onPrevious,
  onClose
}: MobileSingleImageViewProps) {
  // Image engagement state
  const [comments, setComments] = useState<MediaComment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(true)
  const [likeCount, setLikeCount] = useState(image.like_count || 0)
  const [hasLiked, setHasLiked] = useState(image.has_liked || false)
  const [isLiking, setIsLiking] = useState(false)

  // Comment input state
  const [commentInput, setCommentInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Current user
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Pinch to zoom state
  const [scale, setScale] = useState(1)
  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const [initialDistance, setInitialDistance] = useState(0)
  const [initialScale, setInitialScale] = useState(1)

  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setInitialDistance(getDistance(e.touches))
      setInitialScale(scale)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const currentDistance = getDistance(e.touches)
      const newScale = Math.max(1, Math.min(4, (currentDistance / initialDistance) * initialScale))
      setScale(newScale)
    } else if (e.touches.length === 1 && scale > 1) {
      const touch = e.touches[0]
      setTranslateX(touch.clientX - window.innerWidth / 2)
      setTranslateY(touch.clientY - window.innerHeight / 2)
    }
  }

  const handleTouchEnd = () => {
    if (scale === 1) {
      setTranslateX(0)
      setTranslateY(0)
    }
  }

  const handleDoubleTap = () => {
    if (scale === 1) {
      setScale(2)
    } else {
      setScale(1)
      setTranslateX(0)
      setTranslateY(0)
    }
  }

  // Load current user
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    getUser()
  }, [])

  // Load comments and like status from backend
  useEffect(() => {
    const loadComments = async () => {
      if (!image.post_image_id) return
      setIsLoadingComments(true)
      try {
        const fetchedComments = await getMediaComments(image.post_image_id, 'post_image')
        setComments(fetchedComments)
      } catch (error) {
        console.error('Error loading comments:', error)
      } finally {
        setIsLoadingComments(false)
      }
    }

    const loadLikeStatus = async () => {
      if (!image.post_image_id) return
      try {
        const count = await getMediaLikeCount(image.post_image_id, 'post_image')
        const liked = await hasUserLikedMedia(image.post_image_id, 'post_image')
        setLikeCount(count)
        setHasLiked(liked)
      } catch (error) {
        console.error('Error loading like status:', error)
      }
    }

    if (image.post_image_id) {
      loadComments()
      loadLikeStatus()
    }
  }, [image.post_image_id])

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentInput.trim() || isSubmitting) return

    if (!image.post_image_id) {
      toast.error('Kan ikke kommentere på dette bildet')
      return
    }

    if (!currentUser) {
      toast.error('Du må være logget inn for å kommentere')
      return
    }

    setIsSubmitting(true)
    try {
      const newComment = await addMediaComment(image.post_image_id, commentInput, 'post_image')
      if (newComment) {
        setComments([...comments, newComment])
        setCommentInput('')
        toast.success('Kommentar lagt til')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Kunne ikke legge til kommentar')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleLike = async () => {
    if (isLiking) return

    if (!image.post_image_id) {
      toast.error('Kan ikke like dette bildet')
      return
    }

    if (!currentUser) {
      toast.error('Du må være logget inn for å like')
      return
    }

    setIsLiking(true)
    try {
      const nowLiked = await toggleMediaLike(image.post_image_id, 'post_image')
      setHasLiked(nowLiked)
      setLikeCount(count => nowLiked ? count + 1 : count - 1)
    } catch (error) {
      console.error('Error toggling like:', error)
      toast.error('Kunne ikke like bilde')
    } finally {
      setIsLiking(false)
    }
  }

  // Format relative time
  const getRelativeTime = (date: string) => {
    const now = new Date()
    const past = new Date(date)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Nå'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}t`
    if (diffDays < 7) return `${diffDays}d`
    return new Date(date).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
  }

  const postData = context.post_data
  const title = postData?.title || image.caption || 'Bilde'
  const caption = postData?.content || image.caption || ''

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
      {/* Close button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-20"
        aria-label="Lukk"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Desktop: Centered container with max width | Mobile: Full width */}
      <div className="max-w-2xl mx-auto p-4 pb-64 md:py-8">
        {/* Author Info */}
        {postData && (
          <div className="flex items-center gap-3 mb-4 md:mb-6 pb-4 border-b border-white/10">
            <Avatar className="w-10 h-10 md:w-12 md:h-12">
              {postData.user.avatar_url && (
                <AvatarImage src={postData.user.avatar_url} alt={postData.user.full_name} />
              )}
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                {postData.user.full_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-white text-sm md:text-base">{postData.user.full_name}</p>
              <p className="text-xs md:text-sm text-gray-400">
                {new Date(postData.created_at).toLocaleDateString('nb-NO', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        )}

        {/* Image with pinch to zoom */}
        <div className="mb-4 md:mb-6">
          <div
            className="relative aspect-square md:aspect-auto md:max-h-[70vh] rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDoubleClick={handleDoubleTap}
          >
            <div
              className="absolute inset-0 transition-transform duration-200 flex items-center justify-center"
              style={{
                transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`,
              }}
            >
              <img
                src={getImageUrl(image, 'original')}
                alt={image.alt_text || image.caption || 'Bilde'}
                className="w-full h-full md:max-h-[70vh] object-cover md:object-contain rounded-lg"
                draggable={false}
              />
            </div>
          </div>
          {scale > 1 && (
            <p className="text-xs text-center text-gray-400 mt-2">
              Pinch ut for å zoome tilbake • Dobbelttrykk for reset
            </p>
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>

        {/* Caption */}
        {caption && (
          <p className="text-sm text-gray-300 mb-4">
            {caption}
          </p>
        )}

        {/* Engagement stats */}
        <div className="flex items-center gap-4 py-3 border-y border-white/10 mb-4">
          <button
            onClick={handleToggleLike}
            disabled={isLiking || !currentUser}
            className={`flex items-center gap-2 transition-all ${
              hasLiked ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'
            } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">
              {likeCount > 0 ? likeCount : ''}
            </span>
          </button>
          <div className="flex items-center gap-2 text-gray-400">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{comments.length > 0 ? comments.length : ''}</span>
          </div>
          <button className="flex items-center gap-2 text-gray-400 ml-auto hover:text-white transition-colors">
            <Share2 className="w-5 h-5" />
            <span className="text-sm font-medium">Del</span>
          </button>
        </div>

        {/* Comment input */}
        {currentUser ? (
          <div className="mb-6">
            <form onSubmit={handleAddComment} className="flex gap-2">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                  Du
                </AvatarFallback>
              </Avatar>
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Skriv en kommentar..."
                maxLength={2000}
                disabled={isSubmitting}
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              {commentInput.trim() && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sender...' : 'Send'}
                </button>
              )}
            </form>
          </div>
        ) : (
          <div className="mb-6 text-center py-4">
            <p className="text-sm text-gray-400">
              Logg inn for å kommentere og like
            </p>
          </div>
        )}

        {/* Comments section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase">Kommentarer</h3>

          {isLoadingComments ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
                <MessageCircle className="w-6 h-6 text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-500">Ingen kommentarer ennå</p>
              <p className="text-xs mt-1 text-zinc-600">Vær den første til å kommentere</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="space-y-2">
                <div className="flex gap-2">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    {comment.user?.avatar_url && (
                      <AvatarImage src={comment.user.avatar_url} alt={comment.user.full_name} />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-500 text-white text-xs">
                      {comment.user?.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-white/5 rounded-2xl px-3 py-2">
                      <p className="text-sm font-semibold text-white">
                        {comment.user?.full_name || 'Ukjent bruker'}
                      </p>
                      <p className="text-sm text-gray-300">{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-1 px-3">
                      <span className="text-xs text-gray-500">
                        {getRelativeTime(comment.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom white space for comfortable scrolling */}
        <div className="h-[100px]" />
      </div>
    </div>
  )
}
