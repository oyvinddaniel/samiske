'use client'

import { useState } from 'react'
import { Eye, Heart, MessageCircle, Share2, ChevronLeft, User, Calendar, X, Send, Smile } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface MetadataVariant {
  id: number
  name: string
  description: string
  inspiration: string
  layout: string
}

const variants: MetadataVariant[] = [
  {
    id: 1,
    name: 'Header Stack',
    description: 'Profil → Tittel → Beskrivelse → Actions → Gallery',
    inspiration: 'Instagram Post',
    layout: 'Vertikal stack over gallery',
  },
  {
    id: 2,
    name: 'Sticky Header + Floating Actions',
    description: 'Sticky profil/tittel øverst, floating action bar over gallery',
    inspiration: 'Facebook',
    layout: 'Sticky top + floating bottom',
  },
  {
    id: 3,
    name: 'Compact Top Bar',
    description: 'Alt komprimert i én linje over gallery',
    inspiration: 'Twitter',
    layout: 'Single-line header',
  },
  {
    id: 4,
    name: 'Side-by-Side Header',
    description: 'Profil venstre, stats høyre, tittel/beskrivelse under',
    inspiration: 'LinkedIn',
    layout: 'Split header med metrics',
  },
  {
    id: 5,
    name: 'Hero Card',
    description: 'Stort kort med gradient bakgrunn over gallery',
    inspiration: 'Spotify',
    layout: 'Hero-style card',
  },
  {
    id: 6,
    name: 'Minimal Overlay',
    description: 'Transparent overlay på første bilde, expand for detaljer',
    inspiration: 'Unsplash',
    layout: 'Overlay på gallery',
  },
  {
    id: 7,
    name: 'Bottom Sheet Metadata',
    description: 'Gallery først, pull up for metadata og kommentarer',
    inspiration: 'TikTok',
    layout: 'Swipe-up sheet',
  },
  {
    id: 8,
    name: 'Tabs Layout',
    description: 'Tabs: Gallery | Info | Comments',
    inspiration: 'YouTube',
    layout: 'Tabbed interface',
  },
  {
    id: 9,
    name: 'Card Stack',
    description: 'Metadata-kort mellom galleribilder',
    inspiration: 'Pinterest',
    layout: 'Inline cards',
  },
  {
    id: 10,
    name: 'Magazine Cover',
    description: 'Stor tittel over gallery, profil i hjørne, actions nederst',
    inspiration: 'Vogue/Medium',
    layout: 'Editorial style',
  },
  {
    id: 11,
    name: 'Header Stack + Tabs',
    description: 'Profil → Tittel → Beskrivelse → Actions → Tabs (Galleri/Kommentarer)',
    inspiration: 'Instagram + YouTube Hybrid',
    layout: 'Stack med tab-switching',
  },
]

// Mock gallery images - More variety for better masonry effect
const mockImages = [
  { id: 1, aspect: 'portrait', color: 'from-rose-500 to-pink-600', likes: 24, comments: 5 },
  { id: 2, aspect: 'landscape', color: 'from-blue-500 to-cyan-600', likes: 18, comments: 3 },
  { id: 3, aspect: 'square', color: 'from-green-500 to-emerald-600', likes: 42, comments: 8 },
  { id: 4, aspect: 'portrait', color: 'from-purple-500 to-violet-600', likes: 31, comments: 2 },
  { id: 5, aspect: 'landscape', color: 'from-orange-500 to-amber-600', likes: 15, comments: 1 },
  { id: 6, aspect: 'square', color: 'from-indigo-500 to-blue-600', likes: 67, comments: 12 },
  { id: 7, aspect: 'portrait', color: 'from-teal-500 to-cyan-600', likes: 28, comments: 4 },
  { id: 8, aspect: 'landscape', color: 'from-fuchsia-500 to-pink-600', likes: 53, comments: 9 },
  { id: 9, aspect: 'square', color: 'from-lime-500 to-green-600', likes: 19, comments: 0 },
  { id: 10, aspect: 'portrait', color: 'from-red-500 to-rose-600', likes: 38, comments: 6 },
  { id: 11, aspect: 'landscape', color: 'from-sky-500 to-blue-600', likes: 22, comments: 3 },
  { id: 12, aspect: 'square', color: 'from-emerald-500 to-teal-600', likes: 45, comments: 7 },
  { id: 13, aspect: 'portrait', color: 'from-violet-500 to-purple-600', likes: 33, comments: 5 },
  { id: 14, aspect: 'landscape', color: 'from-amber-500 to-orange-600', likes: 12, comments: 1 },
  { id: 15, aspect: 'square', color: 'from-cyan-500 to-teal-600', likes: 56, comments: 10 },
  { id: 16, aspect: 'portrait', color: 'from-pink-500 to-rose-600', likes: 29, comments: 4 },
  { id: 17, aspect: 'landscape', color: 'from-slate-500 to-gray-600', likes: 41, comments: 8 },
  { id: 18, aspect: 'square', color: 'from-yellow-500 to-amber-600', likes: 35, comments: 6 },
]

