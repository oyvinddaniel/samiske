'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NestedComments } from '@/components/posts/NestedComments'
import { PostStats } from '@/components/posts/PostStats'
import { RSVPButton } from '@/components/events/RSVPButton'
import { RSVPList } from '@/components/events/RSVPList'
import { MentionText } from '@/components/mentions'
import { Video, Globe, MapPin, Clock, Calendar, ArrowLeft, Heart, Loader2, Archive } from 'lucide-react'

interface Post {
  id: string
  title: string
  content: string
  image_url: string | null
  type: 'standard' | 'event'
  visibility: 'public' | 'members'
  event_date: string | null
  event_time: string | null
  event_end_time: string | null
  event_location: string | null
  is_digital: boolean
  meeting_url: string | null
  meeting_platform: string | null
  max_participants: number | null
  created_at: string
  user_id: string
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
}

interface PostDetailPanelProps {
  postId: string
  onClose: () => void
}

export function PostDetailPanel({ postId, onClose }: PostDetailPanelProps) {
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | undefined>()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isLiking, setIsLiking] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id)

      // Fetch post
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          image_url,
          type,
          visibility,
          event_date,
          event_time,
          event_end_time,
          event_location,
          is_digital,
          meeting_url,
          meeting_platform,
          max_participants,
          created_at,
          user_id,
          user:profiles!posts_user_id_fkey (
            id,
            full_name,
            avatar_url
          ),
          category:categories (
            name,
            slug,
            color
          ),
          images:post_images (
            id,
            url,
            thumbnail_url,
            width,
            height,
            sort_order
          ),
          video:post_videos (
            id,
            bunny_video_id,
            thumbnail_url,
            playback_url,
            hls_url,
            duration,
            width,
            height,
            status
          )
        `)
        .eq('id', postId)
        .single()

      if (error || !data) {
        setLoading(false)
        return
      }

      const userData = Array.isArray(data.user) ? data.user[0] : data.user
      const categoryData = Array.isArray(data.category) ? data.category[0] : data.category

      setPost({
        ...data,
        user: userData as Post['user'],
        category: categoryData as Post['category'],
      })

      // Get like count
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)
      setLikeCount(count || 0)

      // Check if user has liked
      if (user) {
        const { data: likeData } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .single()
        setLiked(!!likeData)
      }

      // Record view for statistics
      await supabase.rpc('record_post_view', {
        p_post_id: postId,
        p_session_id: !user ? `anon_${Date.now()}` : null
      })

      setLoading(false)
    }

    fetchPost()
  }, [postId, supabase])

  const handleLike = async () => {
    if (!currentUserId || isLiking) return

    setIsLiking(true)

    if (liked) {
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', currentUserId)
      setLiked(false)
      setLikeCount((prev) => prev - 1)
    } else {
      await supabase.from('likes').insert({
        post_id: postId,
        user_id: currentUserId,
      })
      setLiked(true)
      setLikeCount((prev) => prev + 1)
    }

    setIsLiking(false)
  }

  const handleDelete = async () => {
    if (!confirm('Er du sikker på at du vil slette dette innlegget?')) return

    await supabase.from('posts').delete().eq('id', postId)
    onClose()
  }

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
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
    const dateObj = new Date(date)
    let formatted = dateObj.toLocaleDateString('nb-NO', options)
    if (time) {
      formatted += ` kl. ${time.slice(0, 5)}`
    }
    return formatted
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onClose} className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tilbake
        </Button>
        <div className="bg-white rounded-xl p-6 flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onClose} className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tilbake
        </Button>
        <div className="bg-white rounded-xl p-6 text-center text-gray-500">
          Innlegget ble ikke funnet
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={onClose} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Tilbake
      </Button>

      <Card>
        {/* Image */}
        {post.image_url && (
          <div className="aspect-video w-full overflow-hidden rounded-t-xl bg-gray-100">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <CardHeader>
          {/* Author and meta */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={post.user.avatar_url || undefined} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {getInitials(post.user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">{post.user.full_name || 'Ukjent'}</p>
                <p className="text-sm text-gray-500">{formatDate(post.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {post.visibility === 'members' && (
                <Badge variant="outline" className="text-xs">
                  Kun medlemmer
                </Badge>
              )}
              {post.category && (
                <Badge
                  style={{ backgroundColor: post.category.color, color: 'white' }}
                  className="text-xs"
                >
                  {post.category.name}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{post.title}</h1>

          {/* Event details */}
          {post.type === 'event' && post.event_date && (
            <div className="space-y-4">
              {/* Event info card */}
              <div className={`p-4 rounded-lg space-y-3 ${post.is_digital ? 'bg-purple-50' : 'bg-blue-50'}`}>
                {/* Digital badge */}
                {post.is_digital && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm bg-purple-100 text-purple-700 font-medium">
                      <Video className="w-4 h-4" />
                      Digitalt arrangement
                    </span>
                  </div>
                )}

                {/* Date and time */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">
                    {formatEventDate(post.event_date, post.event_time)}
                  </span>
                </div>

                {/* End time */}
                {post.event_end_time && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-5 h-5" />
                    <span>Slutter kl. {post.event_end_time.slice(0, 5)}</span>
                  </div>
                )}

                {/* Location or digital meeting info */}
                {post.is_digital ? (
                  <>
                    {post.meeting_platform && (
                      <div className="flex items-center gap-2 text-purple-700">
                        <Video className="w-5 h-5" />
                        <span>{post.meeting_platform}</span>
                      </div>
                    )}
                    {post.meeting_url && (
                      <a
                        href={post.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Globe className="w-4 h-4" />
                        Bli med på møtet
                      </a>
                    )}
                  </>
                ) : post.event_location && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <span>{post.event_location}</span>
                  </div>
                )}
              </div>

              {/* RSVP Section */}
              <div className="p-4 border border-gray-200 rounded-lg space-y-4">
                <h3 className="font-semibold text-gray-900">Påmelding</h3>
                <RSVPButton
                  postId={post.id}
                  isLoggedIn={!!currentUserId}
                  maxParticipants={post.max_participants}
                />
              </div>

              {/* RSVP List */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Deltakere</h3>
                <RSVPList
                  postId={post.id}
                  maxParticipants={post.max_participants}
                />
              </div>
            </div>
          )}

          {/* Content */}
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            <MentionText content={post.content} />
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={!currentUserId || isLiking}
                className={liked ? 'text-red-500' : likeCount > 0 ? 'text-red-500' : 'text-gray-400'}
              >
                <Heart className={`w-4 h-4 mr-1 ${liked ? 'fill-current' : ''}`} />
                {likeCount}
              </Button>
            </div>

            {/* Owner actions */}
            {currentUserId === post.user_id && (
              <div className="flex items-center gap-2">
                <PostStats
                  postId={postId}
                  isOwner={true}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-red-500 hover:text-red-700"
                >
                  Slett innlegg
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardContent className="pt-6">
          <NestedComments
            postId={postId}
            postOwnerId={post.user_id}
            currentUserId={currentUserId}
          />
        </CardContent>
      </Card>
    </div>
  )
}
