'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Lock, Eye, EyeOff } from 'lucide-react'
import type { Group, GroupType } from '@/lib/types/groups'
import { groupTypeLabels } from '@/lib/types/groups'

interface GroupCardProps {
  group: Group
  userRole?: string | null
  showType?: boolean
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

export function GroupCard({ group, userRole, showType = true, onClick }: GroupCardProps) {
  const TypeIcon = typeIcons[group.group_type]

  const cardContent = (
    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Group avatar */}
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            {group.image_url ? (
              <img
                src={group.image_url}
                alt={group.name}
                className="w-full h-full rounded-lg object-cover"
              />
            ) : (
              <Users className="w-6 h-6 text-blue-600" />
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
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {group.member_count} {group.member_count === 1 ? 'medlem' : 'medlemmer'}
              </span>
              {group.post_count > 0 && (
                <span>{group.post_count} innlegg</span>
              )}
            </div>

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
