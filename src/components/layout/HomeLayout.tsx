'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { RightSidebar } from '@/components/layout/RightSidebar'
import { BottomNav } from '@/components/layout/BottomNav'

interface HomeLayoutProps {
  children: React.ReactNode
  currentCategory?: string
}

export function HomeLayout({ children, currentCategory = '' }: HomeLayoutProps) {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  useEffect(() => {
    // Listen for mobile sidebar events
    const handleOpenLeftSidebar = () => setShowMobileSidebar(true)
    const handleCloseLeftSidebar = () => setShowMobileSidebar(false)

    window.addEventListener('open-left-sidebar', handleOpenLeftSidebar)
    window.addEventListener('close-left-sidebar', handleCloseLeftSidebar)

    return () => {
      window.removeEventListener('open-left-sidebar', handleOpenLeftSidebar)
      window.removeEventListener('close-left-sidebar', handleCloseLeftSidebar)
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <Sidebar currentCategory={currentCategory} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header currentCategory={currentCategory} />

        <div className="flex-1 flex gap-6 p-4 md:p-6 pb-20 lg:pb-6">
          {/* Feed/Calendar column */}
          <main className="flex-1 max-w-2xl">
            {children}
          </main>

          {/* Right Sidebar */}
          <RightSidebar />
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  )
}
