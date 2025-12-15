'use client'

import { useState } from 'react'
import { FullWidthVariants } from './FullWidthVariants'
import { LoginModal } from './LoginModal'

export function LandingPage() {
  const [showLoginModal, setShowLoginModal] = useState(false)

  return (
    <div className="min-h-screen">
      <FullWidthVariants
        variant="gradient-overlay"
        onLoginClick={() => setShowLoginModal(true)}
      />

      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  )
}
