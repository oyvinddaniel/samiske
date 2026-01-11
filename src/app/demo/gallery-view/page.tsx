'use client'

import { useState } from 'react'
import { Eye, Heart, MessageCircle, ChevronLeft, Grid3x3, LayoutGrid } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface GalleryVariant {
  id: number
  name: string
  description: string
  inspiration: string
  pros: string[]
  cons: string[]
  complexity: 'Enkel' | 'Moderat' | 'Kompleks'
  implementationTime: string
}

const variants: GalleryVariant[] = [
  {
    id: 1,
    name: 'Classic Masonry',
    description: 'Pinterest-stil med forskjellige høyder, 2 kolonner',
    inspiration: 'Pinterest',
    pros: ['Visuelt interessant', 'Effektiv plassbruk', 'Fungerer med alle aspect ratios'],
    cons: ['Kan være vanskelig å finne spesifikt bilde'],
    complexity: 'Moderat',
    implementationTime: '2 timer',
  },
  {
    id: 8,
    name: 'Magazine Layout',
    description: 'Varierende størrelser i typografi-inspirert layout',
    inspiration: 'Vogue/Kinfolk',
    pros: ['Sofistikert', 'Hierarki', 'Redaksjonell følelse'],
    cons: ['Kompleks', 'Krever kurering'],
    complexity: 'Kompleks',
    implementationTime: '5 timer',
  },
  {
    id: 12,
    name: 'Bento Box',
    description: 'Apple-stil grid med kurerte størrelser',
    inspiration: 'Apple Marketing',
    pros: ['Premium', 'Elegant', 'Kurert'],
    cons: ['Krever design-beslutninger', 'Mindre fleksibel'],
    complexity: 'Kompleks',
    implementationTime: '4 timer',
  },
]

// Mock images for demos - 25 bilder
const mockImages = [
  { id: 1, aspect: 'portrait', color: 'from-rose-500 to-pink-600' },
  { id: 2, aspect: 'landscape', color: 'from-blue-500 to-cyan-600' },
  { id: 3, aspect: 'square', color: 'from-green-500 to-emerald-600' },
  { id: 4, aspect: 'portrait', color: 'from-purple-500 to-violet-600' },
  { id: 5, aspect: 'landscape', color: 'from-orange-500 to-amber-600' },
  { id: 6, aspect: 'square', color: 'from-indigo-500 to-blue-600' },
  { id: 7, aspect: 'portrait', color: 'from-teal-500 to-cyan-600' },
  { id: 8, aspect: 'landscape', color: 'from-fuchsia-500 to-pink-600' },
  { id: 9, aspect: 'square', color: 'from-lime-500 to-green-600' },
  { id: 10, aspect: 'portrait', color: 'from-red-500 to-rose-600' },
  { id: 11, aspect: 'landscape', color: 'from-sky-500 to-blue-600' },
  { id: 12, aspect: 'square', color: 'from-emerald-500 to-teal-600' },
  { id: 13, aspect: 'portrait', color: 'from-violet-500 to-purple-600' },
  { id: 14, aspect: 'landscape', color: 'from-amber-500 to-orange-600' },
  { id: 15, aspect: 'square', color: 'from-cyan-500 to-teal-600' },
  { id: 16, aspect: 'portrait', color: 'from-pink-500 to-rose-600' },
  { id: 17, aspect: 'landscape', color: 'from-slate-500 to-gray-600' },
  { id: 18, aspect: 'square', color: 'from-yellow-500 to-amber-600' },
  { id: 19, aspect: 'portrait', color: 'from-fuchsia-600 to-purple-700' },
  { id: 20, aspect: 'landscape', color: 'from-teal-600 to-emerald-700' },
  { id: 21, aspect: 'square', color: 'from-orange-600 to-red-700' },
  { id: 22, aspect: 'portrait', color: 'from-blue-600 to-indigo-700' },
  { id: 23, aspect: 'landscape', color: 'from-green-600 to-lime-700' },
  { id: 24, aspect: 'square', color: 'from-purple-600 to-fuchsia-700' },
  { id: 25, aspect: 'portrait', color: 'from-cyan-600 to-sky-700' },
]

