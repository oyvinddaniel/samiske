'use client'

import { Cloud, CloudOff, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'

interface DraftIndicatorProps {
  isSaving: boolean
  lastSaved: Date | null
  isDirty: boolean
  className?: string
}

export function DraftIndicator({
  isSaving,
  lastSaved,
  isDirty,
  className,
}: DraftIndicatorProps) {
  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()

    // Less than 10 seconds - show "nå"
    if (diffMs < 10000) {
      return 'nå'
    }

    // Less than 1 minute - show seconds
    if (diffMs < 60000) {
      return `${Math.floor(diffMs / 1000)} sek siden`
    }

    // Otherwise use formatDistanceToNow
    return formatDistanceToNow(date, { addSuffix: true, locale: nb })
  }

  if (isSaving) {
    return (
      <div className={cn('flex items-center gap-1.5 text-xs text-gray-500', className)}>
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Lagrer...</span>
      </div>
    )
  }

  if (lastSaved) {
    return (
      <div className={cn('flex items-center gap-1.5 text-xs text-gray-500', className)}>
        <Cloud className="w-3 h-3 text-green-500" />
        <span>Lagret {formatTime(lastSaved)}</span>
        {isDirty && <span className="text-amber-500">(endringer)</span>}
      </div>
    )
  }

  if (isDirty) {
    return (
      <div className={cn('flex items-center gap-1.5 text-xs text-amber-600', className)}>
        <CloudOff className="w-3 h-3" />
        <span>Ikke lagret</span>
      </div>
    )
  }

  return null
}

// Simplified version just showing a checkmark when saved
export function DraftSavedBadge({
  isSaving,
  lastSaved,
  className,
}: {
  isSaving: boolean
  lastSaved: Date | null
  className?: string
}) {
  if (isSaving) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs',
          className
        )}
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Lagrer</span>
      </div>
    )
  }

  if (lastSaved) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs',
          className
        )}
      >
        <Check className="w-3 h-3" />
        <span>Lagret</span>
      </div>
    )
  }

  return null
}
