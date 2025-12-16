'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import {
  UsersTab,
  PostsTab,
  ReportsTab,
  FeedbackTab,
  BugReportsTab,
  GeographyTab,
  StatsCards,
  StatisticsTab,
  EmergencyTab,
  UserAnalyticsTab,
} from '@/components/admin'
import { BroadcastMessagesTab } from '@/components/admin/BroadcastMessagesTab'
import type { User, Post, Stats, Feedback, Report, BugReportWithUser } from '@/components/admin'
import type { BugReportPriority, BugReportStatus } from '@/lib/types/bug-reports'

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [bugReports, setBugReports] = useState<BugReportWithUser[]>([])
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalPosts: 0, totalComments: 0, totalLikes: 0, totalFeedback: 0, totalBugReports: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  // Fetch functions
  const fetchUsers = useCallback(async () => {
    const { data, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (data) setUsers(data)
    if (count !== null) setStats(prev => ({ ...prev, totalUsers: count }))
  }, [supabase])

  const fetchPosts = useCallback(async () => {
    const { data, count } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        type,
        visibility,
        created_at,
        user:profiles!posts_user_id_fkey (
          id,
          full_name,
          email
        ),
        category:categories (
          name,
          color
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(10000)

    if (data) {
      const formattedPosts = data.map((post) => {
        const userData = Array.isArray(post.user) ? post.user[0] : post.user
        const categoryData = Array.isArray(post.category) ? post.category[0] : post.category
        return {
          ...post,
          user: userData as Post['user'],
          category: categoryData as Post['category'],
        }
      })
      setPosts(formattedPosts)
    }
    if (count !== null) setStats(prev => ({ ...prev, totalPosts: count }))
  }, [supabase])

  const fetchFeedback = useCallback(async () => {
    const { data, error } = await supabase
      .from('feedback')
      .select(`
        id,
        message,
        created_at,
        user:profiles (
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching feedback:', error)
      return
    }

    if (data) {
      const formattedFeedback = data.map((f) => ({
        ...f,
        user: Array.isArray(f.user) ? f.user[0] : f.user,
      }))
      setFeedback(formattedFeedback as Feedback[])
    }
  }, [supabase])

  const fetchReports = useCallback(async () => {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        id,
        reason,
        description,
        status,
        created_at,
        reporter:profiles!reports_reporter_id_fkey (
          id,
          full_name,
          email
        ),
        post:posts (
          id,
          title
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reports:', error)
      return
    }

    if (data) {
      const formattedReports = data.map((r) => ({
        ...r,
        reporter: Array.isArray(r.reporter) ? r.reporter[0] : r.reporter,
        post: Array.isArray(r.post) ? r.post[0] : r.post,
      }))
      setReports(formattedReports as Report[])
    }
  }, [supabase])

  const fetchBugReports = useCallback(async () => {
    const { data, error } = await supabase
      .from('bug_reports')
      .select(`
        *,
        user:profiles!bug_reports_user_id_fkey (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bug reports:', error)
      return
    }

    if (data) {
      const formattedBugReports = data.map((br) => ({
        ...br,
        user: Array.isArray(br.user) ? br.user[0] : br.user,
      }))
      setBugReports(formattedBugReports as BugReportWithUser[])
    }
  }, [supabase])

  const fetchStats = useCallback(async () => {
    const [usersResult, postsResult, commentsResult, likesResult, feedbackResult, bugReportsResult] = await Promise.all([
      supabase.rpc('get_auth_users_count'),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('likes').select('*', { count: 'exact', head: true }),
      supabase.from('feedback').select('*', { count: 'exact', head: true }),
      supabase.from('bug_reports').select('*', { count: 'exact', head: true }),
    ])

    setStats({
      totalUsers: usersResult.data || 0,
      totalPosts: postsResult.count || 0,
      totalComments: commentsResult.count || 0,
      totalLikes: likesResult.count || 0,
      totalFeedback: feedbackResult.count || 0,
      totalBugReports: bugReportsResult.count || 0,
    })
  }, [supabase])

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      fetchUsers(),
      fetchPosts(),
      fetchFeedback(),
      fetchReports(),
      fetchBugReports(),
      fetchStats(),
    ])
    setRefreshing(false)
  }

  // Check admin and fetch initial data
  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        router.push('/')
        return
      }

      setCurrentUser(profile)
      setIsAdmin(true)

      await Promise.all([
        fetchUsers(),
        fetchPosts(),
        fetchFeedback(),
        fetchReports(),
        fetchBugReports(),
        fetchStats(),
      ])

      setLoading(false)
    }

    checkAdminAndFetchData()
  }, [router, supabase, fetchUsers, fetchPosts, fetchFeedback, fetchReports, fetchBugReports, fetchStats])

  // Real-time subscription
  useEffect(() => {
    if (!isAdmin) return

    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchUsers()
        fetchStats()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts()
        fetchStats()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback' }, () => {
        fetchFeedback()
        fetchStats()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, fetchReports)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bug_reports' }, () => {
        fetchBugReports()
        fetchStats()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, isAdmin, fetchUsers, fetchPosts, fetchFeedback, fetchReports, fetchBugReports, fetchStats])

  // Handlers
  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (!error) {
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
    }
  }

  const handleDeletePost = async (postId: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId)

    if (!error) {
      setPosts(posts.filter((p) => p.id !== postId))
      setStats((prev) => ({ ...prev, totalPosts: prev.totalPosts - 1 }))
    }
  }

  const handleDeleteFeedback = async (feedbackId: string) => {
    const { error } = await supabase.from('feedback').delete().eq('id', feedbackId)

    if (!error) {
      setFeedback(feedback.filter((f) => f.id !== feedbackId))
      setStats((prev) => ({ ...prev, totalFeedback: prev.totalFeedback - 1 }))
    }
  }

  const handleUpdateReportStatus = async (reportId: string, newStatus: string) => {
    const { error } = await supabase
      .from('reports')
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: currentUser?.id
      })
      .eq('id', reportId)

    if (!error) {
      setReports(reports.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r)))
    }
  }

  const handleUpdateBugReport = async (
    reportId: string,
    updates: { priority?: BugReportPriority; status?: BugReportStatus; admin_notes?: string }
  ) => {
    const updateData: Record<string, unknown> = { ...updates }

    if (updates.status === 'resolved') {
      updateData.resolved_at = new Date().toISOString()
      updateData.resolved_by = currentUser?.id
    }

    const { error } = await supabase
      .from('bug_reports')
      .update(updateData)
      .eq('id', reportId)

    if (!error) {
      setBugReports(
        bugReports.map((br) =>
          br.id === reportId ? { ...br, ...updates } : br
        )
      )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl p-6 animate-pulse">
            <div className="w-48 h-8 bg-gray-200 rounded mb-6" />
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg" />
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back link */}
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            ← Tilbake til forsiden
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin-panel</h1>
            <p className="text-gray-500 mt-1">Administrer brukere og innhold</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Oppdaterer...' : 'Oppdater'}
          </Button>
        </div>

        {/* Stats */}
        <StatsCards stats={stats} />

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="emergency" className="text-red-600 data-[state=active]:bg-red-100">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Nødstopp
            </TabsTrigger>
            <TabsTrigger value="users">Brukere ({users.length})</TabsTrigger>
            <TabsTrigger value="user-analytics">Brukerlogg & Statistikk</TabsTrigger>
            <TabsTrigger value="posts">Innlegg ({posts.length})</TabsTrigger>
            <TabsTrigger value="reports">
              Rapporter ({reports.filter(r => r.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="feedback">Tilbakemeldinger ({feedback.length})</TabsTrigger>
            <TabsTrigger value="bugs">
              Bug-rapporter ({bugReports.filter(br => br.status === 'new').length})
            </TabsTrigger>
            <TabsTrigger value="geography">Geografi</TabsTrigger>
            <TabsTrigger value="statistics">Statistikk</TabsTrigger>
            <TabsTrigger value="broadcasts">Meldinger</TabsTrigger>
          </TabsList>

          <TabsContent value="emergency">
            <EmergencyTab />
          </TabsContent>

          <TabsContent value="broadcasts">
            <BroadcastMessagesTab />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab
              users={users}
              currentUserId={currentUser?.id}
              onRoleChange={handleRoleChange}
            />
          </TabsContent>

          <TabsContent value="user-analytics">
            <UserAnalyticsTab />
          </TabsContent>

          <TabsContent value="posts">
            <PostsTab posts={posts} onDeletePost={handleDeletePost} />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab reports={reports} onUpdateStatus={handleUpdateReportStatus} />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackTab feedback={feedback} onDeleteFeedback={handleDeleteFeedback} />
          </TabsContent>

          <TabsContent value="bugs">
            <BugReportsTab
              bugReports={bugReports}
              onUpdateBugReport={handleUpdateBugReport}
            />
          </TabsContent>

          <TabsContent value="geography">
            <GeographyTab />
          </TabsContent>

          <TabsContent value="statistics">
            <StatisticsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
