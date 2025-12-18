'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Archive, Eye } from 'lucide-react'
import type { Report } from './types'
import { formatDate, getReasonLabel } from './utils'

interface ReportsTabProps {
  reports: Report[]
  onUpdateStatus: (reportId: string, newStatus: string) => void
}

export function ReportsTab({ reports, onUpdateStatus }: ReportsTabProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showArchived, setShowArchived] = useState(false)

  // Archived statuses
  const archivedStatuses = ['resolved', 'dismissed']

  const filteredReports = reports.filter((report) => {
    if (filterStatus !== 'all' && report.status !== filterStatus) return false
    // Hide archived if not showing them
    if (!showArchived && archivedStatuses.includes(report.status)) return false
    return true
  })

  // Count archived items for badge
  const archivedCount = reports.filter(r => archivedStatuses.includes(r.status)).length
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Venter</Badge>
      case 'reviewed':
        return <Badge className="bg-blue-500">Under behandling</Badge>
      case 'resolved':
        return <Badge className="bg-green-500">Løst</Badge>
      case 'dismissed':
        return <Badge variant="outline">Avvist</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rapporter</CardTitle>
        <CardDescription>Se og behandle rapportert innhold</CardDescription>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statuser</SelectItem>
              <SelectItem value="pending">Venter</SelectItem>
              <SelectItem value="reviewed">Under behandling</SelectItem>
              <SelectItem value="resolved">Løst</SelectItem>
              <SelectItem value="dismissed">Avvist</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={showArchived ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className="ml-auto"
          >
            {showArchived ? (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Skjul arkivert ({archivedCount})
              </>
            ) : (
              <>
                <Archive className="w-4 h-4 mr-2" />
                Vis arkivert ({archivedCount})
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredReports.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {filterStatus !== 'all' || !showArchived
                ? 'Ingen rapporter matcher filteret'
                : 'Ingen rapporter'}
            </p>
          ) : (
            filteredReports.map((report) => (
              <div
                key={report.id}
                className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{getReasonLabel(report.reason)}</Badge>
                    {getStatusBadge(report.status)}
                  </div>
                  {report.post && (
                    <Link
                      href={`/innlegg/${report.post.id}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {report.post.title}
                    </Link>
                  )}
                  {report.description && (
                    <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Rapportert av {report.reporter?.full_name || report.reporter?.email || 'Ukjent'}{' '}
                    • {formatDate(report.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Select
                    value={report.status}
                    onValueChange={(value) => onUpdateStatus(report.id, value)}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Venter</SelectItem>
                      <SelectItem value="reviewed">Under behandling</SelectItem>
                      <SelectItem value="resolved">Løst</SelectItem>
                      <SelectItem value="dismissed">Avvist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
