'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Save, X, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { Place, Municipality } from './types'
import type { SupabaseClient } from '@supabase/supabase-js'

interface PlacesTabProps {
  places: Place[]
  municipalities: Municipality[]
  supabase: SupabaseClient
  onDataChange: () => void
}

export function PlacesTab({
  places,
  municipalities,
  supabase,
  onDataChange
}: PlacesTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [filterMunicipality, setFilterMunicipality] = useState<string>('')

  const resetForm = () => {
    setEditingId(null)
    setIsCreating(false)
    setFormData({})
  }

  const handleCreate = async () => {
    const { error } = await supabase
      .from('places')
      .insert({
        name: formData.name,
        name_sami: formData.name_sami || null,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[æ]/g, 'ae').replace(/[ø]/g, 'o').replace(/[å]/g, 'a'),
        municipality_id: formData.municipality_id,
      })

    if (error) {
      toast.error('Kunne ikke opprette sted: ' + error.message)
    } else {
      toast.success('Sted opprettet')
      resetForm()
      onDataChange()
    }
  }

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('places')
      .update({
        name: formData.name,
        name_sami: formData.name_sami || null,
        slug: formData.slug,
        municipality_id: formData.municipality_id,
      })
      .eq('id', id)

    if (error) {
      toast.error('Kunne ikke oppdatere sted: ' + error.message)
    } else {
      toast.success('Sted oppdatert')
      resetForm()
      onDataChange()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Slett sted?')) return

    const { error } = await supabase
      .from('places')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Kunne ikke slette sted: ' + error.message)
    } else {
      toast.success('Sted slettet')
      onDataChange()
    }
  }

  const startEditing = (place: Place) => {
    setEditingId(place.id)
    setIsCreating(false)
    setFormData({
      name: place.name,
      name_sami: place.name_sami || '',
      slug: place.slug,
      municipality_id: place.municipality_id,
    })
  }

  const filteredPlaces = places.filter(p => {
    if (filterMunicipality && p.municipality_id !== filterMunicipality) return false
    return true
  })

  return (
    <TabsContent value="places" className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <select
          value={filterMunicipality}
          onChange={e => setFilterMunicipality(e.target.value)}
          className="text-sm border rounded px-2 py-1"
        >
          <option value="">Alle kommuner</option>
          {municipalities.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <Button onClick={() => setIsCreating(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nytt sted
        </Button>
      </div>

      <p className="text-sm text-gray-500">{filteredPlaces.length} steder</p>

      {isCreating && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Nytt sted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Navn</Label>
                <Input
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Sentrum"
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
                <Label className="text-xs">Kommune</Label>
                <select
                  value={formData.municipality_id || ''}
                  onChange={e => setFormData({ ...formData, municipality_id: e.target.value })}
                  className="w-full border rounded px-2 py-1.5 text-sm"
                >
                  <option value="">Velg kommune...</option>
                  {municipalities.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
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
        {filteredPlaces.map(place => (
          <Card key={place.id} className={cn(editingId === place.id && 'border-blue-300')}>
            <CardContent className="py-3">
              {editingId === place.id ? (
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
                    <div className="col-span-2">
                      <Label className="text-xs">Kommune</Label>
                      <select
                        value={formData.municipality_id || ''}
                        onChange={e => setFormData({ ...formData, municipality_id: e.target.value })}
                        className="w-full border rounded px-2 py-1.5 text-sm"
                      >
                        {municipalities.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpdate(place.id)}>
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
                    <MapPin className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium">{place.name}</p>
                      <p className="text-xs text-gray-500">
                        {place.name_sami && <span className="mr-2">{place.name_sami}</span>}
                        <span className="text-gray-400">{place.municipality?.name}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startEditing(place)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(place.id)}>
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
