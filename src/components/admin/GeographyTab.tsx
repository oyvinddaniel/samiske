'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plus, Pencil, Trash2, Save, X, Link2, Unlink,
  Globe, Languages, Building2, MapPin, ChevronDown,
  MessageSquare, Check, XCircle, Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { sanitizeHtml } from '@/lib/sanitize'

// Types
interface Country {
  id: string
  name: string
  name_sami: string | null
  code: string
  sort_order: number
}

interface LanguageArea {
  id: string
  name: string
  name_sami: string | null
  code: string
  description: string | null
  sort_order: number
}

interface Municipality {
  id: string
  name: string
  name_sami: string | null
  slug: string
  country_id: string
  language_area_id: string | null
  country?: Country
  language_area?: LanguageArea | null
}

interface Place {
  id: string
  name: string
  name_sami: string | null
  slug: string
  municipality_id: string
  municipality?: Municipality
}

interface Suggestion {
  id: string
  user_id: string
  suggestion_type: 'new_item' | 'edit_name' | 'edit_relationship'
  entity_type: 'language_area' | 'municipality' | 'place'
  entity_id: string | null
  suggested_data: Record<string, unknown>
  current_data: Record<string, unknown> | null
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  user?: {
    id: string
    full_name: string | null
    email: string
  }
}

