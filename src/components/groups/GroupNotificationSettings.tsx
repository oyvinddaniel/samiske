'use client'

import { useState, useEffect } from 'react'
import { Bell, Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getGroupNotificationPreferences,
  updateGroupNotificationPreferences,
  type GroupNotificationPreferences,
} from '@/lib/groups'
import { toast } from 'sonner'
import type { Group } from '@/lib/types/groups'

interface GroupNotificationSettingsProps {
  group: Group
}

const frequencyLabels: Record<GroupNotificationPreferences['notification_frequency'], string> = {
  instant: 'Umiddelbart',
  daily: 'Daglig oppsummering',
  weekly: 'Ukentlig oppsummering',
  none: 'Ingen varsler',
}

export function GroupNotificationSettings({ group }: GroupNotificationSettingsProps) {
  const [preferences, setPreferences] = useState<GroupNotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchPreferences = async () => {
      setLoading(true)
      const prefs = await getGroupNotificationPreferences(group.id)
      setPreferences(prefs)
      setLoading(false)
    }

    fetchPreferences()
  }, [group.id])

  const handleToggle = async (key: keyof GroupNotificationPreferences, value: boolean) => {
    if (!preferences) return

    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
    setSaving(true)

    const success = await updateGroupNotificationPreferences(group.id, { [key]: value })

    if (!success) {
      // Revert on failure
      setPreferences(preferences)
      toast.error('Kunne ikke lagre innstilling')
    }

    setSaving(false)
  }

  const handleFrequencyChange = async (value: GroupNotificationPreferences['notification_frequency']) => {
    if (!preferences) return

    const newPreferences = { ...preferences, notification_frequency: value }
    setPreferences(newPreferences)
    setSaving(true)

    const success = await updateGroupNotificationPreferences(group.id, { notification_frequency: value })

    if (success) {
      toast.success('Varslingsfrekvens oppdatert')
    } else {
      // Revert on failure
      setPreferences(preferences)
      toast.error('Kunne ikke lagre innstilling')
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!preferences) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Kunne ikke laste innstillinger</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <Bell className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <p>Disse innstillingene gjelder kun for denne gruppen</p>
      </div>

      {/* Frequency */}
      <div className="space-y-2">
        <Label>Varslingsfrekvens</Label>
        <Select
          value={preferences.notification_frequency}
          onValueChange={handleFrequencyChange}
          disabled={saving}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(frequencyLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Only show toggles if not "none" */}
      {preferences.notification_frequency !== 'none' && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notify-posts" className="font-medium">Nye innlegg</Label>
              <p className="text-sm text-gray-500">Varsle når noen poster i gruppen</p>
            </div>
            <Switch
              id="notify-posts"
              checked={preferences.notify_new_posts}
              onCheckedChange={(checked) => handleToggle('notify_new_posts', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notify-events" className="font-medium">Arrangementer</Label>
              <p className="text-sm text-gray-500">Varsle om nye arrangementer</p>
            </div>
            <Switch
              id="notify-events"
              checked={preferences.notify_events}
              onCheckedChange={(checked) => handleToggle('notify_events', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notify-comments" className="font-medium">Kommentarer</Label>
              <p className="text-sm text-gray-500">Varsle om kommentarer på dine innlegg</p>
            </div>
            <Switch
              id="notify-comments"
              checked={preferences.notify_comments_own_posts}
              onCheckedChange={(checked) => handleToggle('notify_comments_own_posts', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notify-mentions" className="font-medium">Omtaler</Label>
              <p className="text-sm text-gray-500">Varsle når noen nevner deg</p>
            </div>
            <Switch
              id="notify-mentions"
              checked={preferences.notify_mentions}
              onCheckedChange={(checked) => handleToggle('notify_mentions', checked)}
              disabled={saving}
            />
          </div>
        </div>
      )}

      {preferences.notification_frequency === 'none' && (
        <p className="text-sm text-gray-500 text-center py-4">
          Du vil ikke motta noen varsler fra denne gruppen
        </p>
      )}
    </div>
  )
}
