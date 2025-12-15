'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  UserPlus,
  FileText,
  MessageCircle,
  Heart,
  TrendingUp,
  Activity,
  Calendar
} from 'lucide-react'

interface TimeStats {
  today: number
  thisWeek: number
  thisMonth: number
  total: number
}

interface ActivityLog {
  id: string
  type: 'user' | 'post' | 'comment'
  user_name: string
  timestamp: string
  description: string
}

export function StatisticsTab() {
  const supabase = createClient()

  // Stats state
  const [newUsers, setNewUsers] = useState<TimeStats>({ today: 0, thisWeek: 0, thisMonth: 0, total: 0 })
  const [activeUsers, setActiveUsers] = useState({ day: 0, week: 0, month: 0 })
  const [newPosts, setNewPosts] = useState<TimeStats>({ today: 0, thisWeek: 0, thisMonth: 0, total: 0 })
  const [newComments, setNewComments] = useState<TimeStats>({ today: 0, thisWeek: 0, thisMonth: 0, total: 0 })
  const [engagement, setEngagement] = useState({ avgCommentsPerPost: 0, avgLikesPerPost: 0, totalLikes: 0 })
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllStats()

    // Debounced refresh function
    let refreshTimeout: NodeJS.Timeout | null = null
    const debouncedRefresh = () => {
      if (refreshTimeout) clearTimeout(refreshTimeout)
      refreshTimeout = setTimeout(() => {
        fetchAllStats(false) // Don't show loading spinner for realtime updates
      }, 2000) // Wait 2 seconds after last change
    }

    // Real-time subscriptions with debouncing
    const channel = supabase
      .channel('statistics-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, debouncedRefresh)
      .subscribe()

    return () => {
      if (refreshTimeout) clearTimeout(refreshTimeout)
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchAllStats = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    await Promise.all([
      fetchNewUsers(),
      fetchActiveUsers(),
      fetchNewPosts(),
      fetchNewComments(),
      fetchEngagement(),
      fetchActivityLog()
    ])
    if (showLoading) setLoading(false)
  }

  const fetchNewUsers = async () => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [todayResult, weekResult, monthResult, totalResult] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabase.from('profiles').select('*', { count: 'exact', head: true })
    ])

    setNewUsers({
      today: todayResult.count || 0,
      thisWeek: weekResult.count || 0,
      thisMonth: monthResult.count || 0,
      total: totalResult.count || 0
    })
  }

  const fetchActiveUsers = async () => {
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const [dayResult, weekResult, monthResult] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_seen_at', dayAgo),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_seen_at', weekAgo),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_seen_at', monthAgo)
    ])

    setActiveUsers({
      day: dayResult.count || 0,
      week: weekResult.count || 0,
      month: monthResult.count || 0
    })
  }

  const fetchNewPosts = async () => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [todayResult, weekResult, monthResult, totalResult] = await Promise.all([
      supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
      supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabase.from('posts').select('*', { count: 'exact', head: true })
    ])

    setNewPosts({
      today: todayResult.count || 0,
      thisWeek: weekResult.count || 0,
      thisMonth: monthResult.count || 0,
      total: totalResult.count || 0
    })
  }

  const fetchNewComments = async () => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [todayResult, weekResult, monthResult, totalResult] = await Promise.all([
      supabase.from('comments').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabase.from('comments').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
      supabase.from('comments').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabase.from('comments').select('*', { count: 'exact', head: true })
    ])

    setNewComments({
      today: todayResult.count || 0,
      thisWeek: weekResult.count || 0,
      thisMonth: monthResult.count || 0,
      total: totalResult.count || 0
    })
  }

  const fetchEngagement = async () => {
    const [postsResult, commentsResult, likesResult] = await Promise.all([
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('likes').select('*', { count: 'exact', head: true })
    ])

    const totalPosts = postsResult.count || 1 // Avoid division by zero
    const totalComments = commentsResult.count || 0
    const totalLikes = likesResult.count || 0

    setEngagement({
      avgCommentsPerPost: parseFloat((totalComments / totalPosts).toFixed(2)),
      avgLikesPerPost: parseFloat((totalLikes / totalPosts).toFixed(2)),
      totalLikes
    })
  }

  const fetchActivityLog = async () => {
    // Fetch recent users (last 20)
    const { data: recentUsers } = await supabase
      .from('profiles')
      .select('id, full_name, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    // Fetch recent posts (last 20)
    const { data: recentPosts } = await supabase
      .from('posts')
      .select('id, title, created_at, user:profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(10)

    // Combine and sort
    const activities: ActivityLog[] = []

    recentUsers?.forEach(user => {
      activities.push({
        id: user.id,
        type: 'user',
        user_name: user.full_name || 'Ukjent',
        timestamp: user.created_at,
        description: 'Ny bruker registrert'
      })
    })

    recentPosts?.forEach(post => {
      const userData = Array.isArray(post.user) ? post.user[0] : post.user
      activities.push({
        id: post.id,
        type: 'post',
        user_name: userData?.full_name || 'Ukjent',
        timestamp: post.created_at,
        description: `Opprettet innlegg: ${post.title || 'Uten tittel'}`
      })
    })

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    setActivityLog(activities.slice(0, 20))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Nå nettopp'
    if (diffMins < 60) return `${diffMins} min siden`
    if (diffHours < 24) return `${diffHours} timer siden`
    if (diffDays < 7) return `${diffDays} dager siden`

    return date.toLocaleDateString('no-NO', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Live indicator */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Sanntidsdata - oppdateres automatisk</span>
      </div>

      {/* New Users Stats */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Nye brukere
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-900">I dag</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-900">{newUsers.today}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-900">Denne uken</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-900">{newUsers.thisWeek}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-900">Denne måneden</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-900">{newUsers.thisMonth}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-900">Totalt</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{newUsers.total}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active Users Stats */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Aktive brukere
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Siste 24 timer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{activeUsers.day}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Siste 7 dager
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{activeUsers.week}</p>
            </CardContent>
          </Card>
          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Siste 30 dager
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{activeUsers.month}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Posts */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Nye innlegg
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">I dag</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{newPosts.today}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">Denne uken</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{newPosts.thisWeek}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">Denne måneden</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{newPosts.thisMonth}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">Totalt</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{newPosts.total}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Comments */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Nye kommentarer
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">I dag</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{newComments.today}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">Denne uken</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{newComments.thisWeek}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">Denne måneden</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{newComments.thisMonth}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">Totalt</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{newComments.total}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Engasjement
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">Snitt kommentarer per innlegg</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{engagement.avgCommentsPerPost}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">Snitt likes per innlegg</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{engagement.avgLikesPerPost}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Totale likes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{engagement.totalLikes}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Log */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Aktivitetslogg (siste 20)
        </h3>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {activityLog.length === 0 ? (
                <div className="p-6 text-center text-gray-500">Ingen aktivitet ennå</div>
              ) : (
                activityLog.map((activity) => (
                  <div key={`${activity.type}-${activity.id}`} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        activity.type === 'user' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'post' ? 'bg-green-100 text-green-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {activity.type === 'user' ? <Users className="w-4 h-4" /> :
                         activity.type === 'post' ? <FileText className="w-4 h-4" /> :
                         <MessageCircle className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.user_name}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(activity.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