export default function GalleryViewDemoPage() {
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)

  if (selectedVariant !== null) {
    const variant = variants.find((v) => v.id === selectedVariant)
    if (!variant) return null

    return (
      <div className="fixed inset-0 bg-black z-50">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/90 to-transparent p-4">
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
        <div className="absolute inset-0 pt-20">
          {selectedVariant === 1 && <Variant1 />}
          {selectedVariant === 8 && <Variant8 />}
          {selectedVariant === 12 && <Variant12 />}
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
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
              <LayoutGrid className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gallery View Designs</h1>
              <p className="text-gray-500">3 moderne design-forslag for bildegalleri på mobil (25 bilder hver)</p>
            </div>
          </div>
          <p className="text-gray-600">
            Trykk på et design for å se fullskjerm demo. Alle varianter er mobiloptimaliserte og touch-vennlige.
          </p>
        </div>

        {/* Variants Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Design</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Kompleksitet</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tid</th>
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
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        variant.complexity === 'Enkel'
                          ? 'bg-green-100 text-green-700'
                          : variant.complexity === 'Moderat'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {variant.complexity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{variant.implementationTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Variant Details */}
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
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                <span className="bg-gray-100 px-2 py-0.5 rounded">{variant.inspiration}</span>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-green-600 mb-1">Fordeler:</p>
                  <ul className="text-xs text-gray-600 space-y-0.5">
                    {variant.pros.slice(0, 2).map((pro, i) => (
                      <li key={i}>• {pro}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-600 mb-1">Ulemper:</p>
                  <ul className="text-xs text-gray-600 space-y-0.5">
                    {variant.cons.slice(0, 1).map((con, i) => (
                      <li key={i}>• {con}</li>
                    ))}
                  </ul>
                </div>
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

// Variant 1: Classic Masonry
function Variant1() {
  return (
    <div className="h-full overflow-y-auto bg-black p-4">
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
              <div className="absolute bottom-2 right-2 flex gap-2">
                <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                  <Heart className="w-3 h-3 text-white fill-white" />
                  <span className="text-xs text-white">12</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Variant 8: Magazine Layout
function Variant8() {
  // Pattern: 1 large hero (6 cols), 2 medium (3 cols each), 3 small (2 cols each) = 6 bilder per syklus
  const layout = [
    { span: 'col-span-6 row-span-2', aspectClass: 'aspect-[16/9]', iconSize: 'w-16 h-16' },
    { span: 'col-span-3', aspectClass: 'aspect-square', iconSize: 'w-8 h-8' },
    { span: 'col-span-3', aspectClass: 'aspect-square', iconSize: 'w-8 h-8' },
    { span: 'col-span-2', aspectClass: 'aspect-square', iconSize: 'w-6 h-6' },
    { span: 'col-span-2', aspectClass: 'aspect-square', iconSize: 'w-6 h-6' },
    { span: 'col-span-2', aspectClass: 'aspect-square', iconSize: 'w-6 h-6' },
  ]

  return (
    <div className="h-full overflow-y-auto bg-black p-4">
      <div className="grid grid-cols-6 gap-3">
        {mockImages.map((img, i) => {
          const layoutItem = layout[i % layout.length]
          return (
            <div key={img.id} className={layoutItem.span}>
              <div className={`relative rounded-xl overflow-hidden bg-gradient-to-br ${img.color} ${layoutItem.aspectClass}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Eye className={`${layoutItem.iconSize} text-white/40`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Variant 12: Bento Box
function Variant12() {
  // Pattern: 1 large featured (4 cols, 3 rows), 1 medium (2 cols, 2 rows), 2 small (2 cols, 1 row each) = 4 bilder per syklus
  const layout = [
    { span: 'col-span-4 row-span-3', borderRadius: 'rounded-2xl', iconSize: 'w-16 h-16' },
    { span: 'col-span-2 row-span-2', borderRadius: 'rounded-xl', iconSize: 'w-10 h-10' },
    { span: 'col-span-2 row-span-1', borderRadius: 'rounded-xl', iconSize: 'w-8 h-8' },
    { span: 'col-span-2 row-span-1', borderRadius: 'rounded-xl', iconSize: 'w-8 h-8' },
  ]

  return (
    <div className="h-full overflow-y-auto bg-black p-4">
      <div className="grid grid-cols-4 auto-rows-[100px] gap-3">
        {mockImages.map((img, i) => {
          const layoutItem = layout[i % layout.length]
          return (
            <div key={img.id} className={layoutItem.span}>
              <div className={`relative w-full h-full ${layoutItem.borderRadius} overflow-hidden bg-gradient-to-br ${img.color}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Eye className={`${layoutItem.iconSize} text-white/40`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

