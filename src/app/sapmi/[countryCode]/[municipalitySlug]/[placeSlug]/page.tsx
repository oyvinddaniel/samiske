import { notFound } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { GeographyBreadcrumb, StarPlaceButton } from '@/components/geography'
import { Feed } from '@/components/feed/Feed'
import type { GeographyBreadcrumb as BreadcrumbType } from '@/lib/types/geography'

interface PlacePageProps {
  params: Promise<{ countryCode: string; municipalitySlug: string; placeSlug: string }>
}

export async function generateMetadata({ params }: PlacePageProps) {
  const { placeSlug } = await params
  const supabase = await createClient()

  const { data: place } = await supabase
    .from('places')
    .select('name')
    .eq('slug', placeSlug)
    .single()

  if (!place) {
    return { title: 'Ikke funnet | samiske.no' }
  }

  return {
    title: `${place.name} | samiske.no`,
    description: `Utforsk ${place.name}`,
  }
}

export default async function PlacePage({ params }: PlacePageProps) {
  const { countryCode, municipalitySlug, placeSlug } = await params
  const supabase = await createClient()

  // Fetch place with municipality and country
  const { data: place } = await supabase
    .from('places')
    .select(`
      *,
      municipality:municipalities(
        *,
        country:countries(*),
        language_area:language_areas(*)
      )
    `)
    .eq('slug', placeSlug)
    .single()

  if (!place) {
    notFound()
  }

  const municipality = place.municipality
  const country = municipality?.country

  // Verify URL matches
  if (
    country?.code?.toUpperCase() !== countryCode.toUpperCase() ||
    municipality?.slug !== municipalitySlug
  ) {
    notFound()
  }

  // Fetch region
  const { data: region } = await supabase
    .from('regions')
    .select('id, name')
    .single()

  // Get current user for starring
  const { data: { user } } = await supabase.auth.getUser()

  // Build breadcrumbs
  const breadcrumbs: BreadcrumbType[] = [
    {
      type: 'region',
      id: region?.id || '',
      name: 'Sapmi',
      href: '/sapmi'
    },
    {
      type: 'country',
      id: country?.id || '',
      name: country?.name || '',
      code: country?.code,
      href: `/sapmi/${country?.code?.toLowerCase()}`
    },
    {
      type: 'municipality',
      id: municipality?.id || '',
      name: municipality?.name || '',
      slug: municipality?.slug,
      href: `/sapmi/${country?.code?.toLowerCase()}/${municipality?.slug}`
    },
    {
      type: 'place',
      id: place.id,
      name: place.name,
      slug: place.slug,
      href: `/sapmi/${country?.code?.toLowerCase()}/${municipality?.slug}/${place.slug}`
    }
  ]

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-8">
        <GeographyBreadcrumb breadcrumbs={breadcrumbs} className="mb-4" />

        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <MapPin className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{place.name}</h1>
              {place.name_sami && (
                <p className="text-lg text-muted-foreground italic">{place.name_sami}</p>
              )}
            </div>
          </div>

          <StarPlaceButton
            userId={user?.id || null}
            locationId={place.id}
            locationType="place"
            locationName={place.name}
          />
        </div>

        {place.description && (
          <p className="text-muted-foreground">{place.description}</p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
          <span>Kommune: {municipality?.name}</span>
          {municipality?.language_area && (
            <span>Sprakområde: {municipality.language_area.name}</span>
          )}
        </div>
      </div>

      {/* Posts section with geographic filtering - only posts from this place */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Innlegg fra {place.name}</h2>
        <Feed geography={{ type: 'place', id: place.id }} />
      </section>
    </div>
  )
}
