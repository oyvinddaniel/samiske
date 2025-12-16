'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Lock, Eye, EyeOff, Clock } from 'lucide-react'
import type { Group, GroupType } from '@/lib/types/groups'
import { groupTypeLabels } from '@/lib/types/groups'

interface GroupCardProps {
  group: Group
  userRole?: string | null
  showType?: boolean
  pendingCount?: number
  onClick?: () => void
}

const typeIcons: Record<GroupType, typeof Users> = {
  open: Eye,
  closed: Lock,
  hidden: EyeOff,
}

const typeColors: Record<GroupType, string> = {
  open: 'bg-green-100 text-green-800',
  closed: 'bg-yellow-100 text-yellow-800',
  hidden: 'bg-gray-100 text-gray-800',
}

export function GroupCard({ group, userRole, showType = true, pendingCount = 0, onClick }: GroupCardProps) {
  const TypeIcon = typeIcons[group.group_type]
  const isAdminOrMod = userRole === 'admin' || userRole === 'moderator'

  const cardContent = (
    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full relative">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Group avatar */}
          <div className="relative w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            {group.image_url ? (
              <img
                src={group.image_url}
                alt={group.name}
                className="w-full h-full rounded-lg object-cover"
              />
            ) : (
              <Users className="w-6 h-6 text-blue-600" />
            )}
            {/* Pending members notification badge */}
            {isAdminOrMod && pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Name and type badge */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {group.name}
              </h3>
              {showType && (
                <Badge variant="secondary" className={`text-xs ${typeColors[group.group_type]}`}>
                  <TypeIcon className="w-3 h-3 mr-1" />
                  {groupTypeLabels[group.group_type]}
                </Badge>
              )}
            </div>

            {/* Description */}
            {group.description && (
              <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                {group.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {group.member_count} {group.member_count === 1 ? 'medlem' : 'medlemmer'}
              </span>
              {group.post_count > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  {group.post_count} innlegg
                </span>
              )}
            </div>

            {/* Pending members alert for admin/mod */}
            {isAdminOrMod && pendingCount > 0 && (
              <div className="mt-2 flex items-center gap-2 px-2.5 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-medium text-orange-700">
                  {pendingCount} {pendingCount === 1 ? 'forespørsel venter' : 'forespørsler venter'}
                </span>
              </div>
            )}

            {/* User role badge */}
            {userRole && (
              <Badge variant="outline" className="mt-2 text-xs">
                {userRole === 'admin' ? 'Administrator' : userRole === 'moderator' ? 'Moderator' : 'Medlem'}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // If onClick is provided, use a div; otherwise use Link for navigation
  if (onClick) {
    return (
      <div onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick()}>
        {cardContent}
      </div>
    )
  }

  return (
    <Link href={`/grupper/${group.slug}`}>
      {cardContent}
    </Link>
  )
}
