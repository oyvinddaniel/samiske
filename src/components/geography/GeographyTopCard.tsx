'use client'

import { useState } from 'react'
import { Star, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GeographyActionMenu } from './GeographyActionMenu'
import { ImageManagementDialog } from './ImageManagementDialog'
import { GeographyImagesManagementDialog } from './GeographyImagesManagementDialog'
import { AdvancedGalleryViewer } from '@/components/gallery'
import type { GalleryImage as AdvancedGalleryImage } from '@/lib/types/gallery'

type EntityType = 'language_area' | 'municipality' | 'place'

interface GeographyImage {
  id: string
  image_url: string
  caption: string | null
  alt_text: string | null
  sort_order: number
  storage_path: string
  original_uploader_id: string
}

interface GalleryImage {
  id: string
  url: string
  caption: string | null
  alt_text: string | null
  storage_path: string
  original_uploader_id: string
}

interface GeographyTopCardProps {
  entityType: EntityType
  entity: {
    id: string
    name: string
    name_sami: string | null
    description: string | null
    code?: string
    slug?: string
    latitude?: number | null
    longitude?: number | null
  }
  images: GeographyImage[]
  parentInfo?: { name: string; type: string } | null
  isStarred: boolean
  isLoggedIn: boolean
  currentUserId: string | null
  onToggleStar: () => void
  onEdit: () => void
  onUploadImages?: () => void
  onReport?: () => void
  onNavigateToParent?: () => void
  onImageUpdated?: () => void
  loading?: boolean
  className?: string
}

