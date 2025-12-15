'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { CommunityStats } from './CommunityStats'
import { InlineRegistrationForm } from './InlineRegistrationForm'

interface HeroFullWidthProps {
  onLoginClick: () => void
}

export function HeroFullWidth({ onLoginClick }: HeroFullWidthProps) {
  return (
    <div className="relative min-h-screen">
      {/* Full-width screenshot background with blur */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/app-screenshot.jpg"
          alt="samiske.no app"
          fill
          className="object-cover blur-sm"
          priority
          quality={90}
        />
        {/* Dark overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden shadow-sm ring-2 ring-white/20">
              <Image
                src="/images/sami.jpg"
                alt="Samisk flagg"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold text-lg text-white">samiske.no</span>
          </div>
          <Button
            variant="outline"
            onClick={onLoginClick}
            className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
          >
            Logg inn
          </Button>
        </div>
      </header>

      {/* Main content - overlaid on screenshot */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Hero content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm text-white/90 mb-4">
                ✨ Sosial plattform for det samiske folket
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-2xl">
                Møtested for det samiske folket
              </h1>

              <p className="text-xl text-white/90 leading-relaxed drop-shadow-lg">
                Koble sammen samer på tvers av landegrenser. Del kultur, følg steder,
                og bevar tradisjoner sammen med fellesskapet.
              </p>
            </div>

            {/* Stats */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <CommunityStats />
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-6 text-white/80">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Gratis å bruke</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Trygt og moderert</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Aktivt fellesskap</span>
              </div>
            </div>
          </div>

          {/* Right side - Registration form overlay */}
          <div className="lg:ml-auto max-w-md w-full">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-1">
              <InlineRegistrationForm onLoginClick={onLoginClick} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent z-0" />
    </div>
  )
}
