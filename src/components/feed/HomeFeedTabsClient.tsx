'use client'

import dynamic from 'next/dynamic'
import { HomeFeedTabsSkeleton } from './HomeFeedTabsSkeleton'

const HomeFeedTabs = dynamic(
  () => import('./HomeFeedTabs').then(mod => ({ default: mod.HomeFeedTabs })),
  {
    ssr: false,
    loading: () => <HomeFeedTabsSkeleton />
  }
)

interface HomeFeedTabsClientProps {
  categorySlug?: string
}

export function HomeFeedTabsClient({ categorySlug }: HomeFeedTabsClientProps) {
  return <HomeFeedTabs categorySlug={categorySlug} />
}
