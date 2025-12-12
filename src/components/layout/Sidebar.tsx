'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const categories = [
  { name: 'Alle', slug: '', color: '#6B7280' },
  { name: 'Generelt', slug: 'generelt', color: '#6B7280' },
  { name: 'Arrangement', slug: 'arrangement', color: '#EF4444' },
  { name: 'Aktivitet', slug: 'aktivitet', color: '#3B82F6' },
  { name: 'Nyhet', slug: 'nyhet', color: '#10B981' },
  { name: 'Møte', slug: 'mote', color: '#F59E0B' },
  { name: 'Spørsmål', slug: 'sporsmal', color: '#8B5CF6' },
  { name: 'Kunngjøring', slug: 'kunngjoring', color: '#EC4899' },
]

interface SidebarProps {
  currentCategory?: string
}

export function Sidebar({ currentCategory = '' }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-200 min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md">
            <img
              src="/images/sami.jpg"
              alt="Samisk flagg"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900">samiske.no</h1>
            <p className="text-xs text-gray-500">Trondheim</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
            Kategorier
          </h2>
          <ul className="space-y-1">
            {categories.map((category) => {
              const isActive = currentCategory === category.slug
              const href = category.slug ? `/?kategori=${category.slug}` : '/'

              return (
                <li key={category.slug}>
                  <Link
                    href={href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      {/* About section */}
      <div className="p-4 border-t border-gray-100 mt-[100px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md mx-auto">
            <img
              src="/images/sami.jpg"
              alt="Samisk flagg"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">samiske.no</h3>
            <p className="text-xs text-gray-500 mt-1">
              Kommunikasjonsplattform for det samiske miljøet i Trondheim
            </p>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <p className="text-[10px] text-gray-400">
              Et alternativ til Facebook der alle innlegg når frem
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
