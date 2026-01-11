'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Brain, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LayoutClassic01FocusFlow } from '@/components/demo/layouts-classic/LayoutClassic01FocusFlow';
import { LayoutClassic02SocialButterfly } from '@/components/demo/layouts-classic/LayoutClassic02SocialButterfly';
import { LayoutClassic03InformationDense } from '@/components/demo/layouts-classic/LayoutClassic03InformationDense';
import { LayoutClassic04EmotionalConnection } from '@/components/demo/layouts-classic/LayoutClassic04EmotionalConnection';
import { LayoutClassic05AchievementUnlocked } from '@/components/demo/layouts-classic/LayoutClassic05AchievementUnlocked';
import { LayoutClassic06CuratorsChoice } from '@/components/demo/layouts-classic/LayoutClassic06CuratorsChoice';
import { LayoutClassic07LocalHero } from '@/components/demo/layouts-classic/LayoutClassic07LocalHero';
import { LayoutClassic08MindfulMoments } from '@/components/demo/layouts-classic/LayoutClassic08MindfulMoments';
import { LayoutClassic09CreatorStudio } from '@/components/demo/layouts-classic/LayoutClassic09CreatorStudio';
import { LayoutClassic10DiscoveryMode } from '@/components/demo/layouts-classic/LayoutClassic10DiscoveryMode';

type LayoutVariant = {
  id: number;
  name: string;
  description: string;
  psychology: string;
  userType: string;
  complexity: 'Enkel' | 'Moderat' | 'Moderat-Høy' | 'Kompleks';
  implemented: boolean;
  component?: React.ComponentType;
};

const variants: LayoutVariant[] = [
  {
    id: 1,
    name: 'Focus Flow',
    description: 'Optimal kognitiv flyt for dyplesing uten distraksjoner',
    psychology: 'Minimere kognitiv belastning, maksimere oppmerksomhet',
    userType: 'Deep readers, studenter, researche',
    complexity: 'Enkel',
    implemented: true,
    component: LayoutClassic01FocusFlow,
  },
  {
    id: 2,
    name: 'Social Butterfly',
    description: 'Maksimal sosial interaksjon med FOMO og social proof',
    psychology: 'Social bekreftelse, community bonding, FOMO',
    userType: 'Sosialt engasjerte brukere',
    complexity: 'Moderat',
    implemented: true,
    component: LayoutClassic02SocialButterfly,
  },
  {
    id: 3,
    name: 'Information Dense',
    description: 'Høy informasjonstetthet for rask scanning',
    psychology: 'Information scent, efficiency for power users',
    userType: 'Power users, moderatorer, journalister',
    complexity: 'Moderat',
    implemented: true,
    component: LayoutClassic03InformationDense,
  },
  {
    id: 4,
    name: 'Emotional Connection',
    description: 'Varme, nærhet og meningsfull interaksjon',
    psychology: 'Emotional design, human connection, trust',
    userType: 'Empati-drevne brukere',
    complexity: 'Moderat',
    implemented: true,
    component: LayoutClassic04EmotionalConnection,
  },
  {
    id: 5,
    name: 'Achievement Unlocked',
    description: 'Gamification med achievements og progression',
    psychology: 'Motivasjon gjennom belønninger, habit formation',
    userType: 'Målrettede, competitive users',
    complexity: 'Kompleks',
    implemented: true,
    component: LayoutClassic05AchievementUnlocked,
  },
  {
    id: 6,
    name: "Curator's Choice",
    description: 'Editorial kuratering, kvalitet over kvantitet',
    psychology: 'Information scent, redusere decision fatigue',
    userType: 'Kvalitetsbevisste brukere',
    complexity: 'Moderat',
    implemented: true,
    component: LayoutClassic06CuratorsChoice,
  },
  {
    id: 7,
    name: 'Local Hero',
    description: 'Geografisk fokus, community pride',
    psychology: 'Local identity, proximity bias, community',
    userType: 'Stedsbaserte brukere',
    complexity: 'Moderat',
    implemented: true,
    component: LayoutClassic07LocalHero,
  },
  {
    id: 8,
    name: 'Mindful Moments',
    description: 'Velvære og balansert bruk av sosiale medier',
    psychology: 'Redusere angst, fremme healthy habits',
    userType: 'Wellness-bevisste brukere',
    complexity: 'Moderat-Høy',
    implemented: true,
    component: LayoutClassic08MindfulMoments,
  },
  {
    id: 9,
    name: 'Creator Studio',
    description: 'Verktøy for innholdsskapere med analytics',
    psychology: 'Redusere creative friction, empowerment',
    userType: 'Content creators, artists',
    complexity: 'Kompleks',
    implemented: true,
    component: LayoutClassic09CreatorStudio,
  },
  {
    id: 10,
    name: 'Discovery Mode',
    description: 'Utforskning og serendipitet utenfor bobler',
    psychology: 'Curiosity, variable rewards, exploration',
    userType: 'Nysgjerrige explorers',
    complexity: 'Moderat-Høy',
    implemented: true,
    component: LayoutClassic10DiscoveryMode,
  },
];

