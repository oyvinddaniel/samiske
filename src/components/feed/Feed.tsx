'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PostCard } from '@/components/posts/PostCard'
import { CreatePostSheet } from '@/components/posts/CreatePostSheet'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface GeographyFilter {
  type: 'sapmi' | 'country' | 'language_area' | 'municipality' | 'place'
  id?: string  // UUID, null for 'sapmi'
}

interface FeedProps {
  categorySlug?: string
  geography?: GeographyFilter
}

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
  comment_count: number
  like_count: number
  user_has_liked: boolean
  // Geografisk info
  posted_from_name?: string
  posted_from_type?: 'place' | 'municipality' | 'sapmi'
}

export function Feed({ categorySlug, geography }: FeedProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | undefined>()
  const [showCreatePost, setShowCreatePost] = useState(false)
  const supabase = createClient()

  const fetchPosts = useCallback(async () => {
      setLoading(true)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id)

      let postsData: Array<{
        id: string
        title: string
        content: string
        image_url: string | null
        type: string
        visibility: string
        event_date: string | null
        event_time: string | null
        event_location: string | null
        created_at: string
        pinned: boolean | null
        user_id: string
        category_id: string | null
        posted_from_name?: string
        posted_from_type?: string
        user?: unknown
        category?: unknown
      }> | null = null
      let fetchError: Error | null = null

      // Use RPC function if geography filter is provided
      if (geography) {
        const { data, error } = await supabase.rpc('get_posts_for_geography', {
          geography_type_param: geography.type,
          geography_id_param: geography.id || null,
          limit_param: 50,
          offset_param: 0
        })

        if (error) {
          // Fallback to standard query if RPC fails (function might not exist yet)
          console.warn('RPC function not available, falling back to standard query:', error)
          fetchError = error
        } else {
          // RPC returns posts without user/category joins, need to fetch those separately
          postsData = data
        }
      }

      // Standard query (no geography filter or RPC fallback)
      if (!postsData) {
        let query = supabase
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
            pinned,
            user_id,
            category_id,
            municipality_id,
            place_id,
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
          .order('pinned', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })

        // Filter by category if provided
        if (categorySlug) {
          const { data: category } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', categorySlug)
            .single()

          if (category) {
            query = query.eq('category_id', category.id)
          }
        }

        const { data, error } = await query
        postsData = data
        fetchError = error
      }

      const error = fetchError

      if (error) {
        console.error('Error fetching posts:', error)
        toast.error('Kunne ikke laste innlegg. Prøv igjen senere.')
        setLoading(false)
        return
      }

      if (!postsData || postsData.length === 0) {
        setPosts([])
        setLoading(false)
        return
      }

      // Get all post IDs and user IDs for batch queries
      const postIds = postsData.map(p => p.id)
      const userIds = [...new Set(postsData.map(p => p.user_id).filter(Boolean))]
      const categoryIds = [...new Set(postsData.map(p => p.category_id).filter(Boolean))]

      // Batch fetch user data if not included (RPC doesn't include joins)
      let usersMap: Record<string, { id: string; full_name: string | null; avatar_url: string | null }> = {}
      if (userIds.length > 0 && !postsData[0]?.user) {
        const { data: users } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds)
        usersMap = (users || []).reduce((acc, u) => {
          acc[u.id] = u
          return acc
        }, {} as typeof usersMap)
      }

      // Batch fetch category data if not included
      let categoriesMap: Record<string, { name: string; slug: string; color: string }> = {}
      if (categoryIds.length > 0 && !postsData[0]?.category) {
        const { data: categories } = await supabase
          .from('categories')
          .select('id, name, slug, color')
          .in('id', categoryIds as string[])
        categoriesMap = (categories || []).reduce((acc, c) => {
          acc[c.id] = c
          return acc
        }, {} as typeof categoriesMap)
      }

      // Batch fetch comment counts (single query instead of N queries)
      const { data: commentCounts } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)

      // Batch fetch like counts (single query instead of N queries)
      const { data: likeCounts } = await supabase
        .from('likes')
        .select('post_id')
        .in('post_id', postIds)

      // Batch fetch user's likes (single query instead of N queries)
      let userLikedPostIds: string[] = []
      if (user) {
        const { data: userLikes } = await supabase
          .from('likes')
          .select('post_id')
          .in('post_id', postIds)
          .eq('user_id', user.id)
        userLikedPostIds = (userLikes || []).map(l => l.post_id)
      }

      // Count comments and likes per post
      const commentCountMap = (commentCounts || []).reduce((acc, c) => {
        acc[c.post_id] = (acc[c.post_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const likeCountMap = (likeCounts || []).reduce((acc, l) => {
        acc[l.post_id] = (acc[l.post_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Map posts with counts
      const postsWithCounts: Post[] = postsData.map((post) => {
        // Get user data from join or from separate fetch
        const userData = post.user
          ? (Array.isArray(post.user) ? post.user[0] : post.user)
          : usersMap[post.user_id]

        // Get category data from join or from separate fetch
        const categoryData = post.category
          ? (Array.isArray(post.category) ? post.category[0] : post.category)
          : (post.category_id ? categoriesMap[post.category_id] : null)

        return {
          id: post.id,
          title: post.title,
          content: post.content,
          image_url: post.image_url,
          type: post.type as 'standard' | 'event',
          visibility: post.visibility as 'public' | 'members',
          event_date: post.event_date,
          event_time: post.event_time,
          event_location: post.event_location,
          created_at: post.created_at,
          user: userData as Post['user'],
          category: categoryData as Post['category'],
          comment_count: commentCountMap[post.id] || 0,
          like_count: likeCountMap[post.id] || 0,
          user_has_liked: userLikedPostIds.includes(post.id),
          posted_from_name: post.posted_from_name,
          posted_from_type: post.posted_from_type as Post['posted_from_type'],
        }
      })

      setPosts(postsWithCounts)
      setLoading(false)
  }, [categorySlug, geography, supabase])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="space-y-2">
                <div className="w-24 h-4 bg-gray-200 rounded" />
                <div className="w-16 h-3 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="w-3/4 h-5 bg-gray-200 rounded mb-2" />
            <div className="w-full h-4 bg-gray-200 rounded mb-1" />
            <div className="w-2/3 h-4 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Create post button - only for logged in users */}
      {currentUserId && (
        <button onClick={() => setShowCreatePost(true)} className="block mb-5 w-full">
          <div className="w-40 mx-auto">
            <div className="bg-white rounded-xl p-4 border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Create post sheet */}
      {currentUserId && (
        <CreatePostSheet
          open={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          onSuccess={fetchPosts}
          userId={currentUserId}
        />
      )}

      <div className="space-y-[66px]">
        {posts.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-gray-500 mb-4">Ingen innlegg ennå</p>
            <p className="text-sm text-gray-400">
              Vær den første til å dele noe med miljøet!
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
            />
          ))
        )}

        {/* Spacer for scrolling last post up */}
        <div className="h-[500px]" />
      </div>

      {/* Overlay for non-logged in users - gradient blur at bottom */}
      {!currentUserId && (
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
          {/* Gradient blur overlay - blurry at bottom, clearer going up (40% height) */}
          <div className="h-[40vh] relative">
            {/* Multiple blur layers for stronger gradient effect */}
            <div className="absolute inset-0 backdrop-blur-lg bg-white/80" style={{ maskImage: 'linear-gradient(to top, black 0%, transparent 100%)' }} />
            <div className="absolute inset-0 backdrop-blur-md bg-white/70" style={{ maskImage: 'linear-gradient(to top, black 40%, transparent 90%)' }} />
            <div className="absolute inset-0 backdrop-blur-sm bg-white/50" style={{ maskImage: 'linear-gradient(to top, black 20%, transparent 70%)' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
          </div>

          {/* Content - horizontal full-width layout */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-lg border-t border-gray-200 py-4 px-6">
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                {/* Logo */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md">
                    <img
                      src="/images/sami.jpg"
                      alt="Samisk flagg"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="hidden sm:block">
                    <p className="font-semibold text-gray-900">samiske.no</p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href="/login">
                    <Button variant="outline" size="sm">
                      Logg inn
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Registrer deg
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
