'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PostData } from './types'

interface EditPostDialogProps {
  postData: PostData
  editTitle: string
  editContent: string
  editEventDate: string
  editEventTime: string
  editEventLocation: string
  saving: boolean
  onEditTitleChange: (value: string) => void
  onEditContentChange: (value: string) => void
  onEditEventDateChange: (value: string) => void
  onEditEventTimeChange: (value: string) => void
  onEditEventLocationChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
}

export function EditPostDialog({
  postData,
  editTitle,
  editContent,
  editEventDate,
  editEventTime,
  editEventLocation,
  saving,
  onEditTitleChange,
  onEditContentChange,
  onEditEventDateChange,
  onEditEventTimeChange,
  onEditEventLocationChange,
  onSave,
  onCancel,
}: EditPostDialogProps) {
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
            <Label htmlFor="editEventLocationMobile">Sted</Label>
            <Input
              id="editEventLocationMobile"
              value={editEventLocation}
              onChange={(e) => onEditEventLocationChange(e.target.value)}
            />
          </div>
        </>
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
