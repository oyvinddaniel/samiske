'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, MapPin, ExternalLink, ChevronRight, MoreVertical, Share2, Image as ImageIcon } from 'lucide-react'

// Demo data
const demoLocation = {
  name: 'Kautokeino',
  nameSami: 'Guovdageaidnu',
  type: 'Kommune',
  parentName: 'Nordsamisk område',
  description: 'Kautokeino er en kommune i Troms og Finnmark fylke. Kommunen er den største i Norge målt etter areal, men har relativt få innbyggere. Kautokeino er kjent som et senter for samisk kultur og reindrift.',
  imageUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&h=600&fit=crop',
  galleryImages: [
    'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop',
  ],
  stats: {
    posts: 47,
    followers: 128,
    events: 12,
  },
}

interface CardStyle {
  id: string
  name: string
  category: 'map' | 'image' | 'info'
  description: string
}

const cardStyles: CardStyle[] = [
  // Map-focused (1-5)
  { id: 'split-view', name: '#1 Split View', category: 'map', description: 'Kart til venstre, info til høyre' },
  { id: 'map-header', name: '#2 Map Header', category: 'map', description: 'Stort kart over, info under' },
  { id: 'floating-card', name: '#3 Floating Card', category: 'map', description: 'Kart i bakgrunn, kort flytende over' },
  { id: 'mini-map-pill', name: '#4 Mini Map Pill', category: 'map', description: 'Liten kart-pill ved siden av tittel' },
  { id: 'interactive-map', name: '#5 Interactive Map', category: 'map', description: 'Fullskjerm kart med slide-up panel' },
  // Image-focused (6-10)
  { id: 'hero-image', name: '#6 Hero Image', category: 'image', description: 'Stort hovedbilde med gradient overlay' },
  { id: 'gallery-grid', name: '#7 Gallery Grid', category: 'image', description: '2x3 bildegrid i header' },
  { id: 'carousel', name: '#8 Carousel', category: 'image', description: 'Bildekarusell med prikk-indikatorer' },
  { id: 'masonry-preview', name: '#9 Masonry Preview', category: 'image', description: 'Asymmetrisk bildegrid' },
  { id: 'polaroid-stack', name: '#10 Polaroid Stack', category: 'image', description: 'Bilder som overlapper' },
  // Info-focused (11-15)
  { id: 'clean-minimal', name: '#11 Clean Minimal', category: 'info', description: 'Kun tekst, ingen bilder i header' },
  { id: 'stats-cards', name: '#12 Stats Cards', category: 'info', description: 'Statistikk-kort i grid' },
  { id: 'timeline', name: '#13 Timeline', category: 'info', description: 'Vertikal tidslinje med bilder' },
  { id: 'accordion', name: '#14 Accordion', category: 'info', description: 'Sammenfoldet informasjon' },
  { id: 'tabbed', name: '#15 Tabbed', category: 'info', description: 'Faner for ulik info' },
]

const categoryLabels = {
  map: { name: 'Kart-fokusert', color: 'bg-blue-100 text-blue-700' },
  image: { name: 'Bilde-fokusert', color: 'bg-purple-100 text-purple-700' },
  info: { name: 'Info-fokusert', color: 'bg-green-100 text-green-700' },
}

