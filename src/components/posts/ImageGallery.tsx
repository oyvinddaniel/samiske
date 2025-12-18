'use client'

import { useState, useEffect, useCallback } from 'react'

interface ImageGalleryProps {
  images: string[]
  alt?: string
  onImageClick?: (index: number) => void
}

// Preview component for feed - shows grid layout
export function ImageGalleryPreview({ images, alt, onImageClick }: ImageGalleryProps) {
  if (!images || images.length === 0) return null

  const handleClick = (index: number) => {
    if (onImageClick) {
      onImageClick(index)
    }
  }

  // Single image
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
      <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className="aspect-square overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={`Åpne bilde ${i + 1}`}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    )
  }

  // 3 images - 1 large + 2 small
  if (images.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
        <button
          onClick={() => handleClick(0)}
          className="row-span-2 overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Åpne bilde 1"
        >
          <img src={images[0]} alt="" className="w-full h-full object-cover" />
        </button>
        {images.slice(1).map((img, i) => (
          <button
            key={i}
            onClick={() => handleClick(i + 1)}
            className="aspect-square overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={`Åpne bilde ${i + 2}`}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    )
  }

  // 4+ images - 2x2 grid with +N overlay
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
      {images.slice(0, 4).map((img, i) => (
        <button
          key={i}
          onClick={() => handleClick(i)}
          className="aspect-square overflow-hidden relative focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label={`Åpne bilde ${i + 1}`}
        >
          <img src={img} alt="" className="w-full h-full object-cover" />
          {i === 3 && images.length > 4 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">+{images.length - 4}</span>
            </div>
          )}
        </button>
      ))}
    </div>
  )
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
