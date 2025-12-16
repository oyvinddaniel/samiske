'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook som logger brukeraktivitet (sidevisninger) til databasen.
 * Må brukes i en komponent som har tilgang til autentisert bruker.
 */
export function useActivityLogger(userId: string | null) {
  const pathname = usePathname()
  const lastLoggedPath = useRef<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return
    if (pathname === lastLoggedPath.current) return

    // Logg aktiviteten
    const logActivity = async () => {
      try {
        await supabase.rpc('log_user_activity', {
          p_page_path: pathname,
          p_page_title: document.title || null,
          p_user_agent: navigator.userAgent || null,
        })
        lastLoggedPath.current = pathname
      } catch (error) {
        // Ignorer feil - aktivitetslogging skal ikke påvirke brukeropplevelsen
        console.debug('Activity log error:', error)
      }
    }

    logActivity()
  }, [pathname, userId, supabase])
}
