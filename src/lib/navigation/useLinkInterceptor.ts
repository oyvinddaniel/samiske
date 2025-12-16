'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Hook that intercepts all internal link clicks and converts them to client-side navigation
 *
 * This enables SPA-style navigation where clicking links doesn't cause full page reloads,
 * but content is loaded in the feed area with navbar and sidebars remaining visible.
 *
 * Usage: Call this hook once in HomeLayout component
 *
 * Example:
 * ```tsx
 * export function HomeLayout({ children }) {
 *   useLinkInterceptor() // Automatically intercepts all links
 *   // ... rest of component
 * }
 * ```
 */
export function useLinkInterceptor() {
  const router = useRouter()

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Find the clicked link (could be clicking on a child element)
      const link = (e.target as HTMLElement).closest('a')
      if (!link) return

      const href = link.getAttribute('href')
      if (!href) return

      // Skip external links (http/https to other domains)
      if (href.startsWith('http')) {
        const currentHost = window.location.host
        try {
          const linkHost = new URL(href).host
          if (linkHost !== currentHost) {
            return // External link, let it navigate normally
          }
        } catch {
          return // Invalid URL, let it navigate normally
        }
      }

      // Skip special protocols
      if (
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('sms:')
      ) {
        return
      }

      // Skip links with target="_blank" (user wants new tab)
      if (link.getAttribute('target') === '_blank') return

      // Skip links with download attribute
      if (link.hasAttribute('download')) return

      // Skip links with data-no-intercept attribute (opt-out mechanism)
      if (link.hasAttribute('data-no-intercept')) return

      // This is an internal link - intercept it
      e.preventDefault()
      e.stopPropagation()

      // Navigate using Next.js router for client-side navigation
      router.push(href)
    }

    // Attach to document to catch all links, use capture phase
    document.addEventListener('click', handleClick, true)

    return () => {
      document.removeEventListener('click', handleClick, true)
    }
  }, [router])
}
