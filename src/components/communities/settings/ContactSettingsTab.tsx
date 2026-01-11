'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateCommunity } from '@/lib/communities'
import { toast } from 'sonner'
import type { Community } from '@/lib/types/communities'

interface ContactSettingsTabProps {
  community: Community
  onUpdated: () => void
}

export function ContactSettingsTab({ community, onUpdated }: ContactSettingsTabProps) {
  const [saving, setSaving] = useState(false)

  // Form state
  const [email, setEmail] = useState(community.email || '')
  const [phone, setPhone] = useState(community.phone || '')
  const [website, setWebsite] = useState(community.website_url || '')
  const [address, setAddress] = useState(community.address || '')

  const handleSave = async () => {
    // Validate email if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Ugyldig e-postadresse')
      return
    }

    // Validate website if provided
    if (website && !website.startsWith('http://') && !website.startsWith('https://')) {
      toast.error('Nettside må starte med http:// eller https://')
      return
    }

    setSaving(true)
    try {
      const success = await updateCommunity(community.id, {
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        website_url: website.trim() || undefined,
        address: address.trim() || undefined,
      })

      if (success) {
        toast.success('Kontaktinformasjon lagret')
        onUpdated()
      } else {
        toast.error('Kunne ikke lagre kontaktinformasjon')
      }
    } catch (error) {
      console.error('Error saving contact settings:', error)
      toast.error('Kunne ikke lagre kontaktinformasjon')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges =
    email !== (community.email || '') ||
    phone !== (community.phone || '') ||
    website !== (community.website_url || '') ||
    address !== (community.address || '')

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Kontaktinformasjon</h3>
        <p className="text-sm text-gray-500">
          Denne informasjonen vises offentlig på siden din.
        </p>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">E-post</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="kontakt@eksempel.no"
        />
        <p className="text-xs text-gray-500">
          Besøkende kan bruke denne e-posten for å kontakte dere.
        </p>
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">Telefon</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+47 123 45 678"
        />
      </div>

      {/* Website */}
      <div className="space-y-2">
        <Label htmlFor="website">Nettside</Label>
        <Input
          id="website"
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://eksempel.no"
        />
        <p className="text-xs text-gray-500">
          Lenke til din hovedside eller nettbutikk.
        </p>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">Adresse</Label>
        <Textarea
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Gateadresse&#10;Postnummer Sted"
          rows={3}
        />
        <p className="text-xs text-gray-500">
          Fysisk adresse for besøkende eller leveranser.
        </p>
      </div>

      {/* Save button */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={saving || !hasChanges}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Lagrer...
            </>
          ) : (
            'Lagre endringer'
          )}
        </Button>
      </div>
    </div>
  )
}
