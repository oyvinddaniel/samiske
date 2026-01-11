/**
 * Advanced Gallery Viewer
 * Global component for viewing image galleries with comments and likes
 *
 * Features:
 * - Masonry view: Vertical scrollable gallery with all images
 * - Single image view: Fullscreen with sidebar (profile, caption, comments, likes)
 * - Keyboard navigation: Arrow keys to navigate, ESC to close
 * - Loop navigation: Last image → First image
 *
 * Usage:
 * <AdvancedGalleryViewer
 *   images={images}
 *   initialIndex={0}
 *   context={{ type: 'geography', entity_id: 'uuid' }}
 *   onClose={() => setViewerOpen(false)}
 * />
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle } from 'lucide-react'
import type { GalleryImage, GalleryContext, GalleryViewMode } from '@/lib/types/gallery'
import { getMediaUrl } from '@/lib/media/mediaUrls'
import { GalleryImageSidebar } from './GalleryImageSidebar'
import { PostGallerySidebar } from './PostGallerySidebar'
import { MobileMasonryHeader } from './MobileMasonryHeader'
import { MobileSingleImageView } from './MobileSingleImageView'

// Helper function to get image URL - supports both storage_path and direct URL
function getImageUrl(image: GalleryImage, sizeRequest?: 'thumb' | 'medium' | 'large' | 'original'): string {
  // If image has storage_path, use MediaService
  if (image.storage_path) {
    // Map our size names to MediaService size names
    const mediaSize: 'thumb' | 'medium' | 'large' | 'original' = sizeRequest || 'medium'
    return getMediaUrl(image.storage_path, mediaSize as any) // Type assertion needed for compatibility
  }
  // Otherwise use thumbnail_url for thumbnails, url for others
  if (sizeRequest === 'thumb' && image.thumbnail_url) {
    return image.thumbnail_url
  }
  // Fallback to direct URL
  return image.url || image.thumbnail_url || ''
}

interface AdvancedGalleryViewerProps {
  images: GalleryImage[]
  initialIndex?: number
  initialMode?: GalleryViewMode
  context: GalleryContext
  onClose: () => void
}

export function AdvancedGalleryViewer({
  images,
  initialIndex = 0,
  initialMode = 'masonry',
  context,
  onClose
}: AdvancedGalleryViewerProps) {
  const [viewMode, setViewMode] = useState<GalleryViewMode>(initialMode)
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  const currentImage = images[currentIndex]

  // Lock body scroll
  useEffect(() => {
    // Simple approach - just hide overflow
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (viewMode === 'single') {
        setViewMode('masonry')
      } else {
        onClose()
      }
    } else if (viewMode === 'single') {
      if (e.key === 'ArrowLeft') {
        setCurrentIndex(i => (i - 1 + images.length) % images.length)
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(i => (i + 1) % images.length)
      }
    }
  }, [viewMode, images.length, onClose])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Handle image click from masonry view
  const handleImageClick = (index: number) => {
    setCurrentIndex(index)
    setViewMode('single')
  }

  // Navigate to next image (loop)
  const goToNext = () => {
    setCurrentIndex(i => (i + 1) % images.length)
  }

  // Navigate to previous image (loop)
  const goToPrevious = () => {
    setCurrentIndex(i => (i - 1 + images.length) % images.length)
  }

  if (viewMode === 'masonry') {
    return (
      <MasonryGalleryView
        images={images}
        context={context}
        onImageClick={handleImageClick}
        onClose={onClose}
      />
    )
  }

  return (
    <SingleImageView
      image={currentImage}
      imageIndex={currentIndex}
      totalImages={images.length}
      context={context}
      onNext={goToNext}
      onPrevious={goToPrevious}
      onBack={() => setViewMode('masonry')}
      onClose={onClose}
    />
  )
}

// =====================================================
// MASONRY GALLERY VIEW
// =====================================================

interface MasonryGalleryViewProps {
  images: GalleryImage[]
  context: GalleryContext
  onImageClick: (index: number) => void
  onClose: () => void
}

function MasonryGalleryView({ images, context, onImageClick, onClose }: MasonryGalleryViewProps) {
  const [isMobile, setIsMobile] = useState(false)

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // For post-type galleries, show sidebar with post context
  if (context.type === 'post') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col md:flex-row">
        {/* Desktop: Left Sidebar - Post Context */}
        <div className="hidden md:block">
          <PostGallerySidebar
            context={context}
            viewMode="masonry"
            onClose={onClose}
          />
        </div>

        {/* Masonry Grid - iOS Safari fix: Use absolute positioning instead of flex-1 */}
        <div className="flex-1 relative bg-black min-w-0">
          {/* Header (desktop only) */}
          <div className="hidden md:flex absolute top-0 left-0 right-0 z-10 px-6 py-4 items-center justify-between border-b border-white/10 bg-black">
            <h2 className="text-white text-lg font-semibold">
              Galleri ({images.length} bilder)
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Lukk galleri"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Masonry Grid with Vertical Scroll - iOS Safari fix: Absolute positioning with explicit height */}
          <div
            className="absolute inset-0 md:top-[73px] md:bottom-[52px] bottom-0 overflow-y-auto bg-black"
            style={{
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* Mobile: Post context header at top */}
            {isMobile && context.post_data && (
              <MobileMasonryHeader
                postData={context.post_data}
                onClose={onClose}
              />
            )}

            <div className="max-w-7xl mx-auto p-6 pb-24">
              <div className="columns-1 sm:columns-2 md:columns-3 gap-4">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => onImageClick(index)}
                    className="mb-4 break-inside-avoid relative group cursor-pointer"
                  >
                    <img
                      src={getImageUrl(image, 'medium')}
                      alt={image.alt_text || image.caption || 'Bilde'}
                      className="w-full rounded-lg hover:opacity-90 transition-opacity"
                    />

                    {/* Engagement Badges - Always visible on desktop, pill-shaped */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 md:opacity-100 opacity-0 group-hover:opacity-100 transition-opacity">
                      {image.like_count !== undefined && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm">
                          <Heart className="w-3.5 h-3.5 text-white" />
                          <span className="text-xs font-medium text-white">{image.like_count}</span>
                        </div>
                      )}
                      {image.comment_count !== undefined && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm">
                          <MessageCircle className="w-3.5 h-3.5 text-white" />
                          <span className="text-xs font-medium text-white">{image.comment_count}</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="hidden md:block absolute bottom-0 left-0 right-0 px-6 py-3 bg-black/50 border-t border-white/10">
            <p className="text-white/60 text-sm text-center">
              Klikk på et bilde for å se det i fullskjerm • ESC for å lukke
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Default masonry view (for geography, etc.)
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between border-b border-white/10">
        <h2 className="text-white text-lg font-semibold">
          Galleri ({images.length} bilder)
        </h2>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Lukk galleri"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Masonry Grid with Vertical Scroll */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          <div className="columns-1 sm:columns-2 md:columns-3 gap-4">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => onImageClick(index)}
                className="mb-4 break-inside-avoid relative group cursor-pointer"
              >
                <img
                  src={getImageUrl(image, 'medium')}
                  alt={image.alt_text || image.caption || 'Bilde'}
                  className="w-full rounded-lg hover:opacity-90 transition-opacity"
                />

                {/* Engagement Badges - Always visible on desktop, pill-shaped */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 md:opacity-100 opacity-0 group-hover:opacity-100 transition-opacity">
                  {image.like_count !== undefined && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm">
                      <Heart className="w-3.5 h-3.5 text-white" />
                      <span className="text-xs font-medium text-white">{image.like_count}</span>
                    </div>
                  )}
                  {image.comment_count !== undefined && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm">
                      <MessageCircle className="w-3.5 h-3.5 text-white" />
                      <span className="text-xs font-medium text-white">{image.comment_count}</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="flex-shrink-0 px-6 py-3 bg-black/50 border-t border-white/10">
        <p className="text-white/60 text-sm text-center">
          Klikk på et bilde for å se det i fullskjerm • ESC for å lukke
        </p>
      </div>
    </div>
  )
}

