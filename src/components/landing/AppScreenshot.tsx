'use client'

import { Feed } from '@/components/feed/Feed'
import { cn } from '@/lib/utils'

interface AppScreenshotProps {
  variant?: 'default' | 'browser' | 'phone' | 'full'
  blur?: boolean
  className?: string
}

export function AppScreenshot({ variant = 'default', blur = true, className }: AppScreenshotProps) {
  if (variant === 'browser') {
    return (
      <div className={cn('relative', className)}>
        {/* Browser mockup */}
        <div className="rounded-xl shadow-2xl overflow-hidden border border-gray-200 bg-white">
          {/* Browser chrome */}
          <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 ml-4">
              <div className="bg-white rounded-md px-3 py-1 text-xs text-gray-500 border border-gray-200">
                samiske.no
              </div>
            </div>
          </div>

          {/* Browser content */}
          <div className={cn('relative h-[500px] overflow-hidden', blur && 'blur-sm')}>
            <div className="scale-90 origin-top">
              <Feed />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'phone') {
    return (
      <div className={cn('relative mx-auto', className)} style={{ maxWidth: '375px' }}>
        {/* Phone mockup */}
        <div className="relative rounded-[3rem] shadow-2xl overflow-hidden border-8 border-gray-900 bg-gray-900">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-gray-900 rounded-b-3xl z-10" />

          {/* Phone content */}
          <div className={cn('relative h-[700px] overflow-hidden bg-white', blur && 'blur-sm')}>
            <div className="scale-75 origin-top">
              <Feed />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'full') {
    return (
      <div className={cn('relative rounded-2xl overflow-hidden shadow-xl border border-gray-200', className)}>
        <div className={cn('relative min-h-[600px]', blur && 'blur-sm')}>
          <Feed />
        </div>
      </div>
    )
  }

  // Default variant - simple with optional blur
  return (
    <div className={cn('relative rounded-xl overflow-hidden shadow-lg', className)}>
      <div className={cn('relative min-h-[400px]', blur && 'blur-[2px]')}>
        <Feed />
      </div>
    </div>
  )
}
