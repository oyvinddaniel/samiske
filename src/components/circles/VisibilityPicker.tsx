'use client'

import { useState, useEffect } from 'react'
import { Globe, UserCheck, CircleDot, Lock, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { CircleBadge } from './CircleBadge'
import { getUserCircles } from '@/lib/circles'
import type { PostVisibility, FriendCircle } from '@/lib/types/circles'
import { visibilityLabels } from '@/lib/types/circles'

interface VisibilityPickerProps {
  value: PostVisibility
  selectedCircles: string[]
  onChange: (visibility: PostVisibility, circleIds: string[]) => void
  compact?: boolean
}

const visibilityOptions: { value: PostVisibility; icon: React.ReactNode; description: string }[] = [
  {
    value: 'public',
    icon: <Globe className="w-4 h-4" />,
    description: 'Synlig for alle'
  },
  {
    value: 'friends',
    icon: <UserCheck className="w-4 h-4" />,
    description: 'Kun dine venner'
  },
  {
    value: 'circles',
    icon: <CircleDot className="w-4 h-4" />,
    description: 'Velg sirkler'
  },
  {
    value: 'only_me',
    icon: <Lock className="w-4 h-4" />,
    description: 'Kun synlig for deg'
  },
]

export function VisibilityPicker({
  value,
  selectedCircles,
  onChange,
  compact = false
}: VisibilityPickerProps) {
  const [circles, setCircles] = useState<(FriendCircle & { member_count: number })[]>([])
  const [showCircleSelector, setShowCircleSelector] = useState(false)
  const [tempSelectedCircles, setTempSelectedCircles] = useState<string[]>(selectedCircles)

  useEffect(() => {
    const fetchCircles = async () => {
      const data = await getUserCircles()
      setCircles(data)
    }
    fetchCircles()
  }, [])

  useEffect(() => {
    setTempSelectedCircles(selectedCircles)
  }, [selectedCircles])

  const handleVisibilityChange = (newVisibility: PostVisibility) => {
    if (newVisibility === 'circles') {
      setShowCircleSelector(true)
    } else {
      onChange(newVisibility, [])
    }
  }

  const handleCircleToggle = (circleId: string) => {
    setTempSelectedCircles(prev =>
      prev.includes(circleId)
        ? prev.filter(id => id !== circleId)
        : [...prev, circleId]
    )
  }

  const handleCircleSelectionDone = () => {
    onChange('circles', tempSelectedCircles)
    setShowCircleSelector(false)
  }

  const currentOption = visibilityOptions.find(o => o.value === value)
  const selectedCircleNames = circles
    .filter(c => selectedCircles.includes(c.id))
    .map(c => c.name)
    .join(', ')

  if (showCircleSelector) {
    return (
      <div className="bg-gray-50 rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Velg sirkler</span>
          <Button
            size="sm"
            onClick={handleCircleSelectionDone}
            disabled={tempSelectedCircles.length === 0}
          >
            Ferdig
          </Button>
        </div>

        {circles.length === 0 ? (
          <p className="text-sm text-gray-500">
            Du har ingen sirkler. Opprett sirkler i innstillinger.
          </p>
        ) : (
          <div className="space-y-2">
            {circles.map(circle => (
              <label
                key={circle.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <Checkbox
                  checked={tempSelectedCircles.includes(circle.id)}
                  onCheckedChange={() => handleCircleToggle(circle.id)}
                />
                <CircleBadge
                  name={circle.name}
                  color={circle.color}
                  icon={circle.icon}
                  size="sm"
                />
                <span className="text-xs text-gray-500 ml-auto">
                  {circle.member_count} {circle.member_count === 1 ? 'medlem' : 'medlemmer'}
                </span>
              </label>
            ))}
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setShowCircleSelector(false)}
        >
          Avbryt
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={compact ? 'sm' : 'default'}
          className="gap-2"
        >
          {currentOption?.icon}
          <span className={compact ? 'sr-only sm:not-sr-only' : ''}>
            {value === 'circles' && selectedCircleNames
              ? selectedCircleNames
              : visibilityLabels[value]}
          </span>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        {visibilityOptions.map(option => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleVisibilityChange(option.value)}
            className="gap-3"
          >
            <span className="text-gray-500">{option.icon}</span>
            <div className="flex-1">
              <div className="font-medium">{visibilityLabels[option.value]}</div>
              <div className="text-xs text-gray-500">{option.description}</div>
            </div>
            {value === option.value && (
              <Check className="w-4 h-4 text-blue-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
