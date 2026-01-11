'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Save, RefreshCw, HardDrive, FileImage, Upload, ImageIcon } from 'lucide-react'

interface MediaSettings {
  maxFileSizeMB: number
  maxImagesPerPost: number
  maxImagesPerGeography: number
}

const DEFAULT_SETTINGS: MediaSettings = {
  maxFileSizeMB: 20,
  maxImagesPerPost: 30,
  maxImagesPerGeography: 100,
}

export function MediaSettingsTab() {
  const [settings, setSettings] = useState<MediaSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', [
          'media_max_file_size_mb',
          'media_max_images_per_post',
          'media_max_images_per_geography',
        ])

      if (error) throw error

      const settingsObj: MediaSettings = { ...DEFAULT_SETTINGS }

      if (data) {
        data.forEach((setting) => {
          if (setting.key === 'media_max_file_size_mb') {
            settingsObj.maxFileSizeMB = Number(setting.value) || DEFAULT_SETTINGS.maxFileSizeMB
          } else if (setting.key === 'media_max_images_per_post') {
            settingsObj.maxImagesPerPost = Number(setting.value) || DEFAULT_SETTINGS.maxImagesPerPost
          } else if (setting.key === 'media_max_images_per_geography') {
            settingsObj.maxImagesPerGeography = Number(setting.value) || DEFAULT_SETTINGS.maxImagesPerGeography
          }
        })
      }

      setSettings(settingsObj)
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Kunne ikke hente innstillinger')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Save settings
  const handleSave = async () => {
    setSaving(true)
    try {
      // Upsert all settings
      const { error } = await supabase
        .from('app_settings')
        .upsert([
          { key: 'media_max_file_size_mb', value: settings.maxFileSizeMB.toString() },
          { key: 'media_max_images_per_post', value: settings.maxImagesPerPost.toString() },
          { key: 'media_max_images_per_geography', value: settings.maxImagesPerGeography.toString() },
        ])

      if (error) throw error

      toast.success('Innstillinger lagret')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Kunne ikke lagre innstillinger')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Media Service Innstillinger
          </CardTitle>
          <CardDescription>
            Konfigurer grenser og regler for bildeopplasting
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Settings */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Max File Size */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Maks filstørrelse
            </CardTitle>
            <CardDescription>
              Maksimal størrelse per fil i MB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="maxFileSizeMB">Størrelse (MB)</Label>
              <Input
                id="maxFileSizeMB"
                type="number"
                min="1"
                max="100"
                value={settings.maxFileSizeMB}
                onChange={(e) => setSettings({ ...settings, maxFileSizeMB: Number(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Anbefalt: 20 MB eller lavere
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Max Images Per Post */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileImage className="w-4 h-4" />
              Maks bilder per innlegg
            </CardTitle>
            <CardDescription>
              Antall bilder brukere kan laste opp per innlegg
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="maxImagesPerPost">Antall bilder</Label>
              <Input
                id="maxImagesPerPost"
                type="number"
                min="1"
                max="100"
                value={settings.maxImagesPerPost}
                onChange={(e) => setSettings({ ...settings, maxImagesPerPost: Number(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Standard: 30 bilder
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Max Images Per Geography */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Maks bilder per sted
            </CardTitle>
            <CardDescription>
              Antall bilder per geografisk sted/kommune
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="maxImagesPerGeography">Antall bilder</Label>
              <Input
                id="maxImagesPerGeography"
                type="number"
                min="1"
                max="500"
                value={settings.maxImagesPerGeography}
                onChange={(e) => setSettings({ ...settings, maxImagesPerGeography: Number(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Standard: 100 bilder
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className={`w-4 h-4 ${saving ? 'animate-pulse' : ''}`} />
          {saving ? 'Lagrer...' : 'Lagre innstillinger'}
        </Button>
        <Button
          variant="outline"
          onClick={fetchSettings}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Tilbakestill
        </Button>
      </div>

      {/* Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Informasjon</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 space-y-2">
          <p>
            • Endringer påvirker alle nye opplastinger umiddelbart
          </p>
          <p>
            • Eksisterende bilder påvirkes ikke
          </p>
          <p>
            • Bilder komprimeres automatisk på klient-siden før opplasting
          </p>
          <p>
            • Thumbnails genereres automatisk via Supabase Image Transformation
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
