/**
 * Mobile Masonry Header
 * Sticky header for mobile gallery view showing post context and engagement
 *
 * Features:
 * - Sticky positioning at top of masonry grid
 * - Max 40vh height with internal scroll
 * - Expandable post text ("Les mer")
 * - Comment preview (2 first, load 5 at a time)
 * - Per-comment expansion for long comments
 * - Geography card integration
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Heart, MessageCircle, MapPin, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MentionText } from '@/components/mentions/MentionText'
import type { GalleryContext } from '@/lib/types/gallery'

interface MobileMasonryHeaderProps {
  postData: NonNullable<GalleryContext['post_data']>
  onClose: () => void
}

interface PostComment {
  id: string
  content: string
  created_at: string
  user: {
    id: string
    full_name: string
    avatar_url?: string
  }
}

export function MobileMasonryHeader({ postData, onClose }: MobileMasonryHeaderProps) {
  const [isTextExpanded, setIsTextExpanded] = useState(false)
  const [commentExpansionState, setCommentExpansionState] = useState<Map<string, boolean>>(new Map())
  const [visibleCommentCount, setVisibleCommentCount] = useState(2)
  const [postComments, setPostComments] = useState<PostComment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(true)

  const textContentRef = useRef<HTMLDivElement>(null)
  const [shouldShowExpandButton, setShouldShowExpandButton] = useState(false)

  // Load post comments
  useEffect(() => {
    loadPostComments()
  }, [postData.id])

  // Check if text needs expand button
  useEffect(() => {
    if (textContentRef.current && !isTextExpanded) {
      const needsExpansion = textContentRef.current.scrollHeight > textContentRef.current.clientHeight
      setShouldShowExpandButton(needsExpansion)
    }
  }, [postData.content, isTextExpanded])

  const loadPostComments = async () => {
    setIsLoadingComments(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user:profiles!comments_user_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', postData.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading comments:', error.message || error)
        setPostComments([])
        return
      }

      // Transform the data to match PostComment type
      const transformedData: PostComment[] = (data || []).map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        user: {
          id: comment.user?.id || 'unknown',
          full_name: comment.user?.full_name || 'Ukjent bruker',
          avatar_url: comment.user?.avatar_url || undefined
        }
      }))

      setPostComments(transformedData)
    } catch (error) {
      console.error('Error loading comments:', error instanceof Error ? error.message : 'Unknown error')
      setPostComments([])
    } finally {
      setIsLoadingComments(false)
    }
  }

  const toggleCommentExpansion = (commentId: string) => {
    setCommentExpansionState(prev => {
      const newState = new Map(prev)
      newState.set(commentId, !prev.get(commentId))
      return newState
    })
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
    <div className="bg-black border-b border-white/10 max-h-[40vh] overflow-y-auto flex-shrink-0">
      {/* Author Section */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <Avatar className="w-10 h-10">
          <AvatarImage src={postData.user.avatar_url || undefined} alt={postData.user.full_name} />
          <AvatarFallback>{postData.user.full_name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold text-sm text-white">{postData.user.full_name}</p>
          <p className="text-xs text-gray-400">{formatRelativeTime(postData.created_at)}</p>
        </div>
      </div>

      {/* Post Title */}
      {postData.title && (
        <h3 className="px-4 pt-3 font-bold text-lg text-white">{postData.title}</h3>
      )}

      {/* Post Content - Expandable */}
      {postData.content && (
        <div className="px-4 py-3">
          <div
            ref={textContentRef}
            className={`text-sm text-gray-300 ${!isTextExpanded ? 'line-clamp-3' : ''}`}
          >
            <MentionText content={postData.content} />
          </div>
          {shouldShowExpandButton && (
            <button
              onClick={() => setIsTextExpanded(!isTextExpanded)}
              className="text-blue-400 text-sm font-medium mt-1 hover:text-blue-300"
            >
              {isTextExpanded ? 'Vis mindre' : 'Les mer'}
            </button>
          )}
        </div>
      )}

      {/* Geography Card (if applicable) */}
      {postData.geography && (
        <div className="mx-4 mb-3 p-3 bg-white/5 rounded-lg flex items-center gap-3">
          <MapPin className="w-5 h-5 text-green-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-white">{postData.geography.name}</p>
            {postData.geography.description && (
              <p className="text-xs text-gray-300 line-clamp-2">{postData.geography.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Post-level Engagement Summary */}
      <div className="px-4 py-3 flex items-center gap-6 border-t border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2 text-rose-500">
          <Heart className="w-5 h-5 fill-current" />
          <span className="text-sm font-semibold">{postData.like_count || 0}</span>
        </div>
        <div className="flex items-center gap-2 text-blue-500">
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">{postData.comment_count || 0}</span>
        </div>
      </div>

      {/* Comment Input */}
      <div className="px-4 pt-3 pb-4 border-t border-white/10">
        <div className="flex gap-2">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
              Du
            </AvatarFallback>
          </Avatar>
          <input
            type="text"
            placeholder="Skriv en kommentar..."
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Comment Preview */}
      <div className="px-4 py-3">
        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Kommentarer</h4>

        {isLoadingComments ? (
          <div className="py-4 text-center">
            <p className="text-sm text-gray-400">Laster kommentarer...</p>
          </div>
        ) : postComments.length === 0 ? (
          <div className="py-4 text-center">
            <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Ingen kommentarer ennå</p>
          </div>
        ) : (
          <>
            {/* Comment List - Complete Feed Card style */}
            {postComments.slice(0, visibleCommentCount).map(comment => {
              const isExpanded = commentExpansionState.get(comment.id)
              const isLongComment = comment.content.length > 100

              return (
                <div key={comment.id} className="mb-4">
                  <div className="flex gap-2">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={comment.user.avatar_url || undefined} alt={comment.user.full_name} />
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-500 text-white text-xs">
                        {comment.user.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-white/5 rounded-2xl px-3 py-2">
                        <p className="text-sm font-semibold text-white">{comment.user.full_name}</p>
                        <p className={`text-sm text-gray-300 ${isExpanded || !isLongComment ? '' : 'line-clamp-2'}`}>
                          {comment.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 mt-1 px-3">
                        <button className="text-xs font-medium text-gray-400 hover:text-white">
                          🤍 Like
                        </button>
                        <button className="text-xs font-medium text-gray-400 hover:text-white">
                          Svar
                        </button>
                        <span className="text-xs text-gray-500">{formatRelativeTime(comment.created_at)}</span>
                      </div>
                      {isLongComment && (
                        <button
                          onClick={() => toggleCommentExpansion(comment.id)}
                          className="text-xs text-blue-400 hover:text-blue-300 mt-1 px-3"
                        >
                          {isExpanded ? 'Vis mindre' : 'Les mer'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* "Vis mer" button - load 5 at a time */}
            {visibleCommentCount < postComments.length && (
              <button
                onClick={() => setVisibleCommentCount(count => count + 5)}
                className="text-sm text-blue-400 font-medium hover:text-blue-300 mt-2"
              >
                Vis mer ({postComments.length - visibleCommentCount} til)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
