'use client'

import { useState } from 'react'
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  Smile,
  MoreVertical,
  ChevronLeft,
  ThumbsUp,
  Flame,
  Sparkles,
  Eye,
  User,
} from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface DesignVariant {
  id: number
  name: string
  description: string
  inspiration: string
  pros: string[]
  cons: string[]
  complexity: 'Enkel' | 'Moderat' | 'Kompleks'
  implementationTime: string
}

const variants: DesignVariant[] = [
  {
    id: 1,
    name: 'Instagram Bottom Bar',
    description: 'Minimalistisk bottom bar med like, comment count og input',
    inspiration: 'Instagram Stories',
    pros: ['Thumb-friendly', 'Kjent pattern', 'Rask implementering'],
    cons: ['Begrenset plass', 'Ingen threading'],
    complexity: 'Enkel',
    implementationTime: '2 timer',
  },
  {
    id: 2,
    name: 'Reddit Action Bar',
    description: 'Horisontal action bar med tekst-knapper og inline kommentarer',
    inspiration: 'Reddit',
    pros: ['Tydelige actions', 'Full funksjonalitet', 'Desktop-friendly'],
    cons: ['Tar mer plass', 'Mindre mobilvennlig'],
    complexity: 'Moderat',
    implementationTime: '4 timer',
  },
  {
    id: 3,
    name: 'TikTok Floating Actions',
    description: 'Vertikale floating buttons på høyre side',
    inspiration: 'TikTok',
    pros: ['Ikke i veien', 'Elegant', 'Video-friendly'],
    cons: ['Mindre synlig', 'Uvanlig for bilder'],
    complexity: 'Enkel',
    implementationTime: '2 timer',
  },
  {
    id: 4,
    name: 'Facebook Inline',
    description: 'Action bar med full inline kommentarseksjon',
    inspiration: 'Facebook',
    pros: ['Komplett system', 'Kjent pattern', 'Nested comments'],
    cons: ['Tar mye plass', 'Tregere loading'],
    complexity: 'Kompleks',
    implementationTime: '6 timer',
  },
  {
    id: 5,
    name: 'Pinterest Hover Overlay',
    description: 'Gradient overlay med actions ved hover/tap',
    inspiration: 'Pinterest',
    pros: ['Elegant', 'Ikke i veien', 'Fokus på bilde'],
    cons: ['Krever hover/tap', 'Mindre discoverable'],
    complexity: 'Moderat',
    implementationTime: '3 timer',
  },
  {
    id: 6,
    name: 'Twitter Compact',
    description: 'Kompakt rad med icons nederst',
    inspiration: 'Twitter (X)',
    pros: ['Kompakt', 'Oversiktlig', 'Rask'],
    cons: ['Små touch targets', 'Lite plass til tekst'],
    complexity: 'Enkel',
    implementationTime: '2 timer',
  },
  {
    id: 7,
    name: 'LinkedIn Card',
    description: 'Profesjonell card med profil, actions og preview',
    inspiration: 'LinkedIn',
    pros: ['Profesjonell', 'God UX', 'All info synlig'],
    cons: ['Tar mye plass', 'Mindre for bilder'],
    complexity: 'Moderat',
    implementationTime: '4 timer',
  },
  {
    id: 8,
    name: 'Snapchat Quick Reactions',
    description: 'Emoji quick reactions med swipe-to-comment',
    inspiration: 'Snapchat/iMessage',
    pros: ['Rask interaksjon', 'Fun', 'Moderne'],
    cons: ['Mindre standard', 'Krever onboarding'],
    complexity: 'Kompleks',
    implementationTime: '5 timer',
  },
  {
    id: 9,
    name: 'YouTube Bottom Sheet',
    description: 'Swipe-up bottom sheet for full kommentarseksjon',
    inspiration: 'YouTube mobile',
    pros: ['Full plass for comments', 'Kjent pattern', 'Clean UI'],
    cons: ['Ekstra interaksjon', 'Kompleks state'],
    complexity: 'Kompleks',
    implementationTime: '6 timer',
  },
  {
    id: 10,
    name: 'Modern Glass',
    description: 'Glassmorphism bottom bar med blur og transparency',
    inspiration: 'iOS/macOS',
    pros: ['Moderne', 'Elegant', 'Ser premium ut'],
    cons: ['Performance', 'Browser support'],
    complexity: 'Moderat',
    implementationTime: '3 timer',
  },
  {
    id: 11,
    name: 'LinkedIn Dark Card',
    description: 'Profesjonell card med sort bakgrunn og gradient accents',
    inspiration: 'LinkedIn Dark Mode',
    pros: ['Profesjonell', 'Dark theme', 'Moderne', 'Elegant'],
    cons: ['Tar mye plass', 'Mer kompleks'],
    complexity: 'Moderat',
    implementationTime: '4 timer',
  },
  {
    id: 12,
    name: 'Reddit + Instagram Hybrid',
    description: 'Profil øverst + caption med "mer/mindre" + clean action icons nederst',
    inspiration: 'Reddit + Instagram',
    pros: ['Clean design', 'Profil synlig', 'Caption expandable', 'Kompakt', 'Thumb-friendly'],
    cons: ['Ingen direkte comment input', 'Krever tap for å kommentere'],
    complexity: 'Enkel',
    implementationTime: '2 timer',
  },
  {
    id: 13,
    name: 'Complete Feed Card',
    description: 'Komplett feed-card med bilde på topp, tittel, caption, engagement og full kommentarseksjon',
    inspiration: 'Facebook/Instagram Feed',
    pros: ['All info synlig', 'Full funksjonalitet', 'Threaded comments', 'Like på comments', 'Reply på comments'],
    cons: ['Tar mye plass', 'Tung å scrolle', 'Kompleks'],
    complexity: 'Kompleks',
    implementationTime: '6 timer',
  },
]

