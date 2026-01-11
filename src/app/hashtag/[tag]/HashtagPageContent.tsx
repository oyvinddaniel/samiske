'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PostCard } from '@/components/posts/PostCard'
import { Hash, TrendingUp } from 'lucide-react'
import type { PostData } from '@/components/posts/types'

interface HashtagPageContentProps {
  hashtag: {
    id: string
    tag: string
    displayTag: string
    postCount: number
  }
  initialPostIds: string[]
}

export function HashtagPageContent({ hashtag, initialPostIds }: HashtagPageContentProps) {
  const [posts, setPosts] = useState<PostData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | undefined>()
  const supabase = createClient()

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id)

      if (initialPostIds.length === 0) {
        setPosts([])
        setLoading(false)
        return
      }

      // Fetch full post data
      const { data: postsData, error } = await supabase
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
          category_id,
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
        .in('id', initialPostIds)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching posts:', error)
        setLoading(false)
        return
      }

      // Fetch counts
      const postIds = (postsData || []).map(p => p.id)

      const { data: commentCounts } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)

      const { data: likeCounts } = await supabase
        .from('likes')
        .select('post_id')
        .in('post_id', postIds)

      let userLikedPostIds: string[] = []
      if (user) {
        const { data: userLikes } = await supabase
          .from('likes')
          .select('post_id')
          .in('post_id', postIds)
          .eq('user_id', user.id)
        userLikedPostIds = (userLikes || []).map(l => l.post_id)
      }

      // Fetch images from BOTH media table AND post_images table
      const { data: mediaImages } = await supabase
        .from('media')
        .select('id, entity_id, storage_path, width, height, sort_order')
        .eq('entity_type', 'post')
        .in('entity_id', postIds)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true })

      const { data: postImagesData } = await supabase
        .from('post_images')
        .select('id, post_id, url, thumbnail_url, width, height, sort_order')
        .in('post_id', postIds)
        .order('sort_order', { ascending: true })

      // Group images by post_id
      type PostImageData = {
        id: string
        url: string
        thumbnail_url: string | null
        width: number | null
        height: number | null
        sort_order: number
      }
      const { MediaService } = await import('@/lib/media/mediaService')

      // Add images from media table
      const imagesMap = (mediaImages || []).reduce<Record<string, PostImageData[]>>((acc, img) => {
        if (!acc[img.entity_id]) {
          acc[img.entity_id] = []
        }
        const url = MediaService.getUrl(img.storage_path)
        const thumbnailUrl = MediaService.getUrl(img.storage_path, 'medium')
        acc[img.entity_id].push({
          id: img.id,
          url: url,
          thumbnail_url: thumbnailUrl,
          width: img.width,
          height: img.height,
          sort_order: img.sort_order,
        })
        return acc
      }, {})

      // Add images from post_images table
      ;(postImagesData || []).forEach(img => {
        if (!imagesMap[img.post_id]) {
          imagesMap[img.post_id] = []
        }
        imagesMap[img.post_id].push({
          id: img.id,
          url: img.url,
          thumbnail_url: img.thumbnail_url,
          width: img.width,
          height: img.height,
          sort_order: img.sort_order,
        })
      })

      // Sort images by sort_order
      Object.keys(imagesMap).forEach(postId => {
        imagesMap[postId].sort((a, b) => a.sort_order - b.sort_order)
      })

      // Count maps
      const commentCountMap = (commentCounts || []).reduce((acc, c) => {
        acc[c.post_id] = (acc[c.post_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const likeCountMap = (likeCounts || []).reduce((acc, l) => {
        acc[l.post_id] = (acc[l.post_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Map posts
      const mappedPosts: PostData[] = (postsData || []).map((post) => {
        const userData = Array.isArray(post.user) ? post.user[0] : post.user
        const categoryData = Array.isArray(post.category) ? post.category[0] : post.category

        return {
          id: post.id,
          title: post.title,
          content: post.content,
          image_url: post.image_url,
          images: imagesMap[post.id] || [],
          type: post.type as 'standard' | 'event',
          visibility: post.visibility as 'public' | 'friends' | 'circles',
          event_date: post.event_date,
          event_time: post.event_time,
          event_location: post.event_location,
          created_at: post.created_at,
          user: userData as PostData['user'],
          category: categoryData as PostData['category'],
          comment_count: commentCountMap[post.id] || 0,
          like_count: likeCountMap[post.id] || 0,
          user_has_liked: userLikedPostIds.includes(post.id),
        }
      })

      setPosts(mappedPosts)
      setLoading(false)
    }

    fetchPosts()
  }, [supabase, initialPostIds])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Hash className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                #{hashtag.displayTag}
              </h1>
              <div className="flex items-center gap-2 text-gray-500 mt-1">
                <TrendingUp className="w-4 h-4" />
                <span>{hashtag.postCount} innlegg</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
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
                <div className="w-full h-4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <Hash className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Ingen innlegg med denne hashtagen ennå</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
