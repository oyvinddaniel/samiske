'use client'

import { useState, useEffect } from 'react'
import { X, Star, Building2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { GeographySelector } from './GeographySelector'
import { starMunicipality, starPlace } from '@/lib/geography'
import { toast } from 'sonner'

interface AddStarredLocationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onLocationAdded?: () => void
}

export function AddStarredLocationModal({
  open,
  onOpenChange,
  userId,
  onLocationAdded
}: AddStarredLocationModalProps) {
  const [selectedLocation, setSelectedLocation] = useState<{
    municipalityId: string | null
    placeId: string | null
  }>({ municipalityId: null, placeId: null })
  const [isLoading, setIsLoading] = useState(false)

  // Reset selection when modal opens
  useEffect(() => {
    if (open) {
      setSelectedLocation({ municipalityId: null, placeId: null })
    }
  }, [open])

  const handleAddLocation = async () => {
    if (!selectedLocation.municipalityId && !selectedLocation.placeId) {
      toast.error('Velg en kommune eller et sted')
      return
    }

    setIsLoading(true)

    try {
      let success = false

      if (selectedLocation.placeId) {
        // Star the place
        success = await starPlace(userId, selectedLocation.placeId)
        if (success) {
          toast.success('Sted lagt til i mine steder')
        }
      } else if (selectedLocation.municipalityId) {
        // Star the municipality
        success = await starMunicipality(userId, selectedLocation.municipalityId)
        if (success) {
          toast.success('Kommune lagt til i mine steder')
        }
      }

      if (success) {
        onOpenChange(false)
        onLocationAdded?.()
      } else {
        toast.error('Kunne ikke legge til stedet. Kanskje det allerede er lagt til?')
      }
    } catch (error) {
      console.error('Error adding starred location:', error)
      toast.error('Noe gikk galt')
    } finally {
      setIsLoading(false)
    }
  }

  const getSelectedText = () => {
    if (selectedLocation.placeId) {
      return 'Sted valgt'
    }
    if (selectedLocation.municipalityId) {
      return 'Kommune valgt'
    }
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Legg til sted
          </DialogTitle>
          <DialogDescription>
            Velg en kommune eller et sted du vil ha rask tilgang til i sidemenyen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Velg kommune eller sted
            </label>
            <GeographySelector
              value={selectedLocation}
              onChange={setSelectedLocation}
              placeholder="Velg kommune eller sted..."
              className="w-full"
            />
          </div>

          {getSelectedText() && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
              {selectedLocation.placeId ? (
                <MapPin className="h-4 w-4" />
              ) : (
                <Building2 className="h-4 w-4" />
              )}
              <span>{getSelectedText()}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Avbryt
          </Button>
          <Button
            onClick={handleAddLocation}
            disabled={isLoading || (!selectedLocation.municipalityId && !selectedLocation.placeId)}
          >
            {isLoading ? 'Legger til...' : 'Legg til'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
