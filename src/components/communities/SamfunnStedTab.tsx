'use client'

import { useState, useEffect } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { CommunityCard } from '@/components/communities'
import { getCommunities } from '@/lib/communities'
import type { Community } from '@/lib/types/communities'

export function SamfunnStedTab() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCommunities() {
      setLoading(true)
      const data = await getCommunities(100, 0)
      setCommunities(data)
      setLoading(false)
    }
    loadCommunities()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Info message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">
              Stedfiltrering kommer snart
            </h3>
            <p className="text-sm text-blue-700">
              Her vil du kunne filtrere sider etter språkområde, kommune og sted.
            </p>
          </div>
        </div>
      </div>

      {/* Communities list */}
      {communities.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Ingen sider funnet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {communities.map((community) => (
            <CommunityCard key={community.id} community={community} />
          ))}
        </div>
      )}
    </div>
  )
}
