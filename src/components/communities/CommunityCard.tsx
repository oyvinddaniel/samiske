'use client'

import Link from 'next/link'
import { Building2, Briefcase, Landmark, Users, Palette, GraduationCap, Building, CircleDot, BadgeCheck, Brush, Hammer, UtensilsCrossed, Wrench } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FollowButton } from './FollowButton'
import type { Community } from '@/lib/types/communities'
import { categoryLabels } from '@/lib/types/communities'

export interface CommunityCardProps {
  community: Community
  showDescription?: boolean
  isFollowing?: boolean
}

const categoryIcons: Record<string, React.ReactNode> = {
  organization: <Building2 className="w-5 h-5" />,
  business: <Briefcase className="w-5 h-5" />,
  institution: <Landmark className="w-5 h-5" />,
  association: <Users className="w-5 h-5" />,
  cultural: <Palette className="w-5 h-5" />,
  educational: <GraduationCap className="w-5 h-5" />,
  government: <Building className="w-5 h-5" />,
  artist: <Brush className="w-5 h-5" />,
  craftsperson: <Hammer className="w-5 h-5" />,
  restaurant: <UtensilsCrossed className="w-5 h-5" />,
  service_provider: <Wrench className="w-5 h-5" />,
  other: <CircleDot className="w-5 h-5" />
}

export function CommunityCard({ community, showDescription = true, isFollowing }: CommunityCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 hover:shadow-md transition-shadow border border-gray-100">
      <div className="flex items-start gap-4">
        {/* Logo */}
        <Link
          href={`/samfunn/${community.slug}`}
          className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden"
        >
          {community.logo_url ? (
            <img
              src={community.logo_url}
              alt={community.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-400">
              {categoryIcons[community.category]}
            </span>
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <Link href={`/samfunn/${community.slug}`} className="flex items-center gap-2 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">
                {community.name}
              </h3>
              {community.is_verified && (
                <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
              )}
            </Link>
            {isFollowing !== undefined && (
              <FollowButton
                communityId={community.id}
                isFollowing={isFollowing}
                size="sm"
              />
            )}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">
              {categoryLabels[community.category]}
            </Badge>
          </div>

          {showDescription && community.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
              {community.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {community.follower_count} {community.follower_count === 1 ? 'følger' : 'følgere'}
            </span>
            <span>{community.post_count} innlegg</span>
          </div>
        </div>
      </div>
    </div>
  )
}
