'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Users, Package, Briefcase, MapPin } from 'lucide-react'
import { FollowButton } from './FollowButton'

interface Community {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_image_url: string | null
  follower_count?: number
  post_count?: number
  product_count?: number
  service_count?: number
  isFollowing?: boolean
  industries?: Array<{
    id: string
    name_no: string
  }>
  municipality?: {
    name: string
  } | null
  place?: {
    name: string
  } | null
}

interface SamfunnFeedCardProps {
  community: Community
  currentUserId?: string | null
}

export function SamfunnFeedCard({ community }: SamfunnFeedCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const locationName = community.place?.name || community.municipality?.name

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Cover image */}
      {community.cover_image_url && (
        <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
          <img
            src={community.cover_image_url}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}
      {!community.cover_image_url && (
        <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600" />
      )}

      <CardContent className="p-4">
        {/* Logo and header */}
        <div className="flex items-start gap-4 -mt-12 mb-3">
          <Link href={`/samfunn/${community.slug}`} className="relative">
            <Avatar className="w-20 h-20 border-4 border-white shadow-lg hover:ring-2 hover:ring-blue-500 transition-all">
              <AvatarImage src={community.logo_url || undefined} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-bold">
                {getInitials(community.name)}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 mt-12">
            <Link href={`/samfunn/${community.slug}`}>
              <h3 className="font-bold text-lg hover:text-blue-600 transition-colors">
                {community.name}
              </h3>
            </Link>

            {locationName && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {locationName}
              </p>
            )}
          </div>

          {community.isFollowing !== undefined && (
            <FollowButton
              communityId={community.id}
              isFollowing={community.isFollowing}
            />
          )}
        </div>

        {/* Description */}
        {community.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {community.description}
          </p>
        )}

        {/* Industries */}
        {community.industries && community.industries.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {community.industries.slice(0, 3).map((industry) => (
              <Badge key={industry.id} variant="secondary" className="text-xs">
                {industry.name_no}
              </Badge>
            ))}
            {community.industries.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{community.industries.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600 pt-3 border-t">
          {typeof community.follower_count === 'number' && (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{community.follower_count}</span>
            </div>
          )}

          {typeof community.product_count === 'number' && community.product_count > 0 && (
            <div className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              <span>{community.product_count}</span>
            </div>
          )}

          {typeof community.service_count === 'number' && community.service_count > 0 && (
            <div className="flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              <span>{community.service_count}</span>
            </div>
          )}

          <div className="flex-1" />

          <Link href={`/samfunn/${community.slug}`}>
            <Button variant="ghost" size="sm" className="text-xs">
              Se side
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
