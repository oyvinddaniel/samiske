'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { GeographySearchInput, type GeographySelection } from '@/components/geography'
import { MapPin, ImageIcon } from 'lucide-react'
import { PostData } from './types'
import { EditPostImagesDialog } from './EditPostImagesDialog'

interface EditPostDialogProps {
  postData: PostData
  editTitle: string
  editContent: string
  editEventDate: string
  editEventTime: string
  editEventLocation: string
  editGeography: GeographySelection | null
  saving: boolean
  onEditTitleChange: (value: string) => void
  onEditContentChange: (value: string) => void
  onEditEventDateChange: (value: string) => void
  onEditEventTimeChange: (value: string) => void
  onEditEventLocationChange: (value: string) => void
  onEditGeographyChange: (value: GeographySelection | null) => void
  onSave: () => void
  onCancel: () => void
  onImagesUpdated?: () => void
}

export function EditPostDialog({
  postData,
  editTitle,
  editContent,
  editEventDate,
  editEventTime,
  editEventLocation,
  editGeography,
  saving,
  onEditTitleChange,
  onEditContentChange,
  onEditEventDateChange,
  onEditEventTimeChange,
  onEditEventLocationChange,
  onEditGeographyChange,
  onSave,
  onCancel,
  onImagesUpdated,
}: EditPostDialogProps) {
  const [showImageEditor, setShowImageEditor] = useState(false)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="editTitleMobile">Tittel</Label>
        <Input
          id="editTitleMobile"
          value={editTitle}
          onChange={(e) => onEditTitleChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="editContentMobile">Innhold</Label>
        <Textarea
          id="editContentMobile"
          value={editContent}
          onChange={(e) => onEditContentChange(e.target.value)}
          rows={5}
        />
      </div>
      {postData.type === 'event' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="editEventDateMobile">Dato</Label>
            <Input
              id="editEventDateMobile"
              type="date"
              value={editEventDate}
              onChange={(e) => onEditEventDateChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editEventTimeMobile">Tidspunkt</Label>
            <Input
              id="editEventTimeMobile"
              type="time"
              value={editEventTime}
              onChange={(e) => onEditEventTimeChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editEventLocationMobile">Arrangementssted</Label>
            <Input
              id="editEventLocationMobile"
              value={editEventLocation}
              onChange={(e) => onEditEventLocationChange(e.target.value)}
              placeholder="F.eks. Studentersamfundet"
            />
          </div>
        </>
      )}
      {/* Geography */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          Geografisk tilknytning
        </Label>
        <GeographySearchInput
          value={editGeography}
          onChange={onEditGeographyChange}
          placeholder="Søk etter sted, kommune eller språkområde..."
        />
      </div>

      {/* Edit Images Button */}
      {postData.images && postData.images.length > 0 && (
        <div className="space-y-2">
          <Label>Bilder</Label>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowImageEditor(true)}
            className="w-full"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Rediger bilder ({postData.images.length})
          </Button>
        </div>
      )}

      {/* Image Editor Dialog */}
      {showImageEditor && postData.images && (
        <EditPostImagesDialog
          postId={postData.id}
          images={postData.images}
          open={showImageEditor}
          onClose={() => setShowImageEditor(false)}
          onImagesUpdated={onImagesUpdated || (() => {})}
        />
      )}

      <div className="flex gap-2 pt-2">
        <Button onClick={onSave} disabled={saving} className="flex-1">
          {saving ? 'Lagrer...' : 'Lagre endringer'}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Avbryt
        </Button>
      </div>
    </div>
  )
}
