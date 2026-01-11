'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, MessageSquare, Heart, Calendar } from 'lucide-react'

interface ProfileStats {
  user_id: string
  total_posts: number
  posts_last_30_days: number
  total_comments: number
  friend_count: number
  total_likes_received: number
  total_comments_received: number
  last_post_at: string | null
  last_comment_at: string | null
  member_since: string
}

interface ProfileStatsCardProps {
  userId: string
}

export function ProfileStatsCard({ userId }: ProfileStatsCardProps) {
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchStats()
  }, [userId])

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from('profile_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching stats:', error)
    } else if (data) {
      setStats(data as ProfileStats)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  const memberSince = new Date(stats.member_since).toLocaleDateString('nb-NO', {
    year: 'numeric',
    month: 'long',
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Aktivitet</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <StatItem
            icon={<FileText className="w-5 h-5 text-blue-600" />}
            label="Innlegg"
            value={stats.total_posts}
          />
          <StatItem
            icon={<Users className="w-5 h-5 text-green-600" />}
            label="Venner"
            value={stats.friend_count}
          />
          <StatItem
            icon={<MessageSquare className="w-5 h-5 text-purple-600" />}
            label="Kommentarer"
            value={stats.total_comments}
          />
          <StatItem
            icon={<Heart className="w-5 h-5 text-red-600" />}
            label="Likes mottatt"
            value={Number(stats.total_likes_received)}
          />
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>Medlem siden {memberSince}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value.toLocaleString('nb-NO')}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}
