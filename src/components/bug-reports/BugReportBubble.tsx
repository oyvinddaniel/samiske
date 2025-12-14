'use client'

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { Bug } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BugReportDialog } from './BugReportDialog'

export function BugReportBubble() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Check auth status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentUserId(session?.user?.id || null)
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id || null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  if (!mounted) return null

  return createPortal(
    <>
      {/* Bug Report Dialog */}
      <BugReportDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        currentUserId={currentUserId}
      />

      {/* Floating bubble button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-20 right-4 lg:bottom-4 lg:right-4 z-[9997]',
          'w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105',
          isOpen
            ? 'bg-orange-700 text-white ring-2 ring-orange-400'
            : 'bg-orange-600 text-white hover:bg-orange-700'
        )}
        aria-label="Rapporter problem"
        title="Rapporter problem"
      >
        <Bug className="w-5 h-5" />
      </button>
    </>,
    document.body
  )
}
