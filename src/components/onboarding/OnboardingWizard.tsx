'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GeographySelector } from '@/components/geography/GeographySelector'
import { setUserLocation, completeOnboarding } from '@/lib/geography'
import { toast } from 'sonner'
import { MapPin, Home, Check, ArrowRight, Loader2 } from 'lucide-react'

interface OnboardingWizardProps {
  userId: string
  userName?: string
}

type Step = 'current' | 'home' | 'done'

export function OnboardingWizard({ userId, userName }: OnboardingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('current')
  const [loading, setLoading] = useState(false)

  // Current location (where they live now)
  const [currentLocation, setCurrentLocation] = useState<{
    municipalityId: string | null
    placeId: string | null
  }>({ municipalityId: null, placeId: null })

  // Home location (where they come from)
  const [homeLocation, setHomeLocation] = useState<{
    municipalityId: string | null
    placeId: string | null
  }>({ municipalityId: null, placeId: null })

  const handleNext = async () => {
    setLoading(true)

    if (step === 'current') {
      // Save current location if selected
      if (currentLocation.municipalityId || currentLocation.placeId) {
        await setUserLocation(
          userId,
          'current',
          currentLocation.municipalityId,
          currentLocation.placeId,
          true // auto-star
        )
      }
      setStep('home')
    } else if (step === 'home') {
      // Save home location if selected
      if (homeLocation.municipalityId || homeLocation.placeId) {
        await setUserLocation(
          userId,
          'home',
          homeLocation.municipalityId,
          homeLocation.placeId,
          true // auto-star
        )
      }
      setStep('done')
    }

    setLoading(false)
  }

  const handleSkip = () => {
    if (step === 'current') {
      setStep('home')
    } else if (step === 'home') {
      setStep('done')
    }
  }

  const handleFinish = async () => {
    setLoading(true)
    await completeOnboarding(userId)
    toast.success('Velkommen til samiske.no!')
    router.push('/')
  }

  const getStepNumber = () => {
    switch (step) {
      case 'current': return 1
      case 'home': return 2
      case 'done': return 3
    }
  }

  const handleSkipAll = async () => {
    setLoading(true)
    await completeOnboarding(userId)
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4 relative">
      {/* Skip all link in corner */}
      {step !== 'done' && (
        <button
          onClick={handleSkipAll}
          disabled={loading}
          className="absolute top-4 right-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Hopp over alt
        </button>
      )}

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3].map((num) => (
              <div
                key={num}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  num <= getStepNumber() ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {step === 'current' && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">
                Velkommen{userName ? `, ${userName}` : ''}!
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Hvor bor du na?
              </CardDescription>
            </>
          )}

          {step === 'home' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Fortell oss mer</CardTitle>
              <CardDescription className="text-base mt-2">
                Hvor kommer du fra?
              </CardDescription>
            </>
          )}

          {step === 'done' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Du er klar!</CardTitle>
              <CardDescription className="text-base mt-2">
                Velkommen til samiske.no
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 'current' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Velg kommune eller sted
                </label>
                <GeographySelector
                  value={currentLocation}
                  onChange={setCurrentLocation}
                  placeholder="Velg hvor du bor"
                  className="w-full"
                />
              </div>
              <p className="text-sm text-gray-500 text-center">
                Dette hjelper oss vise deg relevant innhold fra ditt omrade.
              </p>
            </>
          )}

          {step === 'home' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Velg kommune eller sted
                </label>
                <GeographySelector
                  value={homeLocation}
                  onChange={setHomeLocation}
                  placeholder="Velg hvor du kommer fra"
                  className="w-full"
                />
              </div>
              <p className="text-sm text-gray-500 text-center">
                Del din bakgrunn med det samiske miljoet.
              </p>
            </>
          )}

          {step === 'done' && (
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Stedene du valgte er lagt til i &quot;Mine steder&quot; i sidemenyen.
                Du kan endre dette nar som helst i innstillingene.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            {step !== 'done' && (
              <>
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={loading}
                  className="flex-1"
                >
                  Hopp over
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Neste
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </>
            )}

            {step === 'done' && (
              <Button
                onClick={handleFinish}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Kom i gang'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
