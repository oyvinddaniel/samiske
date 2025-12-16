'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function CommunityStats() {
  const [mounted, setMounted] = useState(false)
  const [totalMembers, setTotalMembers] = useState(0)
  const [totalPosts, setTotalPosts] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const fetchStats = async () => {
      // Bruk sikre RPC-funksjoner som ikke eksponerer data
      const [membersCount, postsCount] = await Promise.all([
        supabase.rpc('get_auth_users_count'),
        supabase.rpc('get_posts_count'),
      ])

      setTotalMembers(membersCount.data || 0)
      setTotalPosts(postsCount.data || 0)
    }

    fetchStats()
  }, [mounted, supabase])

  if (!mounted) {
    return (
      <div className="flex flex-wrap gap-6 text-sm">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">-</span>
          <span className="text-gray-600">medlemmer</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">-</span>
          <span className="text-gray-600">innlegg</span>
        </div>
      </div>
    )
  }

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
