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
import { Bug, Lightbulb, HelpCircle, MoreHorizontal, ExternalLink, Image as ImageIcon, MessageCircle, Send, Loader2, Archive, Eye } from 'lucide-react'
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
  const [showArchived, setShowArchived] = useState(false)
  const [selectedReport, setSelectedReport] = useState<BugReportWithUser | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [replyMessage, setReplyMessage] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  // Archived statuses
  const archivedStatuses: BugReportStatus[] = ['resolved', 'dismissed']

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
    // Hide archived if not showing them
    if (!showArchived && archivedStatuses.includes(report.status)) return false
    return true
  })

  // Count archived items for badge
  const archivedCount = bugReports.filter(r => archivedStatuses.includes(r.status)).length

  // Sort: critical first, then by created_at DESC
  const sortedReports = [...filteredReports].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

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

  const handleOpenDetails = (report: BugReportWithUser) => {
    setSelectedReport(report)
    setAdminNotes(report.admin_notes || '')
    // Pre-fill reply message
    setReplyMessage(`Hei! Angående din rapport "${report.title}":\n\n`)
  }

  // Find or create conversation between admin and user
  const findOrCreateConversation = async (adminId: string, userId: string): Promise<string | null> => {
    // Check if conversation exists
    const { data: existingConvs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', adminId)

    if (existingConvs && existingConvs.length > 0) {
      const convIds = existingConvs.map(c => c.conversation_id)

      const { data: matchingConv } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId)
        .in('conversation_id', convIds)
        .limit(1)
        .single()

      if (matchingConv) {
        return matchingConv.conversation_id
      }
    }

    // Create new conversation
    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({})
      .select('id')
      .single()

    if (convError || !newConv) {
      console.error('Failed to create conversation:', convError)
      return null
    }

    // Add both participants
    await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: newConv.id, user_id: adminId },
        { conversation_id: newConv.id, user_id: userId }
      ])

    return newConv.id
  }

  const handleSendReply = async () => {
    if (!selectedReport?.user_id || !replyMessage.trim()) return

    setSendingReply(true)
    try {
      // Get current admin user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Du må være innlogget')
        return
      }

      // Find or create conversation
      const conversationId = await findOrCreateConversation(user.id, selectedReport.user_id)
      if (!conversationId) {
        toast.error('Kunne ikke opprette samtale')
        return
      }

      // Send message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: replyMessage.trim()
        })

      if (messageError) {
        console.error('Failed to send message:', messageError)
        toast.error('Kunne ikke sende melding')
        return
      }

      toast.success('Melding sendt til bruker!')
      setReplyMessage('')
      setSelectedReport(null)
    } catch (error) {
      console.error('Error sending reply:', error)
      toast.error('Noe gikk galt')
    } finally {
      setSendingReply(false)
    }
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
          <div className="flex items-center gap-2 mt-4">
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
                <Label htmlFor="admin-notes">Admin-notater (kun synlig for admin)</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Legg til interne notater..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Reply to user section */}
              {selectedReport.user_id && (
                <div className="border-t pt-4">
                  <Label htmlFor="reply-message" className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Svar til bruker
                  </Label>
                  <Textarea
                    id="reply-message"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Skriv en melding til brukeren..."
                    rows={4}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Meldingen sendes direkte til brukerens innboks
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setSelectedReport(null)}>
                Lukk
              </Button>
              <Button onClick={handleSaveNotes} variant="secondary">
                Lagre notater
              </Button>
              {selectedReport.user_id && (
                <Button
                  onClick={handleSendReply}
                  disabled={sendingReply || !replyMessage.trim()}
                >
                  {sendingReply ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sender...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send melding
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
