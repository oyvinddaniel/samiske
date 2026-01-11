'use client'

import { Suspense } from 'react'
import { HomeLayout } from '@/components/layout/HomeLayout'
import { BookmarksPanel } from '@/components/bookmarks/BookmarksPanel'

export default function BookmarksPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">Laster...</div>
      </div>
    }>
      <HomeLayout>
        <BookmarksPanel onClose={() => {}} />
      </HomeLayout>
    </Suspense>
  )
}
