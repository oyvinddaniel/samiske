'use client'

import { useState, useEffect } from 'react'
import { Plus, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CircleBadge } from './CircleBadge'
import { getUserCircles, addFriendToCircle, removeFriendFromCircle, getFriendCircles } from '@/lib/circles'
import type { FriendCircle } from '@/lib/types/circles'
import { toast } from 'sonner'

interface CirclePickerProps {
  friendId: string
  friendName: string
  onUpdate?: () => void
}

export function CirclePicker({ friendId, friendName, onUpdate }: CirclePickerProps) {
  const [circles, setCircles] = useState<(FriendCircle & { member_count: number })[]>([])
  const [friendCircleIds, setFriendCircleIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const [allCircles, friendInCircles] = await Promise.all([
        getUserCircles(),
        getFriendCircles(friendId)
      ])
      setCircles(allCircles)
      setFriendCircleIds(friendInCircles.map(c => c.circle_id))
    }

    if (open) {
      fetchData()
    }
  }, [friendId, open])

  const handleToggleCircle = async (circleId: string, isInCircle: boolean) => {
    setLoading(true)

    try {
      if (isInCircle) {
        const success = await removeFriendFromCircle(circleId, friendId)
        if (success) {
          setFriendCircleIds(prev => prev.filter(id => id !== circleId))
          const circleName = circles.find(c => c.id === circleId)?.name
          toast.success(`${friendName} fjernet fra ${circleName}`)
        } else {
          toast.error('Kunne ikke fjerne fra sirkel')
        }
      } else {
        const success = await addFriendToCircle(circleId, friendId)
        if (success) {
          setFriendCircleIds(prev => [...prev, circleId])
          const circleName = circles.find(c => c.id === circleId)?.name
          toast.success(`${friendName} lagt til i ${circleName}`)
        } else {
          toast.error('Kunne ikke legge til i sirkel')
        }
      }
      onUpdate?.()
    } catch (error) {
      console.error('Error toggling circle:', error)
      toast.error('Noe gikk galt')
    } finally {
      setLoading(false)
    }
  }

  const friendCircles = circles.filter(c => friendCircleIds.includes(c.id))

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Show circles the friend is in */}
      {friendCircles.map(circle => (
        <div
          key={circle.id}
          className="flex items-center gap-1 bg-gray-100 rounded-full pl-1 pr-2 py-1"
        >
          <CircleBadge
            name={circle.name}
            color={circle.color}
            icon={circle.icon}
            size="sm"
            showName={true}
          />
          <button
            onClick={() => handleToggleCircle(circle.id, true)}
            disabled={loading}
            className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {/* Add to circle button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 gap-1">
            <Plus className="w-3 h-3" />
            Sirkel
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="space-y-1">
            <p className="text-xs text-gray-500 px-2 pb-2">
              Legg {friendName} til i sirkler
            </p>

            {circles.length === 0 ? (
              <p className="text-sm text-gray-500 px-2 py-4 text-center">
                Du har ingen sirkler
              </p>
            ) : (
              circles.map(circle => {
                const isInCircle = friendCircleIds.includes(circle.id)
                return (
                  <button
                    key={circle.id}
                    onClick={() => handleToggleCircle(circle.id, isInCircle)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    <CircleBadge
                      name={circle.name}
                      color={circle.color}
                      icon={circle.icon}
                      size="sm"
                    />
                    {isInCircle && (
                      <Check className="w-4 h-4 text-green-600 ml-auto" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
