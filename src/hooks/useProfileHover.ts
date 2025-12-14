'use client'

import { useState, useRef, useEffect } from 'react'

interface UseProfileHoverReturn {
  showOverlay: boolean
  handleMouseEnter: () => void
  handleMouseLeave: () => void
  handleClick: (e: React.MouseEvent) => void
  handleForceClose: () => void
}

export function useProfileHover(userId: string): UseProfileHoverReturn {
  const [showOverlay, setShowOverlay] = useState(false)
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasFinePointer = useRef(
    typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
  )

  const handleMouseEnter = () => {
    // Only show overlay on devices with fine pointer (desktop/mouse)
    if (!hasFinePointer.current) return

    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }

    // Set timeout to show overlay after 500ms
    showTimeoutRef.current = setTimeout(() => {
      setShowOverlay(true)
    }, 500)
  }

  const handleMouseLeave = () => {
    // Clear show timeout if mouse leaves before delay expires
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current)
      showTimeoutRef.current = null
    }

    // Don't auto-hide on leave - let user click away or press Escape
    // This prevents flickering when moving mouse to popup
  }

  const handleForceClose = () => {
    // Clear all timeouts
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current)
      showTimeoutRef.current = null
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }

    // Hide overlay
    setShowOverlay(false)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Hide overlay immediately when clicking
    setShowOverlay(false)

    // Clear any pending timeouts
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current)
      showTimeoutRef.current = null
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }

    // Dispatch custom event to open user profile panel
    window.dispatchEvent(
      new CustomEvent('open-user-profile-panel', {
        detail: { userId }
      })
    )
  }

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current)
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [])

  return {
    showOverlay,
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
    handleForceClose
  }
}
