'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  UserPlus,
  FileText,
  MessageCircle,
  Heart,
  Activity,
  Clock,
  Globe,
  TrendingUp,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  BarChart3,
} from 'lucide-react'

// Types
interface ActivityEntry {
  id: string
  user_id: string
  user_name: string | null
  user_email: string | null
  page_path: string
  page_title: string | null
  created_at: string
}

interface AuthUser {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  raw_user_meta_data: { full_name?: string }
}

// Constants
const PAGE_SIZE = 30

export function AdminDashboard() {
  const supabase = useMemo(() => createClient(), [])

  // Core stats
  const [coreStats, setCoreStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    totalLikes: 0,
  })

  // User stats
  const [userStats, setUserStats] = useState({
    registeredToday: 0,
    registeredThisWeek: 0,
    registeredThisMonth: 0,
    loggedInToday: 0,
  })

  // Active users
  const [activeUsers, setActiveUsers] = useState({
    last24h: 0,
    last7d: 0,
    last30d: 0,
  })

  // Content stats (today)
  const [contentToday, setContentToday] = useState({
    posts: 0,
    comments: 0,
  })

  // Engagement
  const [engagement, setEngagement] = useState({
    avgCommentsPerPost: 0,
    avgLikesPerPost: 0,
  })

  // Recent registrations
  const [recentUsers, setRecentUsers] = useState<AuthUser[]>([])

  // Activity log
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [activityPage, setActivityPage] = useState(0)
  const [activityTotal, setActivityTotal] = useState(0)
  const [hasMoreActivities, setHasMoreActivities] = useState(true)

  // Loading states
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    else setRefreshing(true)

    try {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const day24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

      // Fetch all data in parallel
      const [
        // Core stats
        usersCountResult,
        postsCountResult,
        commentsCountResult,
        likesCountResult,
        // User registration stats
        registeredTodayResult,
        registeredWeekResult,
        registeredMonthResult,
        loggedInTodayResult,
        // Active users (from last_seen_at)
        active24hResult,
        active7dResult,
        active30dResult,
        // Content today
        postsTodayResult,
        commentsTodayResult,
        // Recent users
        recentUsersResult,
        // Activity log
        activityCountResult,
        activityResult,
      ] = await Promise.all([
        // Core stats
        supabase.rpc('get_auth_users_count'),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('likes').select('*', { count: 'exact', head: true }),
        // User registration stats
        supabase.rpc('get_users_registered_today'),
        supabase.rpc('get_users_registered_this_week'),
        supabase.rpc('get_users_registered_this_month'),
        supabase.rpc('get_users_logged_in_today'),
        // Active users
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_seen_at', day24h),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_seen_at', weekAgo),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_seen_at', day30),
        // Content today
        supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
        supabase.from('comments').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
        // Recent users (last 10)
        supabase.rpc('get_auth_users_list'),
        // Activity log
        supabase.from('user_activity_log').select('*', { count: 'exact', head: true }),
        supabase.from('user_activity_log')
          .select('id, user_id, user_name, user_email, page_path, page_title, created_at')
          .order('created_at', { ascending: false })
          .range(activityPage * PAGE_SIZE, (activityPage + 1) * PAGE_SIZE - 1),
      ])

      // Set core stats
      setCoreStats({
        totalUsers: usersCountResult.data || 0,
        totalPosts: postsCountResult.count || 0,
        totalComments: commentsCountResult.count || 0,
        totalLikes: likesCountResult.count || 0,
      })

      // Set user stats
      setUserStats({
        registeredToday: registeredTodayResult.data || 0,
        registeredThisWeek: registeredWeekResult.data || 0,
        registeredThisMonth: registeredMonthResult.data || 0,
        loggedInToday: loggedInTodayResult.data || 0,
      })

      // Set active users
      setActiveUsers({
        last24h: active24hResult.count || 0,
        last7d: active7dResult.count || 0,
        last30d: active30dResult.count || 0,
      })

      // Set content today
      setContentToday({
        posts: postsTodayResult.count || 0,
        comments: commentsTodayResult.count || 0,
      })

      // Calculate engagement
      const totalPosts = postsCountResult.count || 1
      const totalComments = commentsCountResult.count || 0
      const totalLikes = likesCountResult.count || 0
      setEngagement({
        avgCommentsPerPost: parseFloat((totalComments / totalPosts).toFixed(1)),
        avgLikesPerPost: parseFloat((totalLikes / totalPosts).toFixed(1)),
      })

      // Set recent users (sorted by created_at desc, limit 10)
      if (recentUsersResult.data) {
        const sorted = [...recentUsersResult.data]
          .sort((a: AuthUser, b: AuthUser) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10)
        setRecentUsers(sorted)
      }

      // Set activity log
      setActivityTotal(activityCountResult.count || 0)
      setActivities(activityResult.data || [])
      setHasMoreActivities((activityResult.data?.length || 0) === PAGE_SIZE)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [supabase, activityPage])

  // Initial fetch
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(false)
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchDashboardData(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchDashboardData(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => fetchDashboardData(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => fetchDashboardData(false))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_activity_log' }, () => {
        if (activityPage === 0) fetchDashboardData(false)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchDashboardData, activityPage])

  // Helpers
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const formatTimeAgo = (dateString: string) => {
    const diffMs = Date.now() - new Date(dateString).getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffSecs < 60) return `${diffSecs}s`
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}t`
    return `${diffDays}d`
  }

  const getPageName = (path: string) => {
    const map: Record<string, string> = {
      '/': 'Forsiden',
      '/login': 'Innlogging',
      '/register': 'Registrering',
      '/profil': 'Min profil',
      '/min-profil': 'Min profil',
      '/innstillinger': 'Innstillinger',
      '/kalender': 'Kalender',
      '/grupper': 'Grupper',
      '/samfunn': 'Samfunn',
      '/bokmerker': 'Bokmerker',
      '/admin': 'Admin',
      '/ny': 'Nytt innlegg',
    }
    if (map[path]) return map[path]
    if (path.startsWith('/sapmi')) return 'Sápmi'
    if (path.startsWith('/grupper/')) return 'Gruppe'
    if (path.startsWith('/samfunn/')) return 'Samfunn'
    if (path.startsWith('/bruker/')) return 'Profil'
    if (path.startsWith('/innlegg/')) return 'Innlegg'
    return path
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Sanntidsdata</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchDashboardData(false)}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Oppdater
        </Button>
      </div>

      {/* === SEKSJON 1: HOVEDTALL === */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Oversikt
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Brukere</p>
                  <p className="text-3xl font-bold text-blue-900">{coreStats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Innlegg</p>
                  <p className="text-3xl font-bold text-green-900">{coreStats.totalPosts}</p>
                </div>
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Kommentarer</p>
                  <p className="text-3xl font-bold text-purple-900">{coreStats.totalComments}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Likes</p>
                  <p className="text-3xl font-bold text-red-900">{coreStats.totalLikes}</p>
                </div>
                <Heart className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* === SEKSJON 2: AKTIVITET & VEKST === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aktive brukere */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-600" />
              Aktive brukere
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{activeUsers.last24h}</p>
                <p className="text-xs text-gray-600">Siste 24t</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{activeUsers.last7d}</p>
                <p className="text-xs text-gray-600">Siste 7d</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{activeUsers.last30d}</p>
                <p className="text-xs text-gray-600">Siste 30d</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nye brukere */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-600" />
              Nye brukere
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{userStats.registeredToday}</p>
                <p className="text-xs text-gray-600">I dag</p>
              </div>
              <div className="text-center p-3 bg-teal-50 rounded-lg">
                <p className="text-2xl font-bold text-teal-600">{userStats.registeredThisWeek}</p>
                <p className="text-xs text-gray-600">Denne uken</p>
              </div>
              <div className="text-center p-3 bg-cyan-50 rounded-lg">
                <p className="text-2xl font-bold text-cyan-600">{userStats.registeredThisMonth}</p>
                <p className="text-xs text-gray-600">Denne mnd</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === SEKSJON 3: I DAG & ENGASJEMENT === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aktivitet i dag */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              I dag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Pålogginger</span>
                <Badge variant="secondary">{userStats.loggedInToday}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Nye innlegg</span>
                <Badge variant="secondary">{contentToday.posts}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Nye kommentarer</span>
                <Badge variant="secondary">{contentToday.comments}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Engasjement */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-pink-600" />
              Engasjement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Snitt kommentarer/innlegg</span>
                <Badge className="bg-purple-100 text-purple-700">{engagement.avgCommentsPerPost}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Snitt likes/innlegg</span>
                <Badge className="bg-red-100 text-red-700">{engagement.avgLikesPerPost}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Siste registrerte */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-600" />
              Siste registrerte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {recentUsers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Ingen brukere</p>
              ) : (
                recentUsers.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <span className="font-medium truncate max-w-[150px]">
                      {user.raw_user_meta_data?.full_name || 'Ukjent'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(user.created_at)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === SEKSJON 4: DETALJERT AKTIVITETSLOGG === */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              Sidevisninger
              <Badge variant="outline" className="ml-2">{activityTotal} totalt</Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Ingen sidevisninger logget ennå</p>
              <p className="text-sm mt-1">Aktivitet logges automatisk når brukere navigerer</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-2 px-3 font-medium w-32">Tid</th>
                      <th className="text-left py-2 px-3 font-medium">Bruker</th>
                      <th className="text-left py-2 px-3 font-medium">Side</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((activity) => (
                      <tr key={activity.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-3">
                          <div className="flex flex-col">
                            <span className="font-medium">{formatTimeAgo(activity.created_at)}</span>
                            <span className="text-xs text-gray-400">{formatDateTime(activity.created_at)}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <Users className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{activity.user_name || 'Ukjent'}</p>
                              <p className="text-xs text-gray-500 truncate">{activity.user_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium">{getPageName(activity.page_path)}</p>
                              <p className="text-xs text-gray-500 font-mono truncate">{activity.page_path}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginering */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <span className="text-sm text-gray-500">
                  Side {activityPage + 1} av {Math.ceil(activityTotal / PAGE_SIZE)}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActivityPage(p => Math.max(0, p - 1))}
                    disabled={activityPage === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActivityPage(p => p + 1)}
                    disabled={!hasMoreActivities}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
