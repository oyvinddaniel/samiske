import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PostDetailPageClient } from './PostDetailPageClient'

interface PostPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      content,
      image_url,
      created_at,
      user:profiles!posts_user_id_fkey (
        full_name,
        avatar_url
      ),
      images:post_images (
        url,
        thumbnail_url
      )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!post) {
    return {
      title: 'Innlegg ikke funnet | samiske.no',
      description: 'Dette innlegget finnes ikke eller er slettet.'
    }
  }

  const description = post.content.substring(0, 160) + (post.content.length > 160 ? '...' : '')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://samiske.no'
  const postUrl = `${siteUrl}/innlegg/${id}`

  // Get first image
  const firstImage = post.images?.[0]?.url || post.image_url
  const imageUrl = firstImage || `${siteUrl}/og-default.png`

  const authorName = (post.user as any)?.full_name || 'Anonym'

  return {
    title: `${post.title} | samiske.no`,
    description: description,
    keywords: ['samisk', 'innlegg', 'fellesskap', 'samiske.no'],

    openGraph: {
      title: post.title,
      description: description,
      url: postUrl,
      type: 'article',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        }
      ],
      siteName: 'samiske.no',
      locale: 'nb_NO',
      publishedTime: post.created_at,
    },

    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: description,
      images: [imageUrl],
      site: '@samiske_no',
    },

    alternates: {
      canonical: postUrl,
    }
  }
}

export default async function PostDetailPage({ params }: PostPageProps) {
  const { id } = await params
  return <PostDetailPageClient postId={id} />
}
