'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ListChecks, Plus, Trash2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

interface ChangelogEntry {
  id: string
  content: string
  created_at: string
}

interface ChangelogDropdownProps {
  isAdmin: boolean
  userId?: string | null
}

export function ChangelogDropdown({ isAdmin, userId }: ChangelogDropdownProps) {
  const [entries, setEntries] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  const fetchEntries = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('changelog_entries')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('Feil ved henting av endringer:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Hent antall uleste changelog-entries
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return
    try {
      const { data, error } = await supabase.rpc('get_unread_changelog_count')
      if (error) throw error
      setUnreadCount(data || 0)
    } catch (error) {
      console.error('Feil ved henting av uleste:', error)
    }
  }, [supabase, userId])

  // Marker changelog som sett
  const markAsSeen = useCallback(async () => {
    if (!userId) return
    try {
      await supabase.rpc('mark_changelog_seen')
      setUnreadCount(0)
    } catch (error) {
      console.error('Feil ved markering som sett:', error)
    }
  }, [supabase, userId])

  // Hent uleste ved mount
  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  // Hent entries og marker som sett når dropdown åpnes
  useEffect(() => {
    if (isOpen) {
      fetchEntries()
      // Marker som sett etter kort forsinkelse
      const timer = setTimeout(() => {
        markAsSeen()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, fetchEntries, markAsSeen])

  const handleAdd = async () => {
    if (!newContent.trim()) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('changelog_entries')
        .insert({ content: newContent.trim() })

      if (error) throw error

      toast.success('Endring lagt til')
      setNewContent('')
      setIsAdding(false)
      fetchEntries()
    } catch (error) {
      console.error('Feil ved oppretting:', error)
      toast.error('Kunne ikke legge til endring')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('changelog_entries')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Endring slettet')
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } catch (error) {
      console.error('Feil ved sletting:', error)
      toast.error('Kunne ikke slette endring')
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

  const displayedEntries = showAll ? entries : entries.slice(0, 5)
  const hasMore = entries.length > 5

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label={`Hva er nytt?${unreadCount > 0 ? ` (${unreadCount} uleste)` : ''}`}
        >
          <ListChecks className="w-5 h-5 text-white/80 hover:text-white" />

          {/* Rød notifikasjonsprikk */}
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full"
              aria-hidden="true"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
          <p className="font-semibold text-sm">Hva er nytt?</p>
          {isAdmin && !isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Legg til"
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>

        {isAdding && (
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Hva er nytt..."
              className="w-full p-2 text-sm border border-gray-200 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setIsAdding(false)
                  setNewContent('')
                }}
                className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleAdd}
                disabled={!newContent.trim() || submitting}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Lagrer...' : 'Legg til'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">Laster...</div>
        ) : entries.length === 0 ? (
          <div className="p-6 text-center">
            <ListChecks className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Ingen endringer ennå</p>
          </div>
        ) : (
          <div className="max-h-[350px] overflow-y-auto">
            {displayedEntries.map((entry) => (
              <div
                key={entry.id}
                className="px-3 py-2 border-b border-gray-50 hover:bg-gray-50 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {entry.content}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {formatDate(entry.created_at)}
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded transition-all"
                      title="Slett"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {hasMore && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-1 transition-colors"
              >
                <ChevronDown className="w-3 h-3" />
                Vis {entries.length - 5} flere
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
