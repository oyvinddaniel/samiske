'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Report } from './types'
import { formatDate, getReasonLabel } from './utils'

interface ReportsTabProps {
  reports: Report[]
  onUpdateStatus: (reportId: string, newStatus: string) => void
}

export function ReportsTab({ reports, onUpdateStatus }: ReportsTabProps) {
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
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reports.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Ingen rapporter</p>
          ) : (
            reports.map((report) => (
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