export default function GeographyCardsDemo() {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'map' | 'image' | 'info'>('all')

  const filteredStyles = cardStyles.filter(style => {
    if (categoryFilter === 'all') return true
    return style.category === categoryFilter
  })

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/demo/design-dashboard" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-1">
                <ChevronRight className="w-4 h-4 rotate-180" />
                Design Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Geografiske Toppkort</h1>
              <p className="text-sm text-gray-500">15 designeksempler for steds- og lokasjonskort</p>
            </div>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                categoryFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Alle (15)
            </button>
            <button
              onClick={() => setCategoryFilter('map')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                categoryFilter === 'map' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Kart-fokusert (5)
            </button>
            <button
              onClick={() => setCategoryFilter('image')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                categoryFilter === 'image' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Bilde-fokusert (5)
            </button>
            <button
              onClick={() => setCategoryFilter('info')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                categoryFilter === 'info' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Info-fokusert (5)
            </button>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredStyles.map((style) => (
            <div
              key={style.id}
              className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                selectedStyle === style.id ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedStyle(selectedStyle === style.id ? null : style.id)}
            >
              {/* Style header */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{style.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryLabels[style.category].color}`}>
                    {categoryLabels[style.category].name}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{style.description}</span>
              </div>

              {/* Card preview */}
              <div className="p-4">
                <CardPreview styleId={style.id} location={demoLocation} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selection summary */}
      {selectedStyle && (
        <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto bg-white rounded-xl shadow-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Valgt stil: {cardStyles.find(s => s.id === selectedStyle)?.name}</p>
              <p className="text-sm text-gray-500">Klikk på kortet igjen for å fjerne valget</p>
            </div>
            <button
              onClick={() => setSelectedStyle(null)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Bruk denne stilen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Individual card preview components
function CardPreview({ styleId, location }: { styleId: string; location: typeof demoLocation }) {
  switch (styleId) {
    case 'split-view':
      return <SplitViewCard location={location} />
    case 'map-header':
      return <MapHeaderCard location={location} />
    case 'floating-card':
      return <FloatingCard location={location} />
    case 'mini-map-pill':
      return <MiniMapPillCard location={location} />
    case 'interactive-map':
      return <InteractiveMapCard location={location} />
    case 'hero-image':
      return <HeroImageCard location={location} />
    case 'gallery-grid':
      return <GalleryGridCard location={location} />
    case 'carousel':
      return <CarouselCard location={location} />
    case 'masonry-preview':
      return <MasonryPreviewCard location={location} />
    case 'polaroid-stack':
      return <PolaroidStackCard location={location} />
    case 'clean-minimal':
      return <CleanMinimalCard location={location} />
    case 'stats-cards':
      return <StatsCardsCard location={location} />
    case 'timeline':
      return <TimelineCard location={location} />
    case 'accordion':
      return <AccordionCard location={location} />
    case 'tabbed':
      return <TabbedCard location={location} />
    default:
      return <div className="p-4 text-gray-500">Forhåndsvisning kommer snart</div>
  }
}

// ===== MAP-FOCUSED CARDS (1-5) =====

function SplitViewCard({ location }: { location: typeof demoLocation }) {
  return (
    <div className="flex gap-4 rounded-xl overflow-hidden border border-gray-200">
      {/* Map placeholder */}
      <div className="w-1/3 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center p-4">
        <div className="text-center">
          <MapPin className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-xs text-gray-500 mt-1">Kart</p>
        </div>
      </div>
      {/* Info */}
      <div className="flex-1 p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">{location.type}</span>
          <Star className="w-4 h-4 text-gray-300" />
        </div>
        <h3 className="font-bold text-lg">{location.name}</h3>
        <p className="text-sm text-gray-500">{location.nameSami}</p>
        <p className="text-xs text-gray-400 mt-2 line-clamp-2">{location.description}</p>
      </div>
    </div>
  )
}

function MapHeaderCard({ location }: { location: typeof demoLocation }) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      {/* Large map header */}
      <div className="h-32 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center relative">
        <MapPin className="w-10 h-10 text-red-500" />
        <button className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-lg">
          <ExternalLink className="w-4 h-4 text-gray-600" />
        </button>
      </div>
      {/* Info below */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">{location.type}</span>
          <div className="flex gap-1">
            <Star className="w-4 h-4 text-gray-300" />
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        <h3 className="font-bold text-lg">{location.name}</h3>
        <p className="text-sm text-gray-500">{location.nameSami}</p>
      </div>
    </div>
  )
}

function FloatingCard({ location }: { location: typeof demoLocation }) {
  return (
    <div className="relative h-48 rounded-xl overflow-hidden">
      {/* Background map */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-green-200">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(90deg, #3b82f6 1px, transparent 1px), linear-gradient(#3b82f6 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }} />
      </div>
      {/* Floating card */}
      <div className="absolute bottom-3 left-3 right-3 bg-white rounded-xl p-3 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">{location.type}</span>
            <h3 className="font-bold mt-1">{location.name}</h3>
            <p className="text-sm text-gray-500">{location.nameSami}</p>
          </div>
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
        </div>
      </div>
    </div>
  )
}

function MiniMapPillCard({ location }: { location: typeof demoLocation }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3 mb-3">
        {/* Mini map pill */}
        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <MapPin className="w-5 h-5 text-red-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold">{location.name}</h3>
            <Star className="w-4 h-4 text-gray-300" />
            <MoreVertical className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
          <p className="text-sm text-gray-500">{location.nameSami}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">{location.type}</span>
        <span>i {location.parentName}</span>
      </div>
    </div>
  )
}

function InteractiveMapCard({ location }: { location: typeof demoLocation }) {
  return (
    <div className="relative h-52 rounded-xl overflow-hidden">
      {/* Fullscreen map */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-green-200">
        <MapPin className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-red-500" />
      </div>
      {/* Slide-up panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 shadow-lg">
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold">{location.name}</h3>
            <p className="text-sm text-gray-500">{location.nameSami}</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 bg-gray-100 rounded-lg"><Share2 className="w-4 h-4" /></button>
            <button className="p-2 bg-yellow-50 rounded-lg"><Star className="w-4 h-4 text-yellow-500" /></button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== IMAGE-FOCUSED CARDS (6-10) =====

function HeroImageCard({ location }: { location: typeof demoLocation }) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      {/* Hero image with gradient */}
      <div className="h-36 relative">
        <img src={location.imageUrl} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm">{location.type}</span>
          <h3 className="font-bold text-lg mt-1">{location.name}</h3>
          <p className="text-sm text-white/80">{location.nameSami}</p>
        </div>
        <div className="absolute top-3 right-3 flex gap-1">
          <button className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg"><Star className="w-4 h-4 text-white" /></button>
          <button className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg"><MoreVertical className="w-4 h-4 text-white" /></button>
        </div>
      </div>
    </div>
  )
}

function GalleryGridCard({ location }: { location: typeof demoLocation }) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      {/* 2x3 grid */}
      <div className="grid grid-cols-3 gap-0.5 h-28">
        {location.galleryImages.slice(0, 3).map((img, i) => (
          <img key={i} src={img} alt="" className="w-full h-full object-cover" />
        ))}
      </div>
      {/* Info */}
      <div className="p-3 flex items-center justify-between">
        <div>
          <h3 className="font-bold">{location.name}</h3>
          <p className="text-sm text-gray-500">{location.nameSami}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{location.galleryImages.length} bilder</span>
          <Star className="w-4 h-4 text-gray-300" />
        </div>
      </div>
    </div>
  )
}

function CarouselCard({ location }: { location: typeof demoLocation }) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      {/* Carousel */}
      <div className="h-32 relative">
        <img src={location.imageUrl} alt="" className="w-full h-full object-cover" />
        {/* Dots */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/50'}`} />
          ))}
        </div>
        {/* Nav arrows */}
        <button className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center text-sm">‹</button>
        <button className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center text-sm">›</button>
      </div>
      <div className="p-3">
        <h3 className="font-bold">{location.name}</h3>
        <p className="text-sm text-gray-500">{location.nameSami}</p>
      </div>
    </div>
  )
}

