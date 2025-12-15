'use client'

import { useState, useEffect } from 'react'
import { Construction, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface MaintenanceBannerProps {
  title?: string
  message?: string
}

export function MaintenanceBanner({
  title = 'Vedlikehold pågår',
  message = 'Vi jobber med en oppdatering. Vennligst prøv igjen senere.'
}: MaintenanceBannerProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <Construction className="w-8 h-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600">
            {message}
          </p>
          <div className="pt-4">
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Tilbake til forsiden
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Inline maintenance card for forms
export function MaintenanceCard({
  title = 'Vedlikehold pågår',
  message = 'Vi jobber med en oppdatering. Vennligst prøv igjen senere.'
}: MaintenanceBannerProps) {
  return (
    <Card className="w-full">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
          <Construction className="w-6 h-6 text-amber-600" />
        </div>
        <CardTitle className="text-xl font-bold text-gray-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-3">
        <p className="text-sm text-gray-600">{message}</p>
        <p className="text-xs text-gray-500">Prøv igjen senere!</p>
      </CardContent>
    </Card>
  )
}

// Legacy function for environment variable check (fallback)
export function isMaintenanceMode(): boolean {
  return process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true'
}

// Hook to check database maintenance status
export function useMaintenanceMode() {
  const [status, setStatus] = useState<{
    loading: boolean
    enabled: boolean
    message: string
  }>({
    loading: true,
    enabled: false,
    message: ''
  })

  useEffect(() => {
    // First check env var (instant, no network)
    const envEnabled = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true'

    // Then check database (async)
    fetch('/api/admin/maintenance')
      .then(res => res.json())
      .then(data => {
        setStatus({
          loading: false,
          enabled: envEnabled || data.enabled,
          message: data.message || 'Vi jobber med en oppdatering. Prøv igjen senere.'
        })
      })
      .catch(() => {
        // If API fails, fall back to env var
        setStatus({
          loading: false,
          enabled: envEnabled,
          message: 'Vi jobber med en oppdatering. Prøv igjen senere.'
        })
      })
  }, [])

  return status
}
