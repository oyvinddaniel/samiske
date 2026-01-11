'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProfileStatsCard } from './ProfileStatsCard'
import { PostCard } from '@/components/posts/PostCard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TrendingUp, Calendar, Heart, MessageSquare } from 'lucide-react'

interface ProfileActivityTabProps {
  userId: string
  currentUserId?: string | null
}

interface TopPost {
  id: string
  user_id: string
  content: string | null
  image_url: string | null
  created_at: string
  engagement_score: number
  like_count: number
  comment_count: number
  [key: string]: unknown
}

interface ActivitySummary {
  posts_last_30_days: number
  total_comments: number
  total_likes_received: number
  last_post_at: string | null
  last_comment_at: string | null
}

export function ProfileActivityTab({ userId, currentUserId }: ProfileActivityTabProps) {
  const [topPosts, setTopPosts] = useState<TopPost[]>([])
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchActivity = async () => {
      // Fetch top 5 posts using user_top_posts view to get IDs, then fetch full post data
      const { data: topPostsIds } = await supabase
        .from('user_top_posts')
        .select('post_id, like_count, comment_count, engagement_score')
        .eq('user_id', userId)
        .order('engagement_score', { ascending: false })
        .limit(5)

      if (topPostsIds && topPostsIds.length > 0) {
        // Fetch full post data for the top posts
        const postIds = topPostsIds.map(tp => tp.post_id)
        const { data: fullPostsData } = await supabase
          .from('posts')
          .select(`
            *,
            user:profiles!inner(id, full_name, avatar_url),
            category:categories(name, slug, color),
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
          .in('id', postIds)

        if (fullPostsData) {
          // Sort by engagement score from view
          const sortedPosts = postIds.map(id => {
            const post = fullPostsData.find(p => p.id === id)
            const stats = topPostsIds.find(tp => tp.post_id === id)
            return {
              ...post,
              like_count: stats?.like_count || 0,
              comment_count: stats?.comment_count || 0,
              engagement_score: stats?.engagement_score || 0
            }
          }).filter(Boolean)

          setTopPosts(sortedPosts as TopPost[])
        }
      }

      // Fetch activity summary from profile_stats view
      const { data: statsData } = await supabase
        .from('profile_stats')
        .select('posts_last_30_days, total_comments, total_likes_received, last_post_at, last_comment_at')
        .eq('user_id', userId)
        .single()

      if (statsData) {
        setActivitySummary(statsData as ActivitySummary)
      }

      setLoading(false)
    }

    fetchActivity()
  }, [userId, supabase])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Aldri'
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'I dag'
    if (diffInDays === 1) return 'I går'
    if (diffInDays < 7) return `${diffInDays} dager siden`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} uker siden`

    return date.toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'long',
      year: diffInDays > 365 ? 'numeric' : undefined,
    })
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Card */}
      <ProfileStatsCard userId={userId} />

      {/* Recent Activity Summary */}
      {activitySummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Nylig aktivitet
            </CardTitle>
            <CardDescription>Siste 30 dager</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {activitySummary.posts_last_30_days}
                </p>
                <p className="text-xs text-gray-500">Nye innlegg</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {activitySummary.total_comments}
                </p>
                <p className="text-xs text-gray-500">Kommentarer</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {Number(activitySummary.total_likes_received)}
                </p>
                <p className="text-xs text-gray-500">Likes mottatt</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  {formatDate(activitySummary.last_post_at)}
                </p>
                <p className="text-xs text-gray-500">Siste innlegg</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            Mest populære innlegg
          </CardTitle>
          <CardDescription>Dine innlegg med mest engasjement</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Laster...</div>
            </div>
          ) : topPosts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Ingen innlegg funnet</p>
          ) : (
            <div className="space-y-4">
              {topPosts.map((post, index) => (
                <div key={post.id} className="relative">
                  {/* Ranking badge */}
                  <div className="absolute -left-3 top-4 z-10 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                    #{index + 1}
                  </div>

                  {/* Engagement score */}
                  <div className="absolute -right-3 top-4 z-10 bg-gray-900 text-white rounded-full px-3 py-1 text-xs font-medium shadow-lg flex items-center gap-1">
                    <Heart className="w-3 h-3 text-red-400" />
                    {post.like_count}
                    <MessageSquare className="w-3 h-3 text-blue-400 ml-2" />
                    {post.comment_count}
                  </div>

                  <PostCard post={post as never} currentUserId={currentUserId} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
