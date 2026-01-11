'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  TrendingUp,
  Calendar,
  Users,
  BarChart3,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PostStatsData {
  view_count: number
  like_count: number
  comment_count: number
  bookmark_count: number
  share_count: number
  unique_viewers: number
  views_last_7_days: number
  views_last_30_days: number
  reaction_breakdown: Record<string, number> | null
  views_by_day: { date: string; views: number }[] | null
}

interface PostStatsProps {
  postId: string
  isOwner: boolean
  className?: string
}

export function PostStats({ postId, isOwner, className }: PostStatsProps) {
  const [stats, setStats] = useState<PostStatsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  const fetchStats = async () => {
    if (!isOwner) return

    setLoading(true)
    const { data, error } = await supabase.rpc('get_post_statistics', {
      p_post_id: postId,
    })

    if (error) {
      console.error('Error fetching stats:', error)
    } else {
      setStats(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (open && isOwner) {
      fetchStats()
    }
  }, [open, isOwner, postId])

  if (!isOwner) return null

  const reactionLabels: Record<string, string> = {
    elsker: '❤️ Elsker',
    haha: '😂 Haha',
    wow: '😮 Wow',
    trist: '😢 Trist',
    sint: '😠 Sint',
    tommel: '👍 Tommel',
    ild: '🔥 Ild',
    feiring: '🎉 Feiring',
    hundre: '💯 Hundre',
    takk: '🙏 Takk',
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('text-gray-500 hover:text-blue-600', className)}
        >
          <BarChart3 className="w-4 h-4 mr-1" />
          Statistikk
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Innleggsstatistikk
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Overview metrics */}
            <div className="grid grid-cols-3 gap-4">
              <MetricCard
                icon={Eye}
                label="Visninger"
                value={stats.view_count}
                color="blue"
              />
              <MetricCard
                icon={Heart}
                label="Reaksjoner"
                value={stats.like_count}
                color="red"
              />
              <MetricCard
                icon={MessageCircle}
                label="Kommentarer"
                value={stats.comment_count}
                color="green"
              />
              <MetricCard
                icon={Bookmark}
                label="Bokmerker"
                value={stats.bookmark_count}
                color="amber"
              />
              <MetricCard
                icon={Share2}
                label="Delinger"
                value={stats.share_count}
                color="purple"
              />
              <MetricCard
                icon={Users}
                label="Unike seere"
                value={stats.unique_viewers}
                color="indigo"
              />
            </div>

            {/* Trend */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Visningstrend
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Siste 7 dager</span>
                  <span className="font-medium">{stats.views_last_7_days} visninger</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Siste 30 dager</span>
                  <span className="font-medium">{stats.views_last_30_days} visninger</span>
                </div>
              </div>
            </div>

            {/* Reaction breakdown */}
            {stats.reaction_breakdown && Object.keys(stats.reaction_breakdown).length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Reaksjonsfordeling
                </h4>
                <div className="space-y-2">
                  {Object.entries(stats.reaction_breakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {reactionLabels[type] || type}
                        </span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Daily views chart placeholder */}
            {stats.views_by_day && stats.views_by_day.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Visninger per dag
                </h4>
                <div className="h-24 flex items-end gap-1">
                  {stats.views_by_day.slice(0, 14).reverse().map((day) => {
                    const maxViews = Math.max(...stats.views_by_day!.map((d) => d.views))
                    const height = maxViews > 0 ? (day.views / maxViews) * 100 : 0
                    return (
                      <div
                        key={day.date}
                        className="flex-1 bg-blue-500 rounded-t transition-all"
                        style={{ height: `${Math.max(height, 4)}%` }}
                        title={`${day.date}: ${day.views} visninger`}
                      />
                    )
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>14 dager siden</span>
                  <span>I dag</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">
            Kunne ikke laste statistikk
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Metric card component
interface MetricCardProps {
  icon: React.ElementType
  label: string
  value: number
  color: 'blue' | 'red' | 'green' | 'amber' | 'purple' | 'indigo'
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600',
  red: 'bg-red-50 text-red-600',
  green: 'bg-green-50 text-green-600',
  amber: 'bg-amber-50 text-amber-600',
  purple: 'bg-purple-50 text-purple-600',
  indigo: 'bg-indigo-50 text-indigo-600',
}

function MetricCard({ icon: Icon, label, value, color }: MetricCardProps) {
  return (
    <div className={cn('rounded-lg p-3 text-center', colorClasses[color])}>
      <Icon className="w-5 h-5 mx-auto mb-1" />
      <div className="text-lg font-semibold">{value.toLocaleString('nb-NO')}</div>
      <div className="text-xs opacity-75">{label}</div>
    </div>
  )
}