export default function GalleryMetadataPage() {
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)

  if (selectedVariant !== null) {
    const variant = variants.find((v) => v.id === selectedVariant)
    if (!variant) return null

    return (
      <div className="fixed inset-0 bg-black z-50">
        {/* Header - Positioned over masonry gallery on desktop */}
        <div className="absolute top-0 left-0 md:left-96 right-0 z-20 bg-gradient-to-b from-black/90 to-transparent p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedVariant(null)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-white font-semibold">{variant.name}</h2>
              <p className="text-xs text-white/60">{variant.description}</p>
            </div>
          </div>
        </div>

        {/* Variant Content */}
        <div className="absolute inset-0 pt-20 overflow-y-auto">
          {selectedVariant === 1 && <Variant1 />}
          {selectedVariant === 2 && <Variant2 />}
          {selectedVariant === 3 && <Variant3 />}
          {selectedVariant === 4 && <Variant4 />}
          {selectedVariant === 5 && <Variant5 />}
          {selectedVariant === 6 && <Variant6 />}
          {selectedVariant === 7 && <Variant7 />}
          {selectedVariant === 8 && <Variant8 />}
          {selectedVariant === 9 && <Variant9 />}
          {selectedVariant === 10 && <Variant10 />}
          {selectedVariant === 11 && <Variant11 />}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gallery Metadata Designs</h1>
              <p className="text-gray-500">11 design-forslag for profil, tittel, beskrivelse og engagement</p>
            </div>
          </div>
          <p className="text-gray-600">
            Hvordan skal metadata (profil, tittel, beskrivelse, likes, sharing, kommentarer) vises rundt Classic Masonry
            gallery? Trykk på et design for fullskjerm demo.
          </p>
        </div>

        {/* Variants Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Design</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Layout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {variants.map((variant) => (
                <tr
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant.id)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-gray-500">{variant.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{variant.name}</p>
                    <p className="text-sm text-gray-500">{variant.description}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{variant.layout}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Variant Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {variants.map((variant) => (
            <button
              key={variant.id}
              onClick={() => setSelectedVariant(variant.id)}
              className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:shadow-lg hover:border-gray-300 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{variant.name}</h3>
                <span className="text-xs text-gray-400">#{variant.id}</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">{variant.description}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="bg-gray-100 px-2 py-0.5 rounded">{variant.inspiration}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// =====================================================
// VARIANT IMPLEMENTATIONS
// =====================================================

// Variant 1: Header Stack
function Variant1() {
  const [isLiked, setIsLiked] = useState(false)

  return (
    <div className="h-full overflow-y-auto bg-black">
      {/* Profile */}
      <div className="bg-black p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 border-2 border-white/20">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">ÁR</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-semibold">Ása Ráhka</p>
            <p className="text-xs text-gray-400">Fotograf • Tromsø</p>
          </div>
        </div>
      </div>

      {/* Title & Description */}
      <div className="bg-black px-4 py-3 border-b border-white/10">
        <h1 className="text-2xl font-bold text-white mb-2">Sápmi Landscapes 2025</h1>
        <p className="text-sm text-gray-300">
          En samling av de vakreste landskapene fra Sápmi. Fotografert over sommeren 2025 i Nord-Norge.
        </p>
      </div>

      {/* Actions */}
      <div className="bg-black px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`flex items-center gap-2 ${isLiked ? 'text-rose-500' : 'text-gray-400'}`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">142</span>
          </button>
          <div className="flex items-center gap-2 text-gray-400">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">28</span>
          </div>
        </div>
        <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <Share2 className="w-5 h-5" />
          <span className="text-sm font-medium">Del</span>
        </button>
      </div>

      {/* Gallery - Classic Masonry */}
      <div className="p-4">
        <div className="columns-2 gap-3">
          {mockImages.map((img) => (
            <div key={img.id} className="mb-3 break-inside-avoid">
              <div
                className={`relative rounded-lg overflow-hidden bg-gradient-to-br ${img.color} ${
                  img.aspect === 'portrait' ? 'aspect-[3/4]' : img.aspect === 'landscape' ? 'aspect-[4/3]' : 'aspect-square'
                }`}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white/40" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Variant 2: Sticky Header + Floating Actions
function Variant2() {
  const [isLiked, setIsLiked] = useState(false)

  return (
    <div className="h-full overflow-y-auto bg-black relative">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white text-xs">
                ÁR
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-semibold text-sm">Sápmi Landscapes</p>
              <p className="text-xs text-gray-400">Ása Ráhka</p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-white">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Gallery */}
      <div className="p-4 pb-24">
        <div className="columns-2 gap-3">
          {mockImages.map((img) => (
            <div key={img.id} className="mb-3 break-inside-avoid">
              <div
                className={`relative rounded-lg overflow-hidden bg-gradient-to-br ${img.color} ${
                  img.aspect === 'portrait' ? 'aspect-[3/4]' : img.aspect === 'landscape' ? 'aspect-[4/3]' : 'aspect-square'
                }`}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white/40" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-white/10 p-4">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              isLiked ? 'bg-rose-500/20 text-rose-500' : 'bg-white/10 text-gray-400'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">142</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-gray-400">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">28</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Variant 3: Compact Top Bar
function Variant3() {
  return (
    <div className="h-full overflow-y-auto bg-black">
      {/* Compact Header */}
      <div className="bg-black p-3 border-b border-white/10">
        <div className="flex items-center gap-2 text-xs">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-600 text-white text-[10px]">
              ÁR
            </AvatarFallback>
          </Avatar>
          <span className="text-white font-semibold">Sápmi Landscapes</span>
          <span className="text-gray-400">•</span>
          <Heart className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400">142</span>
          <MessageCircle className="w-4 h-4 text-gray-400 ml-2" />
          <span className="text-gray-400">28</span>
          <Share2 className="w-4 h-4 text-gray-400 ml-auto" />
        </div>
      </div>

      {/* Gallery */}
      <div className="p-4">
        <div className="columns-2 gap-3">
          {mockImages.map((img) => (
            <div key={img.id} className="mb-3 break-inside-avoid">
              <div
                className={`relative rounded-lg overflow-hidden bg-gradient-to-br ${img.color} ${
                  img.aspect === 'portrait' ? 'aspect-[3/4]' : img.aspect === 'landscape' ? 'aspect-[4/3]' : 'aspect-square'
                }`}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white/40" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Variant 4: Side-by-Side Header
function Variant4() {
  const [isLiked, setIsLiked] = useState(false)

  return (
    <div className="h-full overflow-y-auto bg-black">
      {/* Split Header */}
      <div className="bg-black p-4 border-b border-white/10">
        <div className="flex items-start justify-between mb-3">
          {/* Left: Profile */}
          <div className="flex items-center gap-2">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-rose-600 text-white text-xs">
                ÁR
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-semibold text-sm">Ása Ráhka</p>
              <p className="text-xs text-gray-400">6 bilder</p>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="text-right">
            <p className="text-white font-bold text-lg">142</p>
            <p className="text-xs text-gray-400">Likes</p>
          </div>
        </div>

        {/* Title & Actions */}
        <h2 className="text-xl font-bold text-white mb-2">Sápmi Landscapes 2025</h2>
        <p className="text-sm text-gray-300 mb-3">Fotografert over sommeren i Nord-Norge.</p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`flex-1 py-2 rounded-lg font-medium text-sm ${
              isLiked ? 'bg-rose-500 text-white' : 'bg-white/10 text-gray-300'
            }`}
          >
            {isLiked ? 'Likt' : 'Lik'}
          </button>
          <button className="px-4 py-2 rounded-lg bg-white/10 text-gray-300">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Gallery */}
      <div className="p-4">
        <div className="columns-2 gap-3">
          {mockImages.map((img) => (
            <div key={img.id} className="mb-3 break-inside-avoid">
              <div
                className={`relative rounded-lg overflow-hidden bg-gradient-to-br ${img.color} ${
                  img.aspect === 'portrait' ? 'aspect-[3/4]' : img.aspect === 'landscape' ? 'aspect-[4/3]' : 'aspect-square'
                }`}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white/40" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Variant 5: Hero Card
function Variant5() {
  const [isLiked, setIsLiked] = useState(false)

  return (
    <div className="h-full overflow-y-auto bg-black">
      {/* Hero Card */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="w-12 h-12 border-2 border-white/30">
            <AvatarFallback className="bg-white/20 text-white">ÁR</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-semibold">Ása Ráhka</p>
            <p className="text-xs text-white/70">Fotograf</p>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Sápmi Landscapes</h1>
        <p className="text-sm text-white/80 mb-4">
          En samling av de vakreste landskapene fra Sápmi. Fotografert over sommeren 2025.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm ${
              isLiked ? 'bg-white text-purple-600' : 'bg-white/20 text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span>142</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm">
            <MessageCircle className="w-4 h-4" />
            <span>28</span>
          </button>
          <button className="p-2 rounded-full bg-white/20 text-white ml-auto">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Gallery */}
      <div className="px-4 pb-4">
        <div className="columns-2 gap-3">
          {mockImages.map((img) => (
            <div key={img.id} className="mb-3 break-inside-avoid">
              <div
                className={`relative rounded-lg overflow-hidden bg-gradient-to-br ${img.color} ${
                  img.aspect === 'portrait' ? 'aspect-[3/4]' : img.aspect === 'landscape' ? 'aspect-[4/3]' : 'aspect-square'
                }`}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white/40" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Variant 6: Minimal Overlay
function Variant6() {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="h-full overflow-y-auto bg-black relative">
      {/* Gallery with Overlay */}
      <div className="relative">
        {/* Overlay */}
        <div
          className={`absolute top-0 left-0 right-0 z-10 transition-all ${
            showDetails ? 'bg-black/90 p-4' : 'bg-gradient-to-b from-black/60 to-transparent p-4'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xs">
                  ÁR
                </AvatarFallback>
              </Avatar>
              <p className="text-white font-semibold text-sm">Sápmi Landscapes</p>
            </div>
            <button onClick={() => setShowDetails(!showDetails)} className="text-white text-xs">
              {showDetails ? 'Skjul' : 'Vis mer'}
            </button>
          </div>

          {showDetails && (
            <div className="mt-3">
              <h2 className="text-xl font-bold text-white mb-2">Sápmi Landscapes 2025</h2>
              <p className="text-sm text-gray-300 mb-3">Fotografert over sommeren i Nord-Norge.</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-white">
                  <Heart className="w-4 h-4" />
                  <span className="text-sm">142</span>
                </div>
                <div className="flex items-center gap-1 text-white">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">28</span>
                </div>
                <Share2 className="w-4 h-4 text-white ml-auto" />
              </div>
            </div>
          )}
        </div>

        {/* Gallery */}
        <div className="p-4 pt-20">
          <div className="columns-2 gap-3">
            {mockImages.map((img) => (
              <div key={img.id} className="mb-3 break-inside-avoid">
                <div
                  className={`relative rounded-lg overflow-hidden bg-gradient-to-br ${img.color} ${
                    img.aspect === 'portrait' ? 'aspect-[3/4]' : img.aspect === 'landscape' ? 'aspect-[4/3]' : 'aspect-square'
                  }`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Eye className="w-8 h-8 text-white/40" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Variant 7: Bottom Sheet Metadata
function Variant7() {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div className="h-full relative bg-black">
      {/* Gallery (fullscreen) */}
      <div className="h-full overflow-y-auto p-4">
        <div className="columns-2 gap-3">
          {mockImages.map((img) => (
            <div key={img.id} className="mb-3 break-inside-avoid">
              <div
                className={`relative rounded-lg overflow-hidden bg-gradient-to-br ${img.color} ${
                  img.aspect === 'portrait' ? 'aspect-[3/4]' : img.aspect === 'landscape' ? 'aspect-[4/3]' : 'aspect-square'
                }`}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white/40" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pull-up indicator */}
      <button
        onClick={() => setSheetOpen(!sheetOpen)}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm"
      >
        {sheetOpen ? 'Skjul info' : 'Vis info'}
      </button>

      {/* Bottom Sheet */}
      <div
        className={`absolute left-0 right-0 bg-white rounded-t-3xl transition-all duration-300 ${
          sheetOpen ? 'bottom-0 h-[60vh]' : 'bottom-0 h-[100px]'
        }`}
      >
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-4" />
        <div className="px-6 pb-6 overflow-y-auto h-full">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white">ÁR</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-gray-900">Ása Ráhka</p>
              <p className="text-xs text-gray-500">Fotograf</p>
            </div>
          </div>

          {sheetOpen && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sápmi Landscapes 2025</h2>
              <p className="text-sm text-gray-600 mb-4">
                En samling av de vakreste landskapene fra Sápmi. Fotografert over sommeren 2025.
              </p>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">142 likes</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">28 kommentarer</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Kommentarer</h3>
                <p className="text-sm text-gray-500">Kommentarer kommer her...</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Variant 8: Tabs Layout
function Variant8() {
  const [activeTab, setActiveTab] = useState<'gallery' | 'info' | 'comments'>('gallery')

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header */}
      <div className="flex-shrink-0 bg-black p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white text-xs">ÁR</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-semibold text-sm">Sápmi Landscapes</p>
            <p className="text-xs text-gray-400">Ása Ráhka</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 bg-black border-b border-white/10">
        <div className="flex">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'gallery' ? 'text-white border-b-2 border-white' : 'text-gray-400'
            }`}
          >
            Gallery
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'info' ? 'text-white border-b-2 border-white' : 'text-gray-400'
            }`}
          >
            Info
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'comments' ? 'text-white border-b-2 border-white' : 'text-gray-400'
            }`}
          >
            Kommentarer (28)
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'gallery' && (
          <div className="p-4">
            <div className="columns-2 gap-3">
              {mockImages.map((img) => (
                <div key={img.id} className="mb-3 break-inside-avoid">
                  <div
                    className={`relative rounded-lg overflow-hidden bg-gradient-to-br ${img.color} ${
                      img.aspect === 'portrait'
                        ? 'aspect-[3/4]'
                        : img.aspect === 'landscape'
                          ? 'aspect-[4/3]'
                          : 'aspect-square'
                    }`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Eye className="w-8 h-8 text-white/40" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-3">Sápmi Landscapes 2025</h2>
            <p className="text-sm text-gray-300 mb-4">
              En samling av de vakreste landskapene fra Sápmi. Fotografert over sommeren 2025 i Nord-Norge.
            </p>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-300">
                <Heart className="w-5 h-5" />
                <span className="text-sm">142 likes</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="w-5 h-5" />
                <span className="text-sm">Juni 2025</span>
              </div>
            </div>
            <button className="w-full py-3 bg-white/10 text-white rounded-lg font-medium">Del galleri</button>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="p-6">
            <p className="text-gray-400 text-sm">28 kommentarer</p>
            <p className="text-gray-500 text-sm mt-2">Kommentarer vises her...</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Variant 9: Card Stack (Inline cards)
function Variant9() {
  return (
    <div className="h-full overflow-y-auto bg-black p-4">
      {/* Profile Card */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-gradient-to-br from-lime-500 to-green-600 text-white">ÁR</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-semibold">Ása Ráhka</p>
            <p className="text-xs text-gray-400">Fotograf • Tromsø</p>
          </div>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Sápmi Landscapes 2025</h2>
        <p className="text-sm text-gray-300">Fotografert over sommeren i Nord-Norge.</p>
      </div>

      {/* Gallery */}
      <div className="columns-2 gap-3 mb-4">
        {mockImages.slice(0, 3).map((img) => (
          <div key={img.id} className="mb-3 break-inside-avoid">
            <div
              className={`relative rounded-lg overflow-hidden bg-gradient-to-br ${img.color} ${
                img.aspect === 'portrait' ? 'aspect-[3/4]' : img.aspect === 'landscape' ? 'aspect-[4/3]' : 'aspect-square'
              }`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Eye className="w-8 h-8 text-white/40" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Engagement Card */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-white/10">
        <div className="flex items-center justify-around">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">142</p>
            <p className="text-xs text-gray-400">Likes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">28</p>
            <p className="text-xs text-gray-400">Kommentarer</p>
          </div>
          <button className="p-3 bg-white/10 rounded-full text-white">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Rest of Gallery */}
      <div className="columns-2 gap-3">
        {mockImages.slice(3).map((img) => (
          <div key={img.id} className="mb-3 break-inside-avoid">
            <div
              className={`relative rounded-lg overflow-hidden bg-gradient-to-br ${img.color} ${
                img.aspect === 'portrait' ? 'aspect-[3/4]' : img.aspect === 'landscape' ? 'aspect-[4/3]' : 'aspect-square'
              }`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Eye className="w-8 h-8 text-white/40" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Variant 10: Magazine Cover
function Variant10() {
  const [isLiked, setIsLiked] = useState(false)

  return (
    <div className="h-full overflow-y-auto bg-black">
      {/* Magazine-style Header */}
      <div className="relative bg-gradient-to-b from-black to-transparent p-6 pb-12">
        {/* Profile badge in corner */}
        <div className="absolute top-4 right-4">
          <Avatar className="w-10 h-10 border-2 border-white/30">
            <AvatarFallback className="bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white text-xs">
              ÁR
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Big title */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">
          Sápmi
          <br />
          Landscapes
        </h1>
        <p className="text-white/80 text-sm mb-1">Av Ása Ráhka</p>
        <p className="text-white/60 text-xs">Juni 2025 • Nord-Norge</p>
      </div>

      {/* Gallery */}
      <div className="px-4 pb-24">
        <div className="columns-2 gap-3">
          {mockImages.map((img) => (
            <div key={img.id} className="mb-3 break-inside-avoid">
              <div
                className={`relative rounded-lg overflow-hidden bg-gradient-to-br ${img.color} ${
                  img.aspect === 'portrait' ? 'aspect-[3/4]' : img.aspect === 'landscape' ? 'aspect-[4/3]' : 'aspect-square'
                }`}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white/40" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className="flex items-center gap-2 text-white"
          >
            <Heart className={`w-6 h-6 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span className="text-sm font-medium">142</span>
          </button>
          <button className="flex items-center gap-2 text-white">
            <MessageCircle className="w-6 h-6" />
            <span className="text-sm font-medium">28</span>
          </button>
          <button className="flex items-center gap-2 text-white">
            <Share2 className="w-6 h-6" />
            <span className="text-sm font-medium">Del</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Variant 11: Header Stack + Tabs (Gallery/Comments)
function Variant11() {
  const [isLiked, setIsLiked] = useState(false)
  const [activeTab, setActiveTab] = useState<'gallery' | 'comments'>('gallery')
  const [imageLikes, setImageLikes] = useState<Record<number, boolean>>({})
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null)
  const [commentInput, setCommentInput] = useState('')
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set())
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [scale, setScale] = useState(1)
  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const [initialDistance, setInitialDistance] = useState(0)
  const [initialScale, setInitialScale] = useState(1)

  const toggleImageLike = (imageId: number) => {
    setImageLikes(prev => ({
      ...prev,
      [imageId]: !prev[imageId]
    }))
  }

  const openImageView = (imageId: number) => {
    setSelectedImageId(imageId)
  }

  const closeImageView = () => {
    setSelectedImageId(null)
    setScale(1)
    setTranslateX(0)
    setTranslateY(0)
  }

  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setInitialDistance(getDistance(e.touches))
      setInitialScale(scale)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const currentDistance = getDistance(e.touches)
      const newScale = Math.max(1, Math.min(4, (currentDistance / initialDistance) * initialScale))
      setScale(newScale)
    } else if (e.touches.length === 1 && scale > 1) {
      const touch = e.touches[0]
      setTranslateX(touch.clientX - window.innerWidth / 2)
      setTranslateY(touch.clientY - window.innerHeight / 2)
    }
  }

  const handleTouchEnd = () => {
    if (scale === 1) {
      setTranslateX(0)
      setTranslateY(0)
    }
  }

  const handleDoubleTap = () => {
    if (scale === 1) {
      setScale(2)
    } else {
      setScale(1)
      setTranslateX(0)
      setTranslateY(0)
    }
  }

  const toggleCommentLike = (commentId: number) => {
    setLikedComments((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }

  // If single image view is open, show Complete Feed Card
  if (selectedImageId !== null) {
    const selectedImage = mockImages.find(img => img.id === selectedImageId)
    if (!selectedImage) return null

    const mockImageComments = [
      { id: 1, user: 'John Doe', text: 'Utrolig vakkert! 😍', likes: 5 },
      { id: 2, user: 'Mari Hansen', text: 'Hvor er dette fotografert?', likes: 2 },
    ]

    return (
      <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
        {/* Close button */}
        <button
          onClick={closeImageView}
          className="fixed top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-4 pb-64">
          {/* Image with pinch to zoom */}
          <div className="mb-4">
            <div
              className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${selectedImage.color} ${
                selectedImage.aspect === 'portrait'
                  ? 'aspect-[3/4]'
                  : selectedImage.aspect === 'landscape'
                    ? 'aspect-[4/3]'
                    : 'aspect-square'
              } touch-none`}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDoubleClick={handleDoubleTap}
            >
              <div
                className="absolute inset-0 flex items-center justify-center transition-transform duration-200"
                style={{
                  transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`,
                }}
              >
                <Eye className="w-16 h-16 text-white/40" />
              </div>
            </div>
            {scale > 1 && (
              <p className="text-xs text-center text-gray-400 mt-2">
                Pinch ut for å zoome tilbake • Dobbelttrykk for reset
              </p>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-white mb-2">Sápmi Landscapes 2025</h2>

          {/* Caption */}
          <p className="text-sm text-gray-300 mb-4">
            En samling av de vakreste landskapene fra Sápmi. Fotografert over sommeren 2025 i Nord-Norge. 🌄✨
          </p>

          {/* Engagement stats */}
          <div className="flex items-center gap-4 py-3 border-y border-white/10 mb-4">
            <button
              onClick={() => toggleImageLike(selectedImage.id)}
              className={`flex items-center gap-2 ${imageLikes[selectedImage.id] ? 'text-rose-500' : 'text-gray-400'}`}
            >
              <Heart className={`w-5 h-5 ${imageLikes[selectedImage.id] ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{selectedImage.likes + (imageLikes[selectedImage.id] ? 1 : 0)}</span>
            </button>
            <div className="flex items-center gap-2 text-gray-400">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{selectedImage.comments}</span>
            </div>
            <button className="flex items-center gap-2 text-gray-400 ml-auto hover:text-white transition-colors">
              <Share2 className="w-5 h-5" />
              <span className="text-sm font-medium">Del</span>
            </button>
          </div>

          {/* Comment input */}
          <div className="mb-6">
            <div className="flex gap-2">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                  Du
                </AvatarFallback>
              </Avatar>
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Skriv en kommentar..."
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {commentInput && (
                <button className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-full hover:bg-blue-600 transition-colors">
                  Send
                </button>
              )}
            </div>
          </div>

          {/* Comments section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase">Kommentarer</h3>

            {mockImageComments.map((comment) => {
              const isCommentLiked = likedComments.has(comment.id)
              const isReplying = replyingTo === comment.id

              return (
                <div key={comment.id} className="space-y-2">
                  <div className="flex gap-2">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-500 text-white text-xs">
                        {comment.user.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-white/5 rounded-2xl px-3 py-2">
                        <p className="text-sm font-semibold text-white">{comment.user}</p>
                        <p className="text-sm text-gray-300">{comment.text}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-1 px-3">
                        <button
                          onClick={() => toggleCommentLike(comment.id)}
                          className={`text-xs font-medium ${
                            isCommentLiked ? 'text-rose-500' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {isCommentLiked ? '❤️' : '🤍'} {comment.likes + (isCommentLiked ? 1 : 0)}
                        </button>
                        <button
                          onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                          className="text-xs font-medium text-gray-400 hover:text-white"
                        >
                          Svar
                        </button>
                        <span className="text-xs text-gray-500">2t siden</span>
                      </div>

                      {/* Reply input */}
                      {isReplying && (
                        <div className="flex gap-2 mt-2 ml-3">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={`Svar til ${comment.user}...`}
                            className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {replyText && (
                            <button className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-full hover:bg-blue-600 transition-colors">
                              Send
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bottom white space */}
          <div className="h-[100px]" />
        </div>
      </div>
    )
  }

  // Mock comments
  const mockComments = [
    {
      id: 1,
      user: { name: 'John Doe', avatar: 'JD', color: 'from-blue-500 to-cyan-600' },
      text: 'Utrolig vakre bilder! Hvor er dette fotografert? 😍',
      timestamp: '2t siden',
      likes: 12,
    },
    {
      id: 2,
      user: { name: 'Mari Hansen', avatar: 'MH', color: 'from-green-500 to-emerald-600' },
      text: 'Fantastisk jobbet! Elsker lyset i disse bildene.',
      timestamp: '5t siden',
      likes: 8,
    },
    {
      id: 3,
      user: { name: 'Per Olsen', avatar: 'PO', color: 'from-purple-500 to-violet-600' },
      text: 'Må besøke Sápmi en gang! Dette ser magisk ut.',
      timestamp: '1d siden',
      likes: 5,
    },
  ]

  return (
    <div className="bg-black min-h-screen">
      {/* Left Sidebar - Desktop only fixed, Mobile scrolls naturally */}
      <div className="bg-black md:w-96 md:fixed md:left-0 md:top-0 md:h-screen md:overflow-y-auto md:border-r md:border-white/10 md:z-10">
        {/* Profile */}
        <div className="bg-black p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-white/20">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">ÁR</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-semibold">Ása Ráhka</p>
              <p className="text-xs text-gray-400">Fotograf • Tromsø</p>
            </div>
          </div>
        </div>

        {/* Title & Description */}
        <div className="bg-black px-6 py-5 border-b border-white/10">
          <h1 className="text-2xl font-bold text-white mb-3">Sápmi Landscapes 2025</h1>
          <p className="text-sm text-gray-300 leading-relaxed">
            En samling av de vakreste landskapene fra Sápmi. Fotografert over sommeren 2025 i Nord-Norge.
          </p>
        </div>

        {/* Actions */}
        <div className="bg-black px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`flex items-center gap-2 ${isLiked ? 'text-rose-500' : 'text-gray-400'}`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">142</span>
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">28</span>
            </button>
          </div>
          <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <Share2 className="w-5 h-5" />
            <span className="text-sm font-medium">Del</span>
          </button>
        </div>

        {/* Tabs - Mobile only */}
        <div className="bg-black border-b border-white/10 md:hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'gallery'
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Galleri
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'comments'
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Kommentarer ({mockComments.length})
            </button>
          </div>
        </div>

        {/* Mobile Gallery - only shown on mobile when gallery tab active */}
        {activeTab === 'gallery' && (
          <div className="md:hidden p-6">
            <div className="columns-2 gap-4">
              {mockImages.map((img) => (
                <div key={img.id} className="mb-4 break-inside-avoid">
                  <div
                    onClick={() => openImageView(img.id)}
                    className={`relative rounded-lg overflow-hidden bg-gradient-to-br ${img.color} ${
                      img.aspect === 'portrait'
                        ? 'aspect-[3/4]'
                        : img.aspect === 'landscape'
                          ? 'aspect-[4/3]'
                          : 'aspect-square'
                    } group cursor-pointer`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Eye className="w-8 h-8 text-white/40" />
                    </div>

                    {/* Engagement Overlay */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleImageLike(img.id)
                        }}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-full backdrop-blur-sm transition-all group/like ${
                          imageLikes[img.id]
                            ? 'bg-rose-500/60'
                            : 'bg-black/30 hover:bg-black/50'
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 transition-all ${
                            imageLikes[img.id]
                              ? 'fill-white text-white'
                              : 'text-white group-hover/like:scale-110'
                          }`}
                        />
                        <span className="text-xs font-medium text-white">
                          {img.likes + (imageLikes[img.id] ? 1 : 0)}
                        </span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openImageView(img.id)
                        }}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-white" />
                        <span className="text-xs font-medium text-white">{img.comments}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section - shown on mobile when comments tab active, always on desktop */}
        <div className={`p-6 ${activeTab === 'comments' ? '' : 'hidden md:block'}`}>
            {/* Comment Input */}
            <div className="mb-8">
              <div className="flex gap-4">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-rose-500 to-pink-600 text-white text-xs">
                    Du
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Skriv en kommentar..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-6">
              {mockComments.map((comment) => (
                <div key={comment.id} className="flex gap-4">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback className={`bg-gradient-to-br ${comment.user.color} text-white text-xs`}>
                      {comment.user.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-white/5 rounded-2xl px-4 py-3">
                      <p className="text-sm font-semibold text-white mb-2">{comment.user.name}</p>
                      <p className="text-sm text-gray-300 leading-relaxed">{comment.text}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-3 px-3">
                      <button className="text-xs text-gray-400 hover:text-white transition-colors">
                        <Heart className="w-3 h-3 inline mr-1" />
                        {comment.likes}
                      </button>
                      <button className="text-xs text-gray-400 hover:text-white transition-colors">Svar</button>
                      <span className="text-xs text-gray-500">{comment.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          {/* Load More */}
          <button className="w-full mt-8 py-3 text-sm text-gray-400 hover:text-white transition-colors">
            Vis flere kommentarer
          </button>
        </div>
      </div>

      {/* Right Side - Desktop Masonry Gallery (Always visible, scrollable) */}
      <div className="hidden md:block md:ml-96 md:min-h-screen bg-black">
        <div className="p-6 min-h-screen">
          <div className="columns-2 lg:columns-3 gap-4">
            {mockImages.map((img) => (
              <div key={img.id} className="mb-4 break-inside-avoid">
                <div
                  onClick={() => openImageView(img.id)}
                  className={`relative rounded-lg overflow-hidden bg-gradient-to-br ${img.color} ${
                    img.aspect === 'portrait'
                      ? 'aspect-[3/4]'
                      : img.aspect === 'landscape'
                        ? 'aspect-[4/3]'
                        : 'aspect-square'
                  } group cursor-pointer`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Eye className="w-8 h-8 text-white/40" />
                  </div>

                  {/* Engagement Overlay - Always visible on desktop */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleImageLike(img.id)
                      }}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-full backdrop-blur-sm transition-all group/like ${
                        imageLikes[img.id]
                          ? 'bg-rose-500/60'
                          : 'bg-black/30 hover:bg-black/50'
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 transition-all ${
                          imageLikes[img.id]
                            ? 'fill-white text-white'
                            : 'text-white group-hover/like:scale-110'
                        }`}
                      />
                      <span className="text-xs font-medium text-white">
                        {img.likes + (imageLikes[img.id] ? 1 : 0)}
                      </span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openImageView(img.id)
                      }}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-white" />
                      <span className="text-xs font-medium text-white">{img.comments}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
