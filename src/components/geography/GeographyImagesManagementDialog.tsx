'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageIcon, X, Save, Trash2, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MediaService } from '@/lib/media/mediaService'
import { toast } from 'sonner'

type EntityType = 'language_area' | 'municipality' | 'place'

interface GeographyImage {
  id: string
  image_url: string
  caption: string | null
  alt_text: string | null
  sort_order: number
  storage_path: string
  original_uploader_id: string
}

interface GeographyImagesManagementDialogProps {
  open: boolean
  onClose: () => void
  entityType: EntityType
  entityId: string
  entityName: string
  images: GeographyImage[]
  currentUserId: string | null
  onImageUpdated?: () => void
}

interface ImageEdit {
  id: string
  caption: string
  alt_text: string
  deleted: boolean
  sort_order: number
  original_uploader_id: string
  storage_path: string
  image_url: string
}

export function GeographyImagesManagementDialog({
  open,
  onClose,
  entityType,
  entityId,
  entityName,
  images,
  currentUserId,
  onImageUpdated,
}: GeographyImagesManagementDialogProps) {
  const [edits, setEdits] = useState<ImageEdit[]>([])
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  // Initialize edits when images change
  useEffect(() => {
    setEdits(
      images.map(img => ({
        id: img.id,
        caption: img.caption || '',
        alt_text: img.alt_text || '',
        deleted: false,
        sort_order: img.sort_order,
        original_uploader_id: img.original_uploader_id,
        storage_path: img.storage_path,
        image_url: img.image_url,
      }))
    )
  }, [images])

  const updateEdit = (id: string, field: keyof ImageEdit, value: string | boolean | number) => {
    setEdits(prev =>
      prev.map(edit => (edit.id === id ? { ...edit, [field]: value } : edit))
    )
  }

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newEdits = [...edits]
    const swapIndex = direction === 'up' ? index - 1 : index + 1

    if (swapIndex < 0 || swapIndex >= newEdits.length) return

    // Swap
    const temp = newEdits[index]
    newEdits[index] = newEdits[swapIndex]
    newEdits[swapIndex] = temp

    // Update sort orders
    newEdits.forEach((edit, i) => {
      edit.sort_order = i
    })

    setEdits(newEdits)
  }

  const hasChanges = () => {
    return edits.some((edit, index) => {
      const original = images[index]
      if (!original) return edit.deleted

      return (
        edit.caption !== (original.caption || '') ||
        edit.alt_text !== (original.alt_text || '') ||
        edit.deleted ||
        edit.sort_order !== original.sort_order
      )
    })
  }

  const hasOwnImages = edits.some(edit => edit.original_uploader_id === currentUserId)
  const hasOthersImages = edits.some(edit => edit.original_uploader_id !== currentUserId)
  const changesNeedApproval = edits.some(edit => {
    const isOwner = edit.original_uploader_id === currentUserId
    const original = images.find(img => img.id === edit.id)
    if (!original) return false

    const hasEdit = (
      edit.caption !== (original.caption || '') ||
      edit.alt_text !== (original.alt_text || '') ||
      edit.deleted ||
      edit.sort_order !== original.sort_order
    )

    return hasEdit && !isOwner
  })

  const handleSave = async () => {
    if (!currentUserId) return
    if (!hasChanges()) {
      toast.info('Ingen endringer å lagre')
      return
    }

    // Check if changes need approval
    if (changesNeedApproval && !reason.trim()) {
      toast.error('Du må oppgi en begrunnelse for endringer på andres bilder')
      return
    }

    setSaving(true)
    try {
      // Separate own edits from others' edits
      const ownEdits = edits.filter(edit => edit.original_uploader_id === currentUserId)
      const othersEdits = edits.filter(edit => edit.original_uploader_id !== currentUserId)

      // Save own edits directly
      for (const edit of ownEdits) {
        const original = images.find(img => img.id === edit.id)
        if (!original) continue

        const hasChange = (
          edit.caption !== (original.caption || '') ||
          edit.alt_text !== (original.alt_text || '') ||
          edit.sort_order !== original.sort_order
        )

        if (edit.deleted) {
          // Delete image
          await supabase
            .from('media')
            .update({
              deleted_at: new Date().toISOString(),
              deleted_by: currentUserId,
              deletion_reason: 'Deleted by owner via bulk edit',
            })
            .eq('id', edit.id)
        } else if (hasChange) {
          // Update image
          await supabase
            .from('media')
            .update({
              caption: edit.caption || null,
              alt_text: edit.alt_text || null,
              sort_order: edit.sort_order,
            })
            .eq('id', edit.id)
        }
      }

      // Create suggestions for others' edits
      for (const edit of othersEdits) {
        const original = images.find(img => img.id === edit.id)
        if (!original) continue

        const hasChange = (
          edit.caption !== (original.caption || '') ||
          edit.alt_text !== (original.alt_text || '') ||
          edit.sort_order !== original.sort_order
        )

        if (edit.deleted) {
          // Suggest deletion
          await supabase.from('geography_suggestions').insert({
            user_id: currentUserId,
            suggestion_type: 'delete_image',
            entity_type: entityType,
            entity_id: entityId,
            media_id: edit.id,
            suggested_data: { action: 'delete' },
            current_data: {
              caption: original.caption,
              alt_text: original.alt_text,
              url: original.image_url,
            },
            reason: reason,
          })
        } else if (hasChange) {
          // Suggest edit
          await supabase.from('geography_suggestions').insert({
            user_id: currentUserId,
            suggestion_type: 'edit_image',
            entity_type: entityType,
            entity_id: entityId,
            media_id: edit.id,
            suggested_data: {
              caption: edit.caption || null,
              alt_text: edit.alt_text || null,
              sort_order: edit.sort_order,
            },
            current_data: {
              caption: original.caption,
              alt_text: original.alt_text,
              sort_order: original.sort_order,
            },
            reason: reason,
          })
        }
      }

      const ownChanges = ownEdits.some(edit => {
        const original = images.find(img => img.id === edit.id)
        return edit.deleted || (original && (
          edit.caption !== (original.caption || '') ||
          edit.alt_text !== (original.alt_text || '') ||
          edit.sort_order !== original.sort_order
        ))
      })

      const suggestedChanges = othersEdits.some(edit => {
        const original = images.find(img => img.id === edit.id)
        return edit.deleted || (original && (
          edit.caption !== (original.caption || '') ||
          edit.alt_text !== (original.alt_text || '') ||
          edit.sort_order !== original.sort_order
        ))
      })

      if (ownChanges && suggestedChanges) {
        toast.success('Dine endringer er lagret og forslag sendt til admin')
      } else if (ownChanges) {
        toast.success('Alle endringer er lagret')
      } else if (suggestedChanges) {
        toast.success('Forslag sendt til admin for godkjenning')
      }

      onImageUpdated?.()
      onClose()
    } catch (error) {
      console.error('Error saving changes:', error)
      toast.error('Kunne ikke lagre endringer')
    } finally {
      setSaving(false)
    }
  }

  const activeEdits = edits.filter(edit => !edit.deleted)

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Administrer bilder - {entityName}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {images.length === 0 ? (
            <div className="py-12 text-center">
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Ingen bilder lastet opp ennå</p>
            </div>
          ) : (
            <>
              {/* Info banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Bulk-redigering:</strong> Rediger alle bilder samtidig.
                  {hasOthersImages && ' Endringer på andres bilder sendes til admin for godkjenning.'}
                </p>
              </div>

              {/* Need approval warning */}
              {changesNeedApproval && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-amber-900 font-medium mb-2">
                        Du har endringer på bilder lastet opp av andre
                      </p>
                      <Label htmlFor="bulk-reason" className="text-sm text-amber-800">
                        Begrunnelse for endringene (påkrevd)
                      </Label>
                      <Textarea
                        id="bulk-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Forklar hvorfor du vil gjøre disse endringene..."
                        rows={3}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Images list */}
              <div className="space-y-4">
                {activeEdits.map((edit, index) => {
                  const isOwner = edit.original_uploader_id === currentUserId
                  const isFirst = index === 0
                  const isLast = index === activeEdits.length - 1

                  return (
                    <div
                      key={edit.id}
                      className="bg-white border rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex gap-4">
                        {/* Image preview */}
                        <div className="flex-shrink-0">
                          <img
                            src={MediaService.getUrl(edit.storage_path, 'medium')}
                            alt={edit.alt_text || ''}
                            className="w-32 h-32 object-cover rounded-lg"
                          />
                          {isOwner && (
                            <div className="mt-2 text-xs text-center bg-blue-100 text-blue-700 py-1 rounded">
                              Ditt bilde
                            </div>
                          )}
                        </div>

                        {/* Edit fields */}
                        <div className="flex-1 space-y-3">
                          <div>
                            <Label htmlFor={`caption-${edit.id}`} className="text-sm">
                              Bildetekst
                            </Label>
                            <Input
                              id={`caption-${edit.id}`}
                              value={edit.caption}
                              onChange={(e) => updateEdit(edit.id, 'caption', e.target.value)}
                              placeholder="Skriv en beskrivelse..."
                              disabled={saving}
                            />
                          </div>

                          <div>
                            <Label htmlFor={`alt-${edit.id}`} className="text-sm">
                              Alt-tekst (tilgjengelighet)
                            </Label>
                            <Input
                              id={`alt-${edit.id}`}
                              value={edit.alt_text}
                              onChange={(e) => updateEdit(edit.id, 'alt_text', e.target.value)}
                              placeholder="Beskriv bildet for skjermlesere..."
                              disabled={saving}
                            />
                          </div>

                          {!isOwner && (
                            <p className="text-xs text-amber-600">
                              ⚠️ Endringer på dette bildet sendes til admin for godkjenning
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex-shrink-0 flex flex-col gap-2">
                          {/* Reorder */}
                          <div className="flex flex-col gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => moveImage(index, 'up')}
                              disabled={isFirst || saving}
                              className="p-2"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => moveImage(index, 'down')}
                              disabled={isLast || saving}
                              className="p-2"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Delete */}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateEdit(edit.id, 'deleted', true)}
                            disabled={saving}
                            className="p-2"
                            title={isOwner ? 'Slett bildet' : 'Foreslå sletting'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Deleted images preview */}
              {edits.some(edit => edit.deleted) && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Markert for sletting ({edits.filter(e => e.deleted).length})
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {edits.filter(edit => edit.deleted).map(edit => {
                      const isOwner = edit.original_uploader_id === currentUserId
                      return (
                        <div key={edit.id} className="relative group">
                          <img
                            src={MediaService.getUrl(edit.storage_path, 'medium')}
                            alt=""
                            className="w-20 h-20 object-cover rounded opacity-50"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => updateEdit(edit.id, 'deleted', false)}
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                          >
                            Angre
                          </Button>
                          {!isOwner && (
                            <div className="absolute top-1 right-1 bg-amber-500 text-white text-xs px-1 rounded">
                              Forslag
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            <X className="w-4 h-4 mr-2" />
            Avbryt
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges() || saving || (changesNeedApproval && !reason.trim())}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Lagrer...' : 'Lagre alle endringer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
