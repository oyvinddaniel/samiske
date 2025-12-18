'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  RefreshCw,
  AlertTriangle,
  LayoutDashboard,
  Users,
  FileText,
  Flag,
  Bug,
  Globe,
  Megaphone,
  Lightbulb,
} from 'lucide-react'
import {
  UsersTab,
  PostsTab,
  ReportsTab,
  BugReportsTab,
  GeographyTab,
  StatsCards,
  EmergencyTab,
  AdminDashboard,
} from '@/components/admin'
import { BroadcastMessagesTab } from '@/components/admin/BroadcastMessagesTab'
import { FeatureRequestsTab, type FeatureRequestWithUser, type FeatureRequestStatus } from '@/components/admin/FeatureRequestsTab'
import type { User, Post, Stats, Report, BugReportWithUser } from '@/components/admin'
import type { BugReportPriority, BugReportStatus } from '@/lib/types/bug-reports'

type TabValue = 'emergency' | 'dashboard' | 'users' | 'posts' | 'reports' | 'bugs' | 'feature-requests' | 'geography' | 'broadcasts'

interface NavItem {
  value: TabValue
  label: string
  icon: React.ElementType
  badge?: number
  danger?: boolean
}

interface NavCategory {
  title: string
  items: NavItem[]
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('dashboard')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [bugReports, setBugReports] = useState<BugReportWithUser[]>([])
  const [featureRequests, setFeatureRequests] = useState<FeatureRequestWithUser[]>([])
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

  const fetchFeatureRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from('feature_requests')
      .select(`
        *,
        user:profiles!feature_requests_user_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching feature requests:', error)
      return
    }

    if (data) {
      const formattedRequests = data.map((fr) => ({
        ...fr,
        user: Array.isArray(fr.user) ? fr.user[0] : fr.user,
      }))
      setFeatureRequests(formattedRequests as FeatureRequestWithUser[])
    }
  }, [supabase])

  const fetchStats = useCallback(async () => {
    const [usersResult, postsResult, commentsResult, likesResult, bugReportsResult] = await Promise.all([
      supabase.rpc('get_auth_users_count'),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('likes').select('*', { count: 'exact', head: true }),
      supabase.from('bug_reports').select('*', { count: 'exact', head: true }),
    ])

    setStats({
      totalUsers: usersResult.data || 0,
      totalPosts: postsResult.count || 0,
      totalComments: commentsResult.count || 0,
      totalLikes: likesResult.count || 0,
      totalFeedback: 0,
      totalBugReports: bugReportsResult.count || 0,
    })
  }, [supabase])

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      fetchUsers(),
      fetchPosts(),
      fetchReports(),
      fetchBugReports(),
      fetchFeatureRequests(),
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
        fetchReports(),
        fetchBugReports(),
        fetchFeatureRequests(),
        fetchStats(),
      ])

      setLoading(false)
    }

    checkAdminAndFetchData()
  }, [router, supabase, fetchUsers, fetchPosts, fetchReports, fetchBugReports, fetchFeatureRequests, fetchStats])

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, fetchReports)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bug_reports' }, () => {
        fetchBugReports()
        fetchStats()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feature_requests' }, fetchFeatureRequests)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, isAdmin, fetchUsers, fetchPosts, fetchReports, fetchBugReports, fetchFeatureRequests, fetchStats])

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

  const handleUpdateFeatureRequest = async (
    requestId: string,
    updates: { status?: FeatureRequestStatus; admin_notes?: string }
  ) => {
    const { error } = await supabase
      .from('feature_requests')
      .update(updates)
      .eq('id', requestId)

    if (!error) {
      setFeatureRequests(
        featureRequests.map((fr) =>
          fr.id === requestId ? { ...fr, ...updates } : fr
        )
      )
    }
  }

  // Navigation categories
  const navCategories: NavCategory[] = [
    {
      title: 'Oversikt',
      items: [
        { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { value: 'emergency', label: 'Nødstopp', icon: AlertTriangle, danger: true },
      ]
    },
    {
      title: 'Innhold',
      items: [
        { value: 'posts', label: 'Innlegg', icon: FileText, badge: posts.length },
        { value: 'reports', label: 'Rapporter', icon: Flag, badge: reports.filter(r => r.status === 'pending').length },
      ]
    },
    {
      title: 'Brukere',
      items: [
        { value: 'users', label: 'Brukere', icon: Users, badge: users.length },
      ]
    },
    {
      title: 'System',
      items: [
        { value: 'feature-requests', label: 'Forslag', icon: Lightbulb, badge: featureRequests.filter(fr => fr.status === 'new').length },
        { value: 'bugs', label: 'Bug-rapporter', icon: Bug, badge: bugReports.filter(br => br.status === 'new').length },
        { value: 'broadcasts', label: 'Meldinger', icon: Megaphone },
        { value: 'geography', label: 'Geografi', icon: Globe },
      ]
    },
  ]

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
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-gray-900 text-white flex-shrink-0 sticky top-0">
          <div className="p-4 border-b border-gray-800">
            <Link href="/" className="text-sm text-gray-400 hover:text-white">
              ← Tilbake
            </Link>
            <h1 className="text-xl font-bold mt-2">Admin</h1>
          </div>

          <nav className="p-4 space-y-6">
            {navCategories.map((category) => (
              <div key={category.title}>
                <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2 px-2">
                  {category.title}
                </h3>
                <div className="space-y-1">
                  {category.items.map((item) => {
                    const Icon = item.icon
                    const isActive = activeTab === item.value
                    return (
                      <button
                        key={item.value}
                        onClick={() => setActiveTab(item.value)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                          isActive
                            ? item.danger
                              ? 'bg-red-600 text-white'
                              : 'bg-blue-600 text-white'
                            : item.danger
                              ? 'text-red-400 hover:bg-red-900/30'
                              : 'text-gray-300 hover:bg-gray-800'
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            isActive ? 'bg-white/20' : 'bg-gray-700'
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {navCategories.flatMap(c => c.items).find(i => i.value === activeTab)?.label}
              </h2>
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

          {/* Stats - only show on dashboard */}
          {activeTab === 'dashboard' && <StatsCards stats={stats} />}

          {/* Content */}
          <div className="mt-6">
            {activeTab === 'emergency' && <EmergencyTab />}
            {activeTab === 'dashboard' && <AdminDashboard />}
            {activeTab === 'broadcasts' && <BroadcastMessagesTab />}
            {activeTab === 'users' && (
              <UsersTab
                users={users}
                currentUserId={currentUser?.id}
                onRoleChange={handleRoleChange}
              />
            )}
            {activeTab === 'posts' && <PostsTab posts={posts} onDeletePost={handleDeletePost} />}
            {activeTab === 'reports' && <ReportsTab reports={reports} onUpdateStatus={handleUpdateReportStatus} />}
            {activeTab === 'bugs' && (
              <BugReportsTab
                bugReports={bugReports}
                onUpdateBugReport={handleUpdateBugReport}
              />
            )}
            {activeTab === 'feature-requests' && (
              <FeatureRequestsTab
                featureRequests={featureRequests}
                onUpdateFeatureRequest={handleUpdateFeatureRequest}
              />
            )}
            {activeTab === 'geography' && <GeographyTab />}
          </div>
        </main>
      </div>
    </div>
  )
}
