// Keyboard navigation hook for search results

import { useEffect, useState } from 'react'
import type { SearchResult } from './searchTypes'

interface UseKeyboardNavOptions {
  results: SearchResult[]
  onSelect: (result: SearchResult) => void
  onClose: () => void
  enabled?: boolean
}

export function useKeyboardNav({
  results,
  onSelect,
  onClose,
  enabled = true,
}: UseKeyboardNavOptions) {
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  // Reset highlighted index when results change
  useEffect(() => {
    setHighlightedIndex(0)
  }, [results])

  // Handle keyboard events
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((prev) =>
            Math.min(prev + 1, results.length - 1)
          )
          break

        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((prev) => Math.max(prev - 1, 0))
          break

        case 'Enter':
          e.preventDefault()
          if (results[highlightedIndex]) {
            onSelect(results[highlightedIndex])
          }
          break

        case 'Escape':
          e.preventDefault()
          onClose()
          break

        default:
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled, results, highlightedIndex, onSelect, onClose])

  return {
    highlightedIndex,
    setHighlightedIndex,
  }
}
