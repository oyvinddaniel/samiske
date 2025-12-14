import { Globe } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { TabsContent } from '@/components/ui/tabs'
import type { Country } from './types'

interface CountriesTabProps {
  countries: Country[]
}

export function CountriesTab({ countries }: CountriesTabProps) {
  return (
    <TabsContent value="countries" className="space-y-4">
      <p className="text-sm text-gray-500">{countries.length} land (kun visning)</p>
      <div className="space-y-2">
        {countries.map(country => (
          <Card key={country.id}>
            <CardContent className="py-3">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">{country.name}</p>
                  <p className="text-xs text-gray-500">
                    {country.name_sami && <span className="mr-2">{country.name_sami}</span>}
                    <span className="text-gray-400">Kode: {country.code}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TabsContent>
  )
}