export function GeographyTopCard({
  entityType,
  entity,
  images,
  parentInfo,
  isStarred,
  isLoggedIn,
  currentUserId,
  onToggleStar,
  onEdit,
  onUploadImages,
  onReport,
  onNavigateToParent,
  onImageUpdated,
  loading = false,
  className,
}: GeographyTopCardProps) {
  const [imagesManagementOpen, setImagesManagementOpen] = useState(false)

  // Get entity style based on type
  const getEntityStyle = () => {
    switch (entityType) {
      case 'language_area':
        return { bg: 'bg-blue-100', color: 'text-blue-700', label: 'Språkområde' }
      case 'municipality':
        return { bg: 'bg-orange-100', color: 'text-orange-700', label: 'Kommune' }
      case 'place':
        return { bg: 'bg-purple-100', color: 'text-purple-700', label: 'By/sted' }
    }
  }

  const style = getEntityStyle()

  // Convert images to gallery format
  const galleryImages: GalleryImage[] = images.map(img => ({
    id: img.id,
    url: img.image_url,
    caption: img.caption,
    alt_text: img.alt_text,
    storage_path: img.storage_path,
    original_uploader_id: img.original_uploader_id,
  }))

  // Check if we have coordinates for map link
  const hasCoordinates = entity.latitude !== null && entity.latitude !== undefined &&
                         entity.longitude !== null && entity.longitude !== undefined

  // Open in Google Maps
  const handleMapClick = () => {
    if (hasCoordinates) {
      window.open(`https://www.google.com/maps?q=${entity.latitude},${entity.longitude}`, '_blank')
    } else {
      const searchQuery = encodeURIComponent(`${entity.name}, Norway`)
      window.open(`https://www.google.com/maps/search/${searchQuery}`, '_blank')
    }
  }

  return (
    <div className={cn('rounded-2xl overflow-hidden shadow-sm', className)}>
      {/* Floating Card Design - Map/image background with floating info card */}
      {/* Map height increased 50%: 220px -> 330px */}
      <div className="relative h-[330px]">
        {/* Background - Always map/placeholder (no image here) */}
        <div className="absolute inset-0">
          {hasCoordinates ? (
            // Google Maps Static API
            <GoogleStaticMap
              latitude={entity.latitude!}
              longitude={entity.longitude!}
              name={entity.name}
            />
          ) : (
            // Fallback placeholder when no coordinates or API key
            <div className="w-full h-full bg-gradient-to-br from-emerald-100 via-blue-100 to-cyan-100">
              {/* Topographic-style pattern */}
              <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="topo" patternUnits="userSpaceOnUse" width="20" height="20">
                    <circle cx="10" cy="10" r="8" fill="none" stroke="#0891b2" strokeWidth="0.5" opacity="0.5" />
                    <circle cx="10" cy="10" r="4" fill="none" stroke="#0891b2" strokeWidth="0.5" opacity="0.3" />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#topo)" />
              </svg>
              {/* Location marker at 70% vertical height */}
              <div className="absolute inset-0 flex justify-center" style={{ top: '70%', transform: 'translateY(-50%)' }}>
                <div className="relative">
                  <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center shadow-xl">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 rotate-45 -z-10" />
                </div>
              </div>
            </div>
          )}
          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        {/* Top right: Map button only */}
        <div className="absolute top-3 left-3 z-10">
          <button
            onClick={handleMapClick}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
            aria-label="Åpne i Google Maps"
          >
            <MapPin className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Floating card at bottom */}
        <div className="absolute bottom-3 left-3 right-3 bg-white rounded-xl p-4 shadow-lg">
          <div className="flex gap-4">
            {/* Left side: Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', style.bg, style.color)}>
                  {style.label}
                </span>
                {parentInfo && (
                  <button
                    onClick={onNavigateToParent}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors truncate"
                  >
                    i {parentInfo.name}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 truncate">{entity.name}</h1>
                {/* Favorite button */}
                <button
                  onClick={onToggleStar}
                  disabled={loading}
                  className={cn(
                    'p-1 rounded-full transition-colors flex-shrink-0',
                    isStarred
                      ? 'text-yellow-500'
                      : 'text-gray-300 hover:text-gray-400'
                  )}
                  aria-label={isStarred ? 'Fjern fra favoritter' : 'Legg til i favoritter'}
                >
                  <Star className={cn('w-5 h-5', isStarred && 'fill-current')} />
                </button>
              </div>
              {entity.name_sami && (
                <p className="text-sm text-gray-500 truncate">{entity.name_sami}</p>
              )}
              {/* Description - truncated */}
              {entity.description && (
                <p className="text-xs text-gray-400 mt-1 line-clamp-1">{entity.description}</p>
              )}
            </div>

            {/* Right side: Gallery preview + 3-dot menu */}
            <div className="flex-shrink-0 flex items-start gap-2">
              {/* Magazine gallery (on left of menu) */}
              {galleryImages.length > 0 && (
                <MagazineGalleryPreview
                  images={galleryImages}
                  entityType={entityType}
                  entityId={entity.id}
                  entityName={entity.name}
                  currentUserId={currentUserId}
                  onImageUpdated={onImageUpdated}
                />
              )}
              {/* 3-dot menu (always on right) */}
              <GeographyActionMenu
                entityType={entityType}
                entityId={entity.id}
                entityName={entity.name}
                entityNameSami={entity.name_sami}
                latitude={entity.latitude}
                longitude={entity.longitude}
                isLoggedIn={isLoggedIn}
                hasImages={images.length > 0}
                onEdit={onEdit}
                onUploadImages={onUploadImages}
                onManageImages={() => setImagesManagementOpen(true)}
                onReport={onReport}
                municipalityName={parentInfo?.type === 'Kommune' ? parentInfo.name : undefined}
                onCoordinatesUpdated={() => {
                  window.location.reload()
                }}
                variant="default"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Images Management Dialog */}
      <GeographyImagesManagementDialog
        open={imagesManagementOpen}
        onClose={() => setImagesManagementOpen(false)}
        entityType={entityType}
        entityId={entity.id}
        entityName={entity.name}
        images={images}
        currentUserId={currentUserId}
        onImageUpdated={() => {
          setImagesManagementOpen(false)
          onImageUpdated?.()
        }}
      />
    </div>
  )
}

// Magazine Gallery Preview (#6 style) for the floating card
// Layout: Large image on right, 2 small stacked on left, horizontal strip below
interface MagazineGalleryPreviewProps {
  images: GalleryImage[]
  entityType: EntityType
  entityId: string
  entityName: string
  currentUserId: string | null
  onImageUpdated?: () => void
}

