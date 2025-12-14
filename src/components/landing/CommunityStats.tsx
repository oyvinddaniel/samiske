'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function CommunityStats() {
  const [totalMembers, setTotalMembers] = useState(0)
  const [totalPosts, setTotalPosts] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      const [membersCount, postsCount] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
      ])

      setTotalMembers(membersCount.count || 0)
      setTotalPosts(postsCount.count || 0)
    }

    fetchStats()
  }, [supabase])

  return (
    <div className="flex flex-wrap gap-6 text-sm">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">{totalMembers}</span>
        <span className="text-gray-600">medlemmer</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">{totalPosts}</span>
        <span className="text-gray-600">innlegg</span>
      </div>
    </div>
  )
}
