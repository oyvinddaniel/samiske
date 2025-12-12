'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

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

interface MobileNavProps {
  currentCategory?: string
}

export function MobileNav({ currentCategory = '' }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900"
        aria-label="Åpne meny"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out menu */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 w-64 bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md">
              <img
                src="/images/sami.jpg"
                alt="Samisk flagg"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold text-gray-900">samiske.no</span>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-500 hover:text-gray-700"
            aria-label="Lukk meny"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Categories */}
        <nav className="p-4">
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
                    onClick={() => setIsOpen(false)}
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
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            Det samiske miljøet i Trondheim
          </p>
        </div>
      </div>
    </>
  )
}
