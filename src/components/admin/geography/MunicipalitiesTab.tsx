'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Save, X, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { Municipality, Country, LanguageArea } from './types'
import type { SupabaseClient } from '@supabase/supabase-js'

interface MunicipalitiesTabProps {
  municipalities: Municipality[]
  countries: Country[]
  languageAreas: LanguageArea[]
  supabase: SupabaseClient
  onDataChange: () => void
}

export function MunicipalitiesTab({
  municipalities,
  countries,
  languageAreas,
  supabase,
  onDataChange
}: MunicipalitiesTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [filterLanguageArea, setFilterLanguageArea] = useState<string>('')
  const [filterCountry, setFilterCountry] = useState<string>('')

  const resetForm = () => {
    setEditingId(null)
    setIsCreating(false)
    setFormData({})
  }

  const handleCreate = async () => {
    const { error } = await supabase
      .from('municipalities')
      .insert({
        name: formData.name,
        name_sami: formData.name_sami || null,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[æ]/g, 'ae').replace(/[ø]/g, 'o').replace(/[å]/g, 'a'),
        country_id: formData.country_id,
        language_area_id: formData.language_area_id || null,
      })

    if (error) {
      toast.error('Kunne ikke opprette kommune: ' + error.message)
    } else {
      toast.success('Kommune opprettet')
      resetForm()
      onDataChange()
    }
  }

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('municipalities')
      .update({
        name: formData.name,
        name_sami: formData.name_sami || null,
        slug: formData.slug,
        country_id: formData.country_id,
        language_area_id: formData.language_area_id || null,
      })
      .eq('id', id)

    if (error) {
      toast.error('Kunne ikke oppdatere kommune: ' + error.message)
    } else {
      toast.success('Kommune oppdatert')
      resetForm()
      onDataChange()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Slett kommune? Dette vil også slette alle steder i kommunen.')) return

    const { error } = await supabase
      .from('municipalities')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Kunne ikke slette kommune: ' + error.message)
    } else {
      toast.success('Kommune slettet')
      onDataChange()
    }
  }

  const handleLinkToLanguageArea = async (municipalityId: string, languageAreaId: string | null) => {
    const { error } = await supabase
      .from('municipalities')
      .update({ language_area_id: languageAreaId })
      .eq('id', municipalityId)

    if (error) {
      toast.error('Kunne ikke oppdatere kobling: ' + error.message)
    } else {
      toast.success(languageAreaId ? 'Kommune koblet til språkområde' : 'Kobling fjernet')
      onDataChange()
    }
  }

  const startEditing = (municipality: Municipality) => {
    setEditingId(municipality.id)
    setIsCreating(false)
    setFormData({
      name: municipality.name,
      name_sami: municipality.name_sami || '',
      slug: municipality.slug,
      country_id: municipality.country_id,
      language_area_id: municipality.language_area_id || '',
    })
  }

  const filteredMunicipalities = municipalities.filter(m => {
    if (filterLanguageArea && m.language_area_id !== filterLanguageArea) return false
    if (filterCountry && m.country_id !== filterCountry) return false
    return true
  })

  return (
    <TabsContent value="municipalities" className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <select
            value={filterLanguageArea}
            onChange={e => setFilterLanguageArea(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="">Alle språkområder</option>
            {languageAreas.map(la => (
              <option key={la.id} value={la.id}>{la.name}</option>
            ))}
          </select>
          <select
            value={filterCountry}
            onChange={e => setFilterCountry(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="">Alle land</option>
            {countries.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <Button onClick={() => setIsCreating(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Ny kommune
        </Button>
      </div>

      <p className="text-sm text-gray-500">{filteredMunicipalities.length} kommuner</p>

      {isCreating && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ny kommune</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Navn</Label>
                <Input
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Tromsø"
                />
              </div>
              <div>
                <Label className="text-xs">Samisk navn</Label>
                <Input
                  value={formData.name_sami || ''}
                  onChange={e => setFormData({ ...formData, name_sami: e.target.value })}
                  placeholder="Romsa"
                />
              </div>
              <div>
                <Label className="text-xs">Land</Label>
                <select
                  value={formData.country_id || ''}
                  onChange={e => setFormData({ ...formData, country_id: e.target.value })}
                  className="w-full border rounded px-2 py-1.5 text-sm"
                >
                  <option value="">Velg land...</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Språkområde</Label>
                <select
                  value={formData.language_area_id || ''}
                  onChange={e => setFormData({ ...formData, language_area_id: e.target.value })}
                  className="w-full border rounded px-2 py-1.5 text-sm"
                >
                  <option value="">Ingen (valgfritt)</option>
                  {languageAreas.map(la => (
                    <option key={la.id} value={la.id}>{la.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate}>
                <Save className="w-4 h-4 mr-2" />
                Lagre
              </Button>
              <Button size="sm" variant="outline" onClick={resetForm}>
                <X className="w-4 h-4 mr-2" />
                Avbryt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {filteredMunicipalities.map(municipality => (
          <Card key={municipality.id} className={cn(editingId === municipality.id && 'border-blue-300')}>
            <CardContent className="py-3">
              {editingId === municipality.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Navn</Label>
                      <Input
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Samisk navn</Label>
                      <Input
                        value={formData.name_sami || ''}
                        onChange={e => setFormData({ ...formData, name_sami: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Slug</Label>
                      <Input
                        value={formData.slug || ''}
                        onChange={e => setFormData({ ...formData, slug: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Land</Label>
                      <select
                        value={formData.country_id || ''}
                        onChange={e => setFormData({ ...formData, country_id: e.target.value })}
                        className="w-full border rounded px-2 py-1.5 text-sm"
                      >
                        {countries.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Språkområde</Label>
                      <select
                        value={formData.language_area_id || ''}
                        onChange={e => setFormData({ ...formData, language_area_id: e.target.value })}
                        className="w-full border rounded px-2 py-1.5 text-sm"
                      >
                        <option value="">Ingen</option>
                        {languageAreas.map(la => (
                          <option key={la.id} value={la.id}>{la.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpdate(municipality.id)}>
                      <Save className="w-4 h-4 mr-2" />
                      Lagre
                    </Button>
                    <Button size="sm" variant="outline" onClick={resetForm}>
                      <X className="w-4 h-4 mr-2" />
                      Avbryt
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-medium">{municipality.name}</p>
                      <p className="text-xs text-gray-500">
                        {municipality.name_sami && <span className="mr-2">{municipality.name_sami}</span>}
                        <span className="text-gray-400">{municipality.country?.name}</span>
                        {municipality.language_area && (
                          <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">
                            {municipality.language_area.name}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {/* Quick language area selector */}
                    <select
                      value={municipality.language_area_id || ''}
                      onChange={e => handleLinkToLanguageArea(municipality.id, e.target.value || null)}
                      className="text-xs border rounded px-1 py-0.5 max-w-[120px]"
                    >
                      <option value="">Ingen</option>
                      {languageAreas.map(la => (
                        <option key={la.id} value={la.id}>{la.name}</option>
                      ))}
                    </select>
                    <Button size="sm" variant="ghost" onClick={() => startEditing(municipality)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(municipality.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </TabsContent>
  )
}
