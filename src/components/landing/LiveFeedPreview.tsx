'use client'

import { Feed } from '@/components/feed/Feed'

export function LiveFeedPreview() {
  return (
    <div className="bg-gray-50 py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Se hva som skjer
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Få et innblikk i fellesskapet. Bli med for å se alt og delta i samtalen.
          </p>
        </div>

        {/* Reuse existing Feed component - blur overlay triggers automatically for non-logged in users */}
        <div className="max-w-2xl mx-auto">
          <Feed />
        </div>
      </div>
    </div>
  )
}
