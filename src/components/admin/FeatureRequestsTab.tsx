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
import { Lightbulb, MessageCircle, Send, Loader2, Archive, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from './utils'

export type FeatureRequestStatus = 'new' | 'in_progress' | 'completed' | 'rejected' | 'on_hold'

export interface FeatureRequestWithUser {
  id: string
  title: string
  description: string | null
  status: FeatureRequestStatus
  admin_notes: string | null
  created_at: string
  updated_at: string
  user_id: string | null
  user: {
    id: string
    full_name: string | null
    email: string
  } | null
}

interface FeatureRequestsTabProps {
  featureRequests: FeatureRequestWithUser[]
  onUpdateFeatureRequest: (requestId: string, updates: { status?: FeatureRequestStatus; admin_notes?: string }) => void
}

export function FeatureRequestsTab({ featureRequests, onUpdateFeatureRequest }: FeatureRequestsTabProps) {
  const [filterStatus, setFilterStatus] = useState<FeatureRequestStatus | 'all'>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<FeatureRequestWithUser | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [replyMessage, setReplyMessage] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  // Archived statuses
  const archivedStatuses: FeatureRequestStatus[] = ['completed', 'rejected']

  const getStatusBadge = (status: FeatureRequestStatus) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-500">Ny</Badge>
      case 'in_progress':
        return <Badge className="bg-yellow-500">Pågår</Badge>
      case 'completed':
        return <Badge className="bg-green-500">Fullført</Badge>
      case 'rejected':
        return <Badge className="bg-red-500">Avvist</Badge>
      case 'on_hold':
        return <Badge variant="outline">På vent</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredRequests = featureRequests.filter((request) => {
    if (filterStatus !== 'all' && request.status !== filterStatus) return false
    // Hide archived if not showing them
    if (!showArchived && archivedStatuses.includes(request.status)) return false
    return true
  })

  // Count archived items for badge
  const archivedCount = featureRequests.filter(r => archivedStatuses.includes(r.status)).length

  // Sort by created_at DESC
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const handleSaveNotes = async () => {
    if (!selectedRequest) return

    const { error } = await supabase
      .from('feature_requests')
      .update({ admin_notes: adminNotes })
      .eq('id', selectedRequest.id)

    if (error) {
      toast.error('Kunne ikke lagre notater')
      return
    }

    onUpdateFeatureRequest(selectedRequest.id, { admin_notes: adminNotes })
    toast.success('Notater lagret')
    setSelectedRequest(null)
  }

  const handleOpenDetails = (request: FeatureRequestWithUser) => {
    setSelectedRequest(request)
    setAdminNotes(request.admin_notes || '')
    setReplyMessage(`Hei! Angående ditt forslag "${request.title}":\n\n`)
  }

  // Find or create conversation between admin and user
  const findOrCreateConversation = async (adminId: string, userId: string): Promise<string | null> => {
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

    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({})
      .select('id')
      .single()

    if (convError || !newConv) {
      console.error('Failed to create conversation:', convError)
      return null
    }

    await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: newConv.id, user_id: adminId },
        { conversation_id: newConv.id, user_id: userId }
      ])

    return newConv.id
  }

  const handleSendReply = async () => {
    if (!selectedRequest?.user_id || !replyMessage.trim()) return

    setSendingReply(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Du må være innlogget')
        return
      }

      const conversationId = await findOrCreateConversation(user.id, selectedRequest.user_id)
      if (!conversationId) {
        toast.error('Kunne ikke opprette samtale')
        return
      }

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
      setSelectedRequest(null)
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
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Brukerforslag
          </CardTitle>
          <CardDescription>
            Se og behandle forslag fra brukere
          </CardDescription>

          {/* Filters */}
          <div className="flex items-center gap-2 mt-4">
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FeatureRequestStatus | 'all')}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statuser</SelectItem>
                <SelectItem value="new">Ny</SelectItem>
                <SelectItem value="in_progress">Pågår</SelectItem>
                <SelectItem value="completed">Fullført</SelectItem>
                <SelectItem value="rejected">Avvist</SelectItem>
                <SelectItem value="on_hold">På vent</SelectItem>
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
            {sortedRequests.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                {filterStatus !== 'all'
                  ? 'Ingen forslag matcher filteret'
                  : 'Ingen brukerforslag ennå'}
              </p>
            ) : (
              sortedRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(request.status)}
                    </div>

                    <h4 className="font-medium text-gray-900 mb-1">{request.title}</h4>
                    {request.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {request.description}
                      </p>
                    )}

                    <p className="text-xs text-gray-400">
                      {request.user ? (
                        <>{request.user.full_name || request.user.email}</>
                      ) : (
                        <>Anonym</>
                      )}
                      {' • '}
                      {formatDate(request.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDetails(request)}
                    >
                      Detaljer
                    </Button>

                    <Select
                      value={request.status}
                      onValueChange={(value) =>
                        onUpdateFeatureRequest(request.id, { status: value as FeatureRequestStatus })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Ny</SelectItem>
                        <SelectItem value="in_progress">Pågår</SelectItem>
                        <SelectItem value="completed">Fullført</SelectItem>
                        <SelectItem value="rejected">Avvist</SelectItem>
                        <SelectItem value="on_hold">På vent</SelectItem>
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
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Forslag detaljer
              </DialogTitle>
              <DialogDescription>
                ID: {selectedRequest.id}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex gap-2">
                {getStatusBadge(selectedRequest.status)}
              </div>

              <div>
                <Label>Tittel</Label>
                <p className="text-sm mt-1 font-medium">{selectedRequest.title}</p>
              </div>

              {selectedRequest.description && (
                <div>
                  <Label>Beskrivelse</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedRequest.description}</p>
                </div>
              )}

              <div>
                <Label>Foreslått av</Label>
                <p className="text-sm mt-1">
                  {selectedRequest.user
                    ? `${selectedRequest.user.full_name || 'Ingen navn'} (${selectedRequest.user.email})`
                    : 'Anonym'}
                </p>
              </div>

              <div>
                <Label>Dato</Label>
                <p className="text-sm mt-1">{formatDate(selectedRequest.created_at)}</p>
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
              {selectedRequest.user_id && (
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
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                Lukk
              </Button>
              <Button onClick={handleSaveNotes} variant="secondary">
                Lagre notater
              </Button>
              {selectedRequest.user_id && (
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
