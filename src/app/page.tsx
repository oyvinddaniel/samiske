import { Feed } from '@/components/feed/Feed'
import { CalendarView } from '@/components/calendar/CalendarView'
import { HomeLayout } from '@/components/layout/HomeLayout'

interface HomePageProps {
  searchParams: Promise<{ kategori?: string; visning?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  const categorySlug = params.kategori || ''
  const visning = params.visning || ''
  const showCalendar = visning === 'kalender'

  return (
    <HomeLayout currentCategory={showCalendar ? 'kalender' : categorySlug}>
      {/* Category title on mobile */}
      {(categorySlug || showCalendar) && (
        <div className="mb-4 md:hidden">
          <h2 className="text-lg font-semibold text-gray-900 capitalize">
            {showCalendar ? 'Kalender' : categorySlug === 'mote' ? 'Møte' : categorySlug}
          </h2>
        </div>
      )}

      {/* Show Calendar or Feed based on visning parameter */}
      {showCalendar ? (
        <CalendarView />
      ) : (
        <Feed categorySlug={categorySlug} />
      )}
    </HomeLayout>
  )
}
