'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Star, Pencil, MapPin, Building2,
  Calendar, Users, FileText, Loader2
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Feed } from '@/components/feed/Feed'
import { SuggestChangeModal } from './SuggestChangeModal'
import Image from 'next/image'

type EntityType = 'language_area' | 'municipality' | 'place'

interface GeographyImage {
  id: string
  image_url: string
  caption: string | null
  sort_order: number
}

interface ChildItem {
  id: string
  name: string
  name_sami: string | null
  slug: string
  type: 'municipality' | 'place'
}

interface GeographyDetailViewProps {
  entityType: EntityType
  entityId: string
  onClose: () => void
  onNavigate?: (type: EntityType, id: string) => void
}

export function GeographyDetailView({
  entityType,
  entityId,
  onClose,
  onNavigate
}: GeographyDetailViewProps) {
  const supabase = useMemo(() => createClient(), [])

  // Entity data
  const [entity, setEntity] = useState<{
    id: string
    name: string
    name_sami: string | null
    description: string | null
    code?: string
    slug?: string
  } | null>(null)

  // Related data
  const [images, setImages] = useState<GeographyImage[]>([])
  const [children, setChildren] = useState<ChildItem[]>([])
  const [parentInfo, setParentInfo] = useState<{ name: string; type: string } | null>(null)

  // User state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isStarred, setIsStarred] = useState(false)

  // Edit state
  const [suggestionModalOpen, setSuggestionModalOpen] = useState(false)

  // Loading
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Fetch current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getUser()
  }, [supabase])

  // Fetch entity data
  const fetchEntity = useCallback(async () => {
    setLoading(true)

    let query
    if (entityType === 'language_area') {
      query = supabase.from('language_areas').select('id, name, name_sami, description, code').eq('id', entityId).single()
    } else if (entityType === 'municipality') {
      query = supabase.from('municipalities').select('id, name, name_sami, description, slug, language_area_id').eq('id', entityId).single()
    } else {
      query = supabase.from('places').select('id, name, name_sami, description, slug, municipality_id').eq('id', entityId).single()
    }

    const { data, error } = await query
    if (error) {
      console.error('Error fetching entity:', error)
      setLoading(false)
      return
    }

    setEntity(data)

    // Fetch parent info for context
    if (entityType === 'municipality' && 'language_area_id' in data && data.language_area_id) {
      const { data: parentData } = await supabase
        .from('language_areas')
        .select('name')
        .eq('id', data.language_area_id)
        .single()
      if (parentData) setParentInfo({ name: parentData.name, type: 'Språkområde' })
    } else if (entityType === 'place' && 'municipality_id' in data && data.municipality_id) {
      const { data: parentData } = await supabase
        .from('municipalities')
        .select('name')
        .eq('id', data.municipality_id)
        .single()
      if (parentData) setParentInfo({ name: parentData.name, type: 'Kommune' })
    }

    setLoading(false)
  }, [supabase, entityType, entityId])

  // Fetch images
  const fetchImages = useCallback(async () => {
    const column = entityType === 'language_area' ? 'language_area_id' :
                   entityType === 'municipality' ? 'municipality_id' : 'place_id'

    const { data } = await supabase
      .from('geography_images')
      .select('*')
      .eq(column, entityId)
      .order('sort_order')
      .limit(5)

    if (data) setImages(data)
  }, [supabase, entityType, entityId])

  // Fetch children (municipalities for language_area, places for municipality)
  const fetchChildren = useCallback(async () => {
    if (entityType === 'language_area') {
      const { data } = await supabase
        .from('municipalities')
        .select('id, name, name_sami, slug')
        .eq('language_area_id', entityId)
        .order('name')

      if (data) {
        setChildren(data.map(m => ({ ...m, type: 'municipality' as const })))
      }
    } else if (entityType === 'municipality') {
      const { data } = await supabase
        .from('places')
        .select('id, name, name_sami, slug')
        .eq('municipality_id', entityId)
        .order('name')

      if (data) {
        setChildren(data.map(p => ({ ...p, type: 'place' as const })))
      }
    }
  }, [supabase, entityType, entityId])

  // Check if starred
  const checkStarred = useCallback(async () => {
    if (!currentUserId) return

    const table = entityType === 'language_area' ? 'user_starred_language_areas' :
                  entityType === 'municipality' ? 'user_starred_municipalities' : 'user_starred_places'
    const column = entityType === 'language_area' ? 'language_area_id' :
                   entityType === 'municipality' ? 'municipality_id' : 'place_id'

    const { data } = await supabase
      .from(table)
      .select('id')
      .eq('user_id', currentUserId)
      .eq(column, entityId)
      .maybeSingle()

    setIsStarred(!!data)
  }, [supabase, currentUserId, entityType, entityId])

  useEffect(() => {
    fetchEntity()
    fetchImages()
    fetchChildren()
  }, [fetchEntity, fetchImages, fetchChildren])

  useEffect(() => {
    checkStarred()
  }, [checkStarred])

  // Toggle star
  const toggleStar = async () => {
    if (!currentUserId) {
      toast.error('Du må være innlogget for å stjernemerke')
      return
    }

    const table = entityType === 'language_area' ? 'user_starred_language_areas' :
                  entityType === 'municipality' ? 'user_starred_municipalities' : 'user_starred_places'
    const column = entityType === 'language_area' ? 'language_area_id' :
                   entityType === 'municipality' ? 'municipality_id' : 'place_id'

    if (isStarred) {
      await supabase.from(table).delete().eq('user_id', currentUserId).eq(column, entityId)
      setIsStarred(false)
      toast.success('Fjernet fra favoritter')
      // Dispatch event for real-time sidebar update
      window.dispatchEvent(new CustomEvent('starred-locations-changed'))
    } else {
      await supabase.from(table).insert({ user_id: currentUserId, [column]: entityId })
      setIsStarred(true)
      toast.success('Lagt til i favoritter')
      // Dispatch event for real-time sidebar update
      window.dispatchEvent(new CustomEvent('starred-locations-changed'))
    }
  }

  // Upload image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUserId) return

    if (images.length >= 5) {
      toast.error('Maks 5 bilder per sted')
      return
    }

    setUploadingImage(true)

    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${entityType}/${entityId}/${Date.now()}.${fileExt}`

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
        [column]: entityId,
        image_url: publicUrl,
        uploaded_by: currentUserId,
        sort_order: images.length,
      })

      if (dbError) throw dbError

      toast.success('Bilde lastet opp')
      fetchImages()
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Kunne ikke laste opp bilde')
    } finally {
      setUploadingImage(false)
    }
  }

  // Get entity icon and color - all use green MapPin for consistency
  const getEntityStyle = () => {
    const label = entityType === 'language_area' ? 'Språkområde' :
                  entityType === 'municipality' ? 'Kommune' : 'By/sted'
    return { icon: MapPin, color: 'text-green-600', bg: 'bg-green-100', label }
  }

  const style = getEntityStyle()
  const Icon = style.icon

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!entity) {
    return (
      <div className="text-center py-12 text-gray-500">
        Kunne ikke finne dette stedet
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        {/* Type badge and parent info */}
        <div className="flex items-center gap-2 mb-3">
          <div className={cn('px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1', style.bg, style.color)}>
            <Icon className="w-3 h-3" />
            {style.label}
          </div>
          {parentInfo && (
            <span className="text-xs text-gray-400">
              i {parentInfo.name}
            </span>
          )}
        </div>

        {/* Title and Action Buttons */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{entity.name}</h1>
            {entity.name_sami && (
              <p className="text-lg text-gray-500 mt-1">{entity.name_sami}</p>
            )}
          </div>

          <div className="flex gap-2">
            {/* Star button */}
            <div className="flex flex-col items-center">
              <button
                onClick={toggleStar}
                className={cn(
                  'p-3 rounded-full transition-colors',
                  isStarred
                    ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
                    : 'text-gray-300 bg-gray-50 hover:bg-gray-100 hover:text-gray-400'
                )}
              >
                <Star className={cn('w-6 h-6', isStarred && 'fill-current')} />
              </button>
              <span className="text-[10px] text-gray-400 mt-1 text-center whitespace-nowrap">
                Favoritt
              </span>
            </div>

            {/* Edit button */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => setSuggestionModalOpen(true)}
                className="p-3 rounded-full text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <Pencil className="w-6 h-6" />
              </button>
              <span className="text-[10px] text-gray-400 mt-1 text-center whitespace-nowrap">
                Rediger
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="border-t border-gray-100 pt-4">
          {entity.description ? (
            <p className="text-gray-600 text-sm whitespace-pre-wrap">{entity.description}</p>
          ) : (
            <p className="text-gray-400 text-sm italic">Ingen beskrivelse ennå</p>
          )}
        </div>

        {/* Images */}
        {images.length > 0 && (
          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className={cn(
              'grid gap-2',
              images.length === 1 && 'grid-cols-1',
              images.length === 2 && 'grid-cols-2',
              images.length >= 3 && 'grid-cols-3'
            )}>
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  className={cn(
                    'relative rounded-lg overflow-hidden bg-gray-100',
                    images.length === 1 && 'aspect-video',
                    images.length === 2 && 'aspect-square',
                    images.length >= 3 && idx === 0 && images.length > 3 && 'col-span-2 row-span-2 aspect-square',
                    images.length >= 3 && idx > 0 && 'aspect-square'
                  )}
                >
                  <Image
                    src={img.image_url}
                    alt={img.caption || entity.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs - Innlegg alltid først */}
      <Tabs defaultValue="innlegg" className="flex-1 flex flex-col min-h-0">
        <div className="flex justify-center mb-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="innlegg">
              <FileText className="w-4 h-4" />
              Innlegg
            </TabsTrigger>
            <TabsTrigger value="kalender">
              <Calendar className="w-4 h-4" />
              Kalender
            </TabsTrigger>
            {entityType === 'language_area' && (
              <TabsTrigger value="kommuner">
                <Building2 className="w-4 h-4" />
                Kommuner
              </TabsTrigger>
            )}
            {entityType === 'municipality' && (
              <TabsTrigger value="steder">
                <MapPin className="w-4 h-4" />
                Steder
              </TabsTrigger>
            )}
            <TabsTrigger value="samfunn">
              <Users className="w-4 h-4" />
              Samfunn
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 1. Posts tab - alltid først */}
        <TabsContent value="innlegg" className="flex-1 overflow-y-auto mt-4">
          <Feed
            geography={{
              type: entityType === 'language_area' ? 'language_area' :
                    entityType === 'municipality' ? 'municipality' : 'place',
              id: entityId,
            }}
            geographyName={entity.name}
            showFilters={false}
          />
        </TabsContent>

        {/* 2. Calendar tab */}
        <TabsContent value="kalender" className="flex-1 overflow-y-auto mt-4">
          <div className="text-center py-8 text-gray-400">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Kalender kommer snart</p>
          </div>
        </TabsContent>

        {/* 3. Kommuner tab (for språkområder) */}
        {entityType === 'language_area' && (
          <TabsContent value="kommuner" className="flex-1 overflow-y-auto mt-4">
            {children.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Ingen kommuner registrert</p>
              </div>
            ) : (
              <div className="space-y-2">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => onNavigate?.(child.type, child.id)}
                    className="w-full flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-left"
                  >
                    <div className="p-2 rounded-lg bg-orange-100">
                      <Building2 className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{child.name}</p>
                      {child.name_sami && (
                        <p className="text-sm text-gray-500">{child.name_sami}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* 3. Steder tab (for kommuner) */}
        {entityType === 'municipality' && (
          <TabsContent value="steder" className="flex-1 overflow-y-auto mt-4">
            {children.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Ingen steder registrert</p>
              </div>
            ) : (
              <div className="space-y-2">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => onNavigate?.(child.type, child.id)}
                    className="w-full flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-left"
                  >
                    <div className="p-2 rounded-lg bg-purple-100">
                      <MapPin className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{child.name}</p>
                      {child.name_sami && (
                        <p className="text-sm text-gray-500">{child.name_sami}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* Communities tab */}
        <TabsContent value="samfunn" className="flex-1 overflow-y-auto mt-4">
          <div className="text-center py-8 text-gray-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Samfunn kommer snart</p>
            <p className="text-xs mt-2">Her vil virksomheter, bedrifter og ressurspersoner vises</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <SuggestChangeModal
        open={suggestionModalOpen}
        onOpenChange={setSuggestionModalOpen}
        entityType={entityType}
        entity={entity}
        suggestionType="edit_name"
        onSuccess={() => {
          fetchEntity()
          fetchImages()
        }}
      />
    </div>
  )
}
