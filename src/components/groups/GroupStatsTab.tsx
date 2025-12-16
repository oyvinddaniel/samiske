'use client'

import { useState, useEffect } from 'react'
import { Users, FileText, Calendar, TrendingUp, Clock, Loader2 } from 'lucide-react'
import { getGroupStatistics, type GroupStatistics } from '@/lib/groups'
import type { Group } from '@/lib/types/groups'

interface GroupStatsTabProps {
  group: Group
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  subValue?: string
  color: string
}

function StatCard({ icon, label, value, subValue, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-gray-600">{label}</p>
          {subValue && (
            <p className="text-xs text-gray-500 mt-0.5">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export function GroupStatsTab({ group }: GroupStatsTabProps) {
  const [stats, setStats] = useState<GroupStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data, error: statsError } = await getGroupStatistics(group.id)

        if (statsError) {
          setError(statsError)
          return
        }

        setStats(data)
      } catch (err) {
        console.error('Error fetching stats:', err)
        setError('Kunne ikke hente statistikk')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [group.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{error}</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Ingen statistikk tilgjengelig</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Users className="w-5 h-5 text-blue-600" />}
          label="Medlemmer"
          value={stats.member_count}
          subValue={stats.members_this_week > 0 ? `+${stats.members_this_week} denne uken` : undefined}
          color="bg-blue-100"
        />
        <StatCard
          icon={<FileText className="w-5 h-5 text-green-600" />}
          label="Innlegg"
          value={stats.post_count}
          subValue={stats.posts_this_week > 0 ? `+${stats.posts_this_week} denne uken` : undefined}
          color="bg-green-100"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5 text-purple-600" />}
          label="Arrangementer"
          value={stats.event_count}
          color="bg-purple-100"
        />
        {stats.pending_members > 0 && (
          <StatCard
            icon={<Clock className="w-5 h-5 text-orange-600" />}
            label="Venter godkjenning"
            value={stats.pending_members}
            color="bg-orange-100"
          />
        )}
      </div>

      {/* Activity summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Aktivitet denne uken
        </h4>
        <div className="space-y-2 text-sm">
          {stats.members_this_week > 0 ? (
            <p className="text-green-600">
              {stats.members_this_week} {stats.members_this_week === 1 ? 'nytt medlem' : 'nye medlemmer'}
            </p>
          ) : (
            <p className="text-gray-500">Ingen nye medlemmer</p>
          )}
          {stats.posts_this_week > 0 ? (
            <p className="text-green-600">
              {stats.posts_this_week} {stats.posts_this_week === 1 ? 'nytt innlegg' : 'nye innlegg'}
            </p>
          ) : (
            <p className="text-gray-500">Ingen nye innlegg</p>
          )}
        </div>
      </div>

      {/* Info about stats */}
      <p className="text-xs text-gray-400 text-center">
        Statistikken oppdateres i sanntid
      </p>
    </div>
  )
}
