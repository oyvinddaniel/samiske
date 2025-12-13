import { notFound } from 'next/navigation'
import { Map } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { GeographyCard, GeographyBreadcrumb } from '@/components/geography'
import { Feed } from '@/components/feed/Feed'
import type { GeographyBreadcrumb as BreadcrumbType, Country } from '@/lib/types/geography'

interface LanguageAreaPageProps {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: LanguageAreaPageProps) {
  const { code } = await params
  const supabase = await createClient()

  const { data: area } = await supabase
    .from('language_areas')
    .select('name')
    .eq('code', code)
    .single()

  if (!area) {
    return { title: 'Ikke funnet | samiske.no' }
  }

  return {
    title: `${area.name} | samiske.no`,
    description: `Utforsk ${area.name} sprakområde`,
  }
}

export default async function LanguageAreaPage({ params }: LanguageAreaPageProps) {
  const { code } = await params
  const supabase = await createClient()

  // Fetch language area
  const { data: area } = await supabase
    .from('language_areas')
    .select('*')
    .eq('code', code)
    .single()

  if (!area) {
    notFound()
  }

  // Fetch region
  const { data: region } = await supabase
    .from('regions')
    .select('id, name')
    .single()

  // Fetch countries this language area spans
  const { data: countryLinks } = await supabase
    .from('language_area_countries')
    .select(`
      country:countries(*)
    `)
    .eq('language_area_id', area.id)

  const countries = countryLinks
    ?.map(link => link.country as unknown as Country | null)
    .filter((c): c is Country => c !== null)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

  // Fetch municipalities in this language area
  const { data: municipalities } = await supabase
    .from('municipalities')
    .select(`
      *,
      country:countries(code, name)
    `)
    .eq('language_area_id', area.id)
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
      type: 'language_area',
      id: area.id,
      name: area.name,
      code: area.code,
      href: `/sapmi/sprak/${area.code}`
    }
  ]

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-8">
        <GeographyBreadcrumb breadcrumbs={breadcrumbs} className="mb-4" />

        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Map className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{area.name}</h1>
            {area.name_sami && (
              <p className="text-lg text-muted-foreground italic">{area.name_sami}</p>
            )}
          </div>
        </div>

        {area.description && (
          <p className="text-muted-foreground">{area.description}</p>
        )}

        {/* Countries this area spans */}
        {countries && countries.length > 1 && (
          <p className="text-sm text-muted-foreground mt-2">
            Strekker seg over: {countries.map(c => c.name).join(', ')}
          </p>
        )}
      </div>

      {/* Municipalities */}
      {municipalities && municipalities.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Kommuner i {area.name}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {municipalities.map((municipality) => (
              <GeographyCard
                key={municipality.id}
                type="municipality"
                id={municipality.id}
                name={municipality.name}
                nameSami={municipality.name_sami}
                description={municipality.country?.name}
                href={`/sapmi/${municipality.country?.code?.toLowerCase()}/${municipality.slug}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state for municipalities */}
      {(!municipalities || municipalities.length === 0) && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Ingen kommuner registrert i dette sprakområdet enna.</p>
        </div>
      )}

      {/* Posts section with geographic bubbling */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Innlegg fra {area.name}</h2>
        <Feed geography={{ type: 'language_area', id: area.id }} />
      </section>
    </div>
  )
}
