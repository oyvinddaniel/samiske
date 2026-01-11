'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  MapPin, Building2,
  Calendar, Users, FileText, Loader2
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Feed } from '@/components/feed/Feed'
import { SuggestChangeModal } from './SuggestChangeModal'
import { GeographyTopCard } from './GeographyTopCard'
import { ImageUploadModal } from './ImageUploadModal'
import { MediaService, getMediaUrl, MediaEntityType } from '@/lib/media'

type EntityType = 'language_area' | 'municipality' | 'place'

// Mapping til MediaService entity types
const MEDIA_ENTITY_MAP: Record<EntityType, MediaEntityType> = {
  language_area: 'geography_language_area',
  municipality: 'geography_municipality',
  place: 'geography_place',
}

interface GeographyImage {
  id: string
  image_url: string
  caption: string | null
  alt_text: string | null
  sort_order: number
  storage_path: string
  original_uploader_id: string
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
    latitude?: number | null
    longitude?: number | null
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
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  // Loading
  const [loading, setLoading] = useState(true)

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
      query = supabase.from('municipalities').select('id, name, name_sami, description, slug, language_area_id, latitude, longitude').eq('id', entityId).single()
    } else {
      query = supabase.from('places').select('id, name, name_sami, description, slug, municipality_id, latitude, longitude').eq('id', entityId).single()
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

  // Fetch images from both new media table and legacy geography_images
  const fetchImages = useCallback(async () => {
    const allImages: GeographyImage[] = []

    // 1. Hent fra ny media-tabell med original_uploader_id
    const mediaEntityType = MEDIA_ENTITY_MAP[entityType]
    const { data: mediaData } = await supabase
      .from('media')
      .select('id, storage_path, caption, alt_text, sort_order, original_uploader_id')
      .eq('entity_type', mediaEntityType)
      .eq('entity_id', entityId)
      .is('deleted_at', null)
      .order('sort_order')

    if (mediaData) {
      for (const record of mediaData) {
        allImages.push({
          id: record.id,
          image_url: getMediaUrl(record.storage_path, 'original'),
          caption: record.caption,
          alt_text: record.alt_text,
          sort_order: record.sort_order,
          storage_path: record.storage_path,
          original_uploader_id: record.original_uploader_id,
        })
      }
    }

    // 2. Hent fra legacy geography_images (for bakoverkompatibilitet)
    const column = entityType === 'language_area' ? 'language_area_id' :
                   entityType === 'municipality' ? 'municipality_id' : 'place_id'

    const { data: legacyData } = await supabase
      .from('geography_images')
      .select('*')
      .eq(column, entityId)
      .order('sort_order')
      .limit(20)

    if (legacyData) {
      for (const img of legacyData) {
        // Unngå duplikater (sjekk om URL allerede finnes)
        if (!allImages.some(existing => existing.image_url === img.image_url)) {
          allImages.push({
            id: img.id,
            image_url: img.image_url,
            caption: img.caption,
            alt_text: null,
            sort_order: img.sort_order + 1000, // Legacy bilder sorteres etter nye
            storage_path: '',
            original_uploader_id: '', // Legacy images don't have uploader
          })
        }
      }
    }

    // Sorter alle bilder
    allImages.sort((a, b) => a.sort_order - b.sort_order)
    setImages(allImages)
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
      {/* New Top Card with 3-dot menu, map preview, and gallery */}
      <GeographyTopCard
        entityType={entityType}
        entity={entity}
        images={images}
        parentInfo={parentInfo}
        isStarred={isStarred}
        isLoggedIn={!!currentUserId}
        currentUserId={currentUserId}
        onToggleStar={toggleStar}
        onEdit={() => setSuggestionModalOpen(true)}
        onUploadImages={() => setUploadModalOpen(true)}
        onImageUpdated={fetchImages}
        className="mb-6"
      />

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

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        entityType={entityType}
        entityId={entityId}
        currentImageCount={images.length}
        onUploadComplete={fetchImages}
      />
    </div>
  )
}
