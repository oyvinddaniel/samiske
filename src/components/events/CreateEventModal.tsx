'use client'

import { useState } from 'react'
import { Loader2, Calendar, Upload, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  createCommunityEvent,
  uploadCommunityEventImage,
  type CommunityEvent
} from '@/lib/communityEvents'
import { toast } from 'sonner'

interface CreateEventModalProps {
  communityId: string
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onEventCreated?: (event: CommunityEvent) => void
}

export function CreateEventModal({
  communityId,
  userId,
  open,
  onOpenChange,
  onEventCreated
}: CreateEventModalProps) {
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [isAllDay, setIsAllDay] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [registrationRequired, setRegistrationRequired] = useState(false)
  const [registrationUrl, setRegistrationUrl] = useState('')
  const [attendeeLimit, setAttendeeLimit] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('NOK')

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setLocation('')
    setStartsAt('')
    setEndsAt('')
    setIsAllDay(false)
    setImageUrl('')
    setExternalUrl('')
    setRegistrationRequired(false)
    setRegistrationUrl('')
    setAttendeeLimit('')
    setPrice('')
    setCurrency('NOK')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vennligst last opp et bilde')
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Bildet er for stort (maks 5MB)')
      return
    }

    setUploading(true)
    try {
      const url = await uploadCommunityEventImage(communityId, file)
      if (url) {
        setImageUrl(url)
        toast.success('Bilde lastet opp')
      } else {
        toast.error('Kunne ikke laste opp bilde')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Kunne ikke laste opp bilde')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Tittel er påkrevd')
      return
    }

    if (!startsAt) {
      toast.error('Starttidspunkt er påkrevd')
      return
    }

    // Validate dates
    if (endsAt && new Date(endsAt) < new Date(startsAt)) {
      toast.error('Sluttidspunkt kan ikke være før starttidspunkt')
      return
    }

    setSaving(true)
    try {
      const event = await createCommunityEvent(communityId, userId, {
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        starts_at: startsAt,
        ends_at: endsAt || undefined,
        is_all_day: isAllDay,
        image_url: imageUrl || undefined,
        external_url: externalUrl.trim() || undefined,
        registration_required: registrationRequired,
        registration_url: registrationUrl.trim() || undefined,
        attendee_limit: attendeeLimit ? parseInt(attendeeLimit) : undefined,
        price: price ? parseFloat(price) : undefined,
        currency
      })

      if (event) {
        toast.success('Arrangement opprettet')
        resetForm()
        onOpenChange(false)
        if (onEventCreated) onEventCreated(event)
      } else {
        toast.error('Kunne ikke opprette arrangement')
      }
    } catch (error) {
      console.error('Error creating event:', error)
      toast.error('Kunne ikke opprette arrangement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Opprett nytt arrangement
          </DialogTitle>
          <DialogDescription>
            Legg til et arrangement i samfunnets kalender
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Tittel *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Navn på arrangementet"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beskriv arrangementet..."
              rows={4}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Sted</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Hvor arrangementet finner sted"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="starts-at">Starter *</Label>
              <Input
                id="starts-at"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ends-at">Slutter</Label>
              <Input
                id="ends-at"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>

          {/* All day checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="all-day"
              checked={isAllDay}
              onCheckedChange={(checked) => setIsAllDay(checked as boolean)}
            />
            <Label htmlFor="all-day" className="cursor-pointer">
              Heldagsarrangement
            </Label>
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <Label htmlFor="image">Bilde</Label>
            <div className="flex gap-2">
              <Input
                id="image"
                type="file"
                onChange={handleFileUpload}
                accept="image/*"
                disabled={uploading}
              />
              {uploading && <Loader2 className="w-5 h-5 animate-spin" />}
            </div>
            {imageUrl && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Bilde lastet opp
              </p>
            )}
          </div>

          {/* External URL */}
          <div className="space-y-2">
            <Label htmlFor="external-url">Ekstern lenke</Label>
            <Input
              id="external-url"
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Registration */}
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-medium">Påmelding</h4>

            <div className="flex items-center gap-2">
              <Checkbox
                id="registration-required"
                checked={registrationRequired}
                onCheckedChange={(checked) => setRegistrationRequired(checked as boolean)}
              />
              <Label htmlFor="registration-required" className="cursor-pointer">
                Krever påmelding
              </Label>
            </div>

            {registrationRequired && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="registration-url">Påmeldingslenke (valgfritt)</Label>
                  <Input
                    id="registration-url"
                    type="url"
                    value={registrationUrl}
                    onChange={(e) => setRegistrationUrl(e.target.value)}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-gray-500">
                    La stå tom for å bruke intern påmelding
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attendee-limit">Maks antall deltakere</Label>
                  <Input
                    id="attendee-limit"
                    type="number"
                    min="1"
                    value={attendeeLimit}
                    onChange={(e) => setAttendeeLimit(e.target.value)}
                    placeholder="Ubegrenset"
                  />
                </div>
              </>
            )}
          </div>

          {/* Price */}
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-medium">Pris</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Pris</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0 for gratis"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Valuta</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOK">NOK</SelectItem>
                    <SelectItem value="SEK">SEK</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={saving || uploading}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Oppretter...
                </>
              ) : (
                'Opprett arrangement'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
