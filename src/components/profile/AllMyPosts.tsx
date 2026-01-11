'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PostCard } from '@/components/posts/PostCard'
import { Button } from '@/components/ui/button'

interface AllMyPostsProps {
  userId: string
  showOnlyOtherFeeds?: boolean
}

type FilterType = 'all' | 'geographic' | 'communities'

interface PostWithRelations {
  id: string
  user_id: string
  content: string | null
  image_url: string | null
  created_at: string
  municipality_id?: string | null
  place_id?: string | null
  created_for_community_id?: string | null
  municipality?: { id: string; name: string } | null
  place?: { id: string; name: string } | null
  community?: { id: string; name: string; slug: string } | null
  [key: string]: unknown
}

export function AllMyPosts({ userId, showOnlyOtherFeeds = false }: AllMyPostsProps) {
  const [posts, setPosts] = useState<PostWithRelations[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getUser()
  }, [supabase])

  useEffect(() => {
    const fetchAllPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles!inner(id, full_name, avatar_url),
          category:categories(name, slug, color),
          municipality:municipalities(id, name),
          place:places(id, name),
          community:communities(id, name, slug),
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
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setPosts(data)
      }
      setLoading(false)
    }

    fetchAllPosts()
  }, [userId, supabase])

  const filteredPosts = posts.filter(post => {
    // If showOnlyOtherFeeds, exclude personal posts (posts with no associations)
    if (showOnlyOtherFeeds) {
      const isPersonalPost = !post.municipality_id && !post.place_id && !post.created_for_community_id
      if (isPersonalPost) return false
    }

    if (filter === 'all') return true
    if (filter === 'geographic') return post.municipality_id || post.place_id
    if (filter === 'communities') return post.created_for_community_id
    return true
  })

  // Calculate counts - exclude personal posts if showOnlyOtherFeeds is true
  const postsForCounting = showOnlyOtherFeeds
    ? posts.filter(p => p.municipality_id || p.place_id || p.created_for_community_id)
    : posts

  const counts = {
    all: postsForCounting.length,
    geographic: postsForCounting.filter(p => p.municipality_id || p.place_id).length,
    communities: postsForCounting.filter(p => p.created_for_community_id).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Laster...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          Alle ({counts.all})
        </Button>
        <Button
          variant={filter === 'geographic' ? 'default' : 'outline'}
          onClick={() => setFilter('geographic')}
          size="sm"
        >
          📍 Geografiske ({counts.geographic})
        </Button>
        <Button
          variant={filter === 'communities' ? 'default' : 'outline'}
          onClick={() => setFilter('communities')}
          size="sm"
        >
          🏘️ Samfunn ({counts.communities})
        </Button>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <p>Ingen innlegg funnet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map(post => (
            <div key={post.id} className="border rounded-lg overflow-hidden">
              <div className="px-4 pt-3 pb-2 bg-gray-50 border-b flex flex-wrap gap-2">
                {post.municipality_id && post.municipality && (
                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                    📍 {post.municipality.name}
                  </span>
                )}
                {post.place_id && post.place && (
                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                    📍 {post.place.name}
                  </span>
                )}
                {post.created_for_community_id && post.community && (
                  <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                    🏘️ {post.community.name}
                  </span>
                )}
                {!post.municipality_id && !post.place_id && !post.created_for_community_id && (
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                    Personlig
                  </span>
                )}
              </div>
              <div className="p-0">
                <PostCard post={post as never} currentUserId={currentUserId} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
