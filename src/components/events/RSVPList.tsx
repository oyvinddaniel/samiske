'use client'

import { useState, useEffect } from 'react'
import { Loader2, Star, Check, Users } from 'lucide-react'
import Link from 'next/link'
import { getEventRSVPUsers } from '@/lib/events'
import type { RSVPStatus, RSVPUser } from '@/lib/types/events'
import { cn } from '@/lib/utils'

interface RSVPListProps {
  postId: string
  initialUsers?: RSVPUser[]
  showAll?: boolean
  maxDisplay?: number
  maxParticipants?: number | null
}

export function RSVPList({
  postId,
  initialUsers,
  showAll = false,
  maxDisplay = 5,
  maxParticipants
}: RSVPListProps) {
  const [users, setUsers] = useState<RSVPUser[]>(initialUsers ?? [])
  const [isLoading, setIsLoading] = useState(!initialUsers)
  const [filter, setFilter] = useState<RSVPStatus | null>(null)
  const [showMore, setShowMore] = useState(showAll)

  useEffect(() => {
    if (initialUsers) return

    const fetchUsers = async () => {
      setIsLoading(true)
      const data = await getEventRSVPUsers(postId, filter ?? undefined)
      setUsers(data)
      setIsLoading(false)
    }

    fetchUsers()
  }, [postId, filter, initialUsers])

  const displayUsers = showMore ? users : users.slice(0, maxDisplay)
  const goingUsers = users.filter(u => u.status === 'going')
  const interestedUsers = users.filter(u => u.status === 'interested')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p>Ingen har svart enn\u00e5</p>
      </div>
    )
  }

  const isFull = maxParticipants !== null && maxParticipants !== undefined && goingUsers.length >= maxParticipants
  const spotsRemaining = maxParticipants ? maxParticipants - goingUsers.length : null

  return (
    <div className="space-y-3">
      {/* Capacity info */}
      {maxParticipants && (
        <div className={cn(
          'flex items-center gap-2 text-sm p-2 rounded-lg',
          isFull ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'
        )}>
          <Users className="w-4 h-4" />
          {isFull ? (
            <span className="font-medium">Fullt - alle {maxParticipants} plasser er tatt</span>
          ) : (
            <span>{spotsRemaining} av {maxParticipants} plasser igjen</span>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 border-b pb-2">
        <button
          onClick={() => setFilter(null)}
          className={cn(
            'px-3 py-1 text-sm rounded-full transition-colors',
            filter === null
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          Alle ({users.length})
        </button>
        <button
          onClick={() => setFilter('going')}
          className={cn(
            'flex items-center gap-1 px-3 py-1 text-sm rounded-full transition-colors',
            filter === 'going'
              ? 'bg-green-100 text-green-700'
              : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          <Check className="w-3 h-3" />
          Skal delta ({maxParticipants ? `${goingUsers.length}/${maxParticipants}` : goingUsers.length})
        </button>
        <button
          onClick={() => setFilter('interested')}
          className={cn(
            'flex items-center gap-1 px-3 py-1 text-sm rounded-full transition-colors',
            filter === 'interested'
              ? 'bg-amber-100 text-amber-700'
              : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          <Star className="w-3 h-3" />
          Interessert ({interestedUsers.length})
        </button>
      </div>

      {/* User list */}
      <div className="space-y-2">
        {displayUsers.map((user) => (
          <Link
            key={user.user_id}
            href={`/profil/${user.username}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {/* Avatar */}
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-medium">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Name and status */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{user.username}</p>
            </div>

            {/* Status badge */}
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 text-xs rounded-full',
                user.status === 'going'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              )}
            >
              {user.status === 'going' ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Skal delta</span>
                </>
              ) : (
                <>
                  <Star className="w-3 h-3" />
                  <span>Interessert</span>
                </>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Show more button */}
      {users.length > maxDisplay && !showMore && (
        <button
          onClick={() => setShowMore(true)}
          className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Vis alle {users.length} svar
        </button>
      )}
    </div>
  )
}