function MagazineGalleryPreview({ images, entityType, entityId, entityName, currentUserId, onImageUpdated }: MagazineGalleryPreviewProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [startIndex, setStartIndex] = useState(0)

  const handleImageClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setStartIndex(index)
    setViewerOpen(true)
  }

  // Gallery preview sizes (150% of original: 80px -> 120px)
  const GALLERY_WIDTH = 120   // 80 * 1.5
  const LARGE_SIZE = 108      // 72 * 1.5
  const SMALL_WIDTH = 48      // 32 * 1.5
  const TOP_HEIGHT = 75       // 50 * 1.5
  const BOTTOM_HEIGHT = 44    // 29 * 1.5
  const SMALL_STACK_WIDTH = 39 // 26 * 1.5

  // 1 image: Just the large image
  if (images.length === 1) {
    return (
      <>
        <button
          onClick={(e) => handleImageClick(0, e)}
          className="rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-400 transition-all"
          style={{ width: LARGE_SIZE, height: LARGE_SIZE }}
        >
          <img src={images[0].url} alt="" className="w-full h-full object-cover" />
        </button>
        {viewerOpen && (
          <GalleryViewer
            images={images}
            initialIndex={startIndex}
            onClose={() => setViewerOpen(false)}
            title={entityName}
            entityType={entityType}
            entityId={entityId}
            currentUserId={currentUserId}
            onImageUpdated={() => {
              onImageUpdated?.()
              setViewerOpen(false)
            }}
          />
        )}
      </>
    )
  }

  // 2 images: Small on left, large on right
  if (images.length === 2) {
    return (
      <>
        <div className="flex gap-1.5" style={{ height: LARGE_SIZE }}>
          {/* Small image on left */}
          <button
            onClick={(e) => handleImageClick(1, e)}
            className="rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-400 transition-all"
            style={{ width: SMALL_WIDTH }}
          >
            <img src={images[1].url} alt="" className="w-full h-full object-cover" />
          </button>
          {/* Large image on right */}
          <button
            onClick={(e) => handleImageClick(0, e)}
            className="rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-400 transition-all"
            style={{ width: LARGE_SIZE }}
          >
            <img src={images[0].url} alt="" className="w-full h-full object-cover" />
          </button>
        </div>
        {viewerOpen && (
          <GalleryViewer
            images={images}
            initialIndex={startIndex}
            onClose={() => setViewerOpen(false)}
            title={entityName}
            entityType={entityType}
            entityId={entityId}
            currentUserId={currentUserId}
            onImageUpdated={() => {
              onImageUpdated?.()
              setViewerOpen(false)
            }}
          />
        )}
      </>
    )
  }

  // 3 images: 2 small stacked on left, large on right
  if (images.length === 3) {
    return (
      <>
        <div className="flex gap-1.5" style={{ height: LARGE_SIZE }}>
          {/* 2 small stacked on left */}
          <div className="flex flex-col gap-1" style={{ width: SMALL_WIDTH }}>
            <button
              onClick={(e) => handleImageClick(1, e)}
              className="flex-1 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-400 transition-all"
            >
              <img src={images[1].url} alt="" className="w-full h-full object-cover" />
            </button>
            <button
              onClick={(e) => handleImageClick(2, e)}
              className="flex-1 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-400 transition-all"
            >
              <img src={images[2].url} alt="" className="w-full h-full object-cover" />
            </button>
          </div>
          {/* Large image on right */}
          <button
            onClick={(e) => handleImageClick(0, e)}
            className="rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-400 transition-all"
            style={{ width: LARGE_SIZE }}
          >
            <img src={images[0].url} alt="" className="w-full h-full object-cover" />
          </button>
        </div>
        {viewerOpen && (
          <GalleryViewer
            images={images}
            initialIndex={startIndex}
            onClose={() => setViewerOpen(false)}
            title={entityName}
            entityType={entityType}
            entityId={entityId}
            currentUserId={currentUserId}
            onImageUpdated={() => {
              onImageUpdated?.()
              setViewerOpen(false)
            }}
          />
        )}
      </>
    )
  }

  // 4+ images: Gallery preview as one unit
  // Top: 2 small stacked + 1 large, Bottom: 1 horizontal (100% width)
  const remainingCount = images.length - 4
  return (
    <>
      <div className="flex flex-col gap-1.5" style={{ width: GALLERY_WIDTH }}>
        {/* Top row: 2 small + 1 large */}
        <div className="flex gap-1.5" style={{ height: TOP_HEIGHT }}>
          {/* 2 small stacked on left */}
          <div className="flex flex-col gap-1 flex-shrink-0" style={{ width: SMALL_STACK_WIDTH }}>
            <button
              onClick={(e) => handleImageClick(1, e)}
              className="flex-1 rounded-md overflow-hidden hover:ring-2 hover:ring-blue-400 transition-all"
            >
              <img src={images[1].url} alt="" className="w-full h-full object-cover" />
            </button>
            <button
              onClick={(e) => handleImageClick(2, e)}
              className="flex-1 rounded-md overflow-hidden hover:ring-2 hover:ring-blue-400 transition-all"
            >
              <img src={images[2].url} alt="" className="w-full h-full object-cover" />
            </button>
          </div>
          {/* Large image on right */}
          <button
            onClick={(e) => handleImageClick(0, e)}
            className="flex-1 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-400 transition-all"
          >
            <img src={images[0].url} alt="" className="w-full h-full object-cover" />
          </button>
        </div>
        {/* Bottom row: 1 horizontal image - 100% width of gallery preview */}
        <button
          onClick={(e) => handleImageClick(3, e)}
          className="w-full rounded-md overflow-hidden hover:ring-2 hover:ring-blue-400 transition-all relative"
          style={{ height: BOTTOM_HEIGHT }}
        >
          <img src={images[3].url} alt="" className="w-full h-full object-cover" />
          {remainingCount > 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">+{remainingCount}</span>
            </div>
          )}
        </button>
      </div>
      {viewerOpen && (
        <GalleryViewer
          images={images}
          initialIndex={startIndex}
          onClose={() => setViewerOpen(false)}
          title={entityName}
          entityType={entityType}
          entityId={entityId}
          currentUserId={currentUserId}
          onImageUpdated={() => {
            onImageUpdated?.()
            setViewerOpen(false)
          }}
        />
      )}
    </>
  )
}