const mockUser = {
  name: 'Ása Ráhka',
  avatar: '',
  initials: 'ÁR',
}

export default function GalleryEngagementDemo() {
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)
  const [likedVariants, setLikedVariants] = useState<Set<number>>(new Set())
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({})

  const toggleLike = (id: number) => {
    setLikedVariants((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleCommentChange = (id: number, value: string) => {
    setCommentInputs((prev) => ({ ...prev, [id]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/demo/design-dashboard"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gallery Engagement Designs</h1>
              <p className="text-sm text-gray-500">13 moderne design-forslag for likes og kommentarer</p>
            </div>
          </div>
        </div>
      </div>

      {/* Variants Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {variants.map((variant) => {
            const isLiked = likedVariants.has(variant.id)
            const commentInput = commentInputs[variant.id] || ''

            return (
              <div
                key={variant.id}
                className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:border-blue-300 transition-all"
              >
                {/* Variant Info Header */}
                <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{variant.name}</h3>
                      <p className="text-sm text-gray-600">{variant.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
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
                      <span className="text-xs text-gray-500">{variant.implementationTime}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-gray-600">Inspirert av {variant.inspiration}</span>
                  </div>
                </div>

                {/* Live Preview */}
                <div className="bg-black aspect-[9/16] max-h-[600px] relative overflow-hidden">
                  {/* Mock Image */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
                    <div className="text-center text-white/40">
                      <Eye className="w-16 h-16 mx-auto mb-2" />
                      <p className="text-sm">Gallery Image</p>
                    </div>
                  </div>

                  {/* Variant-specific UI */}
                  {variant.id === 1 && <Variant1 isLiked={isLiked} toggleLike={() => toggleLike(1)} commentInput={commentInput} setCommentInput={(v) => handleCommentChange(1, v)} />}
                  {variant.id === 2 && <Variant2 isLiked={isLiked} toggleLike={() => toggleLike(2)} commentInput={commentInput} setCommentInput={(v) => handleCommentChange(2, v)} />}
                  {variant.id === 3 && <Variant3 isLiked={isLiked} toggleLike={() => toggleLike(3)} />}
                  {variant.id === 4 && <Variant4 isLiked={isLiked} toggleLike={() => toggleLike(4)} commentInput={commentInput} setCommentInput={(v) => handleCommentChange(4, v)} />}
                  {variant.id === 5 && <Variant5 isLiked={isLiked} toggleLike={() => toggleLike(5)} />}
                  {variant.id === 6 && <Variant6 isLiked={isLiked} toggleLike={() => toggleLike(6)} />}
                  {variant.id === 7 && <Variant7 isLiked={isLiked} toggleLike={() => toggleLike(7)} commentInput={commentInput} setCommentInput={(v) => handleCommentChange(7, v)} />}
                  {variant.id === 8 && <Variant8 isLiked={isLiked} toggleLike={() => toggleLike(8)} />}
                  {variant.id === 9 && <Variant9 isLiked={isLiked} toggleLike={() => toggleLike(9)} />}
                  {variant.id === 10 && <Variant10 isLiked={isLiked} toggleLike={() => toggleLike(10)} commentInput={commentInput} setCommentInput={(v) => handleCommentChange(10, v)} />}
                  {variant.id === 11 && <Variant11 isLiked={isLiked} toggleLike={() => toggleLike(11)} commentInput={commentInput} setCommentInput={(v) => handleCommentChange(11, v)} />}
                  {variant.id === 12 && <Variant12 isLiked={isLiked} toggleLike={() => toggleLike(12)} commentInput={commentInput} setCommentInput={(v) => handleCommentChange(12, v)} />}
                  {variant.id === 13 && <Variant13 isLiked={isLiked} toggleLike={() => toggleLike(13)} commentInput={commentInput} setCommentInput={(v) => handleCommentChange(13, v)} />}
                </div>

                {/* Pros & Cons */}
                <div className="p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-semibold text-green-700 mb-1">✓ Fordeler</p>
                      <ul className="space-y-0.5 text-gray-600">
                        {variant.pros.map((pro, i) => (
                          <li key={i}>• {pro}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-red-700 mb-1">✗ Ulemper</p>
                      <ul className="space-y-0.5 text-gray-600">
                        {variant.cons.map((con, i) => (
                          <li key={i}>• {con}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Comparison Table */}
        <div className="mt-12 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <h2 className="text-xl font-semibold text-gray-900">Sammenligning</h2>
            <p className="text-sm text-gray-600 mt-1">Oversikt over alle design-forslag</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Design</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Kompleksitet</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Tid</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Beste for</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {variants.map((variant) => (
                  <tr key={variant.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{variant.name}</p>
                        <p className="text-xs text-gray-500">{variant.inspiration}</p>
                      </div>
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
                    <td className="px-4 py-3 text-sm text-gray-600">{variant.implementationTime}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {variant.id === 1 && 'Mobil-first, rask MVP'}
                      {variant.id === 2 && 'Desktop, full funksjonalitet'}
                      {variant.id === 3 && 'Video, stories, immersive'}
                      {variant.id === 4 && 'Social feed, threading'}
                      {variant.id === 5 && 'Visuelle gallerier'}
                      {variant.id === 6 && 'Minimal, text-heavy'}
                      {variant.id === 7 && 'Profesjonelt nettverk'}
                      {variant.id === 8 && 'Unge brukere, casual'}
                      {variant.id === 9 && 'Video, lange kommentarer'}
                      {variant.id === 10 && 'Premium feel, moderne'}
                      {variant.id === 11 && 'Profesjonelt, dark mode'}
                      {variant.id === 12 && 'Hybrid, best of both worlds'}
                      {variant.id === 13 && 'Full feed-stil, all funksjoner'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommendation */}
        <div className="mt-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Anbefaling</h3>
              <p className="text-blue-100 mb-4">
                Start med <strong>Variant 1: Instagram Bottom Bar</strong>, <strong>Variant 10: Modern Glass</strong>,
                eller <strong>Variant 12: Reddit + Instagram Hybrid</strong> for best kombinasjon av funksjonalitet og stil.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <p className="text-xs text-blue-100">Quick Win</p>
                  <p className="font-semibold">Variant 1 (2t)</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <p className="text-xs text-blue-100">Premium Look</p>
                  <p className="font-semibold">Variant 10 (3t)</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <p className="text-xs text-blue-100">Dark Mode</p>
                  <p className="font-semibold">Variant 11 (4t)</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <p className="text-xs text-blue-100">Best of Both</p>
                  <p className="font-semibold">Variant 12 (3t)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link
            href="/demo/design-dashboard"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Tilbake til Design Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

// ===================================================================
// VARIANT COMPONENTS
// ===================================================================

interface VariantProps {
  isLiked: boolean
  toggleLike: () => void
  commentInput?: string
  setCommentInput?: (value: string) => void
}

// Variant 1: Instagram Bottom Bar
function Variant1({ isLiked, toggleLike, commentInput, setCommentInput }: VariantProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-white/10 p-3">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleLike}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`} />
          <span className={`text-sm font-medium ${isLiked ? 'text-rose-500' : 'text-gray-400'}`}>42</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-white/10 transition-colors">
          <MessageCircle className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-400">12</span>
        </button>
        <input
          type="text"
          value={commentInput}
          onChange={(e) => setCommentInput?.(e.target.value)}
          placeholder="Skriv en kommentar..."
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {commentInput && (
          <button className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-full">
            Send
          </button>
        )}
      </div>
    </div>
  )
}

// Variant 2: Reddit Action Bar
function Variant2({ isLiked, toggleLike, commentInput, setCommentInput }: VariantProps) {
  return (
    <>
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8 border-2 border-white/20">
            <AvatarFallback className="bg-purple-500 text-white text-xs">ÁR</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-white">Ása Ráhka</p>
            <p className="text-xs text-white/60">2t siden</p>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-black/95 border-t border-white/10">
        <div className="flex items-center gap-1 p-2 border-b border-white/10">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors ${
              isLiked ? 'text-rose-500' : 'text-gray-300'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">Like (42)</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 text-gray-300 transition-colors">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Kommenter (12)</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 text-gray-300 transition-colors">
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">Del</span>
          </button>
        </div>
        <div className="p-3">
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput?.(e.target.value)}
            placeholder="Skriv en kommentar..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </>
  )
}

// Variant 3: TikTok Floating Actions
function Variant3({ isLiked, toggleLike }: VariantProps) {
  return (
    <div className="absolute right-3 bottom-20 flex flex-col gap-4">
      <button
        onClick={toggleLike}
        className="flex flex-col items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full p-3 hover:bg-black/70 transition-colors"
      >
        <Heart className={`w-6 h-6 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
        <span className="text-xs font-semibold text-white">42</span>
      </button>
      <button className="flex flex-col items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full p-3 hover:bg-black/70 transition-colors">
        <MessageCircle className="w-6 h-6 text-white" />
        <span className="text-xs font-semibold text-white">12</span>
      </button>
      <button className="flex flex-col items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full p-3 hover:bg-black/70 transition-colors">
        <Share2 className="w-6 h-6 text-white" />
      </button>
    </div>
  )
}

// Variant 4: Facebook Inline
function Variant4({ isLiked, toggleLike, commentInput, setCommentInput }: VariantProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black/95 max-h-[50%] overflow-y-auto">
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex gap-6">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-2 ${isLiked ? 'text-blue-500' : 'text-gray-300'}`}
          >
            <ThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-semibold">42</span>
          </button>
          <button className="flex items-center gap-2 text-gray-300">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-semibold">12 kommentarer</span>
          </button>
        </div>
        <button className="text-gray-300 hover:text-white">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
      <div className="p-3 space-y-3">
        {/* Mock Comments */}
        <div className="flex gap-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-blue-500 text-white text-xs">JD</AvatarFallback>
          </Avatar>
          <div className="flex-1 bg-white/5 rounded-2xl px-3 py-2">
            <p className="text-sm font-semibold text-white">John Doe</p>
            <p className="text-sm text-gray-300">Flott bilde!</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-purple-500 text-white text-xs">MÁ</AvatarFallback>
          </Avatar>
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput?.(e.target.value)}
            placeholder="Skriv en kommentar..."
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  )
}

// Variant 5: Pinterest Hover Overlay
function Variant5({ isLiked, toggleLike }: VariantProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="w-10 h-10 border-2 border-white/20">
                <AvatarFallback className="bg-purple-500 text-white text-sm">ÁR</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-white">Ása Ráhka</p>
                <p className="text-xs text-white/80">2t siden</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleLike}
                className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
              </button>
              <button className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors">
                <MessageCircle className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Variant 6: Twitter Compact
function Variant6({ isLiked, toggleLike }: VariantProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-white/10 p-2">
      <div className="flex items-center justify-around">
        <button className="flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors">
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">12</span>
        </button>
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1 transition-colors ${
            isLiked ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'
          }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm">42</span>
        </button>
        <button className="flex items-center gap-1 text-gray-400 hover:text-green-400 transition-colors">
          <Share2 className="w-5 h-5" />
        </button>
        <button className="text-gray-400 hover:text-blue-400 transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

// Variant 7: LinkedIn Card
function Variant7({ isLiked, toggleLike, commentInput, setCommentInput }: VariantProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[60%] overflow-y-auto">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-blue-600 text-white">ÁR</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Ása Ráhka</p>
            <p className="text-sm text-gray-500">Senior Developer • 2t siden</p>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-700">Beautiful landscape in Sápmi ✨</p>
      </div>
      <div className="px-4 py-2 border-b flex items-center justify-between text-sm text-gray-500">
        <span>42 likes</span>
        <span>12 comments</span>
      </div>
      <div className="px-4 py-2 border-b flex items-center justify-around">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
            isLiked ? 'text-blue-600' : 'text-gray-600'
          }`}
        >
          <ThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          <span className="font-medium">Like</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">Comment</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
          <Share2 className="w-5 h-5" />
          <span className="font-medium">Share</span>
        </button>
      </div>
      <div className="p-4">
        <div className="flex gap-2">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-gray-300 text-gray-600">Du</AvatarFallback>
          </Avatar>
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput?.(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  )
}

// Variant 8: Snapchat Quick Reactions
function Variant8({ isLiked, toggleLike }: VariantProps) {
  const reactions = ['❤️', '🔥', '👏', '💯', '😂']

  return (
    <>
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 bg-black/80 backdrop-blur-sm rounded-full p-2">
        {reactions.map((emoji, i) => (
          <button
            key={i}
            onClick={i === 0 ? toggleLike : undefined}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${
              i === 0 && isLiked
                ? 'bg-rose-500 scale-110'
                : 'bg-white/10 hover:bg-white/20 hover:scale-110'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
        <p className="text-white/60 text-xs mb-1">Swipe up for comments</p>
        <div className="w-8 h-1 bg-white/40 rounded-full mx-auto" />
      </div>
    </>
  )
}

// Variant 9: YouTube Bottom Sheet
function Variant9({ isLiked, toggleLike }: VariantProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className="absolute bottom-0 left-0 right-0">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="w-full bg-black/90 backdrop-blur-sm border-t border-white/10 p-4 flex items-center justify-between hover:bg-black/95 transition-colors"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleLike()
                }}
                className="flex flex-col items-center"
              >
                <ThumbsUp className={`w-6 h-6 ${isLiked ? 'fill-blue-500 text-blue-500' : 'text-white'}`} />
                <span className="text-xs text-white mt-1">42</span>
              </button>
              <div className="flex flex-col items-center">
                <MessageCircle className="w-6 h-6 text-white" />
                <span className="text-xs text-white mt-1">12</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white">
              <span className="text-sm">Kommentarer</span>
              <ChevronLeft className="w-5 h-5 -rotate-90" />
            </div>
          </button>
        )}

        {isOpen && (
          <div className="bg-white rounded-t-3xl shadow-2xl h-[70vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Kommentarer (12)</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Mock Comments */}
              <div className="flex gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-blue-500 text-white">JD</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold text-gray-900">@johndoe</span>{' '}
                    <span className="text-gray-600">Flott bilde!</span>
                  </p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-gray-400">2t siden</span>
                    <button className="text-xs text-gray-600 font-medium">Svar</button>
                    <button className="text-xs text-gray-600">❤️ 5</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50">
              <div className="flex gap-2">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-purple-500 text-white">ÁR</AvatarFallback>
                </Avatar>
                <input
                  type="text"
                  placeholder="Legg til en kommentar..."
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// Variant 10: Modern Glass
function Variant10({ isLiked, toggleLike, commentInput, setCommentInput }: VariantProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0">
      <div className="bg-white/10 backdrop-blur-xl border-t border-white/20 shadow-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-10 h-10 ring-2 ring-white/20">
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              ÁR
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Ása Ráhka</p>
            <p className="text-xs text-white/70">2 timer siden</p>
          </div>
          <button className="text-white/70 hover:text-white">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={toggleLike}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-400 text-rose-400' : 'text-white'}`} />
            <span className="text-sm font-medium text-white">42</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all">
            <MessageCircle className="w-5 h-5 text-white" />
            <span className="text-sm font-medium text-white">12</span>
          </button>
          <button className="ml-auto p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all">
            <Share2 className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput?.(e.target.value)}
            placeholder="Skriv en kommentar..."
            className="flex-1 bg-white/10 border border-white/20 backdrop-blur-sm rounded-full px-4 py-2.5 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40"
          />
          <button className="p-2.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full hover:from-blue-600 hover:to-purple-600 transition-all">
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Variant 11: LinkedIn Dark Card
function Variant11({ isLiked, toggleLike, commentInput, setCommentInput }: VariantProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-t-3xl shadow-2xl max-h-[60%] overflow-y-auto border-t border-purple-500/20">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-12 h-12 ring-2 ring-purple-500/30">
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              ÁR
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-white">Ása Ráhka</p>
            <p className="text-sm text-gray-400">Senior Developer • 2t siden</p>
          </div>
          <button className="text-gray-400 hover:text-white transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-300">Beautiful landscape in Sápmi ✨</p>
      </div>

      <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between text-sm bg-white/5">
        <span className="text-gray-400">42 likes</span>
        <span className="text-gray-400">12 comments</span>
      </div>

      <div className="px-4 py-2 border-b border-white/10 flex items-center justify-around">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors ${
            isLiked ? 'text-blue-400' : 'text-gray-300'
          }`}
        >
          <ThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          <span className="font-medium">Like</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:bg-white/10 transition-colors">
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">Comment</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:bg-white/10 transition-colors">
          <Share2 className="w-5 h-5" />
          <span className="font-medium">Share</span>
        </button>
      </div>

      <div className="p-4">
        <div className="flex gap-2">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
              Du
            </AvatarFallback>
          </Avatar>
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput?.(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>
    </div>
  )
}

// Variant 12: Reddit + Instagram Hybrid
function Variant12({ isLiked, toggleLike, commentInput, setCommentInput }: VariantProps) {
  const [showFullCaption, setShowFullCaption] = useState(false)
  const caption = "Beautiful landscape in Sápmi! The midnight sun over the mountains is absolutely stunning. 🌄✨"
  const shouldTruncate = caption.length > 80

  return (
    <>
      {/* Top: Profile only */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 to-transparent p-4">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8 border-2 border-white/20">
            <AvatarFallback className="bg-purple-500 text-white text-xs">ÁR</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-white">Ása Ráhka</p>
            <p className="text-xs text-white/60">2t siden</p>
          </div>
        </div>
      </div>

      {/* Caption - Above bottom bar */}
      <div className="absolute bottom-16 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-4 py-3">
        <p className="text-sm text-white">
          <span className="font-semibold">Ása Ráhka</span>{' '}
          <span className="text-gray-200">
            {shouldTruncate && !showFullCaption ? `${caption.slice(0, 80)}...` : caption}
          </span>
          {shouldTruncate && (
            <button
              onClick={() => setShowFullCaption(!showFullCaption)}
              className="text-gray-400 ml-1 hover:text-gray-300"
            >
              {showFullCaption ? 'mindre' : 'mer'}
            </button>
          )}
        </p>
      </div>

      {/* Bottom: Action icons only (no input) */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-white/10 p-3">
        <div className="flex items-center justify-around">
          <button
            onClick={toggleLike}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${isLiked ? 'text-rose-500' : 'text-gray-400'}`}>42</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-white/10 transition-colors">
            <MessageCircle className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-400">12</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-white/10 transition-colors">
            <Share2 className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-400">Del</span>
          </button>
        </div>
      </div>
    </>
  )
}

// Variant 13: Complete Feed Card
function Variant13({ isLiked, toggleLike, commentInput, setCommentInput }: VariantProps) {
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set())
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [scale, setScale] = useState(1)
  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const [initialDistance, setInitialDistance] = useState(0)
  const [initialScale, setInitialScale] = useState(1)

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
      // Pan when zoomed in
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

  const mockComments = [
    { id: 1, user: 'John Doe', text: 'Amazing photo! 😍', likes: 5 },
    { id: 2, user: 'Mari Hansen', text: 'Så vakker! Hvor er dette?', likes: 2 },
  ]

  return (
    <div className="absolute inset-0 bg-black overflow-y-auto">
      <div className="p-4 pb-64">
        {/* Image with rounded corners - Pinch to zoom */}
        <div className="mb-4">
          <div
            className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 touch-none"
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
        <h2 className="text-xl font-bold text-white mb-2">Beautiful Sápmi Landscape</h2>

        {/* Caption */}
        <p className="text-sm text-gray-300 mb-4">
          The midnight sun over the mountains is absolutely stunning. This is one of the most beautiful places I've
          ever visited! 🌄✨
        </p>

        {/* Engagement stats */}
        <div className="flex items-center gap-4 py-3 border-y border-white/10 mb-4">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-2 ${isLiked ? 'text-rose-500' : 'text-gray-400'}`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">42</span>
          </button>
          <div className="flex items-center gap-2 text-gray-400">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">12</span>
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
              onChange={(e) => setCommentInput?.(e.target.value)}
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

          {mockComments.map((comment) => {
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
