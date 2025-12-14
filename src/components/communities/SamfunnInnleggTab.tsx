'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Feed } from '@/components/feed/Feed'

interface SamfunnInnleggTabProps {
  currentUserId: string | null
}

export function SamfunnInnleggTab({ currentUserId }: SamfunnInnleggTabProps) {
  const [filter, setFilter] = useState<'all' | 'following'>('all')

  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      {currentUserId && (
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Alle
          </Button>
          <Button
            variant={filter === 'following' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('following')}
          >
            Følger
          </Button>
        </div>
      )}

      {/* Feed */}
      <Feed />
    </div>
  )
}
