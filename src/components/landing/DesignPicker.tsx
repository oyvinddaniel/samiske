'use client'

import { designThemes, DesignTheme } from './design-themes'
import { cn } from '@/lib/utils'
import { Palette } from 'lucide-react'

interface DesignPickerProps {
  currentTheme: DesignTheme
  onThemeChange: (theme: DesignTheme) => void
}

export function DesignPicker({ currentTheme, onThemeChange }: DesignPickerProps) {
  return (
    <div className="border-t border-gray-200 bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-gray-900 mb-2">
            <Palette className="w-5 h-5" />
            <h3 className="text-xl font-bold">Velg Design</h3>
          </div>
          <p className="text-sm text-gray-600">
            Utforsk 10 forskjellige moderne SaaS-design-varianter
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.values(designThemes).map((theme) => (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
              className={cn(
                'group relative rounded-xl p-4 text-left transition-all',
                'border-2 hover:shadow-lg',
                currentTheme === theme.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              {/* Color preview */}
              <div className="flex gap-1 mb-3">
                <div
                  className="w-8 h-8 rounded-lg shadow-sm"
                  style={{ background: theme.colors.primary }}
                />
                <div
                  className="w-8 h-8 rounded-lg shadow-sm"
                  style={{ background: theme.colors.secondary }}
                />
                <div
                  className="w-8 h-8 rounded-lg shadow-sm"
                  style={{ background: theme.colors.accent }}
                />
              </div>

              {/* Theme info */}
              <h4 className={cn(
                'font-semibold mb-1 text-sm',
                currentTheme === theme.id ? 'text-blue-900' : 'text-gray-900'
              )}>
                {theme.name}
              </h4>
              <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                {theme.description}
              </p>

              {/* Features */}
              <div className="flex flex-wrap gap-1">
                {theme.features.slice(0, 2).map((feature, i) => (
                  <span
                    key={i}
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      currentTheme === theme.id
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-gray-100 text-gray-700'
                    )}
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {/* Selected indicator */}
              {currentTheme === theme.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Current theme description */}
        <div className="mt-8 max-w-2xl mx-auto bg-gray-50 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex gap-1">
              <div
                className="w-12 h-12 rounded-lg shadow-md"
                style={{ background: designThemes[currentTheme].colors.primary }}
              />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-1">
                {designThemes[currentTheme].name}
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                {designThemes[currentTheme].description}
              </p>
              <div className="flex flex-wrap gap-2">
                {designThemes[currentTheme].features.map((feature, i) => (
                  <span
                    key={i}
                    className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-800"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          Designene er inspirert av moderne SaaS-trender fra{' '}
          <a href="https://www.landingfolio.com/inspiration/landing-page/saas" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Landingfolio
          </a>,{' '}
          <a href="https://saaspo.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Saaspo
          </a>, og{' '}
          <a href="https://www.lapa.ninja/category/saas/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Lapa Ninja
          </a>
        </div>
      </div>
    </div>
  )
}
