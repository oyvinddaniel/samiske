'use client'

import { useState, useEffect, useCallback } from 'react'

interface ImageGalleryProps {
  images: string[]
  alt?: string
  onImageClick?: (index: number) => void
  style?: 'auto' | 'grid-2x3' | 'featured-grid' | 'asymmetric' | 'magazine' | 'vertical-strip' | 'waterfall' | 'polaroid'
}

// Preview component for feed - shows grid layout
export function ImageGalleryPreview({ images, alt, onImageClick, style = 'auto' }: ImageGalleryProps) {
  // Debug: Log received images
  if (images && images.length > 1) {
    console.log('🎨 ImageGalleryPreview received:', images.length, 'images')
    console.log('🎨 First 3 URLs:', images.slice(0, 3).map(url => url.substring(0, 50) + '...'))
  }

  if (!images || images.length === 0) return null

  const handleClick = (index: number) => {
    if (onImageClick) {
      onImageClick(index)
    }
  }

  // Auto-select style based on image count if style='auto'
  const selectedStyle = style === 'auto' ? getAutoStyle(images.length) : style

  // Single image - always the same
  if (images.length === 1) {
    return (
      <button
        onClick={() => handleClick(0)}
        className="w-full overflow-hidden rounded-xl bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label={alt || 'Åpne bilde'}
      >
        <img
          src={images[0]}
          alt={alt || 'Bilde'}
          className="w-full h-auto max-w-full"
        />
      </button>
    )
  }

  // 2 images - side by side
  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className="aspect-square overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={`Åpne bilde ${i + 1}`}
          >
            <img src={img} alt="" className="w-full h-full object-cover rounded-xl" />
          </button>
        ))}
      </div>
    )
  }

  // 3 images - 1 large + 2 small
  if (images.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={() => handleClick(0)}
          className="row-span-2 overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Åpne bilde 1"
        >
          <img src={images[0]} alt="" className="w-full h-full object-cover rounded-xl" />
        </button>
        {images.slice(1).map((img, i) => (
          <button
            key={i}
            onClick={() => handleClick(i + 1)}
            className="aspect-square overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={`Åpne bilde ${i + 2}`}
          >
            <img src={img} alt="" className="w-full h-full object-cover rounded-xl" />
          </button>
        ))}
      </div>
    )
  }

  // 4 images - grid
  if (images.length === 4) {
    return (
      <div className="grid grid-cols-2 gap-1.5">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className="aspect-square overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={`Åpne bilde ${i + 1}`}
          >
            <img src={img} alt="" className="w-full h-full object-cover rounded-xl" />
          </button>
        ))}
      </div>
    )
  }

  // 5 images - Featured + Grid style
  if (images.length === 5 && selectedStyle === 'featured-grid') {
    return (
      <div className="space-y-1.5">
        <button
          onClick={() => handleClick(0)}
          className="w-full overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Åpne bilde 1"
        >
          <img src={images[0]} alt="" className="w-full aspect-video object-cover rounded-xl" />
        </button>
        <div className="grid grid-cols-4 gap-1.5">
          {images.slice(1, 5).map((img, i) => (
            <button
              key={i}
              onClick={() => handleClick(i + 1)}
              className="aspect-square overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label={`Åpne bilde ${i + 2}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover rounded-xl" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  // 6 images - Classic 2x3 Grid or Asymmetric
  if (images.length === 6) {
    if (selectedStyle === 'asymmetric') {
      return (
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => handleClick(0)} className="aspect-[3/4] overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="Åpne bilde 1">
            <img src={images[0]} alt="" className="w-full h-full object-cover rounded-xl" />
          </button>
          <div className="flex flex-col gap-1.5">
            <button onClick={() => handleClick(1)} className="aspect-square overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="Åpne bilde 2">
              <img src={images[1]} alt="" className="w-full h-full object-cover rounded-xl" />
            </button>
            <button onClick={() => handleClick(2)} className="aspect-[4/3] overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="Åpne bilde 3">
              <img src={images[2]} alt="" className="w-full h-full object-cover rounded-xl" />
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            <button onClick={() => handleClick(3)} className="aspect-[4/3] overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="Åpne bilde 4">
              <img src={images[3]} alt="" className="w-full h-full object-cover rounded-xl" />
            </button>
            <button onClick={() => handleClick(4)} className="aspect-square overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="Åpne bilde 5">
              <img src={images[4]} alt="" className="w-full h-full object-cover rounded-xl" />
            </button>
          </div>
          <button onClick={() => handleClick(5)} className="aspect-[3/4] overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="Åpne bilde 6">
            <img src={images[5]} alt="" className="w-full h-full object-cover rounded-xl" />
          </button>
        </div>
      )
    }

    // Default: Classic 2x3
    return (
      <div className="grid grid-cols-2 gap-1.5">
        {images.slice(0, 6).map((img, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className="aspect-square overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={`Åpne bilde ${i + 1}`}
          >
            <img src={img} alt="" className="w-full h-full object-cover rounded-xl" />
          </button>
        ))}
      </div>
    )
  }

  // 7+ images - Waterfall (masonry) with +N overlay
  if (selectedStyle === 'waterfall' && images.length <= 10) {
    return (
      <div className="columns-2 gap-1.5">
        {images.slice(0, 6).map((img, i) => {
          const aspectRatios = ['aspect-[3/4]', 'aspect-square', 'aspect-square', 'aspect-[3/4]', 'aspect-[4/3]', 'aspect-[4/3]']
          return (
            <button
              key={i}
              onClick={() => handleClick(i)}
              className={`w-full ${aspectRatios[i % 6]} overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-500 mb-1.5 relative`}
              aria-label={`Åpne bilde ${i + 1}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover rounded-xl" />
              {i === 5 && images.length > 6 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                  <span className="text-white text-2xl font-bold">+{images.length - 6}</span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  // Default: 2x2 grid with +N overlay for 4+ images
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {images.slice(0, 4).map((img, i) => (
        <button
          key={i}
          onClick={() => handleClick(i)}
          className="aspect-square overflow-hidden relative focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label={`Åpne bilde ${i + 1}`}
        >
          <img src={img} alt="" className="w-full h-full object-cover rounded-xl" />
          {i === 3 && images.length > 4 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
              <span className="text-white text-2xl font-bold">+{images.length - 4}</span>
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

// Auto-select style based on number of images
function getAutoStyle(count: number): 'grid-2x3' | 'featured-grid' | 'asymmetric' | 'waterfall' {
  if (count === 5) return 'featured-grid'
  if (count === 6) return 'grid-2x3'
  if (count >= 7) return 'waterfall'
  return 'grid-2x3'
}

// Full viewer component
interface ImageGalleryViewerProps {
  images: string[]
  initialIndex?: number
  onClose: () => void
  postTitle?: string
}

export function ImageGalleryViewer({ images, initialIndex = 0, onClose, postTitle }: ImageGalleryViewerProps) {
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
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowLeft') {
      setCurrentIndex(i => (i - 1 + images.length) % images.length)
    } else if (e.key === 'ArrowRight') {
      setCurrentIndex(i => (i + 1) % images.length)
    }
  }, [images.length, onClose])

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
        setCurrentIndex(i => (i + 1) % images.length)
      } else {
        setCurrentIndex(i => (i - 1 + images.length) % images.length)
      }
      return
    }

    // Swipe down to close
    if (diffY > 100) {
      onClose()
    }
  }

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
                className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'bg-white' : 'bg-white/30'}`}
              />
            ))}
          </div>
          <button onClick={onClose} className="text-white/70 text-xl">✕</button>
        </div>

        {/* Image */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full">
            <img
              src={images[currentIndex]}
              alt=""
              className="max-w-full max-h-[80vh] rounded-2xl object-contain"
            />
            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentIndex(i => (i - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/60 rounded-full text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentIndex(i => (i + 1) % images.length)}
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

        {/* Counter */}
        <div className="flex-shrink-0 p-4 text-center text-white/50 text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    )
  }

  // Desktop
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="relative max-w-5xl max-h-[90vh] p-4" onClick={e => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white"
        >
          ✕
        </button>

        {/* Image */}
        <img
          src={images[currentIndex]}
          alt=""
          className="max-w-full max-h-[85vh] rounded-2xl object-contain mx-auto"
        />

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex(i => (i - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentIndex(i => (i + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Counter */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  )
}
