import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Feed } from '@/components/feed/Feed'
import { RightSidebar } from '@/components/layout/RightSidebar'
import { BottomNav } from '@/components/layout/BottomNav'

interface HomePageProps {
  searchParams: Promise<{ kategori?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  const categorySlug = params.kategori || ''

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <Sidebar currentCategory={categorySlug} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header currentCategory={categorySlug} />

        <div className="flex-1 flex gap-6 p-4 md:p-6 pb-20 lg:pb-6">
          {/* Feed column */}
          <main className="flex-1 max-w-2xl">
            {/* Category title on mobile */}
            {categorySlug && (
              <div className="mb-4 md:hidden">
                <h2 className="text-lg font-semibold text-gray-900 capitalize">
                  {categorySlug === 'mote' ? 'Møte' : categorySlug}
                </h2>
              </div>
            )}

            {/* Feed */}
            <Feed categorySlug={categorySlug} />
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
