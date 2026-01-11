import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { HashtagPageContent } from './HashtagPageContent'

interface Props {
  params: Promise<{ tag: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag)

  return {
    title: `#${decodedTag} | samiske.no`,
    description: `Se innlegg med hashtag #${decodedTag} på samiske.no`,
    openGraph: {
      title: `#${decodedTag} | samiske.no`,
      description: `Se innlegg med hashtag #${decodedTag} på samiske.no`,
    },
  }
}

export default async function HashtagPage({ params }: Props) {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag).toLowerCase()

  const supabase = await createClient()

  // Hent hashtag info
  const { data: hashtag } = await supabase
    .from('hashtags')
    .select('id, tag, display_tag, post_count, is_blocked')
    .eq('tag', decodedTag)
    .single()

  // Hvis hashtag er blokkert eller ikke finnes, vis 404
  if (!hashtag || hashtag.is_blocked) {
    notFound()
  }

  // Hent innlegg-IDer for denne hashtag
  const { data: postIds } = await supabase.rpc('get_posts_by_hashtag', {
    p_tag: decodedTag,
    p_limit: 50,
    p_offset: 0,
  })

  return (
    <HashtagPageContent
      hashtag={{
        id: hashtag.id,
        tag: hashtag.tag,
        displayTag: hashtag.display_tag,
        postCount: hashtag.post_count,
      }}
      initialPostIds={(postIds || []).map((p: { post_id: string }) => p.post_id)}
    />
  )
}