// Full gallery viewer - Using new AdvancedGalleryViewer
interface GalleryViewerProps {
  images: GalleryImage[]
  initialIndex: number
  onClose: () => void
  title: string
  entityType: EntityType
  entityId: string
  currentUserId: string | null
  onImageUpdated?: () => void
}

function GalleryViewer({ images, initialIndex, onClose, title, entityType, entityId, currentUserId, onImageUpdated }: GalleryViewerProps) {
  // Convert images to AdvancedGalleryImage format
  const advancedGalleryImages: AdvancedGalleryImage[] = images.map(img => ({
    id: img.id,
    storage_path: img.storage_path,
    caption: img.caption,
    alt_text: img.alt_text,
    width: null,
    height: null,
    sort_order: 0,
    created_at: new Date().toISOString(),
    original_uploader_id: img.original_uploader_id,
    uploaded_by: currentUserId,
    uploader: {
      id: currentUserId || '',
      full_name: 'Bruker', // Will be fetched from database in AdvancedGalleryViewer
      avatar_url: null
    }
  }))

  // Map entity type
  const contextType = entityType === 'language_area' ? 'geography'
                    : entityType === 'municipality' ? 'geography'
                    : 'geography'

  return (
    <AdvancedGalleryViewer
      images={advancedGalleryImages}
      initialIndex={initialIndex}
      initialMode="masonry"
      context={{
        type: contextType,
        entity_id: entityId,
        entity_name: title,
        can_comment: true,
        can_like: true
      }}
      onClose={onClose}
    />
  )
}

// Google Static Map component
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

interface GoogleStaticMapProps {
  latitude: number
  longitude: number
  name: string
}

function GoogleStaticMap({ latitude, longitude, name }: GoogleStaticMapProps) {
  if (!GOOGLE_MAPS_API_KEY) {
    // Fallback if no API key
    return (
      <div className="w-full h-full bg-gradient-to-br from-emerald-100 via-blue-100 to-cyan-100 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <MapPin className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Kart ikke tilgjengelig</p>
        </div>
      </div>
    )
  }

  // Offset center slightly south so marker appears higher
  const centerLatitude = latitude - 0.2

  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${centerLatitude},${longitude}&zoom=7&size=800x600&scale=2&maptype=roadmap&markers=color:red%7C${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`

  return (
    <img
      src={mapUrl}
      alt={`Kart over ${name}`}
      className="w-full h-full object-cover"
    />
  )
}
