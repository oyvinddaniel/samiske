'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Save, Trash2, AlertCircle, X } from 'lucide-react'

interface ImageManagementDialogProps {
  open: boolean
  onClose: () => void
  image: {
    id: string
    url: string
    caption: string | null
    alt_text?: string | null
    storage_path?: string
  }
  entityType: 'language_area' | 'municipality' | 'place'
  entityId: string
  entityName: string
  currentUserId: string | null
  isOwner: boolean // true if current user is original uploader
  onSuccess?: () => void
}

export function ImageManagementDialog({
  open,
  onClose,
  image,
  entityType,
  entityId,
  entityName,
  currentUserId,
  isOwner,
  onSuccess,
}: ImageManagementDialogProps) {
  const [caption, setCaption] = useState(image.caption || '')
  const [altText, setAltText] = useState(image.alt_text || '')
  const [reason, setReason] = useState('')
  const [action, setAction] = useState<'edit' | 'delete' | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleDirectEdit = async () => {
    if (!isOwner) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('media')
        .update({
          caption: caption || null,
          alt_text: altText || null,
        })
        .eq('id', image.id)

      if (error) throw error

      toast.success('Bildet er oppdatert')
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error updating image:', error)
      toast.error('Kunne ikke oppdatere bildet')
    } finally {
      setLoading(false)
    }
  }

  const handleDirectDelete = async () => {
    if (!isOwner) return
    if (!confirm('Er du sikker på at du vil slette dette bildet?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('media')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: currentUserId,
          deletion_reason: 'Deleted by uploader',
        })
        .eq('id', image.id)

      if (error) throw error

      toast.success('Bildet er slettet')
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error deleting image:', error)
      toast.error('Kunne ikke slette bildet')
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestEdit = async () => {
    if (!currentUserId || !reason.trim()) {
      toast.error('Du må oppgi en begrunnelse for endringen')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('geography_suggestions')
        .insert({
          user_id: currentUserId,
          suggestion_type: 'edit_image',
          entity_type: entityType,
          entity_id: entityId,
          media_id: image.id,
          suggested_data: {
            caption: caption || null,
            alt_text: altText || null,
          },
          current_data: {
            caption: image.caption,
            alt_text: image.alt_text,
          },
          reason: reason,
        })

      if (error) throw error

      toast.success('Forslag sendt til godkjenning')
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error submitting suggestion:', error)
      toast.error('Kunne ikke sende forslag')
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestDelete = async () => {
    if (!currentUserId || !reason.trim()) {
      toast.error('Du må oppgi en begrunnelse for slettingen')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('geography_suggestions')
        .insert({
          user_id: currentUserId,
          suggestion_type: 'delete_image',
          entity_type: entityType,
          entity_id: entityId,
          media_id: image.id,
          suggested_data: {
            action: 'delete',
          },
          current_data: {
            caption: image.caption,
            alt_text: image.alt_text,
            url: image.url,
          },
          reason: reason,
        })

      if (error) throw error

      toast.success('Forslag om sletting sendt til godkjenning')
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error submitting deletion suggestion:', error)
      toast.error('Kunne ikke sende forslag')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (isOwner) {
      if (action === 'delete') {
        await handleDirectDelete()
      } else {
        await handleDirectEdit()
      }
    } else {
      if (action === 'delete') {
        await handleSuggestDelete()
      } else {
        await handleSuggestEdit()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isOwner ? 'Administrer bilde' : 'Foreslå endring'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image preview */}
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={image.url}
              alt={image.alt_text || ''}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info for non-owners */}
          {!isOwner && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Dette bildet er lastet opp av en annen bruker</p>
                <p className="text-blue-700">
                  Dine endringer vil sendes til admin for godkjenning. Vennligst oppgi en god begrunnelse.
                </p>
              </div>
            </div>
          )}

          {/* Action selection for non-owners */}
          {!isOwner && !action && (
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => setAction('edit')}
                className="h-20 flex flex-col items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                <span>Foreslå redigering</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setAction('delete')}
                className="h-20 flex flex-col items-center justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-5 h-5" />
                <span>Foreslå sletting</span>
              </Button>
            </div>
          )}

          {/* Edit form */}
          {(isOwner || action === 'edit') && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="caption">Bildetekst</Label>
                <Input
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Skriv en beskrivelse av bildet..."
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alt-text">Alt-tekst (for tilgjengelighet)</Label>
                <Input
                  id="alt-text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Beskriv bildet for skjermlesere..."
                  disabled={loading}
                />
              </div>

              {!isOwner && (
                <div className="space-y-2">
                  <Label htmlFor="reason">Begrunnelse for endringen *</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Forklar hvorfor du vil gjøre denne endringen..."
                    rows={3}
                    disabled={loading}
                    required
                  />
                </div>
              )}
            </div>
          )}

          {/* Delete confirmation */}
          {action === 'delete' && !isOwner && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-900">
                  Du er i ferd med å foreslå sletting av dette bildet fra <strong>{entityName}</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delete-reason">Begrunnelse for sletting *</Label>
                <Textarea
                  id="delete-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Forklar hvorfor dette bildet bør slettes..."
                  rows={4}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {action && !isOwner && (
            <Button
              variant="ghost"
              onClick={() => {
                setAction(null)
                setReason('')
              }}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Tilbake
            </Button>
          )}

          <Button variant="outline" onClick={onClose} disabled={loading}>
            Avbryt
          </Button>

          {isOwner && (
            <>
              <Button
                variant="destructive"
                onClick={handleDirectDelete}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Slett
              </Button>
              <Button onClick={handleDirectEdit} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                Lagre endringer
              </Button>
            </>
          )}

          {!isOwner && action && (
            <Button
              onClick={handleSubmit}
              disabled={loading || !reason.trim()}
            >
              {action === 'delete' ? (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Send forslag om sletting
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Send forslag
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
