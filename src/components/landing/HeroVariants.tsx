'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { CommunityStats } from './CommunityStats'
import { InlineRegistrationForm } from './InlineRegistrationForm'
import { AppScreenshot } from './AppScreenshot'
import { DesignTheme } from './design-themes'
import { Users, BookOpen, MapPin, TrendingUp, Star, CheckCircle } from 'lucide-react'

interface HeroVariantsProps {
  theme: DesignTheme
  onLoginClick: () => void
}

// Header component reused across variants - moved outside to avoid "Cannot create components during render"
function Header({ dark = false, onLoginClick }: { dark?: boolean; onLoginClick: () => void }) {
  return (
    <header className={`border-b ${dark ? 'border-gray-800 bg-gray-900/80' : 'border-gray-200 bg-white/80'} backdrop-blur-sm sticky top-0 z-40`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden shadow-sm">
            <Image
              src="/images/sami.png"
              alt="Samisk flagg"
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
          <span className={`font-bold text-lg ${dark ? 'text-white' : 'text-gray-900'}`}>samiske.no</span>
        </div>
        <Button variant={dark ? 'outline' : 'outline'} onClick={onLoginClick} className={dark ? 'border-gray-700 text-white hover:bg-gray-800' : ''}>
          Logg inn
        </Button>
      </div>
    </header>
  )
}

export function HeroVariants({ theme, onLoginClick }: HeroVariantsProps) {

  // Minimal Clean - Inspired by Stripe/Linear
  if (theme === 'minimal-clean') {
    return (
      <div className="bg-white">
        <Header onLoginClick={onLoginClick} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left - Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight tracking-tight">
                  Møtested for det samiske folket
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Koble sammen. Del kultur. Bevar tradisjoner. Alt på én plattform.
                </p>
              </div>
              <CommunityStats />
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white" />
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  Bli med i fellesskapet
                </p>
              </div>
            </div>

            {/* Right - Registration */}
            <div>
              <InlineRegistrationForm onLoginClick={onLoginClick} />
            </div>
          </div>

          {/* Full width screenshot below */}
          <div className="mt-20">
            <AppScreenshot variant="browser" blur={true} />
          </div>
        </div>
      </div>
    )
  }

  // Dark Mode
  if (theme === 'dark-mode') {
    return (
      <div className="bg-gray-950 text-white min-h-screen">
        <Header dark onLoginClick={onLoginClick} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
            <div className="lg:col-span-3 space-y-8">
              <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400 mb-4">
                ✨ Digital møteplass for samer
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Møtested for det samiske folket
              </h1>
              <p className="text-xl text-gray-400 leading-relaxed max-w-2xl">
                En moderne sosial plattform som samler det samiske fellesskapet på tvers av grenser.
              </p>
              <CommunityStats />
            </div>

            <div className="lg:col-span-2">
              <InlineRegistrationForm onLoginClick={onLoginClick} />
            </div>
          </div>

          <div className="mt-16">
            <AppScreenshot variant="browser" blur={true} className="border-gray-800" />
          </div>
        </div>
      </div>
    )
  }

  // Gradient Modern
  if (theme === 'gradient-modern') {
    return (
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 min-h-screen">
        <Header onLoginClick={onLoginClick} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center space-y-8 mb-16">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Møtested for det samiske folket
              </span>
            </h1>
            <p className="text-xl text-gray-700 leading-relaxed max-w-3xl mx-auto">
              Koble sammen samer på tvers av landegrenser. Del kultur, følg steder, bevar tradisjoner.
            </p>
            <CommunityStats />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Glassmorphic card with registration */}
            <div className="backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-8 shadow-2xl">
              <InlineRegistrationForm onLoginClick={onLoginClick} />
            </div>

            {/* App screenshot */}
            <div className="backdrop-blur-xl bg-white/50 border border-white/20 rounded-3xl p-4 shadow-2xl">
              <AppScreenshot variant="full" blur={true} className="rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Screenshot First
  if (theme === 'screenshot-first') {
    return (
      <div className="bg-gray-50">
        <Header onLoginClick={onLoginClick} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="text-center space-y-6 mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900">
              Møtested for det samiske folket
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Se hvordan appen fungerer - ekte innhold fra fellesskapet
            </p>
            <CommunityStats />
          </div>

          {/* Large screenshot */}
          <div className="mb-12">
            <AppScreenshot variant="browser" blur={true} />
          </div>

          {/* Registration below screenshot */}
          <div className="max-w-md mx-auto">
            <InlineRegistrationForm onLoginClick={onLoginClick} />
          </div>
        </div>
      </div>
    )
  }

  // Split Screen
  if (theme === 'split-screen') {
    return (
      <div className="bg-white min-h-screen">
        <Header onLoginClick={onLoginClick} />
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-4rem)]">
          {/* Left side - Content & Registration */}
          <div className="flex items-center justify-center px-8 py-16 lg:py-0">
            <div className="max-w-lg space-y-8">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                  Møtested for det samiske folket
                </h1>
                <p className="text-lg text-gray-600">
                  Sosial plattform som samler det samiske fellesskapet
                </p>
                <CommunityStats />
              </div>
              <InlineRegistrationForm onLoginClick={onLoginClick} />
            </div>
          </div>

          {/* Right side - Screenshot */}
          <div className="bg-gray-50 flex items-center justify-center p-8">
            <AppScreenshot variant="browser" blur={true} className="max-w-2xl" />
          </div>
        </div>
      </div>
    )
  }

  // Browser Mockup (3D style)
  if (theme === 'browser-mockup') {
    return (
      <div className="bg-gradient-to-b from-gray-100 to-white">
        <Header onLoginClick={onLoginClick} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-2 space-y-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Møtested for det samiske folket
              </h1>
              <p className="text-lg text-gray-600">
                Se appen i aksjon. Ekte fellesskap, ekte innhold.
              </p>
              <CommunityStats />
              <InlineRegistrationForm onLoginClick={onLoginClick} />
            </div>

            <div className="lg:col-span-3">
              {/* 3D tilted browser mockup */}
              <div className="transform perspective-1000 rotate-y-12">
                <AppScreenshot variant="browser" blur={true} className="shadow-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Feature Grid
  if (theme === 'feature-grid') {
    const features = [
      { icon: Users, title: 'Fellesskap', desc: 'Koble sammen samer på tvers av grenser' },
      { icon: BookOpen, title: 'Kultur', desc: 'Bevar samisk kultur og språk' },
      { icon: MapPin, title: 'Steder', desc: 'Følg viktige steder i Sápmi' },
      { icon: TrendingUp, title: 'Aktivitet', desc: 'Levende fellesskap hver dag' },
    ]

    return (
      <div className="bg-white">
        <Header onLoginClick={onLoginClick} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-6 mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
              Møtested for det samiske folket
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Alt du trenger for å koble sammen med det samiske fellesskapet
            </p>
            <CommunityStats />
          </div>

          {/* Feature grid with screenshots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.desc}</p>
                    </div>
                  </div>
                  <div className="rounded-lg overflow-hidden">
                    <AppScreenshot variant="default" blur={true} className="h-48" />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Registration */}
          <div className="max-w-md mx-auto">
            <InlineRegistrationForm onLoginClick={onLoginClick} />
          </div>
        </div>
      </div>
    )
  }

  // Social Proof Heavy
  if (theme === 'social-proof') {
    return (
      <div className="bg-white">
        <Header onLoginClick={onLoginClick} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              <div className="flex items-center gap-2 text-yellow-500 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-6 h-6 fill-current" />
                ))}
                <span className="text-gray-600 ml-2">Fra fellesskapet</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Møtested for det samiske folket
              </h1>

              <CommunityStats />

              {/* Trust indicators */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Aktivt fellesskap hver dag</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Trygg og moderert plattform</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Bevaring av samisk kultur</span>
                </div>
              </div>

              {/* Testimonial */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <p className="text-gray-700 mb-4 italic">
                  &ldquo;Endelig et sted hvor jeg kan koble sammen med andre samer og følge med på hva som skjer i Sápmi&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Aktiv bruker</p>
                    <p className="text-sm text-gray-600">Medlem siden 2024</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <AppScreenshot variant="browser" blur={true} />
              <InlineRegistrationForm onLoginClick={onLoginClick} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Glassmorphism
  if (theme === 'glassmorphism') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <Header dark onLoginClick={onLoginClick} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-8 mb-16">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-lg">
              Møtested for det samiske folket
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto drop-shadow">
              En moderne digital møteplass for det samiske fellesskapet
            </p>
            <div className="inline-block">
              <CommunityStats />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Glass card with registration */}
            <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
              <InlineRegistrationForm onLoginClick={onLoginClick} />
            </div>

            {/* Glass card with screenshot */}
            <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-4 shadow-2xl">
              <AppScreenshot variant="full" blur={true} className="rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Bento Box
  if (theme === 'bento-box') {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header onLoginClick={onLoginClick} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-6 mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
              Møtested for det samiske folket
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Moderne sosial plattform for det samiske fellesskapet
            </p>
            <CommunityStats />
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Large screenshot */}
            <div className="md:col-span-2 md:row-span-2 bg-white rounded-2xl p-4 shadow-lg">
              <AppScreenshot variant="full" blur={true} className="h-full" />
            </div>

            {/* Feature cards */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg flex flex-col justify-between">
              <Users className="w-12 h-12 mb-4" />
              <div>
                <h3 className="text-2xl font-bold mb-2">Fellesskap</h3>
                <p className="text-blue-100">Koble sammen på tvers av grenser</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg flex flex-col justify-between">
              <BookOpen className="w-12 h-12 mb-4" />
              <div>
                <h3 className="text-2xl font-bold mb-2">Kultur</h3>
                <p className="text-purple-100">Bevar tradisjoner og språk</p>
              </div>
            </div>

            {/* Registration card */}
            <div className="md:col-span-1 bg-white rounded-2xl p-6 shadow-lg">
              <InlineRegistrationForm onLoginClick={onLoginClick} />
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg flex flex-col justify-between">
              <MapPin className="w-12 h-12 mb-4" />
              <div>
                <h3 className="text-2xl font-bold mb-2">Steder</h3>
                <p className="text-green-100">Følg viktige steder i Sápmi</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fallback - return minimal clean
  return null
}
