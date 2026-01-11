'use client'

import { Suspense } from 'react'
import { HomeLayout } from '@/components/layout/HomeLayout'
import { CalendarView } from '@/components/calendar/CalendarView'

function CalendarContent() {
  return (
    <HomeLayout>
      <div className="w-full max-w-full">
        <CalendarView
          showFilter={true}
          hideBackButton={true}
        />
      </div>
    </HomeLayout>
  )
}

export default function CalendarPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    }>
      <CalendarContent />
    </Suspense>
  )
}
