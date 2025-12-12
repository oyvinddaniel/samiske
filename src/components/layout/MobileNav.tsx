'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
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

interface MobileNavProps {
  currentCategory?: string
}

export function MobileNav({ currentCategory = '' }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [rightMenuOpen, setRightMenuOpen] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Listen for open-left-sidebar event from BottomNav
  useEffect(() => {
    const handleOpenSidebar = () => setIsOpen(true)
    window.addEventListener('open-left-sidebar', handleOpenSidebar)
    return () => window.removeEventListener('open-left-sidebar', handleOpenSidebar)
  }, [])

  // Track when right menu opens/closes
  useEffect(() => {
    const handleRightMenuOpen = () => setRightMenuOpen(true)
    const handleRightMenuClose = () => setRightMenuOpen(false)
    window.addEventListener('right-menu-opened', handleRightMenuOpen)
    window.addEventListener('right-menu-closed', handleRightMenuClose)
    return () => {
      window.removeEventListener('right-menu-opened', handleRightMenuOpen)
      window.removeEventListener('right-menu-closed', handleRightMenuClose)
    }
  }, [])

  // Notify when this menu opens/closes (sync + async)
  useEffect(() => {
    // Set synchronous flag on window for immediate access by other components
    (window as unknown as { __leftMenuOpen: boolean }).__leftMenuOpen = isOpen

    if (isOpen) {
      window.dispatchEvent(new CustomEvent('left-menu-opened'))
    } else {
      window.dispatchEvent(new CustomEvent('left-menu-closed'))
    }
  }, [isOpen])

  // Swipe right anywhere to open left menu, swipe left to close when open
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStartX.current = touch.clientX
      touchStartY.current = touch.clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return

      const touch = e.touches[0]
      const deltaX = touch.clientX - touchStartX.current
      const deltaY = Math.abs(touch.clientY - touchStartY.current)

      // Check synchronous flag for right menu state (more reliable than async state)
      const isRightMenuOpen = (window as unknown as { __rightMenuOpen?: boolean }).__rightMenuOpen

      if (isOpen) {
        // When menu is open, swipe left anywhere to close
        if (deltaX < -80 && Math.abs(deltaX) > deltaY * 1.5) {
          // Set flag to prevent other menu from opening on same swipe
          (window as unknown as { __menuJustClosed: boolean }).__menuJustClosed = true
          setTimeout(() => {
            (window as unknown as { __menuJustClosed: boolean }).__menuJustClosed = false
          }, 100)
          setIsOpen(false)
          touchStartX.current = null
          touchStartY.current = null
        }
      } else if (!isRightMenuOpen && !(window as unknown as { __menuJustClosed?: boolean }).__menuJustClosed) {
        // When menu is closed AND right menu is not open, swipe right to open
        if (deltaX > 80 && deltaX > deltaY * 1.5) {
          setIsOpen(true)
          touchStartX.current = null
          touchStartY.current = null
        }
      }
    }

    const handleTouchEnd = () => {
      touchStartX.current = null
      touchStartY.current = null
    }

    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isOpen])

  // Swipe to close menu
  const handleMenuTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleMenuTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return

    const deltaX = e.touches[0].clientX - touchStartX.current
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current)

    // Swipe left to close
    if (deltaX < -50 && Math.abs(deltaX) > deltaY) {
      setIsOpen(false)
      touchStartX.current = null
      touchStartY.current = null
    }
  }

  const handleMenuTouchEnd = () => {
    touchStartX.current = null
    touchStartY.current = null
  }

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

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

      {/* Portal for menu - renders at document body level to avoid stacking context issues */}
      {mounted && createPortal(
        <>
          {/* Overlay */}
          <div
            className={cn(
              'fixed inset-0 bg-black/50 z-[9998] md:hidden transition-opacity duration-300',
              isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            )}
            onClick={() => setIsOpen(false)}
          />

          {/* Slide-out menu */}
          <div
            ref={menuRef}
            onTouchStart={handleMenuTouchStart}
            onTouchMove={handleMenuTouchMove}
            onTouchEnd={handleMenuTouchEnd}
            className={cn(
              'fixed inset-y-0 left-0 w-64 bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out md:hidden',
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
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
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
        </>,
        document.body
      )}
    </>
  )
}
