'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, Clock, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'
import { toast } from 'sonner'

interface PollOption {
  id: string
  text: string
  vote_count: number
  percentage: number
}

interface PollData {
  poll_id: string
  question: string
  allow_multiple: boolean
  ends_at: string | null
  total_votes: number
  is_ended: boolean
  user_voted: boolean
  user_votes: string[]
  options: PollOption[]
}

interface PollProps {
  postId: string
  className?: string
}

export function Poll({ postId, className }: PollProps) {
  const [poll, setPoll] = useState<PollData | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isVoting, setIsVoting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const loadPoll = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase.rpc('get_post_poll', {
          p_post_id: postId,
        })

        if (error) {
          // 🔇 Silently return if no poll (expected for most posts)
          return
        }

        if (data && data.length > 0) {
          setPoll(data[0])
          if (data[0].user_votes) {
            setSelectedOptions(data[0].user_votes)
          }
        }
      } catch (err) {
        // 🔇 Silently handle - no poll is expected for most posts
      } finally {
        setIsLoading(false)
      }
    }

    loadPoll()
  }, [postId, supabase])

  const handleOptionClick = (optionId: string) => {
    if (!poll || poll.user_voted || poll.is_ended) return

    if (poll.allow_multiple) {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      )
    } else {
      setSelectedOptions([optionId])
    }
  }

  const handleVote = async () => {
    if (!poll || selectedOptions.length === 0) return

    setIsVoting(true)
    try {
      const { error } = await supabase.rpc('vote_on_poll', {
        p_poll_id: poll.poll_id,
        p_option_ids: selectedOptions,
      })

      if (error) {
        toast.error(error.message || 'Kunne ikke stemme')
        return
      }

      // Reload poll data
      const { data } = await supabase.rpc('get_post_poll', {
        p_post_id: postId,
      })

      if (data && data.length > 0) {
        setPoll(data[0])
      }

      toast.success('Din stemme er registrert')
    } catch (err) {
      toast.error('Noe gikk galt')
    } finally {
      setIsVoting(false)
    }
  }

  if (isLoading) {
    return (
      <div className={cn('bg-gray-50 rounded-lg p-4 animate-pulse', className)}>
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!poll) {
    return null
  }

  const showResults = poll.user_voted || poll.is_ended

  return (
    <div className={cn('bg-gray-50 rounded-lg p-4', className)}>
      {/* Question */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <h4 className="font-medium text-gray-900">{poll.question}</h4>
        <BarChart3 className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
      </div>

      {/* Options */}
      <div className="space-y-2">
        {poll.options.map((option) => {
          const isSelected = selectedOptions.includes(option.id)
          const isUserVote = poll.user_votes?.includes(option.id)

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleOptionClick(option.id)}
              disabled={poll.user_voted || poll.is_ended}
              className={cn(
                'w-full text-left rounded-lg transition-all relative overflow-hidden',
                showResults
                  ? 'bg-white border border-gray-200 p-3'
                  : cn(
                      'border-2 p-3',
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    )
              )}
            >
              {/* Progress bar for results */}
              {showResults && (
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 transition-all',
                    isUserVote ? 'bg-blue-100' : 'bg-gray-100'
                  )}
                  style={{ width: `${option.percentage}%` }}
                />
              )}

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Checkbox/Radio */}
                  {!showResults && (
                    <div
                      className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                        poll.allow_multiple ? 'rounded' : 'rounded-full',
                        isSelected
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  )}

                  {/* Check mark for user's vote */}
                  {showResults && isUserVote && (
                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  )}

                  <span className={cn('text-sm', isUserVote && 'font-medium')}>
                    {option.text}
                  </span>
                </div>

                {/* Results */}
                {showResults && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">
                      {option.vote_count} {option.vote_count === 1 ? 'stemme' : 'stemmer'}
                    </span>
                    <span className="font-medium text-gray-700 min-w-[3ch] text-right">
                      {option.percentage}%
                    </span>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Vote button */}
      {!showResults && selectedOptions.length > 0 && (
        <Button
          onClick={handleVote}
          disabled={isVoting}
          className="w-full mt-4"
        >
          {isVoting ? 'Stemmer...' : 'Stem'}
        </Button>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
        <span className="text-xs text-gray-500">
          {poll.total_votes} {poll.total_votes === 1 ? 'stemme' : 'stemmer'}
          {poll.allow_multiple && ' · Flervalg'}
        </span>

        {poll.ends_at && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {poll.is_ended ? (
              <span>Avsluttet</span>
            ) : (
              <span>
                Avsluttes{' '}
                {formatDistanceToNow(new Date(poll.ends_at), {
                  addSuffix: true,
                  locale: nb,
                })}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
