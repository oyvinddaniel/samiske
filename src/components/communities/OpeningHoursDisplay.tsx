'use client'

import { useEffect, useState } from 'react'
import { Clock, Circle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  getOpeningHours,
  groupOpeningHours,
  isCurrentlyOpen,
  getTodayHours,
  type OpeningHours
} from '@/lib/openingHours'

interface OpeningHoursDisplayProps {
  communityId: string
}

export function OpeningHoursDisplay({ communityId }: OpeningHoursDisplayProps) {
  const [hours, setHours] = useState<OpeningHours[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHours = async () => {
      const data = await getOpeningHours(communityId)
      setHours(data)
      setLoading(false)
    }

    fetchHours()
  }, [communityId])

  if (loading || hours.length === 0) {
    return null
  }

  const currentlyOpen = isCurrentlyOpen(hours)
  const todayHours = getTodayHours(hours)
  const grouped = groupOpeningHours(hours)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Åpningstider
        </h3>
        <Badge
          variant={currentlyOpen ? 'default' : 'secondary'}
          className={currentlyOpen ? 'bg-green-600' : ''}
        >
          <Circle className={`w-2 h-2 mr-1 ${currentlyOpen ? 'fill-white' : 'fill-gray-500'}`} />
          {currentlyOpen ? 'Åpent nå' : 'Stengt nå'}
        </Badge>
      </div>

      {todayHours && (
        <p className="text-sm text-gray-600">
          <span className="font-medium">I dag:</span> {todayHours}
        </p>
      )}

      <div className="space-y-1.5">
        {grouped.map((group, index) => (
          <div
            key={index}
            className="flex justify-between text-sm"
          >
            <span className="text-gray-600 font-medium">{group.days}</span>
            <span className="text-gray-900">{group.hours}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
