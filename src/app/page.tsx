import { HomeFeedTabs } from '@/components/feed/HomeFeedTabs'
import { HomeLayout } from '@/components/layout/HomeLayout'
import { LandingPage } from '@/components/landing/LandingPage'
import { createClient } from '@/lib/supabase/server'

interface HomePageProps {
  searchParams: Promise<{ kategori?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  // Check auth status
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Show landing page for unauthenticated users
  if (!user) {
    return <LandingPage />
  }

  // Existing experience for authenticated users
  const params = await searchParams
  const categorySlug = params.kategori || ''

  return (
    <HomeLayout currentCategory={categorySlug}>
      <HomeFeedTabs categorySlug={categorySlug} />
    </HomeLayout>
  )
}
