'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface ReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  postId?: string
  commentId?: string
  currentUserId: string
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam eller reklame' },
  { value: 'harassment', label: 'Trakassering eller mobbing' },
  { value: 'hate', label: 'Hatefullt innhold' },
  { value: 'misinformation', label: 'Feilinformasjon' },
  { value: 'inappropriate', label: 'Upassende innhold' },
  { value: 'other', label: 'Annet' },
]

export function ReportDialog({
  open,
  onOpenChange,
  postId,
  commentId,
  currentUserId,
}: ReportDialogProps) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Velg en grunn for rapporten')
      return
    }

    setSubmitting(true)

    const { error } = await supabase.from('reports').insert({
      reporter_id: currentUserId,
      post_id: postId || null,
      comment_id: commentId || null,
      reason,
      description: description.trim() || null,
    })

    if (error) {
      console.error('Error submitting report:', error)
      toast.error('Kunne ikke sende rapport. Prøv igjen.')
    } else {
      toast.success('Takk for rapporten! Vi vil se på den.')
      setReason('')
      setDescription('')
      onOpenChange(false)
    }

    setSubmitting(false)
  }

  const handleClose = () => {
    if (!submitting) {
      setReason('')
      setDescription('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Rapporter innhold
          </DialogTitle>
          <DialogDescription>
            Fortell oss hvorfor du mener dette innholdet bryter våre retningslinjer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Velg grunn *</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Tilleggsinformasjon (valgfritt)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Gi oss mer informasjon om hvorfor du rapporterer..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">
              {description.length}/500
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !reason}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sender...
              </>
            ) : (
              'Send rapport'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
