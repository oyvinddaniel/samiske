'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, User, Clock, Globe, ChevronLeft, ChevronRight } from 'lucide-react'

interface ActivityEntry {
  id: string
  user_id: string
  user_name: string | null
  user_email: string | null
  page_path: string
  page_title: string | null
  created_at: string
}

const PAGE_SIZE = 50

export function UserActivityLog() {
  const supabase = createClient()
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const fetchActivities = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    else setRefreshing(true)

    try {
      // Hent totalt antall
      const { count } = await supabase
        .from('user_activity_log')
        .select('*', { count: 'exact', head: true })

      setTotalCount(count || 0)

      // Hent aktiviteter for denne siden
      const { data, error } = await supabase
        .from('user_activity_log')
        .select('id, user_id, user_name, user_email, page_path, page_title, created_at')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (error) {
        console.error('Error fetching activity log:', error)
        return
      }

      setActivities(data || [])
      setHasMore((data?.length || 0) === PAGE_SIZE)
    } catch (error) {
      console.error('Error fetching activity log:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [supabase, page])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  // Auto-refresh hvert 30. sekund
  useEffect(() => {
    const interval = setInterval(() => {
      if (page === 0) {
        fetchActivities(false)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchActivities, page])

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffSecs < 60) return `${diffSecs} sek siden`
    if (diffMins < 60) return `${diffMins} min siden`
    if (diffHours < 24) return `${diffHours} timer siden`
    return formatDateTime(dateString)
  }

  const getPageName = (path: string) => {
    const pathMap: Record<string, string> = {
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

    if (pathMap[path]) return pathMap[path]
    if (path.startsWith('/sapmi')) return 'Sápmi - Geografi'
    if (path.startsWith('/grupper/')) return 'Gruppevisning'
    if (path.startsWith('/samfunn/')) return 'Samfunnsvisning'
    if (path.startsWith('/bruker/')) return 'Brukerprofil'
    if (path.startsWith('/innlegg/')) return 'Innleggsvisning'
    return path
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Detaljert brukerlogg
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Detaljert brukerlogg
            <span className="text-sm font-normal text-gray-500">
              ({totalCount} totalt)
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Oppdateres automatisk
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchActivities(false)}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Ingen aktivitet logget ennå</p>
            <p className="text-sm mt-1">Aktivitet logges når brukere navigerer i appen</p>
          </div>
        ) : (
          <>
            {/* Tabell */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-2 px-3 font-medium">Tidspunkt</th>
                    <th className="text-left py-2 px-3 font-medium">Bruker</th>
                    <th className="text-left py-2 px-3 font-medium">Side</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => (
                    <tr key={activity.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-2 px-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {formatTimeAgo(activity.created_at)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDateTime(activity.created_at)}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {activity.user_name || 'Ukjent'}
                            </span>
                            {activity.user_email && (
                              <span className="text-xs text-gray-500">
                                {activity.user_email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {getPageName(activity.page_path)}
                            </span>
                            <span className="text-xs text-gray-500 font-mono">
                              {activity.page_path}
                            </span>
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
              <div className="text-sm text-gray-500">
                Viser {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, totalCount)} av {totalCount}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Forrige
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={!hasMore}
                >
                  Neste
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
