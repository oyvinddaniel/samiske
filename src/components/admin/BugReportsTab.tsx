'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Bug, Lightbulb, HelpCircle, MoreHorizontal, ExternalLink, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { BugReportWithUser } from '@/lib/types/bug-reports'
import type { BugReportPriority, BugReportStatus, BugReportCategory } from '@/lib/types/bug-reports'
import { formatDate } from './utils'

interface BugReportsTabProps {
  bugReports: BugReportWithUser[]
  onUpdateBugReport: (reportId: string, updates: { priority?: BugReportPriority; status?: BugReportStatus; admin_notes?: string }) => void
}

const CATEGORY_CONFIG = {
  bug: { label: 'Bug', icon: Bug, color: 'bg-red-500' },
  improvement: { label: 'Forbedring', icon: Lightbulb, color: 'bg-blue-500' },
  question: { label: 'Spørsmål', icon: HelpCircle, color: 'bg-purple-500' },
  other: { label: 'Annet', icon: MoreHorizontal, color: 'bg-gray-500' },
}

export function BugReportsTab({ bugReports, onUpdateBugReport }: BugReportsTabProps) {
  const [filterStatus, setFilterStatus] = useState<BugReportStatus | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<BugReportPriority | 'all'>('all')
  const [selectedReport, setSelectedReport] = useState<BugReportWithUser | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const supabase = useMemo(() => createClient(), [])

  const getStatusBadge = (status: BugReportStatus) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-yellow-500">Ny</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-500">Under arbeid</Badge>
      case 'resolved':
        return <Badge className="bg-green-500">Løst</Badge>
      case 'dismissed':
        return <Badge variant="outline">Avvist</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: BugReportPriority) => {
    switch (priority) {
      case 'critical':
        return <Badge className="bg-red-600">Kritisk</Badge>
      case 'high':
        return <Badge className="bg-orange-500">Høy</Badge>
      case 'medium':
        return <Badge className="bg-yellow-500">Medium</Badge>
      case 'low':
        return <Badge className="bg-gray-400">Lav</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const getCategoryBadge = (category: BugReportCategory) => {
    const config = CATEGORY_CONFIG[category]
    const Icon = config.icon
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const filteredReports = bugReports.filter((report) => {
    if (filterStatus !== 'all' && report.status !== filterStatus) return false
    if (filterPriority !== 'all' && report.priority !== filterPriority) return false
    return true
  })

  // Sort: critical first, then by created_at DESC
  const sortedReports = [...filteredReports].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const handleOpenDetails = (report: BugReportWithUser) => {
    setSelectedReport(report)
    setAdminNotes(report.admin_notes || '')
  }

  const handleSaveNotes = async () => {
    if (!selectedReport) return

    const { error } = await supabase
      .from('bug_reports')
      .update({ admin_notes: adminNotes })
      .eq('id', selectedReport.id)

    if (error) {
      toast.error('Kunne ikke lagre notater')
      return
    }

    onUpdateBugReport(selectedReport.id, { admin_notes: adminNotes })
    toast.success('Notater lagret')
    setSelectedReport(null)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Bug-rapporter</CardTitle>
          <CardDescription>
            Se og behandle bug-rapporter fra brukere
          </CardDescription>

          {/* Filters */}
          <div className="flex gap-2 mt-4">
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as BugReportStatus | 'all')}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statuser</SelectItem>
                <SelectItem value="new">Ny</SelectItem>
                <SelectItem value="in_progress">Under arbeid</SelectItem>
                <SelectItem value="resolved">Løst</SelectItem>
                <SelectItem value="dismissed">Avvist</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={(value) => setFilterPriority(value as BugReportPriority | 'all')}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle prioriteter</SelectItem>
                <SelectItem value="critical">Kritisk</SelectItem>
                <SelectItem value="high">Høy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Lav</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {sortedReports.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                {filterStatus !== 'all' || filterPriority !== 'all'
                  ? 'Ingen rapporter matcher filtrene'
                  : 'Ingen bug-rapporter ennå'}
              </p>
            ) : (
              sortedReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getCategoryBadge(report.category)}
                      {getStatusBadge(report.status)}
                      {getPriorityBadge(report.priority)}
                    </div>

                    <h4 className="font-medium text-gray-900 mb-1">{report.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {report.description}
                    </p>

                    {report.url && (
                      <a
                        href={report.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 mb-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {report.url}
                      </a>
                    )}

                    {report.screenshot_url && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <ImageIcon className="w-3 h-3" />
                        Har skjermbilde
                      </div>
                    )}

                    <p className="text-xs text-gray-400">
                      {report.user ? (
                        <>Av {report.user.full_name || report.user.email}</>
                      ) : (
                        <>Anonym</>
                      )}
                      {' • '}
                      {formatDate(report.created_at)}
                      {report.screen_size && ` • ${report.screen_size}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDetails(report)}
                    >
                      Detaljer
                    </Button>

                    <Select
                      value={report.status}
                      onValueChange={(value) =>
                        onUpdateBugReport(report.id, { status: value as BugReportStatus })
                      }
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Ny</SelectItem>
                        <SelectItem value="in_progress">Under arbeid</SelectItem>
                        <SelectItem value="resolved">Løst</SelectItem>
                        <SelectItem value="dismissed">Avvist</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={report.priority}
                      onValueChange={(value) =>
                        onUpdateBugReport(report.id, { priority: value as BugReportPriority })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Lav</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">Høy</SelectItem>
                        <SelectItem value="critical">Kritisk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Bug-rapport detaljer
              </DialogTitle>
              <DialogDescription>
                ID: {selectedReport.id}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex gap-2">
                {getCategoryBadge(selectedReport.category)}
                {getStatusBadge(selectedReport.status)}
                {getPriorityBadge(selectedReport.priority)}
              </div>

              <div>
                <Label>Tittel</Label>
                <p className="text-sm mt-1">{selectedReport.title}</p>
              </div>

              <div>
                <Label>Beskrivelse</Label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{selectedReport.description}</p>
              </div>

              {selectedReport.screenshot_url && (
                <div>
                  <Label>Skjermbilde</Label>
                  <img
                    src={selectedReport.screenshot_url}
                    alt="Bug screenshot"
                    className="mt-2 rounded border max-w-full"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>URL</Label>
                  <a
                    href={selectedReport.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline block mt-1"
                  >
                    {selectedReport.url || 'N/A'}
                  </a>
                </div>
                <div>
                  <Label>Skjermstørrelse</Label>
                  <p className="text-sm mt-1">{selectedReport.screen_size || 'N/A'}</p>
                </div>
              </div>

              <div>
                <Label>User Agent</Label>
                <p className="text-xs text-gray-600 mt-1 font-mono break-all">
                  {selectedReport.user_agent || 'N/A'}
                </p>
              </div>

              <div>
                <Label>Rapportert av</Label>
                <p className="text-sm mt-1">
                  {selectedReport.user
                    ? `${selectedReport.user.full_name || 'Ingen navn'} (${selectedReport.user.email})`
                    : 'Anonym'}
                </p>
              </div>

              <div>
                <Label>Dato</Label>
                <p className="text-sm mt-1">{formatDate(selectedReport.created_at)}</p>
              </div>

              <div>
                <Label htmlFor="admin-notes">Admin-notater</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Legg til interne notater..."
                  rows={4}
                  className="mt-1"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedReport(null)}>
                Lukk
              </Button>
              <Button onClick={handleSaveNotes}>Lagre notater</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
