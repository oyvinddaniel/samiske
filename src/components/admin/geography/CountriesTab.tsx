'use client'

import { useState } from 'react'
import { MapPin, Pencil, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { Country } from './types'
import type { SupabaseClient } from '@supabase/supabase-js'

interface CountriesTabProps {
  countries: Country[]
  supabase: SupabaseClient
  onDataChange: () => void
}

export function CountriesTab({ countries, supabase, onDataChange }: CountriesTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})

  const resetForm = () => {
    setEditingId(null)
    setFormData({})
  }

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('countries')
      .update({
        name_sami: formData.name_sami || null,
      })
      .eq('id', id)

    if (error) {
      toast.error('Kunne ikke oppdatere land: ' + error.message)
    } else {
      toast.success('Land oppdatert')
      resetForm()
      onDataChange()
    }
  }

  const startEditing = (country: Country) => {
    setEditingId(country.id)
    setFormData({
      name: country.name,
      name_sami: country.name_sami || '',
      code: country.code,
    })
  }

  return (
    <TabsContent value="countries" className="space-y-4">
      <p className="text-sm text-gray-500">{countries.length} land</p>
      <div className="space-y-2">
        {countries.map(country => (
          <Card key={country.id} className={cn(editingId === country.id && 'border-blue-300')}>
            <CardContent className="py-3">
              {editingId === country.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Navn (kan ikke endres)</Label>
                      <Input
                        value={formData.name || ''}
                        disabled
                        className="bg-gray-100"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Samisk navn</Label>
                      <Input
                        value={formData.name_sami || ''}
                        onChange={e => setFormData({ ...formData, name_sami: e.target.value })}
                        placeholder="Skriv samisk navn..."
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Kode (kan ikke endres)</Label>
                      <Input
                        value={formData.code || ''}
                        disabled
                        className="bg-gray-100"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpdate(country.id)}>
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
                    <MapPin className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">{country.name}</p>
                      <p className="text-xs text-gray-500">
                        {country.name_sami ? (
                          <span className="mr-2 text-green-600">{country.name_sami}</span>
                        ) : (
                          <span className="mr-2 text-orange-500 italic">Mangler samisk navn</span>
                        )}
                        <span className="text-gray-400">Kode: {country.code}</span>
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => startEditing(country)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </TabsContent>
  )
}
