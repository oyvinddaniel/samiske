'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { Stats } from './types'

interface StatsCardsProps {
  stats: Stats
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
          <p className="text-sm text-gray-500">Brukere</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-3xl font-bold text-gray-900">{stats.totalPosts}</p>
          <p className="text-sm text-gray-500">Innlegg</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-3xl font-bold text-gray-900">{stats.totalComments}</p>
          <p className="text-sm text-gray-500">Kommentarer</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-3xl font-bold text-gray-900">{stats.totalLikes}</p>
          <p className="text-sm text-gray-500">Likes</p>
        </CardContent>
      </Card>
    </div>
  )
}
