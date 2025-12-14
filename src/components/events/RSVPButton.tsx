'use client'

import { useState, useEffect } from 'react'
import { Star, Check, Loader2, Users, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { setEventRSVP, removeEventRSVP, getUserRSVPStatus, getEventRSVPCounts, getEventCapacity, type EventCapacity } from '@/lib/events'
import type { RSVPStatus, RSVPCounts } from '@/lib/types/events'
import { toast } from 'sonner'

interface RSVPButtonProps {
  postId: string
  isLoggedIn: boolean
  initialStatus?: RSVPStatus | null
  initialCounts?: RSVPCounts
  maxParticipants?: number | null
  onRSVPChange?: (status: RSVPStatus | null, counts: RSVPCounts) => void
  compact?: boolean
}

export function RSVPButton({
  postId,
  isLoggedIn,
  initialStatus,
  initialCounts,
  maxParticipants,
  onRSVPChange,
  compact = false
}: RSVPButtonProps) {
  const [currentStatus, setCurrentStatus] = useState<RSVPStatus | null>(initialStatus ?? null)
  const [counts, setCounts] = useState<RSVPCounts>(initialCounts ?? { interested_count: 0, going_count: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(!!initialStatus || !!initialCounts)
  const [capacity, setCapacity] = useState<EventCapacity | null>(null)

  // Fetch initial data if not provided
  useEffect(() => {
    if (isInitialized) return

    const fetchData = async () => {
      const promises: Promise<unknown>[] = [
        getEventRSVPCounts(postId),
        isLoggedIn ? getUserRSVPStatus(postId) : Promise.resolve(null)
      ]

      // Also fetch capacity if max_participants is set
      if (maxParticipants) {
        promises.push(getEventCapacity(postId))
      }

      const results = await Promise.all(promises)
      setCounts(results[0] as RSVPCounts)
      if (results[1]) setCurrentStatus(results[1] as RSVPStatus)
      if (results[2]) setCapacity(results[2] as EventCapacity)
      setIsInitialized(true)
    }

    fetchData()
  }, [postId, isLoggedIn, isInitialized, maxParticipants])

  // Check if event is full (only for 'going' status)
  const isFull = maxParticipants !== null && maxParticipants !== undefined && counts.going_count >= maxParticipants

  const handleRSVP = async (status: RSVPStatus) => {
    if (!isLoggedIn) {
      toast.error('Du må være logget inn for å svare på arrangementer')
      return
    }

    // Check capacity for 'going' status
    if (status === 'going' && isFull && currentStatus !== 'going') {
      toast.error('Arrangementet er fullt')
      return
    }

    setIsLoading(true)

    try {
      // If clicking the same status, remove RSVP
      if (currentStatus === status) {
        const success = await removeEventRSVP(postId)
        if (success) {
          const newCounts = {
            ...counts,
            [status === 'interested' ? 'interested_count' : 'going_count']:
              Math.max(0, counts[status === 'interested' ? 'interested_count' : 'going_count'] - 1)
          }
          setCurrentStatus(null)
          setCounts(newCounts)
          onRSVPChange?.(null, newCounts)
        }
      } else {
        // Set new status
        const result = await setEventRSVP(postId, status)
        if (result.success) {
          // Update counts based on status change
          const newCounts = { ...counts }

          // If there was a previous status, decrement that count
          if (currentStatus) {
            const prevCountKey = currentStatus === 'interested' ? 'interested_count' : 'going_count'
            newCounts[prevCountKey] = Math.max(0, newCounts[prevCountKey] - 1)
          }

          // Increment the new status count
          const newCountKey = status === 'interested' ? 'interested_count' : 'going_count'
          newCounts[newCountKey] = newCounts[newCountKey] + 1

          setCurrentStatus(status)
          setCounts(newCounts)
          onRSVPChange?.(status, newCounts)
        } else {
          // Handle error
          toast.error(result.error)
        }
      }
    } catch (error) {
      console.error('RSVP error:', error)
      toast.error('Kunne ikke oppdatere RSVP')
    } finally {
      setIsLoading(false)
    }
  }

  const totalCount = counts.interested_count + counts.going_count

  // Calculate spots remaining
  const spotsRemaining = maxParticipants ? maxParticipants - counts.going_count : null

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleRSVP('interested')}
          disabled={isLoading}
          className={cn(
            'flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-all',
            currentStatus === 'interested'
              ? 'bg-amber-100 text-amber-700 border border-amber-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Star className={cn('w-3 h-3', currentStatus === 'interested' && 'fill-amber-500')} />
          )}
          <span>{counts.interested_count}</span>
        </button>
        <button
          onClick={() => handleRSVP('going')}
          disabled={isLoading || (isFull && currentStatus !== 'going')}
          className={cn(
            'flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-all',
            currentStatus === 'going'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : isFull
              ? 'bg-red-50 text-red-400 border border-red-200 cursor-not-allowed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : isFull && currentStatus !== 'going' ? (
            <AlertCircle className="w-3 h-3" />
          ) : (
            <Check className={cn('w-3 h-3', currentStatus === 'going' && 'text-green-600')} />
          )}
          <span>
            {maxParticipants ? `${counts.going_count}/${maxParticipants}` : counts.going_count}
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Capacity info */}
      {maxParticipants && (
        <div className={cn(
          'flex items-center gap-2 text-sm',
          isFull ? 'text-red-600' : 'text-gray-500'
        )}>
          <Users className="w-4 h-4" />
          {isFull ? (
            <span className="font-medium">Fullt ({counts.going_count}/{maxParticipants} plasser)</span>
          ) : (
            <span>{counts.going_count} av {maxParticipants} plasser</span>
          )}
        </div>
      )}

      {/* Total participants summary */}
      {totalCount > 0 && !maxParticipants && (
        <p className="text-sm text-gray-500">
          {counts.going_count > 0 && (
            <span>{counts.going_count} skal delta</span>
          )}
          {counts.going_count > 0 && counts.interested_count > 0 && (
            <span> · </span>
          )}
          {counts.interested_count > 0 && (
            <span>{counts.interested_count} interessert</span>
          )}
        </p>
      )}

      {/* Interested count when max participants is set */}
      {maxParticipants && counts.interested_count > 0 && (
        <p className="text-sm text-gray-500">
          {counts.interested_count} interessert
        </p>
      )}

      {/* RSVP Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleRSVP('interested')}
          disabled={isLoading}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
            currentStatus === 'interested'
              ? 'bg-amber-100 text-amber-700 border-2 border-amber-400'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Star className={cn('w-4 h-4', currentStatus === 'interested' && 'fill-amber-500')} />
          )}
          <span>Interessert</span>
        </button>

        <button
          onClick={() => handleRSVP('going')}
          disabled={isLoading || (isFull && currentStatus !== 'going')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
            currentStatus === 'going'
              ? 'bg-green-100 text-green-700 border-2 border-green-400'
              : isFull
              ? 'bg-red-50 text-red-300 border border-red-200 cursor-not-allowed'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isFull && currentStatus !== 'going' ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <Check className={cn('w-4 h-4', currentStatus === 'going' && 'text-green-600')} />
          )}
          <span>{isFull && currentStatus !== 'going' ? 'Fullt' : 'Skal delta'}</span>
        </button>
      </div>
    </div>
  )
}
