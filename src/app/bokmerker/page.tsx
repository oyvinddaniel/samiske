'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { PostCard } from '@/components/posts/PostCard'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Bookmark } from 'lucide-react'

// Raw post data from Supabase join query
interface RawPostData {
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
  user: { id: string; full_name: string; avatar_url: string | null } | { id: string; full_name: string; avatar_url: string | null }[]
  category: { id: string; name: string; slug: string; color: string } | { id: string; name: string; slug: string; color: string }[] | null
}

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
    full_name: string
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

export default function BookmarksPage() {
  const [posts, setPosts] = useState<BookmarkedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const fetchBookmarks = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
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
        // Get post IDs for fetching counts
        const postIds = bookmarks.map(b => b.post_id)

        // Fetch like counts
        const { data: likeCounts } = await supabase
          .from('likes')
          .select('post_id')
          .in('post_id', postIds)

        // Fetch comment counts
        const { data: commentCounts } = await supabase
          .from('comments')
          .select('post_id')
          .in('post_id', postIds)

        // Fetch user's likes
        const { data: userLikes } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds)

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
            const post = b.posts as unknown as RawPostData
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
  }, [supabase, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Back button */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Tilbake til forsiden
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Bookmark className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mine bokmerker</h1>
            <p className="text-sm text-gray-500">{posts.length} innlegg lagret</p>
          </div>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ingen bokmerker ennå</h3>
            <p className="text-gray-500 mb-4">
              Klikk på bokmerke-ikonet på innlegg du vil lagre til senere.
            </p>
            <Link href="/">
              <Button>Utforsk innlegg</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={userId || undefined}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
