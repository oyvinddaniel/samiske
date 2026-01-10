'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Lock, Eye, EyeOff, ArrowLeft, Share2 } from 'lucide-react'
import type { Group, GroupType, MemberStatus } from '@/lib/types/groups'
import { groupTypeLabels } from '@/lib/types/groups'
import { JoinGroupButton } from './JoinGroupButton'

interface GroupHeaderProps {
  group: Group
  userRole?: string | null
  memberStatus?: MemberStatus | null
  onClose: () => void
  onMembershipChange?: () => void
}

const typeIcons: Record<GroupType, typeof Users> = {
  open: Eye,
  closed: Lock,
  hidden: EyeOff,
}

export function GroupHeader({ group, userRole, memberStatus, onClose, onMembershipChange }: GroupHeaderProps) {
  const TypeIcon = typeIcons[group.group_type]
  const isMember = memberStatus === 'approved'

  const handleShare = async () => {
    try {
      await navigator.share({
        title: group.name,
        text: group.description || `Sjekk ut ${group.name}`,
        url: `/grupper/${group.slug}`,
      })
    } catch {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/grupper/${group.slug}`)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      {/* Back button and actions */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tilbake
        </Button>
        <Button variant="ghost" size="sm" onClick={handleShare}>
          <Share2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Group info */}
      <div className="flex items-start gap-4">
        {/* Group avatar */}
        <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
          {group.image_url ? (
            <img
              src={group.image_url}
              alt={group.name}
              className="w-full h-full rounded-lg object-cover"
            />
          ) : (
            <Users className="w-8 h-8 text-blue-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name */}
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            {group.name}
          </h1>

          {/* Stats and type */}
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {group.member_count} {group.member_count === 1 ? 'medlem' : 'medlemmer'}
            </span>
            <Badge variant="secondary" className="text-xs">
              <TypeIcon className="w-3 h-3 mr-1" />
              {groupTypeLabels[group.group_type]}
            </Badge>
          </div>

          {/* Description */}
          {group.description && (
            <p className="text-sm text-gray-600 mb-3">
              {group.description}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <JoinGroupButton
              groupId={group.id}
              groupType={group.group_type}
              isMember={isMember}
              memberStatus={memberStatus || null}
              userRole={userRole || null}
              onStatusChange={onMembershipChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
