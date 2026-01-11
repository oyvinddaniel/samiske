'use client'

import { HomeLayout } from '@/components/layout/HomeLayout'
import { PostDetailPanel } from '@/components/posts/PostDetailPanel'

interface PostDetailPageClientProps {
  postId: string
}

export function PostDetailPageClient({ postId }: PostDetailPageClientProps) {
  return (
    <HomeLayout>
      <PostDetailPanel postId={postId} onClose={() => {}} />
    </HomeLayout>
  )
}
