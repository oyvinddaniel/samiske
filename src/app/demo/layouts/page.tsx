'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Layout, Sparkles, Zap, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layout01Classic } from '@/components/demo/layouts/Layout01Classic';
import { Layout02Command } from '@/components/demo/layouts/Layout02Command';
import { Layout03Minimal } from '@/components/demo/layouts/Layout03Minimal';
import { Layout04Dashboard } from '@/components/demo/layouts/Layout04Dashboard';
import { Layout05Split } from '@/components/demo/layouts/Layout05Split';
import { Layout06Stories } from '@/components/demo/layouts/Layout06Stories';
import { Layout07Masonry } from '@/components/demo/layouts/Layout07Masonry';
import { Layout08Keyboard } from '@/components/demo/layouts/Layout08Keyboard';
import { Layout09Islands } from '@/components/demo/layouts/Layout09Islands';
import { Layout10AI } from '@/components/demo/layouts/Layout10AI';

type LayoutInfo = {
  id: number;
  name: string;
  description: string;
  category: 'realistic' | 'innovative';
  complexity: 'Enkel' | 'Moderat' | 'Moderat-Høy' | 'Kompleks' | 'Høy' | 'Veldig Høy';
  inspiration: string;
  usp: string;
  implemented: boolean;
  component?: React.ComponentType;
};

const layouts: LayoutInfo[] = [
  {
    id: 1,
    name: 'Enhanced Classic',
    description: 'Forbedret versjon av nåværende three-column layout med trending topics og suggestions',
    category: 'realistic',
    complexity: 'Enkel',
    inspiration: 'Twitter/X, LinkedIn, nåværende samiske.no',
    usp: 'Lav risiko, familiær, fikser UX-problemer',
    implemented: true,
    component: Layout01Classic,
  },
  {
    id: 2,
    name: 'Command Center',
    description: 'Discord-inspirert 4-kolonne workspace for power-users',
    category: 'realistic',
    complexity: 'Kompleks',
    inspiration: 'Discord, Notion, Slack',
    usp: 'Maksimal effektivitet, multiple contexts samtidig',
    implemented: true,
    component: Layout02Command,
  },
  {
    id: 3,
    name: 'Minimal Centered',
    description: 'Single-column centered feed med floating sidebars',
    category: 'realistic',
    complexity: 'Moderat',
    inspiration: 'Threads, Bluesky, Medium',
    usp: 'Distraction-free, maksimal fokus',
    implemented: true,
    component: Layout03Minimal,
  },
  {
    id: 4,
    name: 'Professional Dashboard',
    description: 'Top-nav med fullstendig customizable widgets',
    category: 'realistic',
    complexity: 'Kompleks',
    inspiration: 'LinkedIn, Notion, Google Analytics',
    usp: 'Brukerkontrollert, personalized dashboard',
    implemented: true,
    component: Layout04Dashboard,
  },
  {
    id: 5,
    name: 'Split Timeline',
    description: 'Dual-feed side-by-side for parallel browsing',
    category: 'realistic',
    complexity: 'Moderat-Høy',
    inspiration: 'TweetDeck, News streams',
    usp: 'Browse to kontekster samtidig',
    implemented: true,
    component: Layout05Split,
  },
  {
    id: 6,
    name: 'Immersive Stories',
    description: 'Full-screen vertical mobile-first layout',
    category: 'innovative',
    complexity: 'Moderat',
    inspiration: 'Instagram Stories, TikTok',
    usp: 'Immersive, perfekt for visual storytelling',
    implemented: true,
    component: Layout06Stories,
  },
  {
    id: 7,
    name: 'Magazine Mosaic',
    description: 'Pinterest-style masonry grid layout',
    category: 'innovative',
    complexity: 'Moderat-Høy',
    inspiration: 'Pinterest, Apple News+',
    usp: 'Visuelt stunning, magazine-quality',
    implemented: true,
    component: Layout07Masonry,
  },
  {
    id: 8,
    name: 'Command Palette Interface',
    description: 'Keyboard-first power-user interface',
    category: 'innovative',
    complexity: 'Høy',
    inspiration: 'Figma, VS Code, Raycast',
    usp: 'Raskest interface for power-users',
    implemented: true,
    component: Layout08Keyboard,
  },
  {
    id: 9,
    name: 'Floating Islands',
    description: 'Physics-based spatial canvas med infinite scroll',
    category: 'innovative',
    complexity: 'Veldig Høy',
    inspiration: 'Miro/FigJam, Prezi',
    usp: 'Helt unikt, spatial organization',
    implemented: true,
    component: Layout09Islands,
  },
  {
    id: 10,
    name: 'Ambient Intelligence',
    description: 'AI-adaptive layout som lærer av brukeradferd',
    category: 'innovative',
    complexity: 'Veldig Høy',
    inspiration: 'Spotify, Netflix adaptive UI',
    usp: 'Interface som kjenner deg',
    implemented: true,
    component: Layout10AI,
  },
];