// =====================================================
// SINGLE IMAGE VIEW
// =====================================================

interface SingleImageViewProps {
  image: GalleryImage
  imageIndex: number
  totalImages: number
  context: GalleryContext
  onNext: () => void
  onPrevious: () => void
  onBack: () => void
  onClose: () => void
}

function SingleImageView({
  image,
  imageIndex,
  totalImages,
  context,
  onNext,
  onPrevious,
  onBack,
  onClose
}: SingleImageViewProps) {
  const [isMobile, setIsMobile] = useState(false)

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Mobile: Use Complete Feed Card design for posts
  if (isMobile && context.type === 'post') {
    return (
      <MobileSingleImageView
        image={image}
        imageIndex={imageIndex}
        totalImages={totalImages}
        context={context}
        onNext={onNext}
        onPrevious={onPrevious}
        onClose={onClose}
      />
    )
  }

  // Desktop: Sidebar + Large Image
  return (
    <div className="fixed inset-0 bg-black z-50 flex">
      {/* Left Sidebar - Context-aware (Post vs Geography) */}
      {context.type === 'post' ? (
        <PostGallerySidebar
          context={context}
          currentImage={image}
          viewMode="single"
          onBackToMasonry={onBack}
          onClose={onClose}
        />
      ) : (
        <GalleryImageSidebar
          image={image}
          context={context}
          onBack={onBack}
          onClose={onClose}
        />
      )}

      {/* Main Image Area */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          aria-label="Lukk"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image */}
        <div className="relative max-w-full max-h-full p-8">
          <img
            src={getImageUrl(image, 'original')}
            alt={image.alt_text || image.caption || 'Bilde'}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>

        {/* Navigation Arrows */}
        {totalImages > 1 && (
          <>
            <button
              onClick={onPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              aria-label="Forrige bilde"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              aria-label="Neste bilde"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white text-sm">
          {imageIndex + 1} / {totalImages}
        </div>

        {/* Keyboard hint */}
        <div className="absolute bottom-4 right-4 bg-black/50 px-3 py-1.5 rounded-full text-white/60 text-xs">
          ← → piltaster • ESC tilbake
        </div>
      </div>
    </div>
  )
}
