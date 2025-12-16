'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, UserPlus, Activity, TrendingUp, Calendar } from 'lucide-react'
import { formatDate } from './utils'

interface AuthUser {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  raw_user_meta_data: {
    full_name?: string
  }
}

interface RegistrationTrend {
  date: string
  count: number
}

export function UserAnalyticsTab() {
  const [users, setUsers] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    registeredToday: 0,
    loggedInToday: 0,
    registeredThisWeek: 0,
    registeredThisMonth: 0,
  })
  const [trend, setTrend] = useState<RegistrationTrend[]>([])
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // Fetch all data in parallel
      const [usersResult, totalResult, todayResult, loginTodayResult, weekResult, monthResult, trendResult] = await Promise.all([
        supabase.rpc('get_auth_users_list'),
        supabase.rpc('get_auth_users_count'),
        supabase.rpc('get_users_registered_today'),
        supabase.rpc('get_users_logged_in_today'),
        supabase.rpc('get_users_registered_this_week'),
        supabase.rpc('get_users_registered_this_month'),
        supabase.rpc('get_user_registration_trend'),
      ])

      if (usersResult.data) {
        setUsers(usersResult.data as AuthUser[])
      }

      setStats({
        totalUsers: totalResult.data || 0,
        registeredToday: todayResult.data || 0,
        loggedInToday: loginTodayResult.data || 0,
        registeredThisWeek: weekResult.data || 0,
        registeredThisMonth: monthResult.data || 0,
      })

      if (trendResult.data) {
        setTrend(trendResult.data as RegistrationTrend[])
      }

      setLoading(false)
    }

    fetchData()
  }, [supabase])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse">Laster brukerdata...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Totalt antall brukere</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Registrert i dag</p>
                <p className="text-3xl font-bold text-green-600">{stats.registeredToday}</p>
              </div>
              <UserPlus className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Logget inn i dag</p>
                <p className="text-3xl font-bold text-purple-600">{stats.loggedInToday}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Denne uken</p>
                <p className="text-3xl font-bold text-orange-600">{stats.registeredThisWeek}</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Denne måneden</p>
                <p className="text-3xl font-bold text-indigo-600">{stats.registeredThisMonth}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registration Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Registreringstrend (siste 30 dager)</CardTitle>
          <CardDescription>Antall nye brukere per dag</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {trend.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Ingen data tilgjengelig</p>
            ) : (
              trend.map((day) => (
                <div key={day.date} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm text-gray-700">
                    {new Date(day.date).toLocaleDateString('nb-NO', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  <Badge variant={day.count > 0 ? 'default' : 'outline'}>
                    {day.count} nye
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>Alle brukere ({users.length})</CardTitle>
          <CardDescription>
            Fullstendig liste over registrerte brukere fra Authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {users.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Ingen brukere funnet</p>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {user.raw_user_meta_data?.full_name || 'Ingen navn'}
                      </h4>
                      {user.email_confirmed_at ? (
                        <Badge className="bg-green-500">Verifisert</Badge>
                      ) : (
                        <Badge variant="outline">Ikke verifisert</Badge>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{user.email}</p>

                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>
                        <strong>Registrert:</strong> {formatDate(user.created_at)}
                      </span>
                      {user.last_sign_in_at && (
                        <span>
                          <strong>Sist innlogget:</strong> {formatDate(user.last_sign_in_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