export default function LayoutsClassicGalleryPage() {
  const [selectedVariant, setSelectedVariant] = useState<LayoutVariant | null>(null);

  const complexityColors = {
    'Enkel': 'bg-green-100 text-green-800',
    'Moderat': 'bg-blue-100 text-blue-800',
    'Moderat-Høy': 'bg-yellow-100 text-yellow-800',
    'Kompleks': 'bg-orange-100 text-orange-800',
  };

  // If a variant is selected, show it fullscreen
  if (selectedVariant && selectedVariant.component) {
    const VariantComponent = selectedVariant.component;
    return (
      <div className="fixed inset-0 z-50 bg-white">
        {/* Back button */}
        <div className="absolute top-4 left-4 z-50">
          <Button
            onClick={() => setSelectedVariant(null)}
            variant="default"
            className="gap-2 shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbake til galleri
          </Button>
        </div>

        {/* Variant info badge */}
        <div className="absolute top-4 right-4 z-50">
          <Badge className="bg-black text-white px-4 py-2 text-sm shadow-lg">
            {selectedVariant.name}
          </Badge>
        </div>

        {/* Render variant */}
        <VariantComponent />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/demo/layouts">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Brain className="w-8 h-8 text-purple-600" />
                Enhanced Classic - Psykologi-baserte Varianter
              </h1>
              <p className="text-gray-600 mt-1">
                10 varianter av Enhanced Classic layout basert på menneskelig psykologi
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {variants.filter(v => v.implemented).length} / {variants.length} implementert
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Card */}
        <Card className="mb-8 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Om disse variantene
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-3">
              Alle varianter bruker samme <strong>3-kolonne Enhanced Classic struktur</strong> (272px left sidebar | flex-1 main feed | 304px right sidebar),
              men arrangerer elementer på nye måter basert på <strong>psykologiske prinsipper</strong>.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded-lg p-3">
                <p className="font-semibold text-purple-600 mb-1">🧠 Kognitiv Psykologi</p>
                <p className="text-gray-600">Attention, cognitive load, memory</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="font-semibold text-blue-600 mb-1">❤️ Sosial Psykologi</p>
                <p className="text-gray-600">Social proof, FOMO, community</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="font-semibold text-green-600 mb-1">⚡ Motivasjonspsykologi</p>
                <p className="text-gray-600">Rewards, habits, achievement</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Variants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {variants.map((variant) => (
            <Card
              key={variant.id}
              className={`group hover:shadow-xl transition-all duration-300 ${
                variant.implemented ? 'cursor-pointer' : 'opacity-75'
              }`}
              onClick={() => variant.implemented && setSelectedVariant(variant)}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    #{variant.id}
                  </Badge>
                  <div className="flex gap-2">
                    <Badge className={complexityColors[variant.complexity]}>
                      {variant.complexity}
                    </Badge>
                    {variant.implemented ? (
                      <Badge className="bg-green-600 text-white">
                        <Zap className="w-3 h-3 mr-1" />
                        Live
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        Kommer snart
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">
                  {variant.name}
                </CardTitle>
                <CardDescription className="text-sm">
                  {variant.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Preview placeholder */}
                <div className={`h-48 rounded-lg border-2 border-dashed flex items-center justify-center ${
                  variant.implemented
                    ? 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 group-hover:border-purple-400'
                    : 'bg-gray-100 border-gray-300'
                }`}>
                  <div className="text-center p-4">
                    <Brain className={`w-12 h-12 mx-auto mb-2 ${
                      variant.implemented ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                    <p className="text-sm text-gray-600">
                      {variant.implemented ? 'Klikk for fullskjerm' : 'Under utvikling'}
                    </p>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Psykologi:</span>
                    <p className="text-gray-600">{variant.psychology}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Brukertype:</span>
                    <p className="text-gray-600">{variant.userType}</p>
                  </div>
                </div>

                {variant.implemented && (
                  <Button className="w-full gap-2" onClick={() => setSelectedVariant(variant)}>
                    <Zap className="w-4 h-4" />
                    Vis variant
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-12 bg-white rounded-xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Psykologisk Fordeling</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Kognitiv Psykologi</p>
              <p className="text-3xl font-bold text-purple-600">4</p>
              <p className="text-sm text-gray-500 mt-1">Focus, Dense, Mindful, Curator's</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Sosial Psykologi</p>
              <p className="text-3xl font-bold text-blue-600">3</p>
              <p className="text-sm text-gray-500 mt-1">Social, Emotional, Local Hero</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Motivasjon</p>
              <p className="text-3xl font-bold text-green-600">2</p>
              <p className="text-sm text-gray-500 mt-1">Achievement, Creator</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Implementert</p>
              <p className="text-3xl font-bold text-gray-900">
                {variants.filter(v => v.implemented).length} / {variants.length}
              </p>
              <p className="text-sm text-gray-500 mt-1">Klar for testing</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
