'use client'

import { formatVersionString } from '@/lib/version'

export function Footer() {
  const versionString = formatVersionString()

  return (
    <footer className="mt-auto py-4 px-4 border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>© 2025 samiske.no</span>
            <a href="/personvern" className="hover:text-gray-700 transition-colors">
              Personvern
            </a>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono">{versionString}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
