'use client'

import { useState } from 'react'
import { FileText, Trash2, Clock, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Draft } from '@/hooks/useDrafts'
import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'

interface DraftsListProps {
  drafts: Draft[]
  currentDraftId: string | null
  onSelectDraft: (draftId: string) => void
  onDeleteDraft: (draftId: string) => void
  onCreateNew: () => void
  isLoading?: boolean
  className?: string
}

export function DraftsList({
  drafts,
  currentDraftId,
  onSelectDraft,
  onDeleteDraft,
  onCreateNew,
  isLoading,
  className,
}: DraftsListProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className={cn('bg-gray-50 rounded-lg p-3', className)}>
        <div className="flex items-center gap-2 text-gray-500 animate-pulse">
          <FileText className="w-4 h-4" />
          <span className="text-sm">Laster utkast...</span>
        </div>
      </div>
    )
  }

  if (drafts.length === 0) {
    return null // Don't show if no drafts
  }

  const handleDelete = async (e: React.MouseEvent, draftId: string) => {
    e.stopPropagation()
    setDeletingId(draftId)
    await onDeleteDraft(draftId)
    setDeletingId(null)
  }

  const getPreviewText = (draft: Draft) => {
    if (draft.title) return draft.title
    if (draft.content) return draft.content.slice(0, 50) + (draft.content.length > 50 ? '...' : '')
    return 'Tomt utkast'
  }

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: nb })
    } catch {
      return 'ukjent'
    }
  }

  return (
    <div className={cn('bg-amber-50 border border-amber-200 rounded-lg overflow-hidden', className)}>
      {/* Header - always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-amber-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-800">
            {drafts.length} lagrede utkast
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-amber-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-600" />
        )}
      </button>

      {/* Expandable list */}
      {isExpanded && (
        <div className="border-t border-amber-200">
          {/* Create new button */}
          <button
            type="button"
            onClick={onCreateNew}
            className={cn(
              'w-full flex items-center gap-3 p-3 text-left hover:bg-amber-100 transition-colors border-b border-amber-100',
              !currentDraftId && 'bg-amber-100'
            )}
          >
            <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center">
              <Plus className="w-4 h-4 text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-900">Nytt innlegg</p>
              <p className="text-xs text-amber-600">Start på nytt</p>
            </div>
          </button>

          {/* Drafts list */}
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className={cn(
                'flex items-center gap-3 p-3 hover:bg-amber-100 transition-colors cursor-pointer group',
                currentDraftId === draft.id && 'bg-amber-100'
              )}
              onClick={() => onSelectDraft(draft.id)}
            >
              <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-amber-700" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-900 truncate">
                  {getPreviewText(draft)}
                </p>
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(draft.lastSavedAt)}</span>
                  {draft.postType === 'event' && (
                    <span className="ml-2 px-1.5 py-0.5 bg-amber-200 rounded text-amber-700">
                      Arrangement
                    </span>
                  )}
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => handleDelete(e, draft.id)}
                disabled={deletingId === draft.id}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-amber-600 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
