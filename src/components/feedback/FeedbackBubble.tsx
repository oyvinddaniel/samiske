'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { MessageSquarePlus, X, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FeedbackBubble() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)

    // Auto-open after 10 seconds (only once per session)
    const hasSeenFeedback = sessionStorage.getItem('feedbackShown')
    if (!hasSeenFeedback) {
      const timer = setTimeout(() => {
        setIsOpen(true)
        sessionStorage.setItem('feedbackShown', 'true')
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedback.trim() || sending) return

    setSending(true)

    try {
      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser()

      await supabase.from('feedback').insert({
        message: feedback.trim(),
        user_id: user?.id || null,
      })

      setSent(true)
      setFeedback('')

      // Reset after 3 seconds
      setTimeout(() => {
        setSent(false)
        setIsOpen(false)
      }, 3000)
    } catch (error) {
      console.error('Feedback error:', error)
    }

    setSending(false)
  }

  if (!mounted) return null

  return createPortal(
    <>
      {/* Feedback panel */}
      <div
        className={cn(
          'fixed z-[9998] bg-white rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden',
          'w-72 sm:w-80',
          'left-4',
          'bottom-20 lg:bottom-20',
          isOpen
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95 pointer-events-none'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <h2 className="font-medium text-sm">Hva savner du?</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Lukk"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-2">Takk!</div>
              <p className="text-sm text-gray-600">Vi setter pris på tilbakemeldingen din</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Fortell oss hva du ønsker deg..."
                className="w-full p-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-400">{feedback.length}/500</span>
                <button
                  type="submit"
                  disabled={!feedback.trim() || sending}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all',
                    feedback.trim() && !sending
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                >
                  {sending ? 'Sender...' : (
                    <>
                      Send <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Floating bubble button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-20 left-4 lg:bottom-4 lg:left-4 z-[9997]',
          'w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105',
          isOpen
            ? 'bg-purple-700 text-white ring-2 ring-purple-400'
            : 'bg-purple-600 text-white hover:bg-purple-700'
        )}
        aria-label="Gi tilbakemelding"
      >
        <MessageSquarePlus className="w-5 h-5" />
      </button>
    </>,
    document.body
  )
}
