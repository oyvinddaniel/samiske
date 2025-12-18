'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, ChevronDown, Lightbulb } from 'lucide-react'
import { toast } from 'sonner'

interface FeatureRequest {
  id: string
  title: string
  description: string | null
  status: string
  created_at: string
}

export function FeatureRequestDropdown() {
  const [requests, setRequests] = useState<FeatureRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  const fetchRequests = useCallback(async () => {
    try {
      // Hent kun id, title, description, status, created_at (ikke user_id for anonymitet)
      const { data, error } = await supabase
        .from('feature_requests')
        .select('id, title, description, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Feil ved henting av forslag:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (isOpen) {
      fetchRequests()
    }
  }, [isOpen, fetchRequests])

  const handleSubmit = async () => {
    if (!title.trim()) return

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Du må være logget inn for å sende forslag')
        return
      }

      const { error } = await supabase
        .from('feature_requests')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          user_id: user.id
        })

      if (error) throw error

      toast.success('Takk for forslaget!')
      setTitle('')
      setDescription('')
      setIsAdding(false)
      fetchRequests()
    } catch (error) {
      console.error('Feil ved sending av forslag:', error)
      toast.error('Kunne ikke sende forslag')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    })
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { text: string; color: string }> = {
      new: { text: 'Ny', color: 'bg-blue-100 text-blue-700' },
      in_progress: { text: 'Pågår', color: 'bg-yellow-100 text-yellow-700' },
      completed: { text: 'Fullført', color: 'bg-green-100 text-green-700' },
      rejected: { text: 'Avvist', color: 'bg-red-100 text-red-700' },
      on_hold: { text: 'På vent', color: 'bg-gray-100 text-gray-700' },
    }
    return labels[status] || labels.new
  }

  const displayedRequests = showAll ? requests : requests.slice(0, 5)
  const hasMore = requests.length > 5

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Foreslå funksjon"
        >
          <Plus className="w-5 h-5 text-white/80 hover:text-white" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96">
        <div className="px-3 py-3 border-b border-gray-100">
          <p className="font-semibold text-sm leading-snug">Har du forslag til endringer, nye funksjoner - eller store nye konsepter/idéer du har lyst skal legges til?</p>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="mt-3 px-4 py-2 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              Nytt forslag
            </button>
          )}
        </div>

        {isAdding && (
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Kort tittel..."
              className="w-full p-2 text-sm border border-gray-200 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beskriv forslaget (valgfritt)..."
              className="w-full p-2 text-sm border border-gray-200 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setIsAdding(false)
                  setTitle('')
                  setDescription('')
                }}
                className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleSubmit}
                disabled={!title.trim() || submitting}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Sender...' : 'Send forslag'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">Laster...</div>
        ) : requests.length === 0 ? (
          <div className="p-6 text-center">
            <Lightbulb className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Ingen forslag ennå</p>
            <p className="text-xs text-gray-400 mt-1">Vær den første!</p>
          </div>
        ) : (
          <div className="max-h-[350px] overflow-y-auto">
            {displayedRequests.map((request) => {
              const status = getStatusLabel(request.status)
              return (
                <div
                  key={request.id}
                  className="px-3 py-2 border-b border-gray-50 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {request.title}
                      </p>
                      {request.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {request.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${status.color}`}>
                          {status.text}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatDate(request.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {hasMore && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-1 transition-colors"
              >
                <ChevronDown className="w-3 h-3" />
                Vis {requests.length - 5} flere
              </button>
            )}

            {showAll && hasMore && (
              <button
                onClick={() => setShowAll(false)}
                className="w-full px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-1 transition-colors"
              >
                Vis færre
              </button>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
