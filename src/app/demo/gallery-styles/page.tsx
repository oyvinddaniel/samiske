'use client'

import { useState, useEffect, useCallback } from 'react'

// Demo bilder med caption og kommentarer per bilde
const demoImages = [
  {
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    caption: 'Soloppgang over fjellene - magisk start på dagen!',
    likes: 23,
    comments: [
      { id: 1, author: 'Lars', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', text: 'Utrolig vakkert lys!', time: '45 min siden', likes: 3 },
      { id: 2, author: 'Kristin', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', text: 'Hvor er dette tatt? 😍', time: '30 min siden', likes: 1 },
    ]
  },
  {
    url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=1000&fit=crop',
    caption: 'Stien videre innover fjellet',
    likes: 18,
    comments: [
      { id: 1, author: 'Ole', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', text: 'Ser ut som en fin tur!', time: '1t siden', likes: 2 },
    ]
  },
  {
    url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&h=600&fit=crop',
    caption: 'Den vakre utsikten fra toppen 🏔️',
    likes: 45,
    comments: [
      { id: 1, author: 'Anna', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', text: 'Så nydelig!', time: '2t siden', likes: 4 },
      { id: 2, author: 'Per', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', text: 'Fantastisk utsikt!', time: '1t siden', likes: 2 },
      { id: 3, author: 'Silje', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop', text: 'Dette er det beste bildet! 🥰', time: '45 min siden', likes: 5 },
    ]
  },
  {
    url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&h=1200&fit=crop',
    caption: 'Panorama fra fjelltoppen',
    likes: 31,
    comments: []
  },
  {
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop',
    caption: 'Tåke over dalen - mystisk stemning',
    likes: 28,
    comments: [
      { id: 1, author: 'Morten', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', text: 'Nesten litt skummelt!', time: '3t siden', likes: 1 },
    ]
  },
  {
    url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=1000&fit=crop',
    caption: 'Rasteplass ved vannet',
    likes: 19,
    comments: [
      { id: 1, author: 'Hilde', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', text: 'Perfekt sted for matpause!', time: '2t siden', likes: 2 },
    ]
  },
  {
    url: 'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=800&h=600&fit=crop',
    caption: 'Skogen på vei ned',
    likes: 14,
    comments: []
  },
  {
    url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800&h=1200&fit=crop',
    caption: 'Solnedgang - avslutning på en perfekt dag',
    likes: 52,
    comments: [
      { id: 1, author: 'Erik', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', text: 'Beste bildet! 🌅', time: '1t siden', likes: 8 },
      { id: 2, author: 'Mari', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', text: 'Fantastiske farger', time: '30 min siden', likes: 3 },
    ]
  },
]

const imageUrls = demoImages.map(img => img.url)

export default function GalleryStylesDemo() {
  const [activeViewer, setActiveViewer] = useState<string | null>(null)
  const [viewerState, setViewerState] = useState<'masonry' | 'single'>('masonry')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Lock body scroll when viewer is open
  useEffect(() => {
    if (activeViewer) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      document.body.style.top = `-${window.scrollY}px`
    } else {
      const scrollY = document.body.style.top
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.top = ''
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1)
      }
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.top = ''
    }
  }, [activeViewer])

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (zoomLevel > 1) {
        setZoomLevel(1)
      } else if (viewerState === 'single') {
        setViewerState('masonry')
        setZoomLevel(1)
      } else if (activeViewer) {
        setActiveViewer(null)
        setViewerState('masonry')
        setZoomLevel(1)
      }
    }
    // Arrow key navigation in single view (loops)
    if (viewerState === 'single' && activeViewer) {
      if (e.key === 'ArrowLeft') {
        setCurrentIndex(i => (i - 1 + imageUrls.length) % imageUrls.length)
        setZoomLevel(1)
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(i => (i + 1) % imageUrls.length)
        setZoomLevel(1)
      }
    }
  }, [activeViewer, viewerState, zoomLevel])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const openViewer = (viewerId: string) => {
    setActiveViewer(viewerId)
    setViewerState('masonry')
    setCurrentIndex(0)
    setZoomLevel(1)
  }

  const openSingleImage = (index: number) => {
    setCurrentIndex(index)
    setViewerState('single')
    setZoomLevel(1)
  }

  const toggleZoom = () => {
    setZoomLevel(z => z === 1 ? 2 : 1)
  }

  // Demo post data
  const demoPost = {
    title: 'Helgetur i fjellet',
    content: 'Vi hadde en utrolig fin tur i fjellet i helgen. Været var perfekt og utsikten fantastisk! 🏔️',
    author: 'Maria Hansen',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    likes: 47,
    comments: [
      { id: 1, author: 'Erik Larsen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', text: 'Så flott! Hvilken hytte bodde dere på?', time: '1t siden', likes: 5 },
      { id: 2, author: 'Sara Berg', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', text: 'Nydelige bilder! 😍', time: '45 min siden', likes: 3 },
      { id: 3, author: 'Nils Olsen', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', text: 'Beste tiden på året for fjellturer!', time: '30 min siden', likes: 2 },
      { id: 4, author: 'Ingrid Moe', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop', text: 'Vi var der forrige helg også. Fantastisk vær!', time: '15 min siden', likes: 1 },
    ],
    tags: ['#fjelltur', '#natur', '#friluftsliv', '#utsikt'],
    isPinned: true,
    timestamp: '2 timer siden',
  }

  // Get current image data for single view
  const currentImage = demoImages[currentIndex]

  // Sidebar Component - Shows post info in masonry, image info in single view
  const PostSidebar = ({ showBackButton = false }: { showBackButton?: boolean }) => {
    // Determine what content to show based on view state
    const isSingleView = viewerState === 'single'
    const displayLikes = isSingleView ? currentImage.likes : demoPost.likes
    const displayComments = isSingleView ? currentImage.comments : demoPost.comments

    return (
      <div className="w-96 bg-black flex-shrink-0 flex flex-col h-full">
        {/* Fixed info section */}
        <div className="flex-shrink-0 p-6 pb-0">
          {/* Header with close/back */}
          <div className="flex items-center justify-between mb-6">
            {showBackButton ? (
              <button
                onClick={() => setViewerState('masonry')}
                className="text-white/70 hover:text-white flex items-center gap-2 text-sm"
              >
                ← Tilbake til galleri
              </button>
            ) : (
              <span className="text-white/50 text-xs">ESC for å lukke</span>
            )}
            <button onClick={() => setActiveViewer(null)} className="text-white/70 hover:text-white text-xl">✕</button>
          </div>

          {/* Author - always shown */}
          <div className="flex items-center gap-3 mb-4">
            <img src={demoPost.authorAvatar} alt="" className="w-10 h-10 rounded-full" />
            <div>
              <p className="text-white font-medium">{demoPost.author}</p>
              <p className="text-white/50 text-sm">{demoPost.timestamp}</p>
            </div>
          </div>

          {/* GALLERY VIEW: Show post info */}
          {!isSingleView && (
            <>
              {/* Pinned badge */}
              {demoPost.isPinned && (
                <div className="flex items-center gap-2 text-yellow-400 text-sm mb-4">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                  </svg>
                  Festet innlegg
                </div>
              )}

              {/* Post Title */}
              <h2 className="text-white text-xl font-semibold mb-3">{demoPost.title}</h2>

              {/* Post Content */}
              <p className="text-white/80 text-sm leading-relaxed mb-4">{demoPost.content}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {demoPost.tags.map((tag, i) => (
                  <span key={i} className="text-blue-400 text-sm hover:underline cursor-pointer">{tag}</span>
                ))}
              </div>
            </>
          )}

          {/* SINGLE IMAGE VIEW: Show image caption and thumbnails */}
          {isSingleView && (
            <>
              {/* Image indicator */}
              <div className="flex items-center gap-2 text-white/50 text-sm mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Bilde {currentIndex + 1} av {imageUrls.length}
              </div>

              {/* Image Caption */}
              <p className="text-white text-lg leading-relaxed mb-4">{currentImage.caption}</p>

              {/* Image thumbnails strip */}
              <div className="flex gap-1.5 flex-wrap mb-4">
                {demoImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentIndex(i); setZoomLevel(1); }}
                    className={`w-12 h-12 rounded-lg overflow-hidden transition-all ${i === currentIndex ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-80'}`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Likes & Actions row */}
          <div className="flex items-center justify-between py-3 border-y border-white/10">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 text-white/70 hover:text-red-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-sm">{displayLikes}</span>
              </button>
              <span className="text-white/50 text-sm">
                {displayComments.length} {isSingleView ? 'bildekommentarer' : 'kommentarer'}
              </span>
            </div>
            <div className="flex gap-2">
              <button className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Del">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
              <button className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Lagre">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable comments section */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <h3 className="text-white/70 text-sm font-medium mb-4">
            {isSingleView ? 'Kommentarer på dette bildet' : 'Kommentarer på innlegget'}
          </h3>
          {displayComments.length === 0 ? (
            <p className="text-white/40 text-sm">Ingen kommentarer ennå. Vær den første!</p>
          ) : (
            <div className="space-y-4">
              {displayComments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <img src={comment.avatar} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white text-sm font-medium">{comment.author}</span>
                      <span className="text-white/40 text-xs">{comment.time}</span>
                    </div>
                    <p className="text-white/80 text-sm">{comment.text}</p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <button className="text-white/40 hover:text-red-400 text-xs flex items-center gap-1 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {comment.likes}
                      </button>
                      <button className="text-white/40 hover:text-white text-xs transition-colors">Svar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment input - fixed at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-white/10">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={isSingleView ? 'Kommenter på bildet...' : 'Skriv en kommentar...'}
              className="flex-1 bg-white/10 border-0 rounded-lg px-4 py-2.5 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
            />
            <button className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
              Send
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Masonry Viewer Component
  const MasonryViewer = () => {
    if (!activeViewer) return null

    // Mobile swipe handlers with drag animation
    const DISMISS_THRESHOLD = 150 // Må dra 150px for å lukke
    const DRAG_START_THRESHOLD = 10 // Må dra 10px før drag-modus aktiveres

    const handleTouchStart = (e: React.TouchEvent, context: 'single' | 'gallery') => {
      const touch = e.touches[0]
      const target = e.currentTarget as HTMLElement
      target.dataset.startX = touch.clientX.toString()
      target.dataset.startY = touch.clientY.toString()
      target.dataset.context = context
      target.dataset.dragActivated = 'false'
    }

    const handleTouchMove = (e: React.TouchEvent) => {
      const target = e.currentTarget as HTMLElement
      const startY = parseFloat(target.dataset.startY || '0')
      const currentY = e.touches[0].clientY
      const diffY = currentY - startY // Positive = dragging down

      // Check scroll position in real-time
      const scrollContainer = target.querySelector('[data-scroll-container]') as HTMLElement
      const atTop = scrollContainer ? scrollContainer.scrollTop <= 0 : true

      // Only activate drag mode if at top and dragging down past threshold
      if (atTop && diffY > DRAG_START_THRESHOLD) {
        target.dataset.dragActivated = 'true'
        setIsDragging(true)
        setDragOffset(diffY - DRAG_START_THRESHOLD)
      } else if (target.dataset.dragActivated !== 'true') {
        // Normal scrolling - don't interfere
        setDragOffset(0)
      }
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
      const target = e.currentTarget as HTMLElement
      const startX = parseFloat(target.dataset.startX || '0')
      const startY = parseFloat(target.dataset.startY || '0')
      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY
      const diffX = startX - endX
      const context = target.dataset.context
      const wasDragging = target.dataset.dragActivated === 'true'

      setIsDragging(false)

      // Horizontal swipe - change image with loop (only in single view)
      if (context === 'single' && Math.abs(diffX) > Math.abs(endY - startY) && Math.abs(diffX) > 50) {
        setDragOffset(0)
        if (diffX > 0) {
          // Swipe left - next image (loop to first)
          setCurrentIndex(i => (i + 1) % demoImages.length)
        } else {
          // Swipe right - previous image (loop to last)
          setCurrentIndex(i => (i - 1 + demoImages.length) % demoImages.length)
        }
        return
      }

      // Vertical swipe down - go back/close (pull down to dismiss)
      if (wasDragging && dragOffset > DISMISS_THRESHOLD) {
        // Animate away then close
        setIsDismissing(true)
        setTimeout(() => {
          if (context === 'single') {
            setViewerState('masonry')
          } else if (context === 'gallery') {
            setActiveViewer(null)
          }
          setDragOffset(0)
          setIsDismissing(false)
        }, 200)
      } else {
        // Snap back
        setDragOffset(0)
      }
    }

    // Mobile view - redesigned
    if (isMobile) {
      // Mobile: Single image view with caption and comments below
      if (viewerState === 'single') {
        const dismissProgress = isDismissing ? 1 : Math.min(dragOffset / 300, 1)
        return (
          <div
            className="fixed inset-0 bg-black z-50 flex flex-col"
            style={{
              transform: `translateY(${isDismissing ? '100%' : `${dragOffset}px`})`,
              opacity: 1 - dismissProgress * 0.5,
              transition: isDragging ? 'none' : 'transform 0.2s ease-out, opacity 0.2s ease-out',
            }}
            onTouchStart={(e) => handleTouchStart(e, 'single')}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Swipe handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 bg-white/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex-shrink-0 px-4 pb-3 flex items-center justify-between">
              <button onClick={() => setViewerState('masonry')} className="text-white/70 text-sm">← Galleri</button>
              <div className="flex gap-1.5">
                {demoImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'bg-white' : 'bg-white/30'}`}
                  />
                ))}
              </div>
              <button onClick={() => setActiveViewer(null)} className="text-white/70 text-xl">✕</button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-auto" data-scroll-container>
              {/* Image with 3% space on each side (94% width) */}
              <div className="pt-2 pb-4 flex justify-center">
                <div className="relative" style={{ width: '94%' }}>
                  <img
                    src={currentImage.url}
                    alt=""
                    className="w-full rounded-2xl object-cover"
                  />
                  {/* Navigation arrows on image - always visible, loops */}
                  <button
                    onClick={() => setCurrentIndex(i => (i - 1 + demoImages.length) % demoImages.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/60 rounded-full text-white"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentIndex(i => (i + 1) % demoImages.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/60 rounded-full text-white"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Image caption and info - same 94% width */}
              <div className="pb-4 mx-auto" style={{ width: '94%' }}>
                <p className="text-white text-base mb-3">{currentImage.caption}</p>

                {/* Likes row */}
                <div className="flex items-center gap-4 py-3 border-y border-white/10 mb-4">
                  <button className="flex items-center gap-2 text-white/70">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="text-sm">{currentImage.likes}</span>
                  </button>
                  <span className="text-white/50 text-sm">{currentImage.comments.length} kommentarer</span>
                </div>

                {/* Comments */}
                {currentImage.comments.length === 0 ? (
                  <p className="text-white/40 text-sm">Ingen kommentarer på dette bildet</p>
                ) : (
                  <div className="space-y-4">
                    {currentImage.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <img src={comment.avatar} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white text-sm font-medium">{comment.author}</span>
                            <span className="text-white/40 text-xs">{comment.time}</span>
                          </div>
                          <p className="text-white/80 text-sm">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bottom spacer for scroll */}
                <div style={{ minHeight: '20vh' }} />
              </div>
            </div>

            {/* Comment input - fixed */}
            <div className="flex-shrink-0 p-4 border-t border-white/10 bg-black">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Kommenter på bildet..."
                  className="flex-1 bg-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 text-sm focus:outline-none"
                />
                <button className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm">Send</button>
              </div>
            </div>
          </div>
        )
      }

      // Mobile: Masonry gallery view with post info at bottom
      const dismissProgress = isDismissing ? 1 : Math.min(dragOffset / 300, 1)
      return (
        <div
          className="fixed inset-0 bg-black z-50 flex flex-col"
          style={{
            transform: `translateY(${isDismissing ? '100%' : `${dragOffset}px`})`,
            opacity: 1 - dismissProgress * 0.5,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out, opacity 0.2s ease-out',
          }}
          onTouchStart={(e) => handleTouchStart(e, 'gallery')}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Swipe handle */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 bg-white/30 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex-shrink-0 px-4 pb-3 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <img src={demoPost.authorAvatar} alt="" className="w-8 h-8 rounded-full" />
              <span className="text-white font-medium text-sm">{demoPost.author}</span>
            </div>
            <button onClick={() => setActiveViewer(null)} className="text-white/70 text-xl">✕</button>
          </div>

          {/* Scrollable content: Masonry + Post info */}
          <div className="flex-1 overflow-auto" data-scroll-container>
            {/* Masonry grid - 2 columns (3 on larger mobile) */}
            <div className="p-3 columns-2 min-[480px]:columns-3 gap-2">
              {demoImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => openSingleImage(i)}
                  className="w-full mb-2 block break-inside-avoid"
                >
                  <img src={img.url} alt="" className="w-full rounded-xl" />
                </button>
              ))}
            </div>

            {/* Post info section (after images) */}
            <div className="px-4 pt-4 pb-6 border-t border-white/10">
              {/* Title */}
              <h2 className="text-white text-lg font-semibold mb-2">{demoPost.title}</h2>

              {/* Content */}
              <p className="text-white/80 text-sm leading-relaxed mb-3">{demoPost.content}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {demoPost.tags.map((tag, i) => (
                  <span key={i} className="text-blue-400 text-sm">{tag}</span>
                ))}
              </div>

              {/* Likes row */}
              <div className="flex items-center gap-4 py-3 border-y border-white/10 mb-4">
                <button className="flex items-center gap-2 text-white/70">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="text-sm">{demoPost.likes}</span>
                </button>
                <span className="text-white/50 text-sm">{demoPost.comments.length} kommentarer</span>
              </div>

              {/* Post comments */}
              <h3 className="text-white/70 text-sm font-medium mb-4">Kommentarer</h3>
              <div className="space-y-4">
                {demoPost.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <img src={comment.avatar} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white text-sm font-medium">{comment.author}</span>
                        <span className="text-white/40 text-xs">{comment.time}</span>
                      </div>
                      <p className="text-white/80 text-sm">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom spacer for scroll */}
              <div style={{ minHeight: '20vh' }} />
            </div>
          </div>

          {/* Comment input - fixed */}
          <div className="flex-shrink-0 p-4 border-t border-white/10 bg-black">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Skriv en kommentar..."
                className="flex-1 bg-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 text-sm focus:outline-none"
              />
              <button className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm">Send</button>
            </div>
          </div>
        </div>
      )
    }

    // Desktop: Single image view with sidebar
    if (viewerState === 'single') {
      return (
        <div className="fixed inset-0 bg-black z-50 flex">
          {/* Sidebar */}
          <PostSidebar showBackButton={true} />

          {/* Image area */}
          <div className="flex-1 flex items-center justify-center p-8 relative" onClick={() => setViewerState('masonry')}>
            {/* Navigation arrows - Left (loops) */}
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(i => (i - 1 + imageUrls.length) % imageUrls.length); setZoomLevel(1); }}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full text-white text-3xl transition-all shadow-lg border border-white/10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Navigation arrows - Right (loops) */}
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(i => (i + 1) % imageUrls.length); setZoomLevel(1); }}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full text-white text-3xl transition-all shadow-lg border border-white/10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Image counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm border border-white/10">
              {currentIndex + 1} / {imageUrls.length}
            </div>

            {/* Image with zoom */}
            <div className="overflow-auto max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
              <img
                src={imageUrls[currentIndex]}
                alt=""
                className={`rounded-2xl transition-transform duration-300 cursor-${zoomLevel === 1 ? 'zoom-in' : 'zoom-out'}`}
                style={{
                  transform: `scale(${zoomLevel})`,
                  maxHeight: zoomLevel === 1 ? 'calc(100vh - 4rem)' : 'none',
                  maxWidth: zoomLevel === 1 ? 'calc(100vw - 24rem)' : 'none',
                }}
                onClick={toggleZoom}
              />
            </div>

            {/* Keyboard hint */}
            <div className="absolute bottom-4 right-4 text-white/40 text-xs space-y-1 text-right">
              <p>← → bla i bilder</p>
              <p>Klikk bilde for zoom</p>
              <p>ESC tilbake</p>
            </div>
          </div>
        </div>
      )
    }

    // Desktop: Masonry view with sidebar
    return (
      <div className="fixed inset-0 bg-black z-50 flex">
        {/* Sidebar */}
        <PostSidebar />

        {/* Masonry area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="columns-2 lg:columns-3 xl:columns-4 gap-4">
            {imageUrls.map((img, i) => (
              <button
                key={i}
                onClick={() => openSingleImage(i)}
                className="w-full mb-4 block break-inside-avoid group"
              >
                <img
                  src={img}
                  alt=""
                  className="w-full rounded-2xl shadow-lg group-hover:opacity-80 transition-opacity"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">🖼️ Galleri-stiler Demo v2</h1>
        <p className="text-gray-600 mb-2">7 utvalgte preview-stiler + masonry viewer med sidebar</p>
        <p className="text-sm text-gray-500 mb-8">Alle bilder har avrundede hjørner (rounded-xl/2xl)</p>

        {/* ===== PREVIEW STYLES ===== */}
        <h2 className="text-xl font-semibold mb-4 mt-8 flex items-center gap-2">
          <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">1</span>
          Preview-stiler (i feed) - Grid & Masonry
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-5xl">

          {/* 1. Classic 2x3 Grid */}
          <PreviewCard
            id="grid-2x3"
            name="#1 Classic 2x3"
            desc="2 kolonner, 3 rader"
            selected={selectedPreview}
            onSelect={setSelectedPreview}
            onOpen={openViewer}
          >
            <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden">
              {imageUrls.slice(0, 6).map((img, i) => (
                <img key={i} src={img} alt="" className="w-full aspect-square object-cover rounded-xl" />
              ))}
            </div>
          </PreviewCard>

          {/* 3. Featured + Grid */}
          <PreviewCard
            id="featured-grid"
            name="#3 Featured + Grid"
            desc="1 stor + 4 små"
            selected={selectedPreview}
            onSelect={setSelectedPreview}
            onOpen={openViewer}
          >
            <div className="space-y-1.5">
              <img src={imageUrls[0]} alt="" className="w-full aspect-video object-cover rounded-xl" />
              <div className="grid grid-cols-4 gap-1.5">
                {imageUrls.slice(1, 5).map((img, i) => (
                  <img key={i} src={img} alt="" className="w-full aspect-square object-cover rounded-xl" />
                ))}
              </div>
            </div>
          </PreviewCard>

          {/* 4. Asymmetric 2x4 */}
          <PreviewCard
            id="asymmetric-2x4"
            name="#4 Asymmetric 2x4"
            desc="Varierende høyder"
            selected={selectedPreview}
            onSelect={setSelectedPreview}
            onOpen={openViewer}
          >
            <div className="grid grid-cols-2 gap-1.5">
              <img src={imageUrls[0]} alt="" className="w-full aspect-[3/4] object-cover rounded-xl" />
              <div className="flex flex-col gap-1.5">
                <img src={imageUrls[1]} alt="" className="w-full aspect-square object-cover rounded-xl" />
                <img src={imageUrls[2]} alt="" className="w-full aspect-[4/3] object-cover rounded-xl" />
              </div>
              <div className="flex flex-col gap-1.5">
                <img src={imageUrls[3]} alt="" className="w-full aspect-[4/3] object-cover rounded-xl" />
                <img src={imageUrls[4]} alt="" className="w-full aspect-square object-cover rounded-xl" />
              </div>
              <img src={imageUrls[5]} alt="" className="w-full aspect-[3/4] object-cover rounded-xl" />
            </div>
          </PreviewCard>

          {/* 6. Magazine Layout */}
          <PreviewCard
            id="magazine"
            name="#6 Magazine"
            desc="Editorial-stil"
            selected={selectedPreview}
            onSelect={setSelectedPreview}
            onOpen={openViewer}
          >
            <div className="grid grid-cols-3 gap-1.5">
              <img src={imageUrls[0]} alt="" className="col-span-2 row-span-2 w-full h-full object-cover rounded-xl" />
              <img src={imageUrls[1]} alt="" className="w-full aspect-square object-cover rounded-xl" />
              <img src={imageUrls[2]} alt="" className="w-full aspect-square object-cover rounded-xl" />
              <img src={imageUrls[3]} alt="" className="w-full aspect-[3/1] object-cover rounded-xl col-span-3" />
            </div>
          </PreviewCard>

          {/* 7. Vertical Strip */}
          <PreviewCard
            id="vertical-strip"
            name="#7 Vertical Strip"
            desc="Lang vertikal stripe"
            selected={selectedPreview}
            onSelect={setSelectedPreview}
            onOpen={openViewer}
          >
            <div className="flex gap-1.5">
              <img src={imageUrls[0]} alt="" className="w-2/3 aspect-[2/3] object-cover rounded-xl" />
              <div className="w-1/3 flex flex-col gap-1.5">
                {imageUrls.slice(1, 5).map((img, i) => (
                  <img key={i} src={img} alt="" className="w-full aspect-[4/3] object-cover rounded-xl" />
                ))}
              </div>
            </div>
          </PreviewCard>

          {/* 9. Waterfall */}
          <PreviewCard
            id="waterfall"
            name="#9 Waterfall"
            desc="Fossefalls-effekt"
            selected={selectedPreview}
            onSelect={setSelectedPreview}
            onOpen={openViewer}
          >
            <div className="columns-2 gap-1.5">
              <img src={imageUrls[0]} alt="" className="w-full aspect-[3/4] object-cover rounded-xl mb-1.5" />
              <img src={imageUrls[1]} alt="" className="w-full aspect-square object-cover rounded-xl mb-1.5" />
              <img src={imageUrls[2]} alt="" className="w-full aspect-square object-cover rounded-xl mb-1.5" />
              <img src={imageUrls[3]} alt="" className="w-full aspect-[3/4] object-cover rounded-xl mb-1.5" />
              <img src={imageUrls[4]} alt="" className="w-full aspect-[4/3] object-cover rounded-xl mb-1.5" />
              <img src={imageUrls[5]} alt="" className="w-full aspect-[4/3] object-cover rounded-xl mb-1.5" />
            </div>
          </PreviewCard>

          {/* 18. Polaroid Scatter */}
          <PreviewCard
            id="polaroid-scatter"
            name="#18 Polaroid Grid"
            desc="Polaroid-rammer"
            selected={selectedPreview}
            onSelect={setSelectedPreview}
            onOpen={openViewer}
          >
            <div className="grid grid-cols-2 gap-2">
              {imageUrls.slice(0, 4).map((img, i) => (
                <div key={i} className="bg-white p-1.5 pb-6 rounded-lg shadow-md" style={{ transform: `rotate(${(i - 1.5) * 3}deg)` }}>
                  <img src={img} alt="" className="w-full aspect-square object-cover rounded-sm" />
                </div>
              ))}
            </div>
          </PreviewCard>

        </div>

        {/* ===== VIEWER INFO ===== */}
        <h2 className="text-xl font-semibold mb-4 mt-12 flex items-center gap-2">
          <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm">2</span>
          Viewer (når galleriet åpnes)
        </h2>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-medium mb-4">Masonry Viewer med Zoom</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Desktop</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Masonry-grid med 2-4 kolonner</li>
                <li>• Klikk på bilde → Singel fullskjerm</li>
                <li>• Klikk på bilde i fullskjerm → Zoom inn/ut</li>
                <li>• ESC → Tilbake til masonry</li>
                <li>• ESC igjen → Tilbake til feed</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Mobil</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 1-kolonne vertikal scroll</li>
                <li>• Sort bakgrunn, avrundede hjørner</li>
                <li>• Bildene glir oppover ved scroll</li>
                <li>• Tap på bilde → Fullskjerm med zoom</li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => openViewer('demo')}
            className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            Test Masonry Viewer
          </button>
        </div>

        {/* Selection summary */}
        {selectedPreview && (
          <div className="fixed bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg p-4 border max-w-xl mx-auto">
            <h3 className="font-medium mb-2">Valgt preview-stil:</h3>
            <div className="flex items-center justify-between">
              <span className="font-medium text-blue-600">{selectedPreview}</span>
              <button
                onClick={() => openViewer(selectedPreview)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Åpne viewer →
              </button>
            </div>
          </div>
        )}

        {/* Render Masonry Viewer */}
        <MasonryViewer />
      </div>
    </div>
  )
}

// Preview Card Component
function PreviewCard({
  id,
  name,
  desc,
  selected,
  onSelect,
  onOpen,
  children,
}: {
  id: string
  name: string
  desc: string
  selected: string | null
  onSelect: (id: string | null) => void
  onOpen: (id: string) => void
  children: React.ReactNode
}) {
  return (
    <div
      className={`bg-white rounded-2xl p-3 shadow-sm transition-all hover:shadow-md cursor-pointer ${selected === id ? 'ring-2 ring-blue-500' : ''}`}
      onClick={() => onSelect(selected === id ? null : id)}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-medium text-sm">{name}</h3>
          <p className="text-xs text-gray-500">{desc}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onOpen(id); }}
          className="text-xs px-2 py-1 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Åpne
        </button>
      </div>
      {children}
    </div>
  )
}
