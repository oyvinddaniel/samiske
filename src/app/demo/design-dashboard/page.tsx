'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Image as ImageIcon,
  MapPin,
  FileText,
  Layout,
  Palette,
  Smartphone,
  Menu,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react'

interface DemoCategory {
  id: string
  name: string
  description: string
  href: string
  icon: React.ElementType
  count: number
  status: 'live' | 'coming' | 'wip'
  color: string
}

const categories: DemoCategory[] = [
  {
    id: 'gallery-engagement',
    name: 'Gallery Engagement',
    description: '13 moderne design-forslag for likes, kommentarer og engagement',
    href: '/demo/gallery-engagement',
    icon: ImageIcon,
    count: 13,
    status: 'live',
    color: 'from-rose-500 to-pink-500',
  },
  {
    id: 'gallery-view',
    name: 'Gallery View (Mobil)',
    description: '3 moderne layout-design for bildegalleri-visning (25 bilder hver)',
    href: '/demo/gallery-view',
    icon: ImageIcon,
    count: 3,
    status: 'live',
    color: 'from-purple-500 to-fuchsia-500',
  },
  {
    id: 'gallery-metadata',
    name: 'Gallery Metadata',
    description: '11 design-forslag for profil, tittel, beskrivelse og engagement',
    href: '/demo/gallery-metadata',
    icon: ImageIcon,
    count: 11,
    status: 'live',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    id: 'gallery-styles',
    name: 'Galleri-stiler',
    description: '7 ulike preview-stiler for bildegallerier + masonry viewer',
    href: '/demo/gallery-styles',
    icon: ImageIcon,
    count: 7,
    status: 'live',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'geography-cards',
    name: 'Geografiske toppkort',
    description: '15 designeksempler for steds- og lokasjonskort',
    href: '/demo/geography-cards',
    icon: MapPin,
    count: 15,
    status: 'live',
    color: 'from-green-500 to-teal-500',
  },
  {
    id: 'post-cards',
    name: 'Innleggskort',
    description: 'Ulike stiler for sosiale innlegg og feed-elementer',
    href: '/demo/post-cards',
    icon: FileText,
    count: 0,
    status: 'coming',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'layouts',
    name: 'Sidelayouter',
    description: '10 moderne layout-varianter for sosiale nettverk',
    href: '/demo/layouts',
    icon: Layout,
    count: 10,
    status: 'live',
    color: 'from-orange-500 to-amber-500',
  },
  {
    id: 'layouts-classic',
    name: 'Enhanced Classic - Psykologi',
    description: '10 psykologi-baserte varianter av Enhanced Classic layout',
    href: '/demo/layouts-classic',
    icon: Sparkles,
    count: 10,
    status: 'live',
    color: 'from-purple-500 to-indigo-500',
  },
  {
    id: 'colors',
    name: 'Fargepalett',
    description: 'Farger, gradienter og tema-varianter',
    href: '/demo/colors',
    icon: Palette,
    count: 0,
    status: 'coming',
    color: 'from-red-500 to-rose-500',
  },
  {
    id: 'mobile',
    name: 'Mobilkomponenter',
    description: 'Bunnavigasjon, sheets og mobiloptimaliserte komponenter',
    href: '/demo/mobile',
    icon: Smartphone,
    count: 0,
    status: 'coming',
    color: 'from-indigo-500 to-violet-500',
  },
]

const statusLabels = {
  live: { text: 'Tilgjengelig', className: 'bg-green-100 text-green-700' },
  wip: { text: 'Under arbeid', className: 'bg-yellow-100 text-yellow-700' },
  coming: { text: 'Kommer snart', className: 'bg-gray-100 text-gray-500' },
}

export default function DesignDashboardPage() {
  const [filter, setFilter] = useState<'all' | 'live' | 'coming'>('all')

  const filteredCategories = categories.filter((cat) => {
    if (filter === 'all') return true
    return cat.status === filter
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Design Dashboard</h1>
              <p className="text-gray-500">Designforslag og komponenter for samiske.no</p>
            </div>
          </div>

          <p className="text-gray-600 max-w-2xl mt-4">
            Her samles alle designforslag, komponenter og UI-eksempler. Utforsk ulike stiler
            og velg det som passer best for din brukssituasjon.
          </p>

          {/* Filter buttons */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Alle ({categories.length})
            </button>
            <button
              onClick={() => setFilter('live')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'live'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tilgjengelig ({categories.filter((c) => c.status === 'live').length})
            </button>
            <button
              onClick={() => setFilter('coming')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'coming'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Kommer snart ({categories.filter((c) => c.status === 'coming').length})
            </button>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => {
            const Icon = category.icon
            const status = statusLabels[category.status]
            const isClickable = category.status === 'live'

            const CardContent = (
              <div
                className={`bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all ${
                  isClickable ? 'hover:shadow-lg hover:border-gray-300 cursor-pointer' : 'opacity-75'
                }`}
              >
                {/* Header with gradient */}
                <div className={`h-24 bg-gradient-to-br ${category.color} relative overflow-hidden`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="w-12 h-12 text-white/80" />
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                      {status.text}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                    {category.count > 0 && (
                      <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {category.count} stiler
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{category.description}</p>

                  {isClickable && (
                    <div className="flex items-center text-sm font-medium text-blue-600">
                      Utforsk
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  )}
                </div>
              </div>
            )

            if (isClickable) {
              return (
                <Link key={category.id} href={category.href}>
                  {CardContent}
                </Link>
              )
            }

            return <div key={category.id}>{CardContent}</div>
          })}
        </div>

        {/* Design Resources Section */}
        <div className="mt-12 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Designressurser og inspirasjon</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <a
              href="https://dribbble.com/tags/location-card"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="p-2 bg-pink-100 rounded-lg">
                <ExternalLink className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Dribbble Location Cards</p>
                <p className="text-xs text-gray-500">Lokasjonskort-inspirasjon</p>
              </div>
            </a>
            <a
              href="https://mobbin.com/explore/mobile/ui-elements/card"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <ExternalLink className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Mobbin Card Designs</p>
                <p className="text-xs text-gray-500">Beste mobilapp-design</p>
              </div>
            </a>
            <a
              href="https://developers.google.com/maps/documentation/javascript/places-ui-kit"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <ExternalLink className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Google Places UI Kit</p>
                <p className="text-xs text-gray-500">Offisielle kartkomponenter</p>
              </div>
            </a>
          </div>
        </div>

        {/* Back to app link */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Tilbake til samiske.no
          </Link>
        </div>
      </div>
    </div>
  )
}
