/**
 * Post Gallery Sidebar - Two-Mode Design
 *
 * Masonry Mode: Shows post context (author, title, content, post-level engagement, geography)
 * Single Mode: Shows image-level engagement (comments and likes per image)
 *
 * Follows GalleryImageSidebar styling (dark theme #18181B)
 *
 * Responsive:
 * - Desktop (≥768px): Fixed left sidebar (w-96)
 * - Mobile (<768px): Floating button + bottom sheet
 */

'use client'

import { useState, useEffect } from 'react'
import { Heart, MessageCircle, ChevronLeft, X, Send, MapPin, Menu, Share2, MoreVertical, Pencil, Trash2, Copy, Check, Edit3 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'
import type { User } from '@supabase/supabase-js'
import type { GalleryImage, GalleryContext, MediaComment, GalleryViewMode } from '@/lib/types/gallery'
import {
  getMediaComments,
  addMediaComment,
  editMediaComment,
  deleteMediaComment,
  toggleMediaLike,
  getMediaLikeCount,
  hasUserLikedMedia,
  toggleCommentLike,
  reactToMedia,
  getMediaReactions,
  type ImageType,
  type ReactionType
} from '@/lib/mediaComments'
import { ReactionPicker } from '@/components/gallery/ReactionPicker'
import { EditCaptionModal } from '@/components/gallery/EditCaptionModal'
import { createClient } from '@/lib/supabase/client'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import type { ImageMetadata } from '@/lib/imageMetadata'

interface PostComment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  user: {
    id: string
    full_name: string
    avatar_url?: string | null
  }
}

interface PostGallerySidebarProps {
  context: GalleryContext // Post data
  currentImage?: GalleryImage // Null in masonry mode
  viewMode: GalleryViewMode
  onBackToMasonry?: () => void // Only in single mode
  onClose: () => void
}

export function PostGallerySidebar({
  context,
  currentImage,
  viewMode,
  onBackToMasonry,
  onClose
}: PostGallerySidebarProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    getUser()
  }, [])

  return (
    <>
      {/* Desktop: Fixed left sidebar */}
      <div className="hidden md:block">
        {viewMode === 'masonry' ? (
          <MasonryModeSidebar
            context={context}
            currentUser={currentUser}
            onClose={onClose}
            isMobile={false}
          />
        ) : (
          <SingleModeSidebar
            context={context}
            image={currentImage!}
            currentUser={currentUser}
            onBack={onBackToMasonry!}
            onClose={onClose}
            isMobile={false}
          />
        )}
      </div>

      {/* Mobile: Floating button + Bottom sheet */}
      <div className="md:hidden">
        {/* Floating button to open sidebar */}
        <button
          onClick={() => setMobileSheetOpen(true)}
          className="fixed bottom-20 left-4 z-[9997] w-14 h-14 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-900 hover:bg-white transition-all"
          aria-label="Åpne innleggsinformasjon"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Bottom sheet with sidebar content */}
        <BottomSheet
          open={mobileSheetOpen}
          onClose={() => setMobileSheetOpen(false)}
          title={viewMode === 'masonry' ? 'Innlegg' : 'Bilde'}
        >
          {viewMode === 'masonry' ? (
            <MasonryModeSidebar
              context={context}
              currentUser={currentUser}
              onClose={() => setMobileSheetOpen(false)}
              isMobile={true}
            />
          ) : (
            <SingleModeSidebar
              context={context}
              image={currentImage!}
              currentUser={currentUser}
              onBack={onBackToMasonry!}
              onClose={() => setMobileSheetOpen(false)}
              isMobile={true}
            />
          )}
        </BottomSheet>
      </div>
    </>
  )
}

/**
 * Masonry Mode Sidebar
 * Shows post-level information and engagement
 */
