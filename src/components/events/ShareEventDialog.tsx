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
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Loader2, Share2, Globe, Languages, Building2, X } from 'lucide-react'

interface LanguageArea {
  id: string
  name: string
  code: string
  color?: string
}

interface Municipality {
  id: string
  name: string
  name_sami: string | null
}

interface ExistingShare {
  id: string
  language_area_id: string | null
  municipality_id: string | null
  share_to_sapmi: boolean
}

interface ShareEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  postId: string
  currentMunicipalityId?: string | null
  currentLanguageAreaId?: string | null
  onSuccess?: () => void
}

export function ShareEventDialog({
  open,
  onOpenChange,
  postId,
  currentMunicipalityId,
  currentLanguageAreaId,
  onSuccess,
}: ShareEventDialogProps) {
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [languageAreas, setLanguageAreas] = useState<LanguageArea[]>([])
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [existingShares, setExistingShares] = useState<ExistingShare[]>([])

  // Selection state
  const [selectedLanguageAreas, setSelectedLanguageAreas] = useState<string[]>([])
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([])
  const [shareToSapmi, setShareToSapmi] = useState(false)

  // Fetch data when dialog opens
  useEffect(() => {
    const fetchData = async () => {
      if (!open) return
      setLoading(true)

      const [areasRes, munisRes, sharesRes] = await Promise.all([
        supabase.from('language_areas').select('id, name, code, color').order('sort_order'),
        supabase.from('municipalities').select('id, name, name_sami').order('name').limit(100),
        supabase.from('event_shares').select('id, language_area_id, municipality_id, share_to_sapmi').eq('post_id', postId),
      ])

      if (areasRes.data) {
        // Filter out current language area
        setLanguageAreas(areasRes.data.filter(la => la.id !== currentLanguageAreaId))
      }
      if (munisRes.data) {
        // Filter out current municipality
        setMunicipalities(munisRes.data.filter(m => m.id !== currentMunicipalityId))
      }
      if (sharesRes.data) {
        setExistingShares(sharesRes.data)
        // Initialize selections from existing shares
        setSelectedLanguageAreas(sharesRes.data.filter(s => s.language_area_id).map(s => s.language_area_id!))
        setSelectedMunicipalities(sharesRes.data.filter(s => s.municipality_id).map(s => s.municipality_id!))
        setShareToSapmi(sharesRes.data.some(s => s.share_to_sapmi))
      }

      setLoading(false)
    }

    fetchData()
  }, [open, postId, supabase, currentLanguageAreaId, currentMunicipalityId])

  const handleLanguageAreaToggle = (areaId: string) => {
    setSelectedLanguageAreas(prev =>
      prev.includes(areaId)
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    )
  }

  const handleMunicipalityToggle = (muniId: string) => {
    setSelectedMunicipalities(prev =>
      prev.includes(muniId)
        ? prev.filter(id => id !== muniId)
        : [...prev, muniId]
    )
  }

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Du må være innlogget')
      return
    }

    setSaving(true)

    try {
      // Delete existing shares
      if (existingShares.length > 0) {
        await supabase
          .from('event_shares')
          .delete()
          .eq('post_id', postId)
      }

      // Create new shares
      const newShares: { post_id: string; shared_by: string; language_area_id?: string; municipality_id?: string; share_to_sapmi?: boolean }[] = []

      // Share to Sápmi
      if (shareToSapmi) {
        newShares.push({
          post_id: postId,
          shared_by: user.id,
          share_to_sapmi: true,
        })
      }

      // Share to language areas
      for (const laId of selectedLanguageAreas) {
        newShares.push({
          post_id: postId,
          shared_by: user.id,
          language_area_id: laId,
        })
      }

      // Share to municipalities
      for (const muniId of selectedMunicipalities) {
        newShares.push({
          post_id: postId,
          shared_by: user.id,
          municipality_id: muniId,
        })
      }

      if (newShares.length > 0) {
        const { error } = await supabase.from('event_shares').insert(newShares)
        if (error) throw error
      }

      toast.success('Delinger oppdatert')
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error saving shares:', error)
      toast.error('Kunne ikke lagre delinger')
    } finally {
      setSaving(false)
    }
  }

  const totalShares = selectedLanguageAreas.length + selectedMunicipalities.length + (shareToSapmi ? 1 : 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            Del arrangement
          </DialogTitle>
          <DialogDescription>
            Velg områder der arrangementet skal vises i tillegg til primærområdet.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Share to all of Sápmi */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="share-sapmi"
                  checked={shareToSapmi}
                  onCheckedChange={(checked) => setShareToSapmi(checked === true)}
                />
                <label
                  htmlFor="share-sapmi"
                  className="text-sm font-medium cursor-pointer flex items-center gap-2"
                >
                  <Globe className="w-4 h-4 text-blue-600" />
                  Del med hele Sápmi
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                Arrangementet vises for alle brukere
              </p>
            </div>

            {/* Language areas */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Languages className="w-4 h-4 text-purple-600" />
                Språkområder
              </label>
              <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
                {languageAreas.map((area) => (
                  <div key={area.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`area-${area.id}`}
                      checked={selectedLanguageAreas.includes(area.id)}
                      onCheckedChange={() => handleLanguageAreaToggle(area.id)}
                    />
                    <label
                      htmlFor={`area-${area.id}`}
                      className="text-sm cursor-pointer flex items-center gap-2"
                    >
                      {area.color && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: area.color }}
                        />
                      )}
                      {area.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Municipalities */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-orange-600" />
                Kommuner
              </label>
              <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                {municipalities.map((muni) => (
                  <div key={muni.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`muni-${muni.id}`}
                      checked={selectedMunicipalities.includes(muni.id)}
                      onCheckedChange={() => handleMunicipalityToggle(muni.id)}
                    />
                    <label
                      htmlFor={`muni-${muni.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {muni.name}
                      {muni.name_sami && ` (${muni.name_sami})`}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            {totalShares > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  Arrangementet deles med {totalShares} {totalShares === 1 ? 'område' : 'områder'}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Lagre delinger
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
