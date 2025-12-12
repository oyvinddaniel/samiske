'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CommentSection } from '@/components/posts/CommentSection'

interface Post {
  id: string
  title: string
  content: string
  image_url: string | null
  type: 'standard' | 'event'
  visibility: 'public' | 'members'
  event_date: string | null
  event_time: string | null
  event_location: string | null
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

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | undefined>()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isLiking, setIsLiking] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchPost = async () => {
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
          event_location,
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
          )
        `)
        .eq('id', postId)
        .single()

      if (error || !data) {
        router.push('/')
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

      setLoading(false)
    }

    fetchPost()
  }, [postId, router, supabase])

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
    router.push('/')
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
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl p-6 animate-pulse">
            <div className="w-32 h-4 bg-gray-200 rounded mb-6" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-200" />
              <div className="space-y-2">
                <div className="w-24 h-4 bg-gray-200 rounded" />
                <div className="w-16 h-3 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="w-3/4 h-6 bg-gray-200 rounded mb-4" />
            <div className="space-y-2">
              <div className="w-full h-4 bg-gray-200 rounded" />
              <div className="w-full h-4 bg-gray-200 rounded" />
              <div className="w-2/3 h-4 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!post) return null

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            ← Tilbake til forsiden
          </Link>
        </div>

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
              <div className="flex items-center gap-2">
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
            <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>

            {/* Event details */}
            {post.type === 'event' && post.event_date && (
              <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📅</span>
                  <span className="font-medium text-gray-900">
                    {formatEventDate(post.event_date, post.event_time)}
                  </span>
                </div>
                {post.event_location && (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📍</span>
                    <span className="text-gray-700">{post.event_location}</span>
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {post.content}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={!currentUserId}
                  className={liked ? 'text-red-500' : 'text-gray-500'}
                >
                  {liked ? '❤️' : '🤍'} {likeCount} {likeCount === 1 ? 'like' : 'likes'}
                </Button>
              </div>

              {/* Delete button for owner */}
              {currentUserId === post.user_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-red-500 hover:text-red-700"
                >
                  Slett innlegg
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Comments */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <CommentSection postId={postId} currentUserId={currentUserId} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
