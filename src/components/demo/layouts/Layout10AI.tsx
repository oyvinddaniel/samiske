'use client';

import { useState, useEffect } from 'react';
import { MockHeader } from './shared/MockHeader';
import { MockPostCard } from './shared/MockPostCard';
import { mockPosts } from './shared/MockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Sparkles, TrendingUp, Clock, Eye, Pause, Settings } from 'lucide-react';

type DetectedMode = 'focus' | 'social' | 'discovery' | 'creation';
type Theme = 'energized' | 'focused' | 'relaxed' | 'creative';

export function Layout10AI() {
  const [detectedMode, setDetectedMode] = useState<DetectedMode>('focus');
  const [theme, setTheme] = useState<Theme>('focused');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('afternoon');
  const [suggestions, setSuggestions] = useState<string[]>([
    'Du pleier å sjekke meldinger nå',
    'Nytt innlegg fra en venn du følger tett',
    'Tid for en pause? Ta en kaffe ☕',
  ]);

  // Simulate AI mode detection
  useEffect(() => {
    if (!aiEnabled) return;

    const interval = setInterval(() => {
      const modes: DetectedMode[] = ['focus', 'social', 'discovery', 'creation'];
      const randomMode = modes[Math.floor(Math.random() * modes.length)];
      setDetectedMode(randomMode);

      // Update suggestions based on mode
      if (randomMode === 'social') {
        setSuggestions([
          'Du pleier å sjekke meldinger nå',
          '5 venner er online',
          'Nytt arrangement i din lokasjon',
        ]);
      } else if (randomMode === 'discovery') {
        setSuggestions([
          'Utforsk nye samfunn',
          'Trending: #duodji har 234 innlegg',
          'Nye steder i din region',
        ]);
      } else if (randomMode === 'creation') {
        setSuggestions([
          'Fortsett kladd fra i går',
          'Best tid å poste: kl. 19:00',
          'Dine innlegg får mest likes på kveldstid',
        ]);
      } else {
        setSuggestions([
          'Fortsett lesing: "Samisk språkkurs"',
          'Minimalt grensesnitt aktivt',
          'Forstyrringer pauset i 2 timer',
        ]);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [aiEnabled]);

  // Simulate time of day detection
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 10) setTimeOfDay('morning');
    else if (hour >= 10 && hour < 17) setTimeOfDay('afternoon');
    else if (hour >= 17 && hour < 22) setTimeOfDay('evening');
    else setTimeOfDay('night');
  }, []);

  const themeColors = {
    energized: 'from-orange-500 to-yellow-500',
    focused: 'from-blue-500 to-indigo-500',
    relaxed: 'from-green-500 to-teal-500',
    creative: 'from-purple-500 to-pink-500',
  };

  const themeBackgrounds = {
    energized: 'bg-gradient-to-br from-orange-50 to-yellow-50',
    focused: 'bg-gradient-to-br from-blue-50 to-indigo-50',
    relaxed: 'bg-gradient-to-br from-green-50 to-teal-50',
    creative: 'bg-gradient-to-br from-purple-50 to-pink-50',
  };

  return (
    <div className={`min-h-screen ${themeBackgrounds[theme]} transition-colors duration-1000`}>
      {/* Adaptive Header */}
      <MockHeader variant="default" />

      {/* AI Status Bar */}
      <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 bg-gradient-to-r ${themeColors[theme]} text-white rounded-full`}>
              <Brain className="w-4 h-4 animate-pulse" />
              <span className="text-sm font-medium">
                {detectedMode === 'focus' && 'Fokus-modus'}
                {detectedMode === 'social' && 'Sosial-modus'}
                {detectedMode === 'discovery' && 'Oppdagelses-modus'}
                {detectedMode === 'creation' && 'Kreativ-modus'}
              </span>
            </div>

            <Badge variant="secondary" className="gap-2">
              <Clock className="w-3 h-3" />
              {timeOfDay === 'morning' && 'God morgen'}
              {timeOfDay === 'afternoon' && 'God ettermiddag'}
              {timeOfDay === 'evening' && 'God kveld'}
              {timeOfDay === 'night' && 'God natt'}
            </Badge>

            <Badge variant="outline" className="gap-2">
              <Eye className="w-3 h-3" />
              AI tilpasser seg
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={aiEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAiEnabled(!aiEnabled)}
              className="gap-2"
            >
              {aiEnabled ? <Pause className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              {aiEnabled ? 'Pause AI' : 'Aktiver AI'}
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Feed (adaptive) */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Suggestions */}
            {aiEnabled && suggestions.length > 0 && (
              <Card className="border-2 border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    AI-forslag
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto py-2 px-3"
                    >
                      <span className="text-sm text-gray-700">{suggestion}</span>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Adaptive Feed */}
            <div className="space-y-4">
              {detectedMode === 'focus' && (
                <div className="space-y-6">
                  {mockPosts.slice(0, 3).map((post) => (
                    <MockPostCard key={post.id} post={post} variant="minimal" />
                  ))}
                </div>
              )}

              {detectedMode === 'social' && (
                <div className="grid gap-4">
                  {mockPosts.slice(0, 6).map((post) => (
                    <MockPostCard key={post.id} post={post} variant="default" />
                  ))}
                </div>
              )}

              {detectedMode === 'discovery' && (
                <div className="columns-1 sm:columns-2 gap-4">
                  {mockPosts.slice(0, 8).map((post) => (
                    <div key={post.id} className="break-inside-avoid mb-4">
                      <MockPostCard post={post} variant="compact" />
                    </div>
                  ))}
                </div>
              )}

              {detectedMode === 'creation' && (
                <div className="space-y-6">
                  <Card className="border-2 border-purple-200 bg-purple-50/50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3">
                        <img
                          src="https://i.pravatar.cc/150?img=1"
                          alt="User"
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1">
                          <textarea
                            placeholder="Hva tenker du på?"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-32 resize-none"
                          ></textarea>
                          <div className="flex items-center justify-between mt-3">
                            <Button variant="outline" size="sm">
                              Mal-forslag
                            </Button>
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                              Publiser
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {mockPosts.slice(0, 2).map((post) => (
                    <MockPostCard key={post.id} post={post} variant="default" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: AI Assistant */}
          <div className="space-y-6">
            {/* Learning Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  Dine mønstre
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Mest aktiv</span>
                    <span className="text-sm font-semibold">19:00-21:00</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Foretrukket innhold</span>
                    <span className="text-sm font-semibold">Bilder</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Interaksjonsstil</span>
                    <span className="text-sm font-semibold">Likerklikker</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Theme Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Stemning</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button
                  variant={theme === 'energized' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('energized')}
                  className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white border-0"
                >
                  Energisk
                </Button>
                <Button
                  variant={theme === 'focused' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('focused')}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0"
                >
                  Fokusert
                </Button>
                <Button
                  variant={theme === 'relaxed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('relaxed')}
                  className="bg-gradient-to-r from-green-500 to-teal-500 text-white border-0"
                >
                  Avslappet
                </Button>
                <Button
                  variant={theme === 'creative' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('creative')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
                >
                  Kreativ
                </Button>
              </CardContent>
            </Card>

            {/* Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Personvern</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Vis innsamlede data
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Eksporter data
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-red-600">
                  Slett læring
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
