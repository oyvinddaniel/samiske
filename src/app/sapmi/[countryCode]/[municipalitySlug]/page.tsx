import { notFound } from 'next/navigation'
import { Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { GeographyCard, GeographyBreadcrumb, StarPlaceButton } from '@/components/geography'
import { Feed } from '@/components/feed/Feed'
import type { GeographyBreadcrumb as BreadcrumbType } from '@/lib/types/geography'

interface MunicipalityPageProps {
  params: Promise<{ countryCode: string; municipalitySlug: string }>
}

export async function generateMetadata({ params }: MunicipalityPageProps) {
  const { countryCode, municipalitySlug } = await params
  const supabase = await createClient()

  const { data: municipality } = await supabase
    .from('municipalities')
    .select(`
      name,
      country:countries!inner(code)
    `)
    .eq('slug', municipalitySlug)
    .eq('countries.code', countryCode.toUpperCase())
    .single()

  if (!municipality) {
    return { title: 'Ikke funnet | samiske.no' }
  }

  return {
    title: `${municipality.name} | samiske.no`,
    description: `Utforsk det samiske miljoet i ${municipality.name}`,
  }
}

export default async function MunicipalityPage({ params }: MunicipalityPageProps) {
  const { countryCode, municipalitySlug } = await params
  const supabase = await createClient()

  // Fetch municipality with country
  const { data: municipality } = await supabase
    .from('municipalities')
    .select(`
      *,
      country:countries(*),
      language_area:language_areas(*)
    `)
    .eq('slug', municipalitySlug)
    .single()

  if (!municipality || municipality.country?.code?.toUpperCase() !== countryCode.toUpperCase()) {
    notFound()
  }

  // Fetch region
  const { data: region } = await supabase
    .from('regions')
    .select('id, name')
    .single()

  // Fetch places in this municipality
  const { data: places } = await supabase
    .from('places')
    .select('*')
    .eq('municipality_id', municipality.id)
    .order('name')

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
      id: municipality.country?.id || '',
      name: municipality.country?.name || '',
      code: municipality.country?.code,
      href: `/sapmi/${municipality.country?.code?.toLowerCase()}`
    },
    {
      type: 'municipality',
      id: municipality.id,
      name: municipality.name,
      slug: municipality.slug,
      href: `/sapmi/${municipality.country?.code?.toLowerCase()}/${municipality.slug}`
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
              <Building2 className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{municipality.name}</h1>
              {municipality.name_sami && (
                <p className="text-lg text-muted-foreground italic">{municipality.name_sami}</p>
              )}
            </div>
          </div>

          <StarPlaceButton
            userId={user?.id || null}
            locationId={municipality.id}
            locationType="municipality"
            locationName={municipality.name}
          />
        </div>

        {municipality.description && (
          <p className="text-muted-foreground">{municipality.description}</p>
        )}

        {/* Language area info */}
        {municipality.language_area && (
          <p className="text-sm text-muted-foreground mt-2">
            Sprakområde: {municipality.language_area.name}
          </p>
        )}
      </div>

      {/* Places */}
      {places && places.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Steder i {municipality.name}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {places.map((place) => (
              <GeographyCard
                key={place.id}
                type="place"
                id={place.id}
                name={place.name}
                nameSami={place.name_sami}
                description={place.description}
                href={`/sapmi/${municipality.country?.code?.toLowerCase()}/${municipality.slug}/${place.slug}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Posts section with geographic bubbling */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Innlegg fra {municipality.name}</h2>
        <Feed geography={{ type: 'municipality', id: municipality.id }} />
      </section>
    </div>
  )
}
