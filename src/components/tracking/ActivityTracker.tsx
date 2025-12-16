'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Komponent som logger brukeraktivitet (sidevisninger) til databasen.
 * Plasseres i layout for å tracke alle sider.
 */
export function ActivityTracker() {
  const pathname = usePathname()
  const lastLoggedPath = useRef<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const logActivity = async () => {
      // Ikke logg samme side flere ganger på rad
      if (pathname === lastLoggedPath.current) return

      try {
        // Sjekk om bruker er innlogget
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Logg aktiviteten via RPC
        const { error } = await supabase.rpc('log_user_activity', {
          p_page_path: pathname,
          p_page_title: document.title || null,
          p_user_agent: navigator.userAgent || null,
        })

        if (error) {
          console.debug('Activity log error:', error)
        } else {
          lastLoggedPath.current = pathname
        }
      } catch (error) {
        // Ignorer feil - aktivitetslogging skal ikke påvirke brukeropplevelsen
        console.debug('Activity tracker error:', error)
      }
    }

    // Liten forsinkelse for å sikre at siden er lastet
    const timer = setTimeout(logActivity, 500)
    return () => clearTimeout(timer)
  }, [pathname, supabase])

  // Oppdater last_seen_at periodisk (hvert 5. minutt)
  useEffect(() => {
    const updateLastSeen = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase
          .from('profiles')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', user.id)
      } catch (error) {
        console.debug('Last seen update error:', error)
      }
    }

    // Oppdater umiddelbart
    updateLastSeen()

    // Oppdater hvert 5. minutt
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updateLastSeen()
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [supabase])

  return null // Denne komponenten rendrer ingenting
}
