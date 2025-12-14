'use client'

import { useState, useEffect } from 'react'
import { HeroVariants } from './HeroVariants'
import { FeatureOverview } from './FeatureOverview'
import { LiveFeedPreview } from './LiveFeedPreview'
import { LoginModal } from './LoginModal'
import { DesignPicker } from './DesignPicker'
import { DesignTheme } from './design-themes'

export function LandingPage() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<DesignTheme>('minimal-clean')

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('landing-theme') as DesignTheme
    if (savedTheme) {
      setCurrentTheme(savedTheme)
    }
  }, [])

  // Save theme to localStorage
  const handleThemeChange = (theme: DesignTheme) => {
    setCurrentTheme(theme)
    localStorage.setItem('landing-theme', theme)
    // Smooth scroll to top when changing theme
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen">
      {/* Hero section with selected theme */}
      <HeroVariants theme={currentTheme} onLoginClick={() => setShowLoginModal(true)} />

      {/* Feature overview (only show for certain themes) */}
      {!['feature-grid', 'bento-box', 'social-proof'].includes(currentTheme) && (
        <FeatureOverview />
      )}

      {/* Live feed preview (only show for certain themes) */}
      {!['screenshot-first', 'split-screen', 'browser-mockup', 'feature-grid', 'bento-box'].includes(currentTheme) && (
        <LiveFeedPreview />
      )}

      {/* Design picker at the bottom */}
      <DesignPicker currentTheme={currentTheme} onThemeChange={handleThemeChange} />

      {/* Login modal */}
      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  )
}
