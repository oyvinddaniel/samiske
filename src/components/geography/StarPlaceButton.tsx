'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  starMunicipality,
  unstarMunicipality,
  starPlace,
  unstarPlace,
  isLocationStarred
} from '@/lib/geography'
import { toast } from 'sonner'

interface StarPlaceButtonProps {
  userId: string | null
  locationId: string
  locationType: 'municipality' | 'place'
  locationName: string
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function StarPlaceButton({
  userId,
  locationId,
  locationType,
  locationName,
  className = '',
  variant = 'outline',
  size = 'sm'
}: StarPlaceButtonProps) {
  const [isStarred, setIsStarred] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!userId) return

    const checkStarred = async () => {
      const starred = await isLocationStarred(userId, locationId, locationType)
      setIsStarred(starred)
    }

    checkStarred()
  }, [userId, locationId, locationType])

  const handleToggleStar = async () => {
    if (!userId) {
      toast.error('Du ma logge inn for a stjernemerke steder')
      return
    }

    setIsLoading(true)

    try {
      let success: boolean

      if (isStarred) {
        // Unstar
        success = locationType === 'municipality'
          ? await unstarMunicipality(userId, locationId)
          : await unstarPlace(userId, locationId)

        if (success) {
          setIsStarred(false)
          toast.success(`${locationName} fjernet fra mine steder`)
        }
      } else {
        // Star
        success = locationType === 'municipality'
          ? await starMunicipality(userId, locationId)
          : await starPlace(userId, locationId)

        if (success) {
          setIsStarred(true)
          toast.success(`${locationName} lagt til i mine steder`)
        }
      }

      if (!success) {
        toast.error('Kunne ikke oppdatere stjernemerking')
      }
    } catch (error) {
      console.error('Error toggling star:', error)
      toast.error('Noe gikk galt')
    } finally {
      setIsLoading(false)
    }
  }

  if (!userId) {
    return null
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleStar}
      disabled={isLoading}
      className={`gap-2 ${className}`}
      title={isStarred ? 'Fjern fra mine steder' : 'Legg til i mine steder'}
    >
      <Star
        className={`h-4 w-4 ${isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`}
      />
      {size !== 'icon' && (
        <span>{isStarred ? 'Stjernemerket' : 'Stjernemark'}</span>
      )}
    </Button>
  )
}
