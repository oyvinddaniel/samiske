'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { CommunityStats } from './CommunityStats'
import { InlineRegistrationForm } from './InlineRegistrationForm'
import { Users, BookOpen, MapPin, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type FullWidthVariant =
  | 'dark-overlay'
  | 'light-overlay'
  | 'gradient-overlay'
  | 'centered-content'
  | 'minimal-overlay'
  | 'side-content'
  | 'bottom-content'
  | 'card-stack'
  | 'asymmetric'
  | 'hero-focus'

interface FullWidthVariantsProps {
  variant: FullWidthVariant
  onLoginClick: () => void
}

// Active users indicator component
function ActiveUsersIndicator() {
  const [activeCount, setActiveCount] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchActiveUsers = async () => {
      // Get users active in the last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen_at', twentyFourHoursAgo)

      if (error) {
        console.error('Error fetching active users:', error)
        setActiveCount(0)
      } else {
        console.log('Active users in last 24h:', count)
        setActiveCount(count || 0)
      }
    }

    fetchActiveUsers()
    // Refresh every 5 minutes
    const interval = setInterval(fetchActiveUsers, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [supabase])

  // Don't show if loading or if count is 0
  if (activeCount === null || activeCount === 0) {
    return null
  }

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 backdrop-blur-md border border-blue-400/30 rounded-full text-sm text-white mb-4">
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
      <span>{activeCount} {activeCount === 1 ? 'aktiv bruker' : 'aktive brukere'} siste døgn</span>
    </div>
  )
}

