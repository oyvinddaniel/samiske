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
import { Loader2, Plus, Languages, MapPin, Building2 } from 'lucide-react'

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
}

export function SuggestChangeModal({
  open,
  onOpenChange,
  entityType,
  entity,
  suggestionType,
  parentId,
  onSuccess,
}: SuggestChangeModalProps) {
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(false)
  const [languageAreas, setLanguageAreas] = useState<LanguageArea[]>([])
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])

  // Form state
  const [name, setName] = useState('')
  const [nameSami, setNameSami] = useState('')
  const [selectedLanguageAreas, setSelectedLanguageAreas] = useState<string[]>([])
  const [selectedMunicipality, setSelectedMunicipality] = useState('')
  const [reason, setReason] = useState('')

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

  // Initialize form with existing data
  useEffect(() => {
    if (entity && suggestionType !== 'new_item') {
      setName(entity.name || '')
      setNameSami(entity.name_sami || '')

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

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Du må være innlogget for å foreslå endringer')
      return
    }

    // Input length validation
    const MAX_NAME_LENGTH = 255
    const MAX_REASON_LENGTH = 1000

    if (name.trim().length > MAX_NAME_LENGTH) {
      toast.error(`Navn kan ikke være lengre enn ${MAX_NAME_LENGTH} tegn`)
      return
    }

    if (nameSami.trim().length > MAX_NAME_LENGTH) {
      toast.error(`Samisk navn kan ikke være lengre enn ${MAX_NAME_LENGTH} tegn`)
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

    // Check for slug collision on new items
    if (suggestionType === 'new_item' && name.trim()) {
      const generatedSlug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-æøåä]/g, '')

      try {
        let collisionCheck

        if (entityType === 'language_area') {
          collisionCheck = await supabase
            .from('language_areas')
            .select('id')
            .eq('code', generatedSlug)
            .limit(1)
        } else if (entityType === 'municipality') {
          collisionCheck = await supabase
            .from('municipalities')
            .select('id')
            .eq('slug', generatedSlug)
            .limit(1)
        } else if (entityType === 'place') {
          const municipalityId = selectedMunicipality || parentId
          if (municipalityId) {
            collisionCheck = await supabase
              .from('places')
              .select('id')
              .eq('slug', generatedSlug)
              .eq('municipality_id', municipalityId)
              .limit(1)
          }
        }

        if (collisionCheck?.data && collisionCheck.data.length > 0) {
          toast.error('Dette navnet er allerede i bruk. Vennligst velg et annet navn.')
          return
        }
      } catch (error) {
        console.error('Error checking slug collision:', error)
        // Continue anyway - server-side constraints will catch duplicates
      }
    }

    setLoading(true)

    try {
      // Build suggested data based on suggestion type
      let suggestedData: Record<string, unknown> = {}
      let currentData: Record<string, unknown> | null = null

      if (suggestionType === 'new_item') {
        suggestedData = {
          name: name.trim(),
          name_sami: nameSami.trim() || null,
          slug: name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-æøåä]/g, ''),
        }

        if (entityType === 'municipality') {
          suggestedData.language_area_ids = selectedLanguageAreas
        }
        if (entityType === 'place') {
          suggestedData.municipality_id = selectedMunicipality || parentId
        }
      } else if (suggestionType === 'edit_name') {
        suggestedData = {
          name: name.trim(),
          name_sami: nameSami.trim() || null,
        }
        if (entity) {
          currentData = {
            name: entity.name,
            name_sami: entity.name_sami,
          }
        }
      } else if (suggestionType === 'edit_relationship') {
        if (entityType === 'municipality') {
          suggestedData = {
            language_area_ids: selectedLanguageAreas,
          }
          if (entity) {
            const muni = entity as Municipality
            currentData = {
              language_area_id: muni.language_area_id,
            }
          }
        }
        if (entityType === 'place') {
          suggestedData = {
            municipality_id: selectedMunicipality,
          }
          if (entity) {
            const place = entity as Place
            currentData = {
              municipality_id: place.municipality_id,
            }
          }
        }
      }

      const { error } = await supabase.from('geography_suggestions').insert({
        user_id: user.id,
        suggestion_type: suggestionType,
        entity_type: entityType,
        entity_id: entity?.id || null,
        suggested_data: suggestedData,
        current_data: currentData,
        reason: reason.trim() || null,
      })

      if (error) throw error

      toast.success('Forslag sendt! Admin vil vurdere det.')
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error submitting suggestion:', error)
      toast.error('Kunne ikke sende forslag')
    } finally {
      setLoading(false)
    }
  }

  const getTitle = () => {
    if (suggestionType === 'new_item') {
      switch (entityType) {
        case 'language_area': return 'Foreslå nytt språkområde'
        case 'municipality': return 'Foreslå ny kommune'
        case 'place': return 'Foreslå ny by/sted'
      }
    }
    if (suggestionType === 'edit_name') {
      return `Foreslå navneendring: ${entity?.name || ''}`
    }
    if (suggestionType === 'edit_relationship') {
      return `Foreslå tilknytning: ${entity?.name || ''}`
    }
    return 'Foreslå endring'
  }

  const getDescription = () => {
    if (suggestionType === 'new_item') {
      return 'Forslaget sendes til admin for godkjenning før det legges til.'
    }
    return 'Endringen må godkjennes av admin før den trer i kraft.'
  }

  const getIcon = () => {
    switch (entityType) {
      case 'language_area': return <Languages className="w-5 h-5 text-blue-600" />
      case 'municipality': return <Building2 className="w-5 h-5 text-orange-600" />
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

        <div className="space-y-4 py-4">
          {/* Name fields - shown for new_item and edit_name */}
          {(suggestionType === 'new_item' || suggestionType === 'edit_name') && (
            <>
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
            </>
          )}

          {/* Language area selection - for municipalities */}
          {(entityType === 'municipality' && (suggestionType === 'new_item' || suggestionType === 'edit_relationship')) && (
            <div className="space-y-2">
              <Label>Språkområde(r)</Label>
              <p className="text-xs text-gray-500 mb-2">
                En kommune kan tilhøre flere språkområder
              </p>
              <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                {languageAreas.map((area) => (
                  <div key={area.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`area-${area.id}`}
                      checked={selectedLanguageAreas.includes(area.id)}
                      onCheckedChange={() => handleLanguageAreaToggle(area.id)}
                    />
                    <label
                      htmlFor={`area-${area.id}`}
                      className="text-sm flex items-center gap-2 cursor-pointer"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: area.color }}
                      />
                      {area.name}
                      {area.name_sami && (
                        <span className="text-gray-500">({area.name_sami})</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Municipality selection - for places */}
          {(entityType === 'place' && (suggestionType === 'new_item' || suggestionType === 'edit_relationship')) && (
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
            </div>
          )}

          {/* Language area selection - for places (multiple) */}
          {(entityType === 'place' && suggestionType === 'new_item') && (
            <div className="space-y-2">
              <Label>Språkområde(r) (valgfritt)</Label>
              <p className="text-xs text-gray-500 mb-2">
                Stedet arver normalt fra kommunen, men kan også knyttes direkte
              </p>
              <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
                {languageAreas.map((area) => (
                  <div key={area.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`place-area-${area.id}`}
                      checked={selectedLanguageAreas.includes(area.id)}
                      onCheckedChange={() => handleLanguageAreaToggle(area.id)}
                    />
                    <label
                      htmlFor={`place-area-${area.id}`}
                      className="text-sm flex items-center gap-2 cursor-pointer"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: area.color }}
                      />
                      {area.name}
                    </label>
                  </div>
                ))}
              </div>
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
            <Plus className="w-4 h-4 mr-2" />
            Send forslag
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
