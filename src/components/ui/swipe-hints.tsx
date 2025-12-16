'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'

export function SwipeHints() {
  const [showHints, setShowHints] = useState(true)
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    // Sjekk om brukeren har sett hintene før
    const hasSeenHints = localStorage.getItem('swipe-hints-seen')
    if (hasSeenHints) {
      setShowHints(false)
      return
    }

    // Skjul hintene etter 10 sekunder eller ved interaksjon
    const timer = setTimeout(() => {
      setShowHints(false)
      localStorage.setItem('swipe-hints-seen', 'true')
    }, 10000)

    // Lytt til sveip-events
    const handleSwipe = () => {
      if (!hasInteracted) {
        setHasInteracted(true)
        setShowHints(false)
        localStorage.setItem('swipe-hints-seen', 'true')
      }
    }

    window.addEventListener('left-menu-opened', handleSwipe)
    window.addEventListener('right-menu-opened', handleSwipe)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('left-menu-opened', handleSwipe)
      window.removeEventListener('right-menu-opened', handleSwipe)
    }
  }, [hasInteracted])

  if (!showHints) return null

  return (
    <>
      {/* Venstre hint */}
      <div className="md:hidden fixed left-0 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
        <div className="flex items-center gap-0.5">
          <ChevronRight className="w-5 h-5 text-blue-600/60 animate-slide-right" />
          <ChevronRight className="w-5 h-5 text-blue-600/40 animate-slide-right animation-delay-75" />
          <ChevronRight className="w-5 h-5 text-blue-600/20 animate-slide-right animation-delay-150" />
        </div>
      </div>

      {/* Høyre hint */}
      <div className="md:hidden fixed right-0 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
        <div className="flex items-center gap-0.5">
          <ChevronLeft className="w-5 h-5 text-blue-600/20 animate-slide-left animation-delay-150" />
          <ChevronLeft className="w-5 h-5 text-blue-600/40 animate-slide-left animation-delay-75" />
          <ChevronLeft className="w-5 h-5 text-blue-600/60 animate-slide-left" />
        </div>
      </div>
    </>
  )
}