function MasonryModeSidebar({
  context,
  currentUser,
  onClose,
  isMobile = false
}: {
  context: GalleryContext
  currentUser: User | null
  onClose: () => void
  isMobile?: boolean
}) {
  const [postComments, setPostComments] = useState<PostComment[]>([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const postData = context.post_data!

  // Load post comments
  useEffect(() => {
    const loadPostComments = async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          post_id,
          user_id,
          content,
          created_at,
          user:profiles!comments_user_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', postData.id)
        .is('parent_id', null)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading post comments:', error)
        setLoadingComments(false)
        return
      }

      setPostComments((data || []).map(comment => ({
        ...comment,
        user: Array.isArray(comment.user) ? comment.user[0] : comment.user
      })) as PostComment[])

      setLoadingComments(false)
    }

    loadPostComments()
  }, [postData.id])

  // Format relative time
  const getRelativeTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: nb
      })
    } catch {
      return date
    }
  }

  // Handle adding comment (to post, not individual images)
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return

    if (!currentUser) {
      toast.error('Du må være logget inn for å kommentere')
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postData.id,
          user_id: currentUser.id,
          content: newComment.trim()
        })
        .select(`
          id,
          post_id,
          user_id,
          content,
          created_at,
          user:profiles!comments_user_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .single()

      if (error) throw error

      if (data) {
        const newCommentData = {
          ...data,
          user: Array.isArray(data.user) ? data.user[0] : data.user
        } as PostComment

        setPostComments([...postComments, newCommentData])
        setNewComment('')
        toast.success('Kommentar lagt til')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Kunne ikke legge til kommentar')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`flex flex-col bg-black ${!isMobile ? "w-96 flex-shrink-0 h-full" : ""}`}>
      {/* Profile */}
      <div className="bg-black p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          {postData.user.avatar_url ? (
            <img
              src={postData.user.avatar_url}
              alt={postData.user.full_name}
              className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold border-2 border-white/20">
              {postData.user.full_name?.charAt(0) || '?'}
            </div>
          )}
          <div>
            <p className="text-white font-semibold">{postData.user.full_name || 'Ukjent bruker'}</p>
            <p className="text-xs text-gray-400">{getRelativeTime(postData.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Title & Description */}
      <div className="bg-black px-6 py-5 border-b border-white/10">
        <h1 className="text-2xl font-bold text-white mb-3">{postData.title || 'Galleri'}</h1>
        {postData.content && (
          <p className="text-sm text-gray-300 leading-relaxed">
            {postData.content}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="bg-black px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`flex items-center gap-2 transition-colors ${isLiked ? 'text-rose-500' : 'text-gray-400 hover:text-rose-500'}`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{(postData.like_count || 0) + (isLiked ? 1 : 0)}</span>
          </button>
          <div className="flex items-center gap-2 text-gray-400">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{postComments.length}</span>
          </div>
        </div>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href)
              toast.success('Link kopiert!')
            } catch (error) {
              console.error('Failed to copy link:', error)
              toast.error('Kunne ikke kopiere link')
            }
          }}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-sm font-medium">Del</span>
        </button>
      </div>

      {/* Comments Section */}
      <div className="p-6 flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Comment Input */}
        {currentUser ? (
          <div className="mb-8">
            <form onSubmit={handleAddComment} className="flex gap-4">
              {currentUser.user_metadata?.avatar_url ? (
                <img
                  src={currentUser.user_metadata.avatar_url}
                  alt="Du"
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  Du
                </div>
              )}
              <div className="flex-1">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Skriv en kommentar..."
                  disabled={isSubmitting}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
              {newComment.trim() && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-3 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? '...' : 'Send'}
                </button>
              )}
            </form>
          </div>
        ) : (
          <div className="mb-8 text-center py-4">
            <p className="text-sm text-gray-400">Logg inn for å kommentere</p>
          </div>
        )}

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto">
          {loadingComments ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 rounded-full animate-spin border-white/30 border-t-white" />
            </div>
          ) : postComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-white/[0.04]">
                <MessageCircle className="w-6 h-6 text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-500">Ingen kommentarer ennå</p>
            </div>
          ) : (
            <div className="space-y-6">
              {postComments.map(comment => (
                <div key={comment.id} className="flex gap-4">
                  {comment.user?.avatar_url ? (
                    <img
                      src={comment.user.avatar_url}
                      alt={comment.user.full_name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {comment.user?.full_name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="bg-white/5 rounded-2xl px-4 py-3">
                      <p className="text-sm font-semibold text-white mb-2">{comment.user?.full_name || 'Ukjent bruker'}</p>
                      <p className="text-sm text-gray-300 leading-relaxed">{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-3 px-3">
                      <button className="text-xs text-gray-400 hover:text-white transition-colors">
                        <Heart className="w-3 h-3 inline mr-1" />
                        Like
                      </button>
                      <button className="text-xs text-gray-400 hover:text-white transition-colors">Svar</button>
                      <span className="text-xs text-gray-500">{getRelativeTime(comment.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More */}
          {postComments.length > 0 && (
            <button className="w-full mt-8 py-3 text-sm text-gray-400 hover:text-white transition-colors">
              Vis flere kommentarer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Comment Item Component (Recursive for nested comments)
 */
function CommentItem({
  comment,
  currentUser,
  depth = 0,
  onEdit,
  onDelete,
  onLike,
  onReply,
  isEditing,
  editContent,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  isDeleting,
  onConfirmDelete,
  onCancelDelete,
  isReplying,
  replyContent,
  onReplyChange,
  onSubmitReply,
  onCancelReply,
  actionMenuOpen,
  onToggleActionMenu,
  getRelativeTime
}: {
  comment: MediaComment
  currentUser: User | null
  depth?: number
  onEdit: (comment: MediaComment) => void
  onDelete: (commentId: string) => void
  onLike: (commentId: string) => void
  onReply: (commentId: string) => void
  isEditing: boolean
  editContent: string
  onEditChange: (content: string) => void
  onSaveEdit: (commentId: string) => void
  onCancelEdit: () => void
  isDeleting: boolean
  onConfirmDelete: (commentId: string) => void
  onCancelDelete: () => void
  isReplying: boolean
  replyContent: string
  onReplyChange: (content: string) => void
  onSubmitReply: (parentId: string) => void
  onCancelReply: () => void
  actionMenuOpen: boolean
  onToggleActionMenu: (commentId: string) => void
  getRelativeTime: (date: string) => string
}) {
  const maxDepth = 3 // Maximum nesting level

  return (
    <div className={depth > 0 ? 'ml-8 mt-4' : ''}>
      <div className="flex gap-4">
        {/* Avatar */}
        {comment.user?.avatar_url ? (
          <img
            src={comment.user.avatar_url}
            alt={comment.user.full_name}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {comment.user?.full_name?.charAt(0) || '?'}
          </div>
        )}

        <div className="flex-1">
          {isEditing ? (
            // Edit mode
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={e => onEditChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                maxLength={2000}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSaveEdit(comment.id)}
                  className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 transition-colors"
                >
                  Lagre
                </button>
                <button
                  onClick={onCancelEdit}
                  className="px-3 py-1.5 bg-white/5 text-gray-300 text-xs font-medium rounded hover:bg-white/10 transition-colors"
                >
                  Avbryt
                </button>
              </div>
            </div>
          ) : isDeleting ? (
            // Delete confirmation
            <div className="bg-white/5 rounded-2xl px-4 py-3">
              <p className="text-sm text-white mb-3">Vil du slette denne kommentaren?</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onConfirmDelete(comment.id)}
                  className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 transition-colors"
                >
                  Slett
                </button>
                <button
                  onClick={onCancelDelete}
                  className="px-3 py-1.5 bg-white/5 text-gray-300 text-xs font-medium rounded hover:bg-white/10 transition-colors"
                >
                  Avbryt
                </button>
              </div>
            </div>
          ) : (
            // Normal view
            <>
              <div className="bg-white/5 rounded-2xl px-4 py-3 relative">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white mb-2">{comment.user?.full_name || 'Ukjent bruker'}</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{comment.content}</p>
                  </div>
                  {currentUser?.id === comment.user_id && (
                    <div className="relative ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleActionMenu(comment.id)
                        }}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {actionMenuOpen && (
                        <div className="absolute right-0 top-6 bg-zinc-900 border border-white/10 rounded-lg shadow-xl py-1 z-10 min-w-[120px]">
                          <button
                            onClick={() => onEdit(comment)}
                            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2"
                          >
                            <Pencil className="w-3 h-3" />
                            Rediger
                          </button>
                          <button
                            onClick={() => onDelete(comment.id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/5 flex items-center gap-2"
                          >
                            <Trash2 className="w-3 h-3" />
                            Slett
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 px-3">
                <button
                  onClick={() => onLike(comment.id)}
                  className={`text-xs transition-colors flex items-center gap-1 ${
                    comment.has_liked ? 'text-rose-500' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Heart className={`w-3 h-3 ${comment.has_liked ? 'fill-current' : ''}`} />
                  {comment.like_count ? comment.like_count : 'Like'}
                </button>
                {depth < maxDepth && (
                  <button
                    onClick={() => onReply(comment.id)}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Svar
                  </button>
                )}
                <span className="text-xs text-gray-500">{getRelativeTime(comment.created_at)}</span>
                {comment.reply_count && comment.reply_count > 0 && (
                  <span className="text-xs text-gray-400">
                    {comment.reply_count} {comment.reply_count === 1 ? 'svar' : 'svar'}
                  </span>
                )}
              </div>

              {/* Reply input */}
              {isReplying && (
                <div className="mt-4 ml-0 flex gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={replyContent}
                      onChange={e => onReplyChange(e.target.value)}
                      placeholder={`Svar til ${comment.user?.full_name}...`}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={2000}
                    />
                  </div>
                  {replyContent.trim() && (
                    <button
                      onClick={() => onSubmitReply(comment.id)}
                      className="px-3 py-2 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 transition-colors"
                    >
                      Send
                    </button>
                  )}
                  <button
                    onClick={onCancelReply}
                    className="px-3 py-2 bg-white/5 text-gray-400 text-xs font-medium rounded hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Nested replies */}
          {comment.replies && comment.replies.length > 0 && !isEditing && !isDeleting && (
            <div className="mt-4 space-y-4">
              {comment.replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUser={currentUser}
                  depth={depth + 1}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onLike={onLike}
                  onReply={onReply}
                  isEditing={isEditing}
                  editContent={editContent}
                  onEditChange={onEditChange}
                  onSaveEdit={onSaveEdit}
                  onCancelEdit={onCancelEdit}
                  isDeleting={isDeleting}
                  onConfirmDelete={onConfirmDelete}
                  onCancelDelete={onCancelDelete}
                  isReplying={isReplying}
                  replyContent={replyContent}
                  onReplyChange={onReplyChange}
                  onSubmitReply={onSubmitReply}
                  onCancelReply={onCancelReply}
                  actionMenuOpen={actionMenuOpen}
                  onToggleActionMenu={onToggleActionMenu}
                  getRelativeTime={getRelativeTime}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Single Mode Sidebar
 * Shows image-level engagement (comments and likes per image)
 */
function SingleModeSidebar({
  context,
  image,
  currentUser,
  onBack,
  onClose,
  isMobile = false
}: {
  context: GalleryContext
  image: GalleryImage
  currentUser: User | null
  onBack: () => void
  onClose: () => void
  isMobile?: boolean
}) {
  const [comments, setComments] = useState<MediaComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [likeCount, setLikeCount] = useState(image.like_count || 0)
  const [hasLiked, setHasLiked] = useState(image.has_liked || false)
  const [isLiking, setIsLiking] = useState(false)

  // Reactions
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null)
  const [reactionCounts, setReactionCounts] = useState<Record<ReactionType, number>>({} as Record<ReactionType, number>)

  // Comment actions
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)

  // Edit caption modal
  const [editCaptionModalOpen, setEditCaptionModalOpen] = useState(false)
  const [imageCaption, setImageCaption] = useState(image.caption || '')
  const [imageTitle, setImageTitle] = useState('')
  const [imageAltText, setImageAltText] = useState(image.alt_text || '')

  const postData = context.post_data!

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (actionMenuOpenId) {
        setActionMenuOpenId(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [actionMenuOpenId])

  // Load image comments and reactions
  useEffect(() => {
    const loadComments = async () => {
      if (!image.post_image_id) return
      const fetchedComments = await getMediaComments(image.post_image_id, 'post_image')
      setComments(fetchedComments)
    }

    const loadReactions = async () => {
      if (!image.post_image_id) return
      try {
        const reactionsData = await getMediaReactions(image.post_image_id, 'post_image')
        setUserReaction(reactionsData.user_reaction || null)
        setReactionCounts(reactionsData.reactions || {})
        setLikeCount(reactionsData.total_count)
      } catch (error) {
        console.error('Error loading reactions:', error)
        // Fallback to old like system
        const count = await getMediaLikeCount(image.post_image_id, 'post_image')
        const liked = await hasUserLikedMedia(image.post_image_id, 'post_image')
        setLikeCount(count)
        setHasLiked(liked)
      }
    }

    if (image.post_image_id) {
      loadComments()
      loadReactions()
    }
  }, [image.post_image_id])

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return

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
      const comment = await addMediaComment(image.post_image_id, newComment, 'post_image')
      if (comment) {
        setComments([...comments, comment])
        setNewComment('')
        toast.success('Kommentar lagt til')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Kunne ikke legge til kommentar')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReact = async (reactionType: ReactionType) => {
    if (isLiking) return

    if (!image.post_image_id) {
      toast.error('Kan ikke reagere på dette bildet')
      return
    }

    if (!currentUser) {
      toast.error('Du må være logget inn for å reagere')
      return
    }

    setIsLiking(true)

    try {
      const result = await reactToMedia(image.post_image_id, reactionType, 'post_image')

      // Update user reaction
      if (result.action === 'removed') {
        setUserReaction(null)
        setLikeCount(count => Math.max(0, count - 1))
      } else if (result.action === 'added') {
        setUserReaction(reactionType)
        setLikeCount(count => count + 1)
      } else if (result.action === 'changed') {
        setUserReaction(reactionType)
        // Count stays the same when changing
      }

      // Reload full reactions data to update counts
      const reactionsData = await getMediaReactions(image.post_image_id, 'post_image')
      setReactionCounts(reactionsData.reactions || {})
      setLikeCount(reactionsData.total_count)
    } catch (error) {
      console.error('Error reacting:', error)
      toast.error('Kunne ikke reagere')
    } finally {
      setIsLiking(false)
    }
  }

  // Handle editing comment
  const handleStartEdit = (comment: MediaComment) => {
    setEditingCommentId(comment.id)
    setEditContent(comment.content)
    setActionMenuOpenId(null)
  }

  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditContent('')
  }

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) {
      toast.error('Kommentaren kan ikke være tom')
      return
    }

    try {
      const updated = await editMediaComment(commentId, editContent)
      if (updated) {
        setComments(comments.map(c => c.id === commentId ? { ...c, content: editContent, updated_at: new Date().toISOString() } : c))
        toast.success('Kommentar oppdatert')
        handleCancelEdit()
      }
    } catch (error) {
      console.error('Error editing comment:', error)
      toast.error('Kunne ikke redigere kommentar')
    }
  }

  // Handle deleting comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      const success = await deleteMediaComment(commentId)
      if (success) {
        setComments(comments.filter(c => c.id !== commentId))
        toast.success('Kommentar slettet')
        setDeletingCommentId(null)
        setActionMenuOpenId(null)
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Kunne ikke slette kommentar')
    }
  }

  // Handle liking comment
  const handleToggleCommentLike = async (commentId: string) => {
    if (!currentUser) {
      toast.error('Du må være logget inn for å like')
      return
    }

    try {
      const nowLiked = await toggleCommentLike(commentId)
      setComments(comments.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            has_liked: nowLiked,
            like_count: (c.like_count || 0) + (nowLiked ? 1 : -1)
          }
        }
        return c
      }))
    } catch (error) {
      console.error('Error toggling comment like:', error)
      toast.error('Kunne ikke like kommentar')
    }
  }

  // Handle replying to comment
  const handleStartReply = (commentId: string) => {
    setReplyingToId(commentId)
    setReplyContent('')
    setActionMenuOpenId(null)
  }

  const handleCancelReply = () => {
    setReplyingToId(null)
    setReplyContent('')
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !image.post_image_id) return

    try {
      const reply = await addMediaComment(image.post_image_id, replyContent, 'post_image', parentId)
      if (reply) {
        // Reload all comments to get proper nested structure
        const updatedComments = await getMediaComments(image.post_image_id, 'post_image')
        setComments(updatedComments)
        toast.success('Svar lagt til')
        handleCancelReply()
      }
    } catch (error) {
      console.error('Error adding reply:', error)
      toast.error('Kunne ikke legge til svar')
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

  return (
    <div className={`flex flex-col bg-black ${!isMobile ? "w-96 flex-shrink-0 h-full" : ""}`}>
      {/* Header with Back button */}
      {!isMobile && (
        <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between border-b border-white/10">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-medium">Tilbake til galleri</span>
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            aria-label="Lukk"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Profile - from post context */}
      <div className="bg-black p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          {postData.user.avatar_url ? (
            <img
              src={postData.user.avatar_url}
              alt={postData.user.full_name}
              className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold border-2 border-white/20">
              {postData.user.full_name?.charAt(0) || '?'}
            </div>
          )}
          <div>
            <p className="text-white font-semibold">{postData.user.full_name || 'Ukjent bruker'}</p>
            <p className="text-xs text-gray-400">Fra {postData.title || 'galleri'}</p>
          </div>
        </div>
      </div>

      {/* Image Caption */}
      <div className="bg-black px-6 py-5 border-b border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {imageCaption ? (
              <p className="text-sm text-gray-300 leading-relaxed">{imageCaption}</p>
            ) : (
              <p className="text-sm text-gray-500 italic">Ingen bildetekst</p>
            )}
          </div>
          {currentUser?.id === postData.user.id && image.post_image_id && (
            <button
              onClick={() => setEditCaptionModalOpen(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              aria-label="Rediger bildetekst"
              title="Rediger bildetekst"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Actions - Per-image engagement */}
      <div className="bg-black px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <ReactionPicker
              currentReaction={userReaction}
              onReact={handleReact}
              disabled={isLiking || !currentUser}
            />
            <span className="text-sm font-medium text-gray-400">{likeCount || 0}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{comments.length}</span>
          </div>
        </div>
        <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <Share2 className="w-5 h-5" />
          <span className="text-sm font-medium">Del</span>
        </button>
      </div>

      {/* Comments Section */}
      <div className="p-6 flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Comment Input */}
        {currentUser ? (
          <div className="mb-8">
            <form onSubmit={handleAddComment} className="flex gap-4">
              {currentUser.user_metadata?.avatar_url ? (
                <img
                  src={currentUser.user_metadata.avatar_url}
                  alt="Du"
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  Du
                </div>
              )}
              <div className="flex-1">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Skriv en kommentar..."
                  maxLength={2000}
                  disabled={isSubmitting}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
              {newComment.trim() && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-3 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? '...' : 'Send'}
                </button>
              )}
            </form>
          </div>
        ) : (
          <div className="mb-8 text-center py-4">
            <p className="text-sm text-gray-400">Logg inn for å kommentere og like</p>
          </div>
        )}

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto">
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-white/[0.04]">
                <MessageCircle className="w-6 h-6 text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-500">Ingen kommentarer ennå</p>
              <p className="text-xs mt-1 text-zinc-600">Vær den første til å kommentere</p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUser={currentUser}
                  depth={0}
                  onEdit={handleStartEdit}
                  onDelete={(commentId) => {
                    setDeletingCommentId(commentId)
                    setActionMenuOpenId(null)
                  }}
                  onLike={handleToggleCommentLike}
                  onReply={handleStartReply}
                  isEditing={editingCommentId === comment.id}
                  editContent={editContent}
                  onEditChange={setEditContent}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  isDeleting={deletingCommentId === comment.id}
                  onConfirmDelete={handleDeleteComment}
                  onCancelDelete={() => setDeletingCommentId(null)}
                  isReplying={replyingToId === comment.id}
                  replyContent={replyContent}
                  onReplyChange={setReplyContent}
                  onSubmitReply={handleSubmitReply}
                  onCancelReply={handleCancelReply}
                  actionMenuOpen={actionMenuOpenId === comment.id}
                  onToggleActionMenu={(commentId) => setActionMenuOpenId(actionMenuOpenId === commentId ? null : commentId)}
                  getRelativeTime={getRelativeTime}
                />
              ))}
            </div>
          )}

          {/* Load More */}
          {comments.length > 0 && (
            <button className="w-full mt-8 py-3 text-sm text-gray-400 hover:text-white transition-colors">
              Vis flere kommentarer
            </button>
          )}
        </div>
      </div>

      {/* Edit Caption Modal */}
      {image.post_image_id && (
        <EditCaptionModal
          imageId={image.post_image_id}
          currentMetadata={{
            title: imageTitle || null,
            caption: imageCaption || null,
            alt_text: imageAltText || null
          }}
          isOpen={editCaptionModalOpen}
          onClose={() => setEditCaptionModalOpen(false)}
          onSuccess={(metadata) => {
            setImageCaption(metadata.caption || '')
            setImageTitle(metadata.title || '')
            setImageAltText(metadata.alt_text || '')
          }}
        />
      )}
    </div>
  )
}
