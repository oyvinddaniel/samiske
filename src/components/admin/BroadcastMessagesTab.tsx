'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { AlertTriangle, Bell, Loader2, Trash2, Plus, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { BroadcastMessage } from '@/lib/types/broadcast'

export function BroadcastMessagesTab() {
  const [messages, setMessages] = useState<BroadcastMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newMessage, setNewMessage] = useState({
    title: '',
    content: ''
  })
  const supabase = useMemo(() => createClient(), [])

  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('broadcast_messages')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching broadcast messages:', error)
        toast.error('Kunne ikke hente meldinger')
        return
      }

      setMessages((data || []) as BroadcastMessage[])
    } catch (error) {
      console.error('Error in fetchMessages:', error)
      toast.error('Kunne ikke hente meldinger')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchMessages()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('admin_broadcast_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'broadcast_messages'
        },
        () => {
          fetchMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchMessages, supabase])

  const handleCreate = async () => {
    if (!newMessage.title.trim() || !newMessage.content.trim()) {
      toast.error('Tittel og innhold er påkrevd')
      return
    }

    if (newMessage.title.length > 100) {
      toast.error('Tittel kan ikke være lengre enn 100 tegn')
      return
    }

    if (newMessage.content.length > 2000) {
      toast.error('Innhold kan ikke være lengre enn 2000 tegn')
      return
    }

    setCreating(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Du må være logget inn')
        return
      }

      const { error } = await supabase
        .from('broadcast_messages')
        .insert({
          title: newMessage.title.trim(),
          content: newMessage.content.trim(),
          created_by: user.id,
          is_active: true
        })

      if (error) {
        console.error('Error creating broadcast message:', error)
        toast.error('Kunne ikke opprette melding')
        return
      }

      toast.success('Melding opprettet!')
      setNewMessage({ title: '', content: '' })
      fetchMessages()
    } catch (error) {
      console.error('Error in handleCreate:', error)
      toast.error('Kunne ikke opprette melding')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('broadcast_messages')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) {
        console.error('Error toggling message status:', error)
        toast.error('Kunne ikke oppdatere status')
        return
      }

      toast.success(!currentStatus ? 'Melding aktivert' : 'Melding deaktivert')
      fetchMessages()
    } catch (error) {
      console.error('Error in handleToggleActive:', error)
      toast.error('Kunne ikke oppdatere status')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Er du sikker på at du vil slette denne meldingen?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('broadcast_messages')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting message:', error)
        toast.error('Kunne ikke slette melding')
        return
      }

      toast.success('Melding slettet')
      fetchMessages()
    } catch (error) {
      console.error('Error in handleDelete:', error)
      toast.error('Kunne ikke slette melding')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Create new message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Opprett ny melding
          </CardTitle>
          <CardDescription>
            Send en informasjonsmelding til alle brukere. Meldingen vises automatisk 5 sekunder etter innlogging.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tittel</Label>
            <Input
              id="title"
              placeholder="F.eks: Velkommen til samiske.no"
              value={newMessage.title}
              onChange={(e) => setNewMessage(prev => ({ ...prev, title: e.target.value }))}
              maxLength={100}
            />
            <p className="text-xs text-gray-500">{newMessage.title.length}/100 tegn</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Innhold</Label>
            <Textarea
              id="content"
              placeholder="Skriv meldingen din her..."
              value={newMessage.content}
              onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
              rows={5}
              maxLength={2000}
            />
            <p className="text-xs text-gray-500">{newMessage.content.length}/2000 tegn</p>
          </div>

          <Button
            onClick={handleCreate}
            disabled={creating || !newMessage.title.trim() || !newMessage.content.trim()}
            className="w-full sm:w-auto"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Oppretter...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Opprett melding
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing messages */}
      <Card>
        <CardHeader>
          <CardTitle>Eksisterende meldinger</CardTitle>
          <CardDescription>
            {messages.length === 0 ? 'Ingen meldinger opprettet ennå' : `${messages.length} melding(er)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Ingen meldinger opprettet ennå</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="border rounded-lg p-4 space-y-3 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold text-lg">{message.title}</h3>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs text-gray-400">
                        Opprettet: {new Date(message.created_at).toLocaleString('no-NO')}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">
                          {message.is_active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                        <Switch
                          checked={message.is_active}
                          onCheckedChange={() => handleToggleActive(message.id, message.is_active)}
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(message.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {message.is_active && (
                    <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded w-fit">
                      <CheckCircle className="h-3 w-3" />
                      Vises for brukere
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
