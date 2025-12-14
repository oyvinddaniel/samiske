'use client'

import { useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface SendMessageToCommunityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  communityId: string
  communityName: string
}

export function SendMessageToCommunityModal({
  open,
  onOpenChange,
  communityId,
  communityName
}: SendMessageToCommunityModalProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) {
      toast.error('Skriv en melding')
      return
    }

    setLoading(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Du må være innlogget')
        return
      }

      // Get community admins
      const { data: admins, error: adminsError } = await supabase
        .from('community_admins')
        .select('user_id')
        .eq('community_id', communityId)
        .limit(1)

      if (adminsError) {
        console.error('Error fetching admins:', adminsError)
        toast.error('Kunne ikke hente administratorer')
        return
      }

      if (!admins || admins.length === 0) {
        toast.error('Ingen administratorer funnet for denne siden')
        return
      }

      const adminUserId = admins[0].user_id

      // Get or create conversation with the admin
      const { data: conversationId, error: convError } = await supabase
        .rpc('get_or_create_conversation', { other_user_id: adminUserId })

      if (convError) {
        console.error('Error creating conversation:', convError)
        toast.error('Kunne ikke opprette samtale')
        return
      }

      // Send message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: message.trim()
        })

      if (messageError) {
        console.error('Error sending message:', messageError)
        toast.error('Kunne ikke sende melding')
        return
      }

      toast.success('Melding sendt!')
      setMessage('')
      onOpenChange(false)
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Noe gikk galt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Send melding til {communityName}</DialogTitle>
            <DialogDescription>
              Send en melding til administratorene for denne siden
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="message">Melding</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Skriv din melding her..."
                rows={6}
                maxLength={2000}
                required
              />
              <p className="text-xs text-gray-500">
                {message.length}/2000 tegn
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={loading || !message.trim()}>
              {loading ? (
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