function MasonryPreviewCard({ location }: { location: typeof demoLocation }) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      {/* Masonry grid */}
      <div className="grid grid-cols-3 gap-0.5 h-32">
        <img src={location.galleryImages[0]} alt="" className="col-span-2 row-span-2 w-full h-full object-cover" />
        <img src={location.galleryImages[1]} alt="" className="w-full h-full object-cover" />
        <img src={location.galleryImages[2]} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="p-3 flex items-center justify-between">
        <div>
          <h3 className="font-bold">{location.name}</h3>
          <p className="text-sm text-gray-500">{location.nameSami}</p>
        </div>
        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
      </div>
    </div>
  )
}

function PolaroidStackCard({ location }: { location: typeof demoLocation }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      {/* Polaroid stack */}
      <div className="relative h-28 mb-3">
        {location.galleryImages.slice(0, 3).map((img, i) => (
          <div
            key={i}
            className="absolute bg-white p-1.5 pb-4 rounded shadow-md"
            style={{
              left: `${20 + i * 25}%`,
              top: `${i * 5}px`,
              transform: `rotate(${(i - 1) * 5}deg)`,
              zIndex: 3 - i,
              width: '45%',
            }}
          >
            <img src={img} alt="" className="w-full aspect-square object-cover rounded-sm" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold">{location.name}</h3>
          <p className="text-sm text-gray-500">{location.nameSami}</p>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">{location.type}</span>
      </div>
    </div>
  )
}

// ===== INFO-FOCUSED CARDS (11-15) =====

function CleanMinimalCard({ location }: { location: typeof demoLocation }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">{location.type}</span>
        <div className="flex gap-1">
          <Star className="w-4 h-4 text-gray-300" />
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </div>
      </div>
      <h3 className="font-bold text-xl mb-1">{location.name}</h3>
      <p className="text-gray-500 mb-2">{location.nameSami}</p>
      <p className="text-sm text-gray-400 line-clamp-2">{location.description}</p>
      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
        i {location.parentName}
      </div>
    </div>
  )
}

function StatsCardsCard({ location }: { location: typeof demoLocation }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg">{location.name}</h3>
          <p className="text-sm text-gray-500">{location.nameSami}</p>
        </div>
        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
      </div>
      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-blue-50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-blue-600">{location.stats.posts}</p>
          <p className="text-xs text-blue-500">Innlegg</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-purple-600">{location.stats.followers}</p>
          <p className="text-xs text-purple-500">Følgere</p>
        </div>
        <div className="bg-green-50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-green-600">{location.stats.events}</p>
          <p className="text-xs text-green-500">Hendelser</p>
        </div>
      </div>
    </div>
  )
}

