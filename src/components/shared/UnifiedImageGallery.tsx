'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export interface GalleryImage {
  id: string
  url: string
  caption?: string | null
}

interface GalleryPreviewProps {
  images: GalleryImage[]
  maxPreviewImages?: number
  onOpenGallery?: (startIndex: number) => void
  className?: string
  showThumbnailStrip?: boolean
}

// Preview component - shows grid layout with optional thumbnail strip
export function GalleryPreview({
  images,
  maxPreviewImages = 5,
  onOpenGallery,
  className,
  showThumbnailStrip = false,
}: GalleryPreviewProps) {
  if (!images || images.length === 0) return null

  const displayImages = images.slice(0, maxPreviewImages)
  const remainingCount = images.length - maxPreviewImages

  const handleClick = (index: number) => {
    onOpenGallery?.(index)
  }

  // Single image - full width
  if (displayImages.length === 1) {
    return (
      <div className={cn('space-y-2', className)}>
        <button
          onClick={() => handleClick(0)}
          className="w-full overflow-hidden rounded-xl bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 relative aspect-video"
        >
          <Image
            src={displayImages[0].url}
            alt={displayImages[0].caption || 'Bilde'}
            fill
            className="object-cover"
          />
        </button>
      </div>
    )
  }

  // 2 images - side by side
  if (displayImages.length === 2) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden">
          {displayImages.map((img, i) => (
            <button
              key={img.id}
              onClick={() => handleClick(i)}
              className="aspect-square overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-500 relative"
            >
              <Image src={img.url} alt={img.caption || ''} fill className="object-cover" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  // 3+ images - main image + grid
  return (
    <div className={cn('space-y-2', className)}>
      {/* Main image */}
      <button
        onClick={() => handleClick(0)}
        className="w-full overflow-hidden rounded-xl bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 relative aspect-video"
      >
        <Image
          src={displayImages[0].url}
          alt={displayImages[0].caption || 'Hovedbilde'}
          fill
          className="object-cover"
        />
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            Se {images.length} bilder
          </div>
        )}
      </button>

      {/* Thumbnail strip */}
      {showThumbnailStrip && displayImages.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {displayImages.slice(0, 6).map((img, i) => (
            <button
              key={img.id}
              onClick={() => handleClick(i)}
              className={cn(
                'flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden relative',
                'focus-visible:ring-2 focus-visible:ring-blue-500',
                'hover:opacity-80 transition-opacity'
              )}
            >
              <Image src={img.url} alt="" fill className="object-cover" />
              {i === 5 && remainingCount > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">+{remainingCount}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface GalleryViewerProps {
  images: GalleryImage[]
  initialIndex?: number
  onClose: () => void
  title?: string
}

// Full viewer component
export function GalleryViewer({ images, initialIndex = 0, onClose, title }: GalleryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Lock body scroll
  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.top = `-${scrollY}px`

    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.top = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((i) => (i - 1 + images.length) % images.length)
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((i) => (i + 1) % images.length)
      }
    },
    [images.length, onClose]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.currentTarget as HTMLElement
    target.dataset.startX = e.touches[0].clientX.toString()
    target.dataset.startY = e.touches[0].clientY.toString()
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const target = e.currentTarget as HTMLElement
    const startX = parseFloat(target.dataset.startX || '0')
    const startY = parseFloat(target.dataset.startY || '0')
    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    const diffX = startX - endX
    const diffY = endY - startY

    // Horizontal swipe - change image
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        setCurrentIndex((i) => (i + 1) % images.length)
      } else {
        setCurrentIndex((i) => (i - 1 + images.length) % images.length)
      }
      return
    }

    // Swipe down to close
    if (diffY > 100) {
      onClose()
    }
  }

  const currentImage = images[currentIndex]

  if (isMobile) {
    return (
      <div
        className="fixed inset-0 bg-black z-50 flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between">
          <div className="flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIndex ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
          <button onClick={onClose} className="text-white/70 text-xl">
            ✕
          </button>
        </div>

        {/* Image */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full">
            <img
              src={currentImage.url}
              alt={currentImage.caption || ''}
              className="max-w-full max-h-[80vh] rounded-2xl object-contain"
            />
            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentIndex((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/60 rounded-full text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentIndex((i) => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/60 rounded-full text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Caption and counter */}
        <div className="flex-shrink-0 p-4 text-center">
          {currentImage.caption && (
            <p className="text-white/80 text-sm mb-2">{currentImage.caption}</p>
          )}
          <p className="text-white/50 text-sm">
            {currentIndex + 1} / {images.length}
          </p>
        </div>
      </div>
    )
  }

  // Desktop
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="relative max-w-5xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white"
        >
          ✕
        </button>

        {/* Title */}
        {title && (
          <div className="absolute top-4 left-4 text-white/70 text-sm">{title}</div>
        )}

        {/* Image */}
        <img
          src={currentImage.url}
          alt={currentImage.caption || ''}
          className="max-w-full max-h-[85vh] rounded-2xl object-contain mx-auto"
        />

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((i) => (i - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentIndex((i) => (i + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Caption and counter */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center">
          {currentImage.caption && (
            <p className="text-white/80 text-sm mb-1 max-w-md">{currentImage.caption}</p>
          )}
          <div className="bg-black/50 px-4 py-2 rounded-full text-white text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnail strip at bottom */}
        {images.length > 1 && (
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
            {images.slice(0, 8).map((img, i) => (
              <button
                key={img.id}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  'w-12 h-12 rounded-lg overflow-hidden relative transition-all',
                  i === currentIndex ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-80'
                )}
              >
                <Image src={img.url} alt="" fill className="object-cover" />
              </button>
            ))}
            {images.length > 8 && (
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center text-white text-sm">
                +{images.length - 8}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Combined component with state management
interface UnifiedImageGalleryProps {
  images: GalleryImage[]
  maxPreviewImages?: number
  showThumbnailStrip?: boolean
  title?: string
  className?: string
}

export function UnifiedImageGallery({
  images,
  maxPreviewImages = 5,
  showThumbnailStrip = true,
  title,
  className,
}: UnifiedImageGalleryProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [startIndex, setStartIndex] = useState(0)

  const handleOpenGallery = (index: number) => {
    setStartIndex(index)
    setViewerOpen(true)
  }

  return (
    <>
      <GalleryPreview
        images={images}
        maxPreviewImages={maxPreviewImages}
        showThumbnailStrip={showThumbnailStrip}
        onOpenGallery={handleOpenGallery}
        className={className}
      />
      {viewerOpen && (
        <GalleryViewer
          images={images}
          initialIndex={startIndex}
          onClose={() => setViewerOpen(false)}
          title={title}
        />
      )}
    </>
  )
}