export default function LayoutsGalleryPage() {
  const [filter, setFilter] = useState<'all' | 'realistic' | 'innovative'>('all');
  const [selectedLayout, setSelectedLayout] = useState<LayoutInfo | null>(null);

  const filteredLayouts = layouts.filter((layout) => {
    if (filter === 'all') return true;
    return layout.category === filter;
  });

  const complexityColors = {
    'Enkel': 'bg-green-100 text-green-800',
    'Moderat': 'bg-blue-100 text-blue-800',
    'Moderat-Høy': 'bg-yellow-100 text-yellow-800',
    'Kompleks': 'bg-orange-100 text-orange-800',
    'Høy': 'bg-red-100 text-red-800',
    'Veldig Høy': 'bg-purple-100 text-purple-800',
  };

  // If a layout is selected, show it fullscreen
  if (selectedLayout && selectedLayout.component) {
    const LayoutComponent = selectedLayout.component;
    return (
      <div className="fixed inset-0 z-50 bg-white">
        {/* Back button */}
        <div className="absolute top-4 left-4 z-50">
          <Button
            onClick={() => setSelectedLayout(null)}
            variant="default"
            className="gap-2 shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbake til galleri
          </Button>
        </div>

        {/* Layout info badge */}
        <div className="absolute top-4 right-4 z-50">
          <Badge className="bg-black text-white px-4 py-2 text-sm shadow-lg">
            {selectedLayout.name}
          </Badge>
        </div>

        {/* Render layout */}
        <LayoutComponent />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/demo/design-dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Layout className="w-8 h-8 text-blue-600" />
                Sidelayouter
              </h1>
              <p className="text-gray-600 mt-1">
                10 moderne layout-varianter for sosiale nettverk
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {layouts.filter(l => l.implemented).length} / {layouts.length} implementert
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Alle ({layouts.length})
          </Button>
          <Button
            variant={filter === 'realistic' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('realistic')}
            className="gap-2"
          >
            <Monitor className="w-4 h-4" />
            Realistiske ({layouts.filter(l => l.category === 'realistic').length})
          </Button>
          <Button
            variant={filter === 'innovative' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('innovative')}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Innovative ({layouts.filter(l => l.category === 'innovative').length})
          </Button>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLayouts.map((layout) => (
            <Card
              key={layout.id}
              className={`group hover:shadow-xl transition-all duration-300 ${
                layout.implemented ? 'cursor-pointer' : 'opacity-75'
              }`}
              onClick={() => layout.implemented && setSelectedLayout(layout)}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    #{layout.id}
                  </Badge>
                  <div className="flex gap-2">
                    <Badge className={complexityColors[layout.complexity]}>
                      {layout.complexity}
                    </Badge>
                    {layout.implemented ? (
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
                <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                  {layout.name}
                </CardTitle>
                <CardDescription className="text-sm">
                  {layout.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Preview placeholder */}
                <div className={`h-48 rounded-lg border-2 border-dashed flex items-center justify-center ${
                  layout.implemented
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 group-hover:border-blue-400'
                    : 'bg-gray-100 border-gray-300'
                }`}>
                  <div className="text-center p-4">
                    <Layout className={`w-12 h-12 mx-auto mb-2 ${
                      layout.implemented ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <p className="text-sm text-gray-600">
                      {layout.implemented ? 'Klikk for fullskjerm' : 'Preview kommer snart'}
                    </p>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Inspirasjon:</span>
                    <p className="text-gray-600">{layout.inspiration}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">USP:</span>
                    <p className="text-gray-600">{layout.usp}</p>
                  </div>
                </div>

                {layout.implemented && (
                  <Button className="w-full gap-2" onClick={() => setSelectedLayout(layout)}>
                    <Zap className="w-4 h-4" />
                    Vis layout
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-12 bg-white rounded-xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Oversikt</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Realistiske layouts</p>
              <p className="text-3xl font-bold text-blue-600">
                {layouts.filter(l => l.category === 'realistic').length}
              </p>
              <p className="text-sm text-gray-500 mt-1">Praktiske løsninger</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Innovative layouts</p>
              <p className="text-3xl font-bold text-purple-600">
                {layouts.filter(l => l.category === 'innovative').length}
              </p>
              <p className="text-sm text-gray-500 mt-1">Fremtidsrettede konsepter</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Implementert</p>
              <p className="text-3xl font-bold text-green-600">
                {layouts.filter(l => l.implemented).length} / {layouts.length}
              </p>
              <p className="text-sm text-gray-500 mt-1">Klar for testing</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
