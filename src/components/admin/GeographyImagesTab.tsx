'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Trash2, Edit2, Save, X, RefreshCw, Image as ImageIcon, ChevronUp, ChevronDown } from 'lucide-react'
import { MediaService } from '@/lib/media/mediaService'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface GeographyImage {
  id: string
  entity_type: 'geography_language_area' | 'geography_municipality' | 'geography_place'
  entity_id: string
  storage_path: string
  caption: string | null
  alt_text: string | null
  sort_order: number
  entity_name: string
  entity_sami_name: string | null
  created_at: string
}

type EntityType = 'geography_language_area' | 'geography_municipality' | 'geography_place'

const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  geography_language_area: 'Språkområder',
  geography_municipality: 'Kommuner',
  geography_place: 'Steder',
}

export function GeographyImagesTab() {
  const [images, setImages] = useState<GeographyImage[]>([])
  const [loading, setLoading] = useState(true)
  const [editingImage, setEditingImage] = useState<GeographyImage | null>(null)
  const [editCaption, setEditCaption] = useState('')
  const [editAltText, setEditAltText] = useState('')
  const [activeTab, setActiveTab] = useState<EntityType>('geography_municipality')
  const supabase = createClient()

  const fetchImages = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch all geography images
      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .in('entity_type', ['geography_language_area', 'geography_municipality', 'geography_place'])
        .is('deleted_at', null)
        .order('entity_id')
        .order('sort_order')

      if (mediaError) throw mediaError

      if (!mediaData || mediaData.length === 0) {
        setImages([])
        return
      }

      // Group by entity type to fetch entity data
      const languageAreaIds = mediaData
        .filter(m => m.entity_type === 'geography_language_area')
        .map(m => m.entity_id)
      const municipalityIds = mediaData
        .filter(m => m.entity_type === 'geography_municipality')
        .map(m => m.entity_id)
      const placeIds = mediaData
        .filter(m => m.entity_type === 'geography_place')
        .map(m => m.entity_id)

      // Fetch entity data
      const [languageAreas, municipalities, places] = await Promise.all([
        languageAreaIds.length > 0
          ? supabase
              .from('geography_language_areas')
              .select('id, name, sami_name')
              .in('id', languageAreaIds)
          : Promise.resolve({ data: [] }),
        municipalityIds.length > 0
          ? supabase
              .from('geography_municipalities')
              .select('id, name, sami_name')
              .in('id', municipalityIds)
          : Promise.resolve({ data: [] }),
        placeIds.length > 0
          ? supabase
              .from('geography_places')
              .select('id, name, sami_name')
              .in('id', placeIds)
          : Promise.resolve({ data: [] }),
      ])

      // Create entity lookup maps
      const entityMap = new Map<string, { name: string; sami_name: string | null }>()

      languageAreas.data?.forEach(area => {
        entityMap.set(`geography_language_area:${area.id}`, {
          name: area.name,
          sami_name: area.sami_name
        })
      })

      municipalities.data?.forEach(muni => {
        entityMap.set(`geography_municipality:${muni.id}`, {
          name: muni.name,
          sami_name: muni.sami_name
        })
      })

      places.data?.forEach(place => {
        entityMap.set(`geography_place:${place.id}`, {
          name: place.name,
          sami_name: place.sami_name
        })
      })

      // Map images with entity data
      const enrichedImages: GeographyImage[] = mediaData.map(media => {
        const entityKey = `${media.entity_type}:${media.entity_id}`
        const entityData = entityMap.get(entityKey) || { name: 'Ukjent', sami_name: null }

        return {
          id: media.id,
          entity_type: media.entity_type as EntityType,
          entity_id: media.entity_id,
          storage_path: media.storage_path,
          caption: media.caption,
          alt_text: media.alt_text,
          sort_order: media.sort_order,
          entity_name: entityData.name,
          entity_sami_name: entityData.sami_name,
          created_at: media.created_at,
        }
      })

      setImages(enrichedImages)
    } catch (error) {
      console.error('Error fetching geography images:', error)
      toast.error('Kunne ikke hente bilder')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  const handleDelete = async (imageId: string) => {
    if (!confirm('Er du sikker på at du vil slette dette bildet?')) return

    try {
      const { error } = await supabase
        .from('media')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', imageId)

      if (error) throw error

      toast.success('Bilde slettet')
      setImages(images.filter(img => img.id !== imageId))
    } catch (error) {
      console.error('Error deleting image:', error)
      toast.error('Kunne ikke slette bilde')
    }
  }

  const handleEdit = (image: GeographyImage) => {
    setEditingImage(image)
    setEditCaption(image.caption || '')
    setEditAltText(image.alt_text || '')
  }

  const handleSaveEdit = async () => {
    if (!editingImage) return

    try {
      const { error } = await supabase
        .from('media')
        .update({
          caption: editCaption || null,
          alt_text: editAltText || null,
        })
        .eq('id', editingImage.id)

      if (error) throw error

      toast.success('Bildedetaljer oppdatert')
      setImages(images.map(img =>
        img.id === editingImage.id
          ? { ...img, caption: editCaption || null, alt_text: editAltText || null }
          : img
      ))
      setEditingImage(null)
    } catch (error) {
      console.error('Error updating image:', error)
      toast.error('Kunne ikke oppdatere bildedetaljer')
    }
  }

  const handleReorder = async (imageId: string, direction: 'up' | 'down') => {
    const image = images.find(img => img.id === imageId)
    if (!image) return

    // Find images for the same entity
    const entityImages = images
      .filter(img => img.entity_type === image.entity_type && img.entity_id === image.entity_id)
      .sort((a, b) => a.sort_order - b.sort_order)

    const currentIndex = entityImages.findIndex(img => img.id === imageId)
    if (currentIndex === -1) return
    if (direction === 'up' && currentIndex === 0) return
    if (direction === 'down' && currentIndex === entityImages.length - 1) return

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const currentImage = entityImages[currentIndex]
    const swapImage = entityImages[swapIndex]

    try {
      // Swap sort_order values
      const { error } = await supabase
        .from('media')
        .upsert([
          { id: currentImage.id, sort_order: swapImage.sort_order },
          { id: swapImage.id, sort_order: currentImage.sort_order },
        ])

      if (error) throw error

      toast.success('Rekkefølge oppdatert')
      fetchImages()
    } catch (error) {
      console.error('Error reordering images:', error)
      toast.error('Kunne ikke endre rekkefølge')
    }
  }

  const filteredImages = images.filter(img => img.entity_type === activeTab)

  // Group images by entity
  const groupedImages = filteredImages.reduce((acc, img) => {
    const key = img.entity_id
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(img)
    return acc
  }, {} as Record<string, GeographyImage[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Geografi-bilder</h2>
          <p className="text-sm text-gray-500 mt-1">
            Administrer bilder for språkområder, kommuner og steder
          </p>
        </div>
        <Button variant="outline" onClick={fetchImages} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Oppdater
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as EntityType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="geography_language_area">
            Språkområder ({images.filter(i => i.entity_type === 'geography_language_area').length})
          </TabsTrigger>
          <TabsTrigger value="geography_municipality">
            Kommuner ({images.filter(i => i.entity_type === 'geography_municipality').length})
          </TabsTrigger>
          <TabsTrigger value="geography_place">
            Steder ({images.filter(i => i.entity_type === 'geography_place').length})
          </TabsTrigger>
        </TabsList>

        {Object.keys(groupedImages).length === 0 ? (
          <div className="mt-8 text-center py-12 bg-gray-50 rounded-lg">
            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Ingen bilder funnet for {ENTITY_TYPE_LABELS[activeTab].toLowerCase()}</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {Object.entries(groupedImages).map(([entityId, entityImages]) => {
              const firstImage = entityImages[0]
              const displayName = firstImage.entity_sami_name
                ? `${firstImage.entity_name} (${firstImage.entity_sami_name})`
                : firstImage.entity_name

              return (
                <Card key={entityId}>
                  <CardHeader>
                    <CardTitle className="text-lg">{displayName}</CardTitle>
                    <CardDescription>
                      {entityImages.length} {entityImages.length === 1 ? 'bilde' : 'bilder'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {entityImages.map((image, index) => {
                        const imageUrl = MediaService.getUrl(image.storage_path, 'medium')
                        const isFirst = index === 0
                        const isLast = index === entityImages.length - 1

                        return (
                          <div key={image.id} className="relative group">
                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={imageUrl}
                                alt={image.alt_text || displayName}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Overlay with actions */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleEdit(image)}
                                className="gap-1"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(image.id)}
                                className="gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>

                            {/* Reorder buttons */}
                            <div className="absolute top-2 right-2 flex flex-col gap-1">
                              {!isFirst && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleReorder(image.id, 'up')}
                                  className="w-6 h-6 p-0"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </Button>
                              )}
                              {!isLast && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleReorder(image.id, 'down')}
                                  className="w-6 h-6 p-0"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </Button>
                              )}
                            </div>

                            {/* Caption/Alt text preview */}
                            {(image.caption || image.alt_text) && (
                              <div className="mt-2 text-xs text-gray-600">
                                {image.caption && (
                                  <div className="truncate" title={image.caption}>
                                    📝 {image.caption}
                                  </div>
                                )}
                                {image.alt_text && (
                                  <div className="truncate text-gray-500" title={image.alt_text}>
                                    Alt: {image.alt_text}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingImage} onOpenChange={(open) => !open && setEditingImage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rediger bildedetaljer</DialogTitle>
          </DialogHeader>

          {editingImage && (
            <div className="space-y-4">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={MediaService.getUrl(editingImage.storage_path, 'medium')}
                  alt={editingImage.alt_text || editingImage.entity_name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="caption">Bildetekst</Label>
                <Input
                  id="caption"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="Skriv en bildetekst..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alt-text">Alt-tekst (for tilgjengelighet)</Label>
                <Input
                  id="alt-text"
                  value={editAltText}
                  onChange={(e) => setEditAltText(e.target.value)}
                  placeholder="Beskriv bildet for skjermlesere..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingImage(null)}>
              <X className="w-4 h-4 mr-2" />
              Avbryt
            </Button>
            <Button onClick={handleSaveEdit}>
              <Save className="w-4 h-4 mr-2" />
              Lagre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
