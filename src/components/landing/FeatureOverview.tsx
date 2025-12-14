import { Users, BookOpen, MapPin, TrendingUp } from 'lucide-react'

const features = [
  {
    icon: Users,
    title: 'Fellesskap og tilhørighet',
    description: 'Koble sammen samer på tvers av landegrenser. Bygg relasjoner og del erfaringer.',
  },
  {
    icon: BookOpen,
    title: 'Kultur og språk',
    description: 'Bevar samisk kultur, språk og tradisjoner. Hold arven levende for nye generasjoner.',
  },
  {
    icon: MapPin,
    title: 'Stedstilknytning',
    description: 'Følg med på arrangementer og aktiviteter fra viktige steder i Sápmi.',
  },
  {
    icon: TrendingUp,
    title: 'Aktivitet og engasjement',
    description: 'Et levende fellesskap med aktive medlemmer. Delta i samtalen.',
  },
]

export function FeatureOverview() {
  return (
    <div className="bg-white py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Funksjoner og verdier
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            samiske.no samler det samiske fellesskapet på én plattform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="flex flex-col items-start p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 mb-4">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
