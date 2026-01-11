'use client'

import { useState, useEffect } from 'react'
import { Loader2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  getOpeningHours,
  setOpeningHours,
  getDayName,
  type OpeningHours
} from '@/lib/openingHours'
import { toast } from 'sonner'

interface OpeningHoursEditorProps {
  communityId: string
  onUpdated?: () => void
}

interface DayHours {
  day_of_week: number
  opens_at: string
  closes_at: string
  is_closed: boolean
  note: string
}

export function OpeningHoursEditor({ communityId, onUpdated }: OpeningHoursEditorProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hours, setHours] = useState<DayHours[]>([])

  // Initialize with default hours for all days
  useEffect(() => {
    const fetchHours = async () => {
      setLoading(true)
      const data = await getOpeningHours(communityId)

      // Create array for all 7 days
      const allDays: DayHours[] = []
      for (let i = 0; i < 7; i++) {
        const existing = data.find(h => h.day_of_week === i)
        allDays.push({
          day_of_week: i,
          opens_at: existing?.opens_at || '09:00',
          closes_at: existing?.closes_at || '17:00',
          is_closed: existing?.is_closed ?? false,
          note: existing?.note || ''
        })
      }

      setHours(allDays)
      setLoading(false)
    }

    fetchHours()
  }, [communityId])

  const handleHourChange = (dayIndex: number, field: keyof DayHours, value: string | boolean) => {
    setHours(prevHours =>
      prevHours.map((h, i) =>
        i === dayIndex ? { ...h, [field]: value } : h
      )
    )
  }

  const handleCopyToAll = (dayIndex: number) => {
    const sourceDay = hours[dayIndex]
    setHours(prevHours =>
      prevHours.map(h => ({
        ...h,
        opens_at: sourceDay.opens_at,
        closes_at: sourceDay.closes_at,
        is_closed: sourceDay.is_closed
      }))
    )
    toast.success('Kopiert til alle dager')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const success = await setOpeningHours(communityId, hours)

      if (success) {
        toast.success('Åpningstider lagret')
        if (onUpdated) onUpdated()
      } else {
        toast.error('Kunne ikke lagre åpningstider')
      }
    } catch (error) {
      console.error('Error saving opening hours:', error)
      toast.error('Kunne ikke lagre åpningstider')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Åpningstider
        </h3>
        <p className="text-sm text-gray-500">
          Angi når siden din har åpent for besøkende.
        </p>
      </div>

      <div className="space-y-3">
        {hours.map((dayHours, index) => (
          <div
            key={dayHours.day_of_week}
            className="border rounded-lg p-4 space-y-3"
          >
            {/* Day header */}
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                {getDayName(dayHours.day_of_week)}
              </Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={dayHours.is_closed}
                  onCheckedChange={(checked) =>
                    handleHourChange(index, 'is_closed', checked as boolean)
                  }
                  id={`closed-${index}`}
                />
                <label
                  htmlFor={`closed-${index}`}
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  Stengt
                </label>
              </div>
            </div>

            {/* Time inputs */}
            {!dayHours.is_closed && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor={`opens-${index}`} className="text-xs text-gray-500">
                    Åpner
                  </Label>
                  <Input
                    id={`opens-${index}`}
                    type="time"
                    value={dayHours.opens_at}
                    onChange={(e) =>
                      handleHourChange(index, 'opens_at', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`closes-${index}`} className="text-xs text-gray-500">
                    Stenger
                  </Label>
                  <Input
                    id={`closes-${index}`}
                    type="time"
                    value={dayHours.closes_at}
                    onChange={(e) =>
                      handleHourChange(index, 'closes_at', e.target.value)
                    }
                  />
                </div>
              </div>
            )}

            {/* Note */}
            <div className="space-y-1">
              <Label htmlFor={`note-${index}`} className="text-xs text-gray-500">
                Merknad (valgfritt)
              </Label>
              <Input
                id={`note-${index}`}
                value={dayHours.note}
                onChange={(e) =>
                  handleHourChange(index, 'note', e.target.value)
                }
                placeholder="F.eks. 'Lukket for lunsj 12-13'"
                disabled={dayHours.is_closed}
              />
            </div>

            {/* Copy button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleCopyToAll(index)}
              className="text-xs"
            >
              Kopier til alle dager
            </Button>
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Lagrer...
            </>
          ) : (
            'Lagre åpningstider'
          )}
        </Button>
      </div>
    </div>
  )
}
