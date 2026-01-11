/**
 * Gallery Image Sidebar - 2025 Modern Design
 * Professional comment section with dark theme best practices
 *
 * Design Research (Dec 2025):
 * - Dark gray backgrounds (#18181B) instead of pure black
 * - Subtle transparency and depth
 * - Clean visual hierarchy
 * - Vibrant action colors
 * - Adequate spacing for readability
 */

'use client'

import { useState, useEffect } from 'react'
import { Heart, MessageCircle, ChevronLeft, X, Send } from 'lucide-react'
import { toast } from 'sonner'
import type { User } from '@supabase/supabase-js'
import type { GalleryImage, GalleryContext, MediaComment } from '@/lib/types/gallery'
import {
  getMediaComments,
  addMediaComment,
  toggleMediaLike,
  getMediaLikeCount,
  hasUserLikedMedia
} from '@/lib/mediaComments'
import { createClient } from '@/lib/supabase/client'

interface GalleryImageSidebarProps {
  image: GalleryImage
  context: GalleryContext
  onBack: () => void
  onClose: () => void
}

export function GalleryImageSidebar({
  image,
  context,
  onBack,
  onClose
}: GalleryImageSidebarProps) {
  const [comments, setComments] = useState<MediaComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [likeCount, setLikeCount] = useState(image.like_count || 0)
  const [hasLiked, setHasLiked] = useState(image.has_liked || false)
  const [isLiking, setIsLiking] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    getUser()
  }, [])

  // Load comments and like status
  // Only load if this is from media table (has storage_path), not post_images
  useEffect(() => {
    const loadComments = async () => {
      if (!image.storage_path) return // Skip for post_images
      const fetchedComments = await getMediaComments(image.id)
      setComments(fetchedComments)
    }

    const loadLikeStatus = async () => {
      if (!image.storage_path) return // Skip for post_images
      const count = await getMediaLikeCount(image.id)
      const liked = await hasUserLikedMedia(image.id)
      setLikeCount(count)
      setHasLiked(liked)
    }

    if (image.storage_path) {
      loadComments()
      loadLikeStatus()
    }
  }, [image.id, image.storage_path])

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return

    // Only allow comments on media table images (not post_images)
    if (!image.storage_path) {
      toast.error('Kommentarer er kun tilgjengelig for geografi-bilder')
      return
    }

    if (!currentUser) {
      toast.error('Du må være logget inn for å kommentere')
      return
    }

    setIsSubmitting(true)

    try {
      const comment = await addMediaComment(image.id, newComment)
      if (comment) {
        setComments([...comments, comment])
        setNewComment('')
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

    // Only allow likes on media table images (not post_images)
    if (!image.storage_path) {
      toast.error('Likes er kun tilgjengelig for geografi-bilder')
      return
    }

    if (!currentUser) {
      toast.error('Du må være logget inn for å like')
      return
    }

    setIsLiking(true)

    try {
      const nowLiked = await toggleMediaLike(image.id)
      setHasLiked(nowLiked)
      setLikeCount(count => nowLiked ? count + 1 : count - 1)
    } catch (error) {
      console.error('Error toggling like:', error)
      toast.error('Kunne ikke like bilde')
    } finally {
      setIsLiking(false)
    }
  }

  // Format relative time (modern approach)
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

  return (
    <div className="w-96 flex-shrink-0 flex flex-col h-full bg-black">
      {/* Header - Clean & Minimal */}
      <div className="flex-shrink-0 px-5 py-4 flex items-center justify-between border-b border-white/[0.08]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-medium">Tilbake</span>
        </button>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-all"
          aria-label="Lukk"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Author Section - Modern Card Style */}
      <div className="flex-shrink-0 px-5 py-5">
        <div className="flex items-start gap-3">
          {/* Avatar with subtle glow */}
          {image.uploader?.avatar_url ? (
            <img
              src={image.uploader.avatar_url}
              alt={image.uploader.full_name}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-white/[0.08]"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-base ring-2 ring-white/[0.08]">
              {image.uploader?.full_name?.charAt(0) || '?'}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-[15px] truncate">
              {image.uploader?.full_name || 'Ukjent bruker'}
            </p>
            <p className="text-zinc-500 text-xs mt-0.5">
              {image.created_at ? new Date(image.created_at).toLocaleDateString('nb-NO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              }) : 'Ukjent dato'}
            </p>
          </div>
        </div>

        {/* Caption - Modern Typography */}
        {image.caption && (
          <p className="mt-4 text-zinc-200 text-[15px] leading-relaxed">
            {image.caption}
          </p>
        )}
      </div>

      {/* Action Bar - Instagram/Threads Style */}
      <div className="flex-shrink-0 px-5 py-3 border-y border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center gap-6">
          {/* Like Button */}
          <button
            onClick={handleToggleLike}
            disabled={isLiking || !currentUser}
            className={`flex items-center gap-2 group transition-all ${
              hasLiked
                ? 'text-rose-500'
                : 'text-zinc-400 hover:text-rose-400'
            } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Heart className={`w-[22px] h-[22px] ${hasLiked ? 'fill-current' : 'group-hover:scale-110'} transition-transform`} />
            <span className="text-sm font-semibold">
              {likeCount > 0 ? likeCount : ''}
            </span>
          </button>

          {/* Comment Count */}
          <div className="flex items-center gap-2 text-zinc-400">
            <MessageCircle className="w-[22px] h-[22px]" />
            <span className="text-sm font-semibold">
              {comments.length > 0 ? comments.length : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Comments Section - Optimized for Readability */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Comments Header */}
        <div className="flex-shrink-0 px-5 py-3">
          <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            Kommentarer
          </h3>
        </div>

        {/* Comment Input - Modern & Polished */}
        {currentUser ? (
          <div className="flex-shrink-0 px-5 pb-4">
            <form onSubmit={handleAddComment} className="flex items-center gap-2">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Legg til kommentar..."
                maxLength={2000}
                disabled={isSubmitting}
                className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-full px-4 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:bg-white/[0.08] focus:border-blue-500/50 disabled:opacity-50 transition-all"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-white rounded-full transition-all disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 disabled:shadow-none"
                aria-label="Send kommentar"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-shrink-0 px-5 pb-4">
            <div className="text-center py-2">
              <p className="text-zinc-500 text-sm">
                Logg inn for å kommentere og like
              </p>
            </div>
          </div>
        )}

        {/* Comments List - Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
                <MessageCircle className="w-6 h-6 text-zinc-600" />
              </div>
              <p className="text-zinc-500 text-sm">
                Ingen kommentarer ennå
              </p>
              <p className="text-zinc-600 text-xs mt-1">
                Vær den første til å kommentere
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-3 group">
                  {/* Avatar */}
                  {comment.user?.avatar_url ? (
                    <img
                      src={comment.user.avatar_url}
                      alt={comment.user.full_name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mt-0.5">
                      {comment.user?.full_name?.charAt(0) || '?'}
                    </div>
                  )}

                  {/* Comment Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <p className="text-white font-semibold text-sm">
                        {comment.user?.full_name || 'Ukjent bruker'}
                      </p>
                      <p className="text-zinc-600 text-xs">
                        {getRelativeTime(comment.created_at)}
                      </p>
                    </div>
                    <p className="text-zinc-300 text-[15px] leading-relaxed break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
