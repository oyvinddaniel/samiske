'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Plus, Languages, MapPin, Building2, Upload, X } from 'lucide-react'
import Image from 'next/image'

interface LanguageArea {
  id: string
  name: string
  name_sami: string | null
  color?: string
}

interface Municipality {
  id: string
  name: string
  name_sami: string | null
  slug: string
  country_id?: string
  language_area_id: string | null
}

interface Place {
  id: string
  name: string
  name_sami: string | null
  slug: string
  municipality_id: string
}

type EntityType = 'language_area' | 'municipality' | 'place'
type SuggestionType = 'new_item' | 'edit_name' | 'edit_relationship'

interface SuggestChangeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: EntityType
  entity?: LanguageArea | Municipality | Place | null
  suggestionType: SuggestionType
  parentId?: string // For new items - which parent to attach to
  onSuccess?: () => void
  onAddMunicipality?: () => void // Callback to open "add municipality" modal
}

interface GeographyImage {
  id: string
  image_url: string
  caption: string | null
  sort_order: number
}

export function SuggestChangeModal({
  open,
  onOpenChange,
  entityType,
  entity,
  suggestionType,
  parentId,
  onSuccess,
  onAddMunicipality,
}: SuggestChangeModalProps) {
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(false)
  const [languageAreas, setLanguageAreas] = useState<LanguageArea[]>([])
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])

  // Form state
  const [name, setName] = useState('')
  const [nameSami, setNameSami] = useState('')
  const [description, setDescription] = useState('')
  const [selectedLanguageAreas, setSelectedLanguageAreas] = useState<string[]>([])
  const [selectedMunicipality, setSelectedMunicipality] = useState('')
  const [reason, setReason] = useState('')

  // Image state
  const [images, setImages] = useState<GeographyImage[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Fetch current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getUser()
  }, [supabase])

  // Fetch language areas and municipalities for selects
  useEffect(() => {
    const fetchData = async () => {
      const [areasResult, munisResult] = await Promise.all([
        supabase.from('language_areas').select('*').order('name'),
        supabase.from('municipalities').select('*').order('name'),
      ])
      if (areasResult.data) setLanguageAreas(areasResult.data)
      if (munisResult.data) setMunicipalities(munisResult.data)
    }
    if (open) fetchData()
  }, [open, supabase])

  // Fetch images for existing entity
  useEffect(() => {
    const fetchImages = async () => {
      if (!entity || suggestionType === 'new_item') {
        setImages([])
        return
      }

      const column = entityType === 'language_area' ? 'language_area_id' :
                     entityType === 'municipality' ? 'municipality_id' : 'place_id'

      const { data } = await supabase
        .from('geography_images')
        .select('*')
        .eq(column, entity.id)
        .order('sort_order')
        .limit(5)

      if (data) setImages(data)
    }
    if (open) fetchImages()
  }, [open, entity, entityType, suggestionType, supabase])

  // Initialize form with existing data
  useEffect(() => {
    if (entity && suggestionType !== 'new_item') {
      setName(entity.name || '')
      setNameSami(entity.name_sami || '')
      setDescription((entity as any).description || '')

      if (entityType === 'municipality') {
        const muni = entity as Municipality
        if (muni.language_area_id) {
          setSelectedLanguageAreas([muni.language_area_id])
        }
      }
      if (entityType === 'place') {
        const place = entity as Place
        setSelectedMunicipality(place.municipality_id || '')
      }
    } else {
      // Reset for new item
      setName('')
      setNameSami('')
      setDescription('')
      setSelectedLanguageAreas([])
      setSelectedMunicipality(parentId || '')
    }
    setReason('')
  }, [entity, entityType, suggestionType, parentId])

  const handleLanguageAreaToggle = (areaId: string) => {
    setSelectedLanguageAreas(prev =>
      prev.includes(areaId)
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    )
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUserId || !entity) return

    if (images.length >= 5) {
      toast.error('Maks 5 bilder per sted')
      return
    }

    setUploadingImage(true)

    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${entityType}/${entity.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('geography-images')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('geography-images')
        .getPublicUrl(fileName)

      // Save to database
      const column = entityType === 'language_area' ? 'language_area_id' :
                     entityType === 'municipality' ? 'municipality_id' : 'place_id'

      const { error: dbError } = await supabase.from('geography_images').insert({
        [column]: entity.id,
        image_url: publicUrl,
        uploaded_by: currentUserId,
        sort_order: images.length,
      })

      if (dbError) throw dbError

      toast.success('Bilde lastet opp')

      // Refresh images
      const { data } = await supabase
        .from('geography_images')
        .select('*')
        .eq(column, entity.id)
        .order('sort_order')
        .limit(5)

      if (data) setImages(data)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Kunne ikke laste opp bilde')
    } finally {
      setUploadingImage(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Du må være innlogget for å redigere')
      return
    }

    // Input length validation
    const MAX_NAME_LENGTH = 255
    const MAX_DESCRIPTION_LENGTH = 2000
    const MAX_REASON_LENGTH = 1000

    if (name.trim().length > MAX_NAME_LENGTH) {
      toast.error(`Navn kan ikke være lengre enn ${MAX_NAME_LENGTH} tegn`)
      return
    }

    if (nameSami.trim().length > MAX_NAME_LENGTH) {
      toast.error(`Samisk navn kan ikke være lengre enn ${MAX_NAME_LENGTH} tegn`)
      return
    }

    if (description.trim().length > MAX_DESCRIPTION_LENGTH) {
      toast.error(`Beskrivelse kan ikke være lengre enn ${MAX_DESCRIPTION_LENGTH} tegn`)
      return
    }

    if (reason.trim().length > MAX_REASON_LENGTH) {
      toast.error(`Begrunnelse kan ikke være lengre enn ${MAX_REASON_LENGTH} tegn`)
      return
    }

    // Validation
    if (suggestionType === 'new_item' && !name.trim()) {
      toast.error('Navn er påkrevd')
      return
    }

    if (suggestionType === 'edit_name' && !name.trim() && !nameSami.trim()) {
      toast.error('Minst ett navn må fylles ut')
      return
    }

    if (suggestionType === 'edit_relationship') {
      if (entityType === 'municipality' && selectedLanguageAreas.length === 0) {
        toast.error('Velg minst ett språkområde')
        return
      }
      if (entityType === 'place' && !selectedMunicipality) {
        toast.error('Velg en kommune')
        return
      }
    }

    setLoading(true)

    try {
      let resultId: string | null = null
      let suggestedData: Record<string, unknown> = {}
      let currentData: Record<string, unknown> | null = null

      // NEW ITEM - Create directly in database
      if (suggestionType === 'new_item') {
        const generatedSlug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-æøåä]/g, '')

        if (entityType === 'language_area') {
          const { data, error } = await supabase.from('language_areas').insert({
            name: name.trim(),
            name_sami: nameSami.trim() || null,
            code: generatedSlug,
            description: description.trim() || null,
            sort_order: 999 // Admin can reorder
          }).select().single()

          if (error) throw error
          resultId = data.id
          suggestedData = { name: name.trim(), name_sami: nameSami.trim() || null, description: description.trim() || null }
        }
        else if (entityType === 'municipality') {
          // Get first available country as default (Norway)
          const { data: countries } = await supabase.from('countries').select('id').eq('code', 'NO').limit(1)
          const defaultCountryId = countries?.[0]?.id || null

          const { data, error } = await supabase.from('municipalities').insert({
            name: name.trim(),
            name_sami: nameSami.trim() || null,
            slug: generatedSlug,
            description: description.trim() || null,
            language_area_id: selectedLanguageAreas[0] || null,
            country_id: defaultCountryId
          }).select().single()

          if (error) throw error
          resultId = data.id
          suggestedData = { name: name.trim(), name_sami: nameSami.trim() || null, description: description.trim() || null, language_area_id: selectedLanguageAreas[0] }
        }
        else if (entityType === 'place') {
          const { data, error } = await supabase.from('places').insert({
            name: name.trim(),
            name_sami: nameSami.trim() || null,
            slug: generatedSlug,
            description: description.trim() || null,
            municipality_id: selectedMunicipality || parentId,
            created_by: user.id
          }).select().single()

          if (error) throw error
          resultId = data.id
          suggestedData = { name: name.trim(), name_sami: nameSami.trim() || null, description: description.trim() || null, municipality_id: selectedMunicipality || parentId }
        }
      }
      // EDIT NAME - Update directly (includes description and relationships)
      else if (suggestionType === 'edit_name') {
        if (!entity) throw new Error('No entity to update')

        currentData = {
          name: entity.name,
          name_sami: entity.name_sami,
          description: (entity as any).description
        }

        suggestedData = {
          name: name.trim(),
          name_sami: nameSami.trim() || null,
          description: description.trim() || null
        }

        // Update name, description, and relationships
        if (entityType === 'municipality') {
          currentData.language_area_id = (entity as Municipality).language_area_id
          suggestedData.language_area_id = selectedLanguageAreas[0] || null

          const { error } = await supabase
            .from('municipalities')
            .update({
              name: name.trim(),
              name_sami: nameSami.trim() || null,
              description: description.trim() || null,
              language_area_id: selectedLanguageAreas[0] || null
            })
            .eq('id', entity.id)

          if (error) throw error
        } else if (entityType === 'place') {
          currentData.municipality_id = (entity as Place).municipality_id
          suggestedData.municipality_id = selectedMunicipality

          const { error } = await supabase
            .from('places')
            .update({
              name: name.trim(),
              name_sami: nameSami.trim() || null,
              description: description.trim() || null,
              municipality_id: selectedMunicipality
            })
            .eq('id', entity.id)

          if (error) throw error
        } else {
          // Language area - no relationships to update
          const { error } = await supabase
            .from('language_areas')
            .update({
              name: name.trim(),
              name_sami: nameSami.trim() || null,
              description: description.trim() || null
            })
            .eq('id', entity.id)

          if (error) throw error
        }

        resultId = entity.id
      }
      // EDIT RELATIONSHIP - Update directly
      else if (suggestionType === 'edit_relationship') {
        if (!entity) throw new Error('No entity to update')

        if (entityType === 'municipality') {
          currentData = { language_area_id: (entity as Municipality).language_area_id }
          suggestedData = { language_area_id: selectedLanguageAreas[0] || null }

          const { error } = await supabase
            .from('municipalities')
            .update({ language_area_id: selectedLanguageAreas[0] || null })
            .eq('id', entity.id)

          if (error) throw error
        }
        else if (entityType === 'place') {
          currentData = { municipality_id: (entity as Place).municipality_id }
          suggestedData = { municipality_id: selectedMunicipality }

          const { error } = await supabase
            .from('places')
            .update({ municipality_id: selectedMunicipality })
            .eq('id', entity.id)

          if (error) throw error
        }
        resultId = entity.id
      }

      // Log to geography_suggestions for admin reference (with auto-approved status)
      await supabase.from('geography_suggestions').insert({
        user_id: user.id,
        suggestion_type: suggestionType,
        entity_type: entityType,
        entity_id: resultId,
        suggested_data: suggestedData,
        current_data: currentData,
        reason: reason.trim() || null,
        status: 'approved', // Auto-approved
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id // Self-approved for logging
      })

      toast.success(suggestionType === 'new_item' ? 'Opprettet!' : 'Endringer lagret!')
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      console.error('Error saving changes:', error)
      if (error.code === '23505') {
        toast.error('Dette navnet er allerede i bruk')
      } else {
        toast.error('Kunne ikke lagre endringer')
      }
    } finally {
      setLoading(false)
    }
  }

  const getTitle = () => {
    if (suggestionType === 'new_item') {
      switch (entityType) {
        case 'language_area': return 'Legg til nytt språkområde'
        case 'municipality': return 'Legg til ny kommune'
        case 'place': return 'Legg til ny by/sted'
      }
    }
    if (suggestionType === 'edit_name') {
      return `Rediger: ${entity?.name || ''}`
    }
    if (suggestionType === 'edit_relationship') {
      return `Endre tilknytning: ${entity?.name || ''}`
    }
    return 'Rediger'
  }

  const getDescription = () => {
    if (suggestionType === 'new_item') {
      return 'Endringen lagres umiddelbart og admin får beskjed.'
    }
    return 'Endringen lagres umiddelbart og admin får beskjed.'
  }

  const getIcon = () => {
    switch (entityType) {
      case 'language_area': return <MapPin className="w-5 h-5 text-blue-600" />
      case 'municipality': return <MapPin className="w-5 h-5 text-orange-600" />
      case 'place': return <MapPin className="w-5 h-5 text-purple-600" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          {/* Name and description fields */}
          <div className="space-y-2">
            <Label htmlFor="name">Navn (norsk)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="F.eks. Kautokeino"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nameSami">Navn (samisk)</Label>
            <Input
              id="nameSami"
              value={nameSami}
              onChange={(e) => setNameSami(e.target.value)}
              placeholder="F.eks. Guovdageaidnu"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse (valgfritt)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="En kort beskrivelse av stedet..."
              rows={3}
            />
          </div>

          {/* Images section - only for existing entities */}
          {suggestionType !== 'new_item' && entity && (
            <div className="space-y-2">
              <Label>Bilder ({images.length}/5)</Label>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {images.map((img) => (
                    <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={img.image_url}
                        alt={img.caption || name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
              {currentUserId && images.length < 5 && (
                <label className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer transition-colors">
                  {uploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  ) : (
                    <Upload className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-600">
                    {uploadingImage ? 'Laster opp...' : 'Last opp bilde'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              )}
            </div>
          )}

          {/* Language area selection - for municipalities (multi-select) */}
          {entityType === 'municipality' && (
            <div className="space-y-2">
              <Label>Språkområder</Label>
              <p className="text-xs text-gray-500 mb-2">
                Velg hvilke språkområder kommunen tilhører (kan velge flere)
              </p>
              <div className="space-y-2 border rounded-lg p-3 max-h-48 overflow-y-auto">
                {languageAreas.map((area) => (
                  <div key={area.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`lang-${area.id}`}
                      checked={selectedLanguageAreas.includes(area.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedLanguageAreas([...selectedLanguageAreas, area.id])
                        } else {
                          setSelectedLanguageAreas(selectedLanguageAreas.filter(id => id !== area.id))
                        }
                      }}
                    />
                    <label
                      htmlFor={`lang-${area.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {area.name}
                      {area.name_sami && ` (${area.name_sami})`}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Municipality selection - for places */}
          {entityType === 'place' && (
            <div className="space-y-2">
              <Label>Kommune</Label>
              <Select value={selectedMunicipality} onValueChange={setSelectedMunicipality}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg kommune" />
                </SelectTrigger>
                <SelectContent>
                  {municipalities.map((muni) => (
                    <SelectItem key={muni.id} value={muni.id}>
                      {muni.name}
                      {muni.name_sami && ` (${muni.name_sami})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {onAddMunicipality && municipalities.length === 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onAddMunicipality}
                  className="w-full mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Legg til kommunen din
                </Button>
              )}
              {onAddMunicipality && municipalities.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onAddMunicipality}
                  className="w-full mt-2 text-blue-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Finner du ikke kommunen? Legg til ny kommune
                </Button>
              )}
            </div>
          )}

          {/* Reason/description */}
          <div className="space-y-2">
            <Label htmlFor="reason">Begrunnelse (valgfritt)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Hvorfor foreslår du denne endringen?"
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {suggestionType === 'new_item' ? 'Opprett' : 'Lagre endringer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