function TimelineCard({ location }: { location: typeof demoLocation }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">{location.name}</h3>
        <Star className="w-4 h-4 text-gray-300" />
      </div>
      {/* Timeline */}
      <div className="space-y-3 relative">
        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200" />
        {[
          { text: 'Nytt innlegg', time: '2t siden', color: 'bg-blue-500' },
          { text: 'Hendelse lagt til', time: '1d siden', color: 'bg-green-500' },
          { text: 'Bilde lastet opp', time: '3d siden', color: 'bg-purple-500' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 relative">
            <div className={`w-6 h-6 rounded-full ${item.color} flex items-center justify-center text-white text-xs z-10`}>
              {i + 1}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{item.text}</p>
              <p className="text-xs text-gray-400">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AccordionCard({ location }: { location: typeof demoLocation }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-gray-200">
      {/* Header - always visible */}
      <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-bold">{location.name}</h3>
            <p className="text-sm text-gray-500">{location.nameSami}</p>
          </div>
        </div>
        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`} />
      </div>
      {/* Expandable content */}
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100">
          <p className="text-sm text-gray-500 mt-3">{location.description}</p>
          <div className="flex gap-2 mt-3">
            <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg">Se mer</button>
            <button className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg">Del</button>
          </div>
        </div>
      )}
    </div>
  )
}

function TabbedCard({ location }: { location: typeof demoLocation }) {
  const [tab, setTab] = useState<'info' | 'images' | 'stats'>('info')
  return (
    <div className="rounded-xl border border-gray-200">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['info', 'images', 'stats'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
          >
            {t === 'info' ? 'Info' : t === 'images' ? 'Bilder' : 'Statistikk'}
          </button>
        ))}
      </div>
      {/* Tab content */}
      <div className="p-4">
        {tab === 'info' && (
          <div>
            <h3 className="font-bold">{location.name}</h3>
            <p className="text-sm text-gray-500">{location.nameSami}</p>
            <p className="text-xs text-gray-400 mt-2 line-clamp-2">{location.description}</p>
          </div>
        )}
        {tab === 'images' && (
          <div className="grid grid-cols-4 gap-1">
            {location.galleryImages.map((img, i) => (
              <img key={i} src={img} alt="" className="w-full aspect-square object-cover rounded" />
            ))}
          </div>
        )}
        {tab === 'stats' && (
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{location.stats.posts}</p>
            <p className="text-sm text-gray-500">innlegg</p>
          </div>
        )}
      </div>
    </div>
  )
}
