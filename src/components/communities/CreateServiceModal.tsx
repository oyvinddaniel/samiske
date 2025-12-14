'use client'

import { useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { createService } from '@/lib/services'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { ServicePriceType } from '@/lib/types/services'
import { servicePriceTypeLabels } from '@/lib/types/services'

interface CreateServiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  communityId: string
  onCreated?: () => void
}

export function CreateServiceModal({
  open,
  onOpenChange,
  communityId,
  onCreated
}: CreateServiceModalProps) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('NOK')
  const [priceType, setPriceType] = useState<ServicePriceType>('contact')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [bookingUrl, setBookingUrl] = useState('')
  const [isOnline, setIsOnline] = useState(false)
  const [searchTags, setSearchTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  const resetForm = () => {
    setName('')
    setDescription('')
    setPrice('')
    setCurrency('NOK')
    setPriceType('contact')
    setContactEmail('')
    setContactPhone('')
    setBookingUrl('')
    setIsOnline(false)
    setSearchTags([])
    setTagInput('')
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !searchTags.includes(tagInput.trim())) {
      setSearchTags([...searchTags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setSearchTags(searchTags.filter(t => t !== tag))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Tjenestenavn er påkrevd')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Du må være innlogget')
        return
      }

      const result = await createService(communityId, user.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        price: price ? parseFloat(price) : undefined,
        currency,
        price_type: priceType,
        contact_email: contactEmail.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
        booking_url: bookingUrl.trim() || undefined,
        is_online: isOnline,
        search_tags: searchTags.length > 0 ? searchTags : undefined,
      })

      if (result.success) {
        toast.success('Tjeneste opprettet!')
        onOpenChange(false)
        resetForm()
        if (onCreated) onCreated()
      } else {
        toast.error(result.error || 'Kunne ikke opprette tjeneste')
      }
    } catch (error) {
      console.error('Error creating service:', error)
      toast.error('Noe gikk galt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Legg til tjeneste</DialogTitle>
            <DialogDescription>
              Vis frem tjenester samfunnet tilbyr
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="service-name">
                Tjenestenavn <span className="text-red-500">*</span>
              </Label>
              <Input
                id="service-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="F.eks. Joik-opplæring"
                maxLength={100}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="service-description">Beskrivelse</Label>
              <Textarea
                id="service-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beskriv tjenesten..."
                maxLength={1000}
                rows={4}
              />
            </div>

            {/* Price */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service-price">Pris</Label>
                <Input
                  id="service-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-currency">Valuta</Label>
                <Input
                  id="service-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="NOK"
                  maxLength={3}
                />
              </div>
            </div>

            {/* Price Type */}
            <div className="space-y-2">
              <Label>Pris-type</Label>
              <RadioGroup
                value={priceType}
                onValueChange={(value) => setPriceType(value as ServicePriceType)}
                className="grid grid-cols-2 gap-2"
              >
                {(['fixed', 'from', 'hourly', 'contact'] as ServicePriceType[]).map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <RadioGroupItem value={type} id={`price-${type}`} />
                    <Label htmlFor={`price-${type}`} className="font-normal cursor-pointer">
                      {servicePriceTypeLabels[type]}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-email">Kontakt e-post</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="kontakt@eksempel.no"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Kontakt telefon</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+47 123 45 678"
                />
              </div>
            </div>

            {/* Booking URL */}
            <div className="space-y-2">
              <Label htmlFor="booking-url">Bookinglenke</Label>
              <Input
                id="booking-url"
                type="url"
                value={bookingUrl}
                onChange={(e) => setBookingUrl(e.target.value)}
                placeholder="https://booking.eksempel.no"
              />
              <p className="text-xs text-gray-500">
                Lenke til ekstern bookingside eller kalender
              </p>
            </div>

            {/* Online */}
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                id="is-online"
                checked={isOnline}
                onChange={(e) => setIsOnline(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="is-online" className="font-normal cursor-pointer">
                Tjenesten tilbys online/eksternt
              </Label>
            </div>

            {/* Search Tags */}
            <div className="space-y-2">
              <Label htmlFor="search-tags">Søkeord (for bedre søk)</Label>
              <div className="flex gap-2">
                <Input
                  id="search-tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  placeholder="Legg til søkeord..."
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {searchTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {searchTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="pl-3 pr-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 rounded-full hover:bg-gray-300 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500">
                Synonymer og alternative navn som hjelper folk å finne tjenesten
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
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Oppretter...
                </>
              ) : (
                'Opprett tjeneste'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
