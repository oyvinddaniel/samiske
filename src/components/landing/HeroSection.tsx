'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { CommunityStats } from './CommunityStats'
import { InlineRegistrationForm } from './InlineRegistrationForm'

interface HeroSectionProps {
  onLoginClick: () => void
}

export function HeroSection({ onLoginClick }: HeroSectionProps) {
  return (
    <div className="bg-gradient-to-b from-blue-50 to-white">
      {/* Simple header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden shadow-sm">
              <Image
                src="/images/sami.jpg"
                alt="Samisk flagg"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold text-lg text-gray-900">samiske.no</span>
          </div>
          <Button variant="outline" onClick={onLoginClick}>
            Logg inn
          </Button>
        </div>
      </header>

      {/* Hero content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start">
          {/* Left side - Content */}
          <div className="lg:col-span-3 space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Møtested for det samiske folket
              </h1>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl">
                samiske.no er en sosial plattform som samler det samiske folket.
                Del arrangementer, følg med på hva som skjer i viktige steder,
                og bevar kultur og språk sammen med fellesskapet.
              </p>
            </div>

            {/* Community stats */}
            <CommunityStats />

            {/* Image */}
            <div className="rounded-2xl overflow-hidden shadow-xl max-w-lg">
              <Image
                src="/images/sami.jpg"
                alt="Samisk flagg"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
                priority
              />
            </div>
          </div>

          {/* Right side - Registration form */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <InlineRegistrationForm onLoginClick={onLoginClick} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
