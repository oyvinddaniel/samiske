'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Clock, MoreVertical, Trash2, Send, Edit, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'
import { toast } from 'sonner'

interface ScheduledPost {
  id: string
  title: string
  content: string
  type: string
  visibility: string
  scheduled_for: string
  created_at: string
  category_id: string | null
  image_url: string | null
}

interface ScheduledPostsListProps {
  className?: string
  onEdit?: (postId: string) => void
}

export function ScheduledPostsList({ className, onEdit }: ScheduledPostsListProps) {
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const supabase = createClient()

  const loadScheduledPosts = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_user_scheduled_posts')

      if (error) {
        console.error('Error loading scheduled posts:', error)
        return
      }

      setPosts(data || [])
    } catch (err) {
      console.error('Error loading scheduled posts:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadScheduledPosts()
  }, [])

  const handlePublishNow = async (postId: string) => {
    try {
      const { error } = await supabase.rpc('publish_post_now', { p_post_id: postId })

      if (error) {
        toast.error('Kunne ikke publisere innlegget')
        return
      }

      toast.success('Innlegget er publisert')
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch (err) {
      toast.error('Noe gikk galt')
    }
    setActiveMenu(null)
  }

  const handleCancel = async (postId: string) => {
    try {
      const { error } = await supabase.rpc('cancel_scheduled_post', { p_post_id: postId })

      if (error) {
        toast.error('Kunne ikke avbryte innlegget')
        return
      }

      toast.success('Planlagt innlegg avbrutt')
      setPosts((prev) => prev.filter((p) => p.id !== postId))
    } catch (err) {
      toast.error('Noe gikk galt')
    }
    setActiveMenu(null)
  }

  if (isLoading) {
    return (
      <div className={cn('p-4', className)}>
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-100 rounded-lg h-24" />
          ))}
        </div>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className={cn('p-6 text-center', className)}>
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Ingen planlagte innlegg</p>
        <p className="text-gray-400 text-xs mt-1">
          Bruk "Planlegg"-knappen når du skriver et innlegg
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between px-1">
        <h3 className="font-medium text-gray-900">Planlagte innlegg</h3>
        <span className="text-sm text-gray-500">{posts.length} stk</span>
      </div>

      <div className="space-y-2">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white border border-gray-200 rounded-lg p-4 relative"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {post.title || 'Uten tittel'}
                </h4>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                  {post.content}
                </p>
              </div>

              {/* Menu button */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setActiveMenu(activeMenu === post.id ? null : post.id)}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>

                {/* Dropdown menu */}
                {activeMenu === post.id && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <button
                      type="button"
                      onClick={() => handlePublishNow(post.id)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                    >
                      <Send className="w-4 h-4 text-green-600" />
                      <span>Publiser nå</span>
                    </button>
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          onEdit(post.id)
                          setActiveMenu(null)
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                        <span>Rediger</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCancel(post.id)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Avbryt planlegging</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Schedule info */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-sm">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600">
                  {format(new Date(post.scheduled_for), "d. MMM yyyy", { locale: nb })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600">
                  {format(new Date(post.scheduled_for), "HH:mm", { locale: nb })}
                </span>
              </div>
              <span className="text-xs text-gray-400 ml-auto">
                {formatDistanceToNow(new Date(post.scheduled_for), {
                  addSuffix: true,
                  locale: nb,
                })}
              </span>
            </div>

            {/* Image preview if exists */}
            {post.image_url && (
              <div className="mt-3">
                <img
                  src={post.image_url}
                  alt=""
                  className="w-full h-24 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Compact version for sidebar/widget
export function ScheduledPostsWidget({ className }: { className?: string }) {
  const [count, setCount] = useState(0)
  const [nextPost, setNextPost] = useState<ScheduledPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const { data } = await supabase.rpc('get_user_scheduled_posts')
        if (data && data.length > 0) {
          setCount(data.length)
          setNextPost(data[0])
        }
      } catch (err) {
        console.error('Error loading scheduled posts:', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [supabase])

  if (isLoading || count === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'bg-blue-50 border border-blue-100 rounded-lg p-3',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-800">
          {count} planlagt{count > 1 ? 'e' : ''} innlegg
        </span>
      </div>
      {nextPost && (
        <p className="text-xs text-blue-600 mt-1">
          Neste: {format(new Date(nextPost.scheduled_for), "d. MMM 'kl.' HH:mm", { locale: nb })}
        </p>
      )}
    </div>
  )
}
