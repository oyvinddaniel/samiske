'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Feed } from '@/components/feed/Feed'
import { createClient } from '@/lib/supabase/client'

interface SamfunnInnleggTabProps {
  currentUserId: string | null
}

export function SamfunnInnleggTab({ currentUserId }: SamfunnInnleggTabProps) {
  const [filter, setFilter] = useState<'all' | 'following'>('all')
  const [followedCommunityIds, setFollowedCommunityIds] = useState<string[]>([])

  const supabase = createClient()

  useEffect(() => {
    async function fetchFollowedCommunities() {
      if (!currentUserId) return

      const { data } = await supabase
        .from('community_followers')
        .select('community_id')
        .eq('user_id', currentUserId)

      setFollowedCommunityIds((data || []).map(f => f.community_id))
    }

    fetchFollowedCommunities()
  }, [currentUserId, supabase])

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
            De jeg følger
          </Button>
        </div>
      )}

      {/* Feed */}
      <Feed
        onlyFromCommunities={true}
        communityIds={filter === 'following' ? followedCommunityIds : undefined}
        hideCreateButton={true}
      />
    </div>
  )
}
