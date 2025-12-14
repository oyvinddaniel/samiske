'use client'

import { useState } from 'react'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { followCommunity, unfollowCommunity } from '@/lib/communities'
import { toast } from 'sonner'

interface FollowButtonProps {
  communityId: string
  isFollowing: boolean
  onStatusChange?: () => void
  size?: 'default' | 'sm' | 'lg'
}

export function FollowButton({
  communityId,
  isFollowing,
  onStatusChange,
  size = 'default'
}: FollowButtonProps) {
  const [loading, setLoading] = useState(false)
  const [following, setFollowing] = useState(isFollowing)

  const handleClick = async () => {
    setLoading(true)

    try {
      if (following) {
        const success = await unfollowCommunity(communityId)
        if (success) {
          setFollowing(false)
          toast.success('Du følger ikke lenger dette samfunnet')
          onStatusChange?.()
        } else {
          toast.error('Kunne ikke slutte å følge')
        }
      } else {
        const success = await followCommunity(communityId)
        if (success) {
          setFollowing(true)
          toast.success('Du følger nå dette samfunnet')
          onStatusChange?.()
        } else {
          toast.error('Kunne ikke følge samfunnet')
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
      toast.error('Noe gikk galt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={following ? 'outline' : 'default'}
      size={size}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : following ? (
        <>
          <UserMinus className="w-4 h-4 mr-2" />
          Slutt å følge
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-2" />
          Følg
        </>
      )}
    </Button>
  )
}