// Shared header component - moved outside to avoid "Cannot create components during render"
function Header({ dark = true, onLoginClick }: { dark?: boolean; onLoginClick: () => void }) {
  return (
    <header className={`relative z-20 border-b ${dark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white/80'} backdrop-blur-md`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg overflow-hidden shadow-sm ${dark ? 'ring-2 ring-white/20' : 'ring-2 ring-gray-200'}`}>
            <Image src="/images/sami.jpg" alt="Samisk flagg" width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <span className={`font-bold text-lg ${dark ? 'text-white' : 'text-gray-900'}`}>samiske.no</span>
        </div>
        <Button
          onClick={onLoginClick}
          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/30 border-0"
        >
          Logg inn
        </Button>
      </div>
    </header>
  )
}

export function FullWidthVariants({ variant, onLoginClick }: FullWidthVariantsProps) {

  // Variant 1: Dark Overlay (original)
  if (variant === 'dark-overlay') {
    return (
      <div className="relative min-h-screen">
        <div className="absolute inset-0 z-0">
          <Image src="/images/app-screenshot.jpg" alt="samiske.no app" fill className="object-cover blur-sm" priority quality={90} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        </div>

        <Header dark onLoginClick={onLoginClick} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm text-white/90 mb-4">
                  ✨ Sosial plattform for det samiske folket
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-2xl">
                  Møtested for det samiske folket
                </h1>
                <p className="text-xl text-white/90 leading-relaxed drop-shadow-lg">
                  Koble sammen samer på tvers av landegrenser. Del kultur, følg steder, og bevar tradisjoner.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                <CommunityStats />
              </div>
            </div>
            <div className="lg:ml-auto max-w-md w-full">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-1">
                <InlineRegistrationForm onLoginClick={onLoginClick} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Variant 2: Light Overlay
  if (variant === 'light-overlay') {
    return (
      <div className="relative min-h-screen">
        <div className="absolute inset-0 z-0">
          <Image src="/images/app-screenshot.jpg" alt="samiske.no app" fill className="object-cover blur-sm" priority quality={90} />
          <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/70 to-white/90" />
        </div>

        <Header dark={false} onLoginClick={onLoginClick} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-block px-4 py-2 bg-blue-100/80 backdrop-blur-md border border-blue-200 rounded-full text-sm text-blue-900 mb-4">
                  ✨ Sosial plattform for det samiske folket
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                  Møtested for det samiske folket
                </h1>
                <p className="text-xl text-gray-700 leading-relaxed">
                  Koble sammen samer på tvers av landegrenser. Del kultur, følg steder, og bevar tradisjoner.
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl p-6 shadow-lg">
                <CommunityStats />
              </div>
            </div>
            <div className="lg:ml-auto max-w-md w-full">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 p-1">
                <InlineRegistrationForm onLoginClick={onLoginClick} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Variant 3: Gradient Overlay
  if (variant === 'gradient-overlay') {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image src="/images/app-screenshot.jpg" alt="samiske.no app" fill className="object-cover blur-sm" priority quality={90} />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(179, 48, 225, 0.85) 0%, rgba(0, 97, 255, 0.85) 100%)' }}
          />
        </div>

        <Header dark onLoginClick={onLoginClick} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-2xl">
                  Møtested for det samiske
                </h1>
                <p className="text-xl text-white/95 leading-relaxed drop-shadow-lg">
                  Nå kan vi selv bestemme. Møt andre samiske. Og finn samiske tilbydere. Fordelt på byer, steder og grupper.
                </p>
              </div>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-2">
                <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-full shadow-lg shadow-blue-500/30 text-sm font-medium flex items-center gap-2 hover:shadow-xl hover:shadow-blue-500/40 transition-shadow">
                  <TrendingUp className="w-4 h-4" />
                  <span>Live aktivitet</span>
                </div>
                <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-full shadow-lg shadow-blue-500/30 text-sm font-medium flex items-center gap-2 hover:shadow-xl hover:shadow-blue-500/40 transition-shadow">
                  <MapPin className="w-4 h-4" />
                  <span>150+ steder</span>
                </div>
                <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-full shadow-lg shadow-blue-500/30 text-sm font-medium flex items-center gap-2 hover:shadow-xl hover:shadow-blue-500/40 transition-shadow">
                  <Users className="w-4 h-4" />
                  <span>Samisk fellesskap</span>
                </div>
              </div>

              <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-6">
                <CommunityStats />
              </div>
            </div>
            <div className="lg:ml-auto max-w-md w-full">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-1">
                <InlineRegistrationForm onLoginClick={onLoginClick} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Variant 4: Centered Content
  if (variant === 'centered-content') {
    return (
      <div className="relative min-h-screen">
        <div className="absolute inset-0 z-0">
          <Image src="/images/app-screenshot.jpg" alt="samiske.no app" fill className="object-cover blur-md" priority quality={90} />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <Header dark onLoginClick={onLoginClick} />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center space-y-12">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-2xl">
                Møtested for det samiske folket
              </h1>
              <p className="text-xl text-white/90 leading-relaxed drop-shadow-lg max-w-2xl mx-auto">
                Koble sammen samer på tvers av landegrenser. Del kultur, følg steder, og bevar tradisjoner.
              </p>
            </div>

            <div className="inline-block bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <CommunityStats />
            </div>

            <div className="max-w-md mx-auto">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-1">
                <InlineRegistrationForm onLoginClick={onLoginClick} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Variant 5: Minimal Overlay
  if (variant === 'minimal-overlay') {
    return (
      <div className="relative min-h-screen">
        <div className="absolute inset-0 z-0">
          <Image src="/images/app-screenshot.jpg" alt="samiske.no app" fill className="object-cover blur-[2px]" priority quality={90} />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <Header dark onLoginClick={onLoginClick} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight drop-shadow-2xl">
                Møtested for det samiske folket
              </h1>
              <div className="inline-block bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                <CommunityStats />
              </div>
            </div>
            <div className="lg:ml-auto max-w-md w-full">
              <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-1">
                <InlineRegistrationForm onLoginClick={onLoginClick} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Variant 6: Side Content (all on one side)
  if (variant === 'side-content') {
    return (
      <div className="relative min-h-screen">
        <div className="absolute inset-0 z-0">
          <Image src="/images/app-screenshot.jpg" alt="samiske.no app" fill className="object-cover blur-sm" priority quality={90} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
        </div>

        <Header dark onLoginClick={onLoginClick} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-xl space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight drop-shadow-2xl">
                Møtested for det samiske folket
              </h1>
              <p className="text-xl text-white/90 leading-relaxed drop-shadow-lg">
                Koble sammen samer på tvers av landegrenser. Del kultur, følg steder, og bevar tradisjoner.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <CommunityStats />
            </div>

            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-1">
              <InlineRegistrationForm onLoginClick={onLoginClick} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Variant 7: Bottom Content
  if (variant === 'bottom-content') {
    return (
      <div className="relative min-h-screen flex flex-col">
        <div className="absolute inset-0 z-0">
          <Image src="/images/app-screenshot.jpg" alt="samiske.no app" fill className="object-cover object-top blur-sm" priority quality={90} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90" />
        </div>

        <Header dark onLoginClick={onLoginClick} />

        <div className="flex-1" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight drop-shadow-2xl">
                Møtested for det samiske folket
              </h1>
              <p className="text-xl text-white/90 leading-relaxed drop-shadow-lg">
                Koble sammen samer på tvers av landegrenser.
              </p>
              <div className="inline-block bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                <CommunityStats />
              </div>
            </div>
            <div>
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-1">
                <InlineRegistrationForm onLoginClick={onLoginClick} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Variant 8: Card Stack
  if (variant === 'card-stack') {
    return (
      <div className="relative min-h-screen">
        <div className="absolute inset-0 z-0">
          <Image src="/images/app-screenshot.jpg" alt="samiske.no app" fill className="object-cover blur-sm" priority quality={90} />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <Header dark onLoginClick={onLoginClick} />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="space-y-6">
            {/* Top card - Hero */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
                Møtested for det samiske folket
              </h1>
              <p className="text-lg text-white/90 leading-relaxed">
                Koble sammen samer på tvers av landegrenser. Del kultur, følg steder, og bevar tradisjoner.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Stats card */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl">
                <CommunityStats />
              </div>

              {/* Registration card */}
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-1">
                <InlineRegistrationForm onLoginClick={onLoginClick} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Variant 9: Asymmetric
  if (variant === 'asymmetric') {
    return (
      <div className="relative min-h-screen">
        <div className="absolute inset-0 z-0">
          <Image src="/images/app-screenshot.jpg" alt="samiske.no app" fill className="object-cover blur-sm" priority quality={90} />
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/80 via-purple-900/60 to-transparent" />
        </div>

        <Header dark onLoginClick={onLoginClick} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="space-y-6 max-w-2xl">
                <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm text-white/90">
                  ✨ Sosial plattform
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-2xl">
                  Møtested for det samiske folket
                </h1>
                <p className="text-xl text-white/90 leading-relaxed drop-shadow-lg">
                  Koble sammen samer på tvers av landegrenser. Del kultur og bevar tradisjoner sammen.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Users, text: 'Fellesskap' },
                  { icon: BookOpen, text: 'Kultur' },
                  { icon: MapPin, text: 'Steder' },
                  { icon: TrendingUp, text: 'Aktivitet' },
                ].map((item, i) => {
                  const Icon = item.icon
                  return (
                    <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex items-center gap-3">
                      <Icon className="w-6 h-6 text-white" />
                      <span className="text-white font-medium">{item.text}</span>
                    </div>
                  )
                })}
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 inline-block">
                <CommunityStats />
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-1">
                <InlineRegistrationForm onLoginClick={onLoginClick} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Variant 10: Hero Focus (large text, minimal other elements)
  if (variant === 'hero-focus') {
    return (
      <div className="relative min-h-screen flex flex-col">
        <div className="absolute inset-0 z-0">
          <Image src="/images/app-screenshot.jpg" alt="samiske.no app" fill className="object-cover blur-md" priority quality={90} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
        </div>

        <Header dark onLoginClick={onLoginClick} />

        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
            <div className="space-y-8">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-tight drop-shadow-2xl">
                Møtested for det samiske folket
              </h1>
              <p className="text-2xl md:text-3xl text-white/90 leading-relaxed drop-shadow-lg max-w-3xl mx-auto">
                Koble sammen. Del kultur. Bevar tradisjoner.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                <CommunityStats />
              </div>
            </div>

            <div className="max-w-md mx-auto">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-1">
                <InlineRegistrationForm onLoginClick={onLoginClick} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
