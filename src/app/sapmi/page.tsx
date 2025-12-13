import { Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { GeographyCard, GeographyBreadcrumb } from '@/components/geography'
import { Feed } from '@/components/feed/Feed'
import type { GeographyBreadcrumb as BreadcrumbType } from '@/lib/types/geography'

export const metadata = {
  title: 'Sapmi | samiske.no',
  description: 'Utforsk det samiske omradet pa tvers av Norge, Sverige, Finland og Russland',
}

export default async function SapmiPage() {
  const supabase = await createClient()

  // Fetch region and countries
  const { data: region } = await supabase
    .from('regions')
    .select('*')
    .single()

  const { data: countries } = await supabase
    .from('countries')
    .select('*')
    .order('sort_order')

  // Build breadcrumbs
  const breadcrumbs: BreadcrumbType[] = [
    {
      type: 'region',
      id: region?.id || '',
      name: 'Sapmi',
      href: '/sapmi'
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
            <h1 className="text-3xl font-bold">Sapmi</h1>
            {region?.name_sami && (
              <p className="text-lg text-muted-foreground italic">{region.name_sami}</p>
            )}
          </div>
        </div>

        <p className="text-muted-foreground">
          {region?.description || 'Det samiske bosetningsomradet pa tvers av Norge, Sverige, Finland og Russland.'}
        </p>
      </div>

      {/* Countries grid */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Land</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {countries?.map((country) => (
            <GeographyCard
              key={country.id}
              type="country"
              id={country.id}
              name={country.name}
              nameSami={country.name_sami}
              href={`/sapmi/${country.code.toLowerCase()}`}
            />
          ))}
        </div>
      </section>

      {/* Language areas section */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Sprakområder</h2>
        <p className="text-sm text-muted-foreground mb-4">
          De samiske sprakområdene strekker seg pa tvers av landegrensene.
        </p>
        <LanguageAreasGrid />
      </section>

      {/* Posts section - all posts from Sapmi */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Alle innlegg fra Sapmi</h2>
        <Feed geography={{ type: 'sapmi' }} />
      </section>
    </div>
  )
}

async function LanguageAreasGrid() {
  const supabase = await createClient()

  const { data: languageAreas } = await supabase
    .from('language_areas')
    .select('*')
    .order('sort_order')

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {languageAreas?.map((area) => (
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
  )
}