export function GeographyTab() {
  const supabase = useMemo(() => createClient(), [])
  const [activeTab, setActiveTab] = useState('language_areas')

  // Data state
  const [countries, setCountries] = useState<Country[]>([])
  const [languageAreas, setLanguageAreas] = useState<LanguageArea[]>([])
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [places, setPlaces] = useState<Place[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Form state
  const [formData, setFormData] = useState<Record<string, string>>({})

  // Filter state
  const [filterLanguageArea, setFilterLanguageArea] = useState<string>('')
  const [filterMunicipality, setFilterMunicipality] = useState<string>('')
  const [filterCountry, setFilterCountry] = useState<string>('')

  // Fetch all data
  const fetchData = useCallback(async () => {
    const [countriesRes, languageAreasRes, municipalitiesRes, placesRes, suggestionsRes] = await Promise.all([
      supabase.from('countries').select('*').order('sort_order'),
      supabase.from('language_areas').select('*').order('sort_order'),
      supabase.from('municipalities').select(`
        *,
        country:countries(*),
        language_area:language_areas(*)
      `).order('name'),
      supabase.from('places').select(`
        *,
        municipality:municipalities(
          *,
          country:countries(*)
        )
      `).order('name'),
      supabase.from('geography_suggestions').select(`
        *,
        user:profiles(id, full_name, email)
      `).order('created_at', { ascending: false }),
    ])

    if (countriesRes.data) setCountries(countriesRes.data)
    if (languageAreasRes.data) setLanguageAreas(languageAreasRes.data)
    if (municipalitiesRes.data) {
      setMunicipalities(municipalitiesRes.data.map(m => ({
        ...m,
        country: Array.isArray(m.country) ? m.country[0] : m.country,
        language_area: Array.isArray(m.language_area) ? m.language_area[0] : m.language_area,
      })))
    }
    if (placesRes.data) {
      setPlaces(placesRes.data.map(p => ({
        ...p,
        municipality: Array.isArray(p.municipality) ? p.municipality[0] : p.municipality,
      })))
    }
    if (suggestionsRes.data) {
      setSuggestions(suggestionsRes.data.map(s => ({
        ...s,
        user: Array.isArray(s.user) ? s.user[0] : s.user,
      })) as Suggestion[])
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Reset form
  const resetForm = () => {
    setEditingId(null)
    setIsCreating(false)
    setFormData({})
  }

  // CRUD handlers for Language Areas
  const handleCreateLanguageArea = async () => {
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
      fetchData()
    }
  }

  const handleUpdateLanguageArea = async (id: string) => {
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
      fetchData()
    }
  }

  const handleDeleteLanguageArea = async (id: string) => {
    if (!confirm('Slett språkområde? Dette vil også fjerne koblinger til kommuner.')) return

    const { error } = await supabase
      .from('language_areas')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Kunne ikke slette språkområde: ' + error.message)
    } else {
      toast.success('Språkområde slettet')
      fetchData()
    }
  }

  // CRUD handlers for Municipalities
  const handleCreateMunicipality = async () => {
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
      fetchData()
    }
  }

  const handleUpdateMunicipality = async (id: string) => {
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
      fetchData()
    }
  }

  const handleDeleteMunicipality = async (id: string) => {
    if (!confirm('Slett kommune? Dette vil også slette alle steder i kommunen.')) return

    const { error } = await supabase
      .from('municipalities')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Kunne ikke slette kommune: ' + error.message)
    } else {
      toast.success('Kommune slettet')
      fetchData()
    }
  }

  // CRUD handlers for Places
  const handleCreatePlace = async () => {
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
      fetchData()
    }
  }

  const handleUpdatePlace = async (id: string) => {
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
      fetchData()
    }
  }

  const handleDeletePlace = async (id: string) => {
    if (!confirm('Slett sted?')) return

    const { error } = await supabase
      .from('places')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Kunne ikke slette sted: ' + error.message)
    } else {
      toast.success('Sted slettet')
      fetchData()
    }
  }

  // Handle suggestion approval using transaction-safe RPC function
  const handleApproveSuggestion = async (suggestion: Suggestion) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const { data, error } = await supabase.rpc('approve_geography_suggestion', {
        p_suggestion_id: suggestion.id,
        p_reviewer_id: user.id,
      })

      if (error) throw error

      const result = data as { success: boolean; message: string; entity_id?: string }

      if (result.success) {
        toast.success(result.message || 'Forslag godkjent og endringer utført')
        fetchData()
      } else {
        toast.error(result.message || 'Kunne ikke godkjenne forslag')
      }
    } catch (error) {
      console.error('Error approving suggestion:', error)
      toast.error('Kunne ikke godkjenne forslag')
    }
  }

  const handleRejectSuggestion = async (suggestion: Suggestion, adminNotes?: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const { data, error } = await supabase.rpc('reject_geography_suggestion', {
        p_suggestion_id: suggestion.id,
        p_reviewer_id: user.id,
        p_admin_notes: adminNotes || null,
      })

      if (error) throw error

      const result = data as { success: boolean; message: string }

      if (result.success) {
        toast.success(result.message || 'Forslag avvist')
        fetchData()
      } else {
        toast.error(result.message || 'Kunne ikke avvise forslag')
      }
    } catch (error) {
      console.error('Error rejecting suggestion:', error)
      toast.error('Kunne ikke avvise forslag')
    }
  }

  // Quick link/unlink municipality to language area
  const handleLinkMunicipalityToLanguageArea = async (municipalityId: string, languageAreaId: string | null) => {
    const { error } = await supabase
      .from('municipalities')
      .update({ language_area_id: languageAreaId })
      .eq('id', municipalityId)

    if (error) {
      toast.error('Kunne ikke oppdatere kobling: ' + error.message)
    } else {
      toast.success(languageAreaId ? 'Kommune koblet til språkområde' : 'Kobling fjernet')
      fetchData()
    }
  }

  // Start editing
  type EditableItem = LanguageArea | Country | Municipality | Place
  const startEditing = (item: EditableItem, type: string) => {
    setEditingId(item.id)
    setIsCreating(false)

    const data: Record<string, string> = {}
    const itemObj = item as unknown as Record<string, unknown>
    Object.keys(itemObj).forEach(key => {
      const value = itemObj[key]
      if (value !== null && typeof value !== 'object') {
        data[key] = String(value)
      }
    })
    // Handle foreign keys
    if (type === 'municipality') {
      const muni = item as Municipality
      data.country_id = muni.country_id
      data.language_area_id = muni.language_area_id || ''
    }
    if (type === 'place') {
      const place = item as Place
      data.municipality_id = place.municipality_id
    }
    setFormData(data)
  }

  // Start creating
  const startCreating = () => {
    setIsCreating(true)
    setEditingId(null)
    setFormData({})
  }

  // Filtered data
  const filteredMunicipalities = municipalities.filter(m => {
    if (filterLanguageArea && m.language_area_id !== filterLanguageArea) return false
    if (filterCountry && m.country_id !== filterCountry) return false
    return true
  })

  const filteredPlaces = places.filter(p => {
    if (filterMunicipality && p.municipality_id !== filterMunicipality) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Geografi-administrasjon</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Forslag
            {suggestions.filter(s => s.status === 'pending').length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {suggestions.filter(s => s.status === 'pending').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="language_areas" className="flex items-center gap-2">
            <Languages className="w-4 h-4" />
            Språkområder
          </TabsTrigger>
          <TabsTrigger value="countries" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Land
          </TabsTrigger>
          <TabsTrigger value="municipalities" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Kommuner
          </TabsTrigger>
          <TabsTrigger value="places" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Steder
          </TabsTrigger>
        </TabsList>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {suggestions.filter(s => s.status === 'pending').length} ventende forslag
            </p>
          </div>

          {suggestions.filter(s => s.status === 'pending').length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Ingen ventende forslag</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {suggestions.filter(s => s.status === 'pending').map(suggestion => {
                const entityIcon = suggestion.entity_type === 'language_area' ? (
                  <Languages className="w-5 h-5 text-blue-600" />
                ) : suggestion.entity_type === 'municipality' ? (
                  <Building2 className="w-5 h-5 text-orange-600" />
                ) : (
                  <MapPin className="w-5 h-5 text-purple-600" />
                )

                const suggestionTypeLabel = suggestion.suggestion_type === 'new_item' ? 'Nytt element' :
                  suggestion.suggestion_type === 'edit_name' ? 'Navneendring' : 'Tilknytning'

                const entityTypeLabel = suggestion.entity_type === 'language_area' ? 'Språkområde' :
                  suggestion.entity_type === 'municipality' ? 'Kommune' : 'Sted'

                return (
                  <Card key={suggestion.id} className="border-yellow-200 bg-yellow-50">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">{entityIcon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs rounded">
                              {suggestionTypeLabel}
                            </span>
                            <span className="text-xs text-gray-500">{entityTypeLabel}</span>
                            <Clock className="w-3 h-3 text-gray-400 ml-auto" />
                            <span className="text-xs text-gray-400">
                              {new Date(suggestion.created_at).toLocaleDateString('nb-NO')}
                            </span>
                          </div>

                          {/* Suggested data */}
                          <div className="bg-white rounded p-3 mb-2 text-sm">
                            {suggestion.suggestion_type === 'new_item' || suggestion.suggestion_type === 'edit_name' ? (
                              <div className="space-y-1">
                                <p>
                                  <span className="text-gray-500">Navn:</span>{' '}
                                  <strong>{sanitizeHtml(suggestion.suggested_data.name as string)}</strong>
                                </p>
                                {typeof suggestion.suggested_data.name_sami === 'string' && suggestion.suggested_data.name_sami && (
                                  <p>
                                    <span className="text-gray-500">Samisk:</span>{' '}
                                    <strong>{sanitizeHtml(suggestion.suggested_data.name_sami)}</strong>
                                  </p>
                                )}
                                {suggestion.current_data && (
                                  <p className="text-gray-400 text-xs mt-1">
                                    Nåværende: {sanitizeHtml(suggestion.current_data.name as string)}
                                    {typeof suggestion.current_data.name_sami === 'string' && suggestion.current_data.name_sami && ` (${sanitizeHtml(suggestion.current_data.name_sami)})`}
                                  </p>
                                )}
                              </div>
                            ) : suggestion.suggestion_type === 'edit_relationship' ? (
                              <div className="space-y-1">
                                {suggestion.entity_type === 'municipality' && (
                                  <p>
                                    <span className="text-gray-500">Språkområder:</span>{' '}
                                    <strong>
                                      {(suggestion.suggested_data.language_area_ids as string[])?.map(id => {
                                        const area = languageAreas.find(la => la.id === id)
                                        return area?.name || id
                                      }).join(', ') || 'Ingen'}
                                    </strong>
                                  </p>
                                )}
                                {suggestion.entity_type === 'place' && (
                                  <p>
                                    <span className="text-gray-500">Kommune:</span>{' '}
                                    <strong>
                                      {municipalities.find(m => m.id === suggestion.suggested_data.municipality_id as string)?.name || 'Ukjent'}
                                    </strong>
                                  </p>
                                )}
                              </div>
                            ) : null}
                          </div>

                          {/* User and reason */}
                          <div className="text-xs text-gray-500 space-y-1">
                            <p>
                              Fra: {sanitizeHtml(suggestion.user?.full_name || suggestion.user?.email || 'Ukjent bruker')}
                            </p>
                            {suggestion.reason && (
                              <p className="italic">&quot;{sanitizeHtml(suggestion.reason)}&quot;</p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveSuggestion(suggestion)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Godkjenn
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const notes = prompt('Begrunnelse for avvisning (valgfritt):')
                              handleRejectSuggestion(suggestion, notes || undefined)
                            }}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Avvis
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* History of reviewed suggestions */}
          {suggestions.filter(s => s.status !== 'pending').length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Behandlede forslag</h3>
              <div className="space-y-2">
                {suggestions.filter(s => s.status !== 'pending').slice(0, 10).map(suggestion => (
                  <Card key={suggestion.id} className={cn(
                    'opacity-75',
                    suggestion.status === 'approved' ? 'border-green-200' : 'border-red-200'
                  )}>
                    <CardContent className="py-2">
                      <div className="flex items-center gap-3 text-sm">
                        {suggestion.status === 'approved' ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="text-gray-600">
                          {suggestion.suggestion_type === 'new_item' ? 'Nytt' :
                           suggestion.suggestion_type === 'edit_name' ? 'Navneendring' : 'Tilknytning'}
                          {': '}
                          {suggestion.suggested_data.name as string || suggestion.entity_type}
                        </span>
                        <span className="text-xs text-gray-400 ml-auto">
                          {suggestion.reviewed_at && new Date(suggestion.reviewed_at).toLocaleDateString('nb-NO')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Language Areas Tab */}
        <TabsContent value="language_areas" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{languageAreas.length} språkområder</p>
            <Button onClick={startCreating} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nytt språkområde
            </Button>
          </div>

          {isCreating && activeTab === 'language_areas' && (
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
                  <Button size="sm" onClick={handleCreateLanguageArea}>
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
                        <Button size="sm" onClick={() => handleUpdateLanguageArea(area.id)}>
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
                        <Languages className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium">{area.name}</p>
                          <p className="text-xs text-gray-500">
                            {area.name_sami && <span className="mr-2">{area.name_sami}</span>}
                            <span className="text-gray-400">Kode: {area.code}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => startEditing(area, 'language_area')}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDeleteLanguageArea(area.id)}>
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

        {/* Countries Tab */}
        <TabsContent value="countries" className="space-y-4">
          <p className="text-sm text-gray-500">{countries.length} land (kun visning)</p>
          <div className="space-y-2">
            {countries.map(country => (
              <Card key={country.id}>
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">{country.name}</p>
                      <p className="text-xs text-gray-500">
                        {country.name_sami && <span className="mr-2">{country.name_sami}</span>}
                        <span className="text-gray-400">Kode: {country.code}</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Municipalities Tab */}
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
            <Button onClick={startCreating} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Ny kommune
            </Button>
          </div>

          <p className="text-sm text-gray-500">{filteredMunicipalities.length} kommuner</p>

          {isCreating && activeTab === 'municipalities' && (
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
                  <Button size="sm" onClick={handleCreateMunicipality}>
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
                        <Button size="sm" onClick={() => handleUpdateMunicipality(municipality.id)}>
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
                          onChange={e => handleLinkMunicipalityToLanguageArea(municipality.id, e.target.value || null)}
                          className="text-xs border rounded px-1 py-0.5 max-w-[120px]"
                        >
                          <option value="">Ingen</option>
                          {languageAreas.map(la => (
                            <option key={la.id} value={la.id}>{la.name}</option>
                          ))}
                        </select>
                        <Button size="sm" variant="ghost" onClick={() => startEditing(municipality, 'municipality')}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDeleteMunicipality(municipality.id)}>
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

        {/* Places Tab */}
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
            <Button onClick={startCreating} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nytt sted
            </Button>
          </div>

          <p className="text-sm text-gray-500">{filteredPlaces.length} steder</p>

          {isCreating && activeTab === 'places' && (
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
                  <Button size="sm" onClick={handleCreatePlace}>
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
                        <Button size="sm" onClick={() => handleUpdatePlace(place.id)}>
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
                        <Button size="sm" variant="ghost" onClick={() => startEditing(place, 'place')}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDeletePlace(place.id)}>
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
      </Tabs>
    </div>
  )
}
