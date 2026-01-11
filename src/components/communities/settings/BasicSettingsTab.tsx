'use client'

import { useState, useRef } from 'react'
import { Loader2, Upload, X, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { updateCommunity } from '@/lib/communities'
import { uploadImage } from '@/lib/imageUpload'
import { toast } from 'sonner'
import type { Community } from '@/lib/types/communities'
import { categoryLabels } from '@/lib/types/communities'

// Category icons mapping
import {
  Briefcase,
  Landmark,
  Users,
  Palette,
  GraduationCap,
  Building,
  CircleDot,
  Brush,
  Hammer,
  UtensilsCrossed,
  Wrench
} from 'lucide-react'

const categoryOptions: { value: string; icon: React.ReactNode }[] = [
  { value: 'organization', icon: <Building2 className="w-4 h-4" /> },
  { value: 'business', icon: <Briefcase className="w-4 h-4" /> },
  { value: 'association', icon: <Users className="w-4 h-4" /> },
  { value: 'cultural', icon: <Palette className="w-4 h-4" /> },
  { value: 'educational', icon: <GraduationCap className="w-4 h-4" /> },
  { value: 'institution', icon: <Landmark className="w-4 h-4" /> },
  { value: 'government', icon: <Building className="w-4 h-4" /> },
  { value: 'artist', icon: <Brush className="w-4 h-4" /> },
  { value: 'craftsperson', icon: <Hammer className="w-4 h-4" /> },
  { value: 'restaurant', icon: <UtensilsCrossed className="w-4 h-4" /> },
  { value: 'service_provider', icon: <Wrench className="w-4 h-4" /> },
  { value: 'other', icon: <CircleDot className="w-4 h-4" /> },
]

interface BasicSettingsTabProps {
  community: Community
  onUpdated: () => void
}

export function BasicSettingsTab({ community, onUpdated }: BasicSettingsTabProps) {
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  // Form state
  const [name, setName] = useState(community.name)
  const [description, setDescription] = useState(community.description || '')
  const [category, setCategory] = useState(community.category)
  const [logoUrl, setLogoUrl] = useState(community.logo_url || '')
  const [coverUrl, setCoverUrl] = useState(community.cover_image_url || '')

  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    try {
      const url = await uploadImage(file, 'communities', `${community.id}/logo`)
      if (url) {
        setLogoUrl(url)
        toast.success('Logo lastet opp')
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast.error('Kunne ikke laste opp logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingCover(true)
    try {
      const url = await uploadImage(file, 'communities', `${community.id}/cover`)
      if (url) {
        setCoverUrl(url)
        toast.success('Coverbilde lastet opp')
      }
    } catch (error) {
      console.error('Error uploading cover:', error)
      toast.error('Kunne ikke laste opp coverbilde')
    } finally {
      setUploadingCover(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Navn er påkrevd')
      return
    }

    setSaving(true)
    try {
      const success = await updateCommunity(community.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        logo_url: logoUrl || undefined,
        cover_image_url: coverUrl || undefined,
      })

      if (success) {
        toast.success('Innstillinger lagret')
        onUpdated()
      } else {
        toast.error('Kunne ikke lagre innstillinger')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Kunne ikke lagre innstillinger')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges =
    name !== community.name ||
    description !== (community.description || '') ||
    category !== community.category ||
    logoUrl !== (community.logo_url || '') ||
    coverUrl !== (community.cover_image_url || '')

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="space-y-2">
        <Label>Logo</Label>
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20 border-2 border-gray-200">
            <AvatarImage src={logoUrl || undefined} alt={name} />
            <AvatarFallback className="bg-gray-100 text-gray-500 text-2xl">
              {name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
            >
              {uploadingLogo ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Last opp logo
            </Button>
            {logoUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLogoUrl('')}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4 mr-2" />
                Fjern logo
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500">Anbefalt størrelse: 200x200 px</p>
      </div>

      {/* Cover image */}
      <div className="space-y-2">
        <Label>Coverbilde</Label>
        <div className="relative">
          <div
            className="h-32 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
            onClick={() => coverInputRef.current?.click()}
          >
            {coverUrl ? (
              <img
                src={coverUrl}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-400 flex flex-col items-center">
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-sm">Klikk for å laste opp</span>
              </div>
            )}
            {uploadingCover && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverUpload}
          />
          {coverUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCoverUrl('')}
              className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-500">Anbefalt størrelse: 1200x400 px</p>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Navn <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Navn på siden"
          maxLength={100}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Beskrivelse</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Fortell litt om siden..."
          maxLength={500}
          rows={4}
        />
        <p className="text-xs text-gray-500 text-right">
          {description.length}/500
        </p>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>Kategori</Label>
        <RadioGroup
          value={category}
          onValueChange={setCategory}
          className="grid grid-cols-2 gap-2"
        >
          {categoryOptions.map((option) => (
            <div key={option.value}>
              <RadioGroupItem
                value={option.value}
                id={`cat-${option.value}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`cat-${option.value}`}
                className="flex items-center gap-2 rounded-lg border-2 border-gray-200 p-3 cursor-pointer hover:bg-gray-50 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 transition-colors"
              >
                <span className="text-gray-500 peer-data-[state=checked]:text-blue-600">
                  {option.icon}
                </span>
                <span className="text-sm font-medium">
                  {categoryLabels[option.value]}
                </span>
              </Label>
            </div>
          ))}
        </RadioGroup>
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
