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
import type { LanguageArea } from './types'
import type { SupabaseClient } from '@supabase/supabase-js'

interface LanguageAreasTabProps {
  languageAreas: LanguageArea[]
  supabase: SupabaseClient
  onDataChange: () => void
}

export function LanguageAreasTab({ languageAreas, supabase, onDataChange }: LanguageAreasTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})

  const resetForm = () => {
    setEditingId(null)
    setIsCreating(false)
    setFormData({})
  }

  const handleCreate = async () => {
    const { error } = await supabase
      .from('language_areas')
      .insert({
        name: formData.name,
        name_sami: formData.name_sami || null,
        code: formData.code,
        description: formData.description || null,
        sort_order: parseInt(formData.sort_order || '0'),
        region_id: (await supabase.from('regions').select('id').single()).data?.id,
      })

    if (error) {
      toast.error('Kunne ikke opprette språkområde: ' + error.message)
    } else {
      toast.success('Språkområde opprettet')
      resetForm()
      onDataChange()
    }
  }

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('language_areas')
      .update({
        name: formData.name,
        name_sami: formData.name_sami || null,
        code: formData.code,
        description: formData.description || null,
        sort_order: parseInt(formData.sort_order || '0'),
      })
      .eq('id', id)

    if (error) {
      toast.error('Kunne ikke oppdatere språkområde: ' + error.message)
    } else {
      toast.success('Språkområde oppdatert')
      resetForm()
      onDataChange()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Slett språkområde? Dette vil også fjerne koblinger til kommuner.')) return

    const { error } = await supabase
      .from('language_areas')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Kunne ikke slette språkområde: ' + error.message)
    } else {
      toast.success('Språkområde slettet')
      onDataChange()
    }
  }

  const startEditing = (area: LanguageArea) => {
    setEditingId(area.id)
    setIsCreating(false)
    setFormData({
      name: area.name,
      name_sami: area.name_sami || '',
      code: area.code,
      description: area.description || '',
      sort_order: String(area.sort_order),
    })
  }

  return (
    <TabsContent value="language_areas" className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{languageAreas.length} språkområder</p>
        <Button onClick={() => setIsCreating(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nytt språkområde
        </Button>
      </div>

      {isCreating && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Nytt språkområde</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Navn</Label>
                <Input
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nordsamisk"
                />
              </div>
              <div>
                <Label className="text-xs">Samisk navn</Label>
                <Input
                  value={formData.name_sami || ''}
                  onChange={e => setFormData({ ...formData, name_sami: e.target.value })}
                  placeholder="Davvisámegiella"
                />
              </div>
              <div>
                <Label className="text-xs">Kode</Label>
                <Input
                  value={formData.code || ''}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  placeholder="north"
                />
              </div>
              <div>
                <Label className="text-xs">Sortering</Label>
                <Input
                  type="number"
                  value={formData.sort_order || '0'}
                  onChange={e => setFormData({ ...formData, sort_order: e.target.value })}
                />
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

      <div className="space-y-2">
        {languageAreas.map(area => (
          <Card key={area.id} className={cn(editingId === area.id && 'border-blue-300')}>
            <CardContent className="py-3">
              {editingId === area.id ? (
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
                      <Label className="text-xs">Kode</Label>
                      <Input
                        value={formData.code || ''}
                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Sortering</Label>
                      <Input
                        type="number"
                        value={formData.sort_order || '0'}
                        onChange={e => setFormData({ ...formData, sort_order: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpdate(area.id)}>
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
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{area.name}</p>
                      <p className="text-xs text-gray-500">
                        {area.name_sami && <span className="mr-2">{area.name_sami}</span>}
                        <span className="text-gray-400">Kode: {area.code}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startEditing(area)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(area.id)}>
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
