'use client'

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

// Helper to check if maintenance mode is enabled
export function isMaintenanceMode(): boolean {
  return process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true'
}
