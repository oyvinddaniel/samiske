'use client'

import { useState, useEffect, ReactNode } from 'react'
import { Monitor, Smartphone, Tablet, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResponsivePreviewProps {
  children: ReactNode
}

const presets = [
  { name: 'iPhone SE', width: 375, icon: Smartphone },
  { name: 'iPhone 11', width: 414, icon: Smartphone },
  { name: 'iPad Mini', width: 768, icon: Tablet },
  { name: 'iPad Pro', width: 1024, icon: Tablet },
  { name: 'Desktop', width: 1280, icon: Monitor },
]

const breakpoints = [
  { name: 'xs', min: 0, max: 639 },
  { name: 'sm', min: 640, max: 767 },
  { name: 'md', min: 768, max: 1023 },
  { name: 'lg', min: 1024, max: 1279 },
  { name: 'xl', min: 1280, max: Infinity },
]

function getBreakpoint(width: number): string {
  const bp = breakpoints.find(b => width >= b.min && width <= b.max)
  return bp?.name || 'xl'
}

function getBreakpointColor(bp: string): string {
  switch (bp) {
    case 'xs': return 'bg-red-500'
    case 'sm': return 'bg-orange-500'
    case 'md': return 'bg-yellow-500'
    case 'lg': return 'bg-green-500'
    case 'xl': return 'bg-blue-500'
    default: return 'bg-gray-500'
  }
}

export function ResponsivePreview({ children }: ResponsivePreviewProps) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [width, setWidth] = useState(375)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load saved state from localStorage
    const savedEnabled = localStorage.getItem('responsive-preview-enabled')
    const savedWidth = localStorage.getItem('responsive-preview-width')
    const savedCollapsed = localStorage.getItem('responsive-preview-collapsed')

    if (savedEnabled === 'true') setIsEnabled(true)
    if (savedWidth) setWidth(parseInt(savedWidth, 10))
    if (savedCollapsed === 'false') setIsCollapsed(false)
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('responsive-preview-enabled', String(isEnabled))
      localStorage.setItem('responsive-preview-width', String(width))
      localStorage.setItem('responsive-preview-collapsed', String(isCollapsed))
    }
  }, [isEnabled, width, isCollapsed, mounted])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return <>{children}</>
  }

  if (!mounted) {
    return <>{children}</>
  }

  const currentBreakpoint = getBreakpoint(width)

  return (
    <>
      {/* Control Panel */}
      <div
        className={cn(
          'fixed right-0 top-1/2 -translate-y-1/2 z-[99999] transition-transform duration-300',
          isCollapsed ? 'translate-x-[calc(100%-40px)]' : 'translate-x-0'
        )}
      >
        <div className="flex">
          {/* Toggle button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-10 h-20 bg-gray-900 text-white rounded-l-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
            title={isCollapsed ? 'Åpne responsiv forhåndsvisning' : 'Lukk'}
          >
            {isCollapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          {/* Panel */}
          <div className="bg-gray-900 text-white p-4 rounded-l-lg shadow-2xl w-64">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Responsiv Forhåndsvisning</h3>
              <button
                onClick={() => setIsEnabled(false)}
                className={cn(
                  'p-1 rounded transition-colors',
                  isEnabled ? 'text-red-400 hover:text-red-300' : 'text-gray-500'
                )}
                title="Deaktiver"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Enable/Disable toggle */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setIsEnabled(!isEnabled)}
                className={cn(
                  'relative w-12 h-6 rounded-full transition-colors',
                  isEnabled ? 'bg-blue-500' : 'bg-gray-600'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                    isEnabled ? 'translate-x-7' : 'translate-x-1'
                  )}
                />
              </button>
              <span className="text-sm">{isEnabled ? 'Aktiv' : 'Inaktiv'}</span>
            </div>

            {isEnabled && (
              <>
                {/* Current width display */}
                <div className="bg-gray-800 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl font-bold">{width}px</span>
                    <span className={cn(
                      'px-2 py-0.5 rounded text-xs font-semibold uppercase',
                      getBreakpointColor(currentBreakpoint)
                    )}>
                      {currentBreakpoint}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Tailwind breakpoint
                  </div>
                </div>

                {/* Slider */}
                <div className="mb-4">
                  <input
                    type="range"
                    min="320"
                    max="1400"
                    value={width}
                    onChange={(e) => setWidth(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>320px</span>
                    <span>1400px</span>
                  </div>
                </div>

                {/* Presets */}
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 mb-2">Hurtigvalg:</p>
                  {presets.map((preset) => {
                    const Icon = preset.icon
                    const isActive = width === preset.width
                    return (
                      <button
                        key={preset.name}
                        onClick={() => setWidth(preset.width)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors',
                          isActive
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="flex-1 text-left">{preset.name}</span>
                        <span className="text-xs opacity-70">{preset.width}px</span>
                      </button>
                    )
                  })}
                </div>

                {/* Breakpoint legend */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-400 mb-2">Breakpoints:</p>
                  <div className="grid grid-cols-5 gap-1 text-center text-xs">
                    {breakpoints.map((bp) => (
                      <div
                        key={bp.name}
                        className={cn(
                          'py-1 rounded',
                          currentBreakpoint === bp.name
                            ? getBreakpointColor(bp.name) + ' text-white'
                            : 'bg-gray-800 text-gray-500'
                        )}
                      >
                        {bp.name}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content wrapper */}
      {isEnabled ? (
        <div className="min-h-screen bg-gray-200 flex justify-center">
          <div
            className="bg-white shadow-2xl min-h-screen overflow-x-hidden"
            style={{ width: `${width}px`, maxWidth: '100vw' }}
          >
            {children}
          </div>
        </div>
      ) : (
        children
      )}
    </>
  )
}
