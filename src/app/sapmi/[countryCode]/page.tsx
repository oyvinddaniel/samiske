import { notFound } from 'next/navigation'
import { Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { GeographyCard, GeographyBreadcrumb } from '@/components/geography'
import { Feed } from '@/components/feed/Feed'
import type { GeographyBreadcrumb as BreadcrumbType, LanguageArea } from '@/lib/types/geography'

interface CountryPageProps {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata({ params }: CountryPageProps) {
  const { countryCode } = await params
  const supabase = await createClient()

  const { data: country } = await supabase
    .from('countries')
    .select('name')
    .eq('code', countryCode.toUpperCase())
    .single()

  if (!country) {
    return { title: 'Ikke funnet | samiske.no' }
  }

  return {
    title: `${country.name} | samiske.no`,
    description: `Utforsk det samiske omradet i ${country.name}`,
  }
}

export default async function CountryPage({ params }: CountryPageProps) {
  const { countryCode } = await params
  const supabase = await createClient()

  // Fetch country
  const { data: country } = await supabase
    .from('countries')
    .select('*')
    .eq('code', countryCode.toUpperCase())
    .single()

  if (!country) {
    notFound()
  }

  // Fetch region
  const { data: region } = await supabase
    .from('regions')
    .select('id, name')
    .single()

  // Fetch language areas that include this country
  const { data: languageAreaLinks } = await supabase
    .from('language_area_countries')
    .select(`
      language_area:language_areas(*)
    `)
    .eq('country_id', country.id)

  const languageAreas = languageAreaLinks
    ?.map(link => link.language_area as unknown as LanguageArea | null)
    .filter((area): area is LanguageArea => area !== null)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

  // Fetch municipalities in this country
  const { data: municipalities } = await supabase
    .from('municipalities')
    .select('*')
    .eq('country_id', country.id)
    .order('name')

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
      id: country.id,
      name: country.name,
      code: country.code,
      href: `/sapmi/${country.code.toLowerCase()}`
    }
  ]

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-8">
        <GeographyBreadcrumb breadcrumbs={breadcrumbs} className="mb-4" />

        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Globe className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{country.name}</h1>
            {country.name_sami && (
              <p className="text-lg text-muted-foreground italic">{country.name_sami}</p>
            )}
          </div>
        </div>

        {country.description && (
          <p className="text-muted-foreground">{country.description}</p>
        )}
      </div>

      {/* Language areas in this country */}
      {languageAreas && languageAreas.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Sprakområder</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {languageAreas.map((area) => (
              <GeographyCard
                key={area.id}
                type="language_area"
                id={area.id}
                name={area.name}
                nameSami={area.name_sami}
                description={area.description}
                href={`/sapmi/sprak/${area.code}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Municipalities */}
      {municipalities && municipalities.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Kommuner</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {municipalities.map((municipality) => (
              <GeographyCard
                key={municipality.id}
                type="municipality"
                id={municipality.id}
                name={municipality.name}
                nameSami={municipality.name_sami}
                href={`/sapmi/${country.code.toLowerCase()}/${municipality.slug}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state for geography */}
      {(!municipalities || municipalities.length === 0) && (!languageAreas || languageAreas.length === 0) && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Ingen kommuner eller sprakområder registrert enna.</p>
        </div>
      )}

      {/* Posts section with geographic bubbling */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Innlegg fra {country.name}</h2>
        <Feed geography={{ type: 'country', id: country.id }} />
      </section>
    </div>
  )
}
