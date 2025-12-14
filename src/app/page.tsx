import { HomeFeedTabs } from '@/components/feed/HomeFeedTabs'
import { HomeLayout } from '@/components/layout/HomeLayout'

interface HomePageProps {
  searchParams: Promise<{ kategori?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  const categorySlug = params.kategori || ''

  return (
    <HomeLayout currentCategory={categorySlug}>
      <HomeFeedTabs categorySlug={categorySlug} />
    </HomeLayout>
  )
}
