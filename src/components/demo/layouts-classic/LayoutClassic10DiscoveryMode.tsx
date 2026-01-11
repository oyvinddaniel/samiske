'use client';

import { useState } from 'react';
import { mockPosts, mockUsers } from '../layouts/shared/MockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, Sparkles, Shuffle, Compass, Users, MapPin, RefreshCw } from 'lucide-react';

/**
 * Variant 10: Discovery Mode
 * Psychology: Curiosity, variable rewards, exploration incentive
 * Features:
 * - "Surprise me" button prominent
 * - Mixed content types
 * - Category jumps
 * - Shuffle to reshuffle feed
 * - Trending outside your bubble
 * - Random user spotlight
 * - Cross-community conversations
 * - Diverse perspectives indicator
 */

export function LayoutClassic10DiscoveryMode() {
  const [feedSeed, setFeedSeed] = useState(0);

  const shuffleFeed = () => {
    setFeedSeed(Math.random());
  };

  const contentTypes = ['post', 'user', 'community', 'place'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-cyan-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">Utforsk</span>
            <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
              <Sparkles className="w-3 h-3 mr-1" />
              Discovery
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button className="bg-gradient-to-r from-pink-500 to-purple-500 gap-2" onClick={shuffleFeed}>
              <Shuffle className="w-4 h-4" />
              Overrask meg!
            </Button>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Left Sidebar - Exploration Tools */}
        <aside className="hidden md:block w-72 sticky top-16 h-[calc(100vh-64px)] p-6">
          {/* Surprise Me Button (Large) */}
          <Button
            className="w-full h-20 bg-gradient-to-br from-rainbow text-white text-lg font-bold mb-6 relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
            }}
            onClick={shuffleFeed}
          >
            <Sparkles className="w-6 h-6 mr-2 animate-pulse" />
            Overrask meg!
          </Button>

          {/* Topic Randomizer */}
          <div className="bg-white rounded-xl p-6 mb-6 border border-cyan-200">
            <h3 className="font-semibold text-gray-900 mb-4">🎯 Utforsk etter:</h3>
            <div className="space-y-2">
              {[
                { label: 'Tema', emoji: '📚' },
                { label: 'Stemning', emoji: '🎭' },
                { label: 'Medium', emoji: '🎨' },
                { label: 'Serendipitet', emoji: '✨' },
              ].map((filter) => (
                <Button
                  key={filter.label}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={shuffleFeed}
                >
                  <span>{filter.emoji}</span>
                  <span>{filter.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Exploration Journey (Breadcrumbs) */}
          <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Din reise:</h3>
            <div className="flex items-center gap-1 text-xs text-gray-600 flex-wrap">
              <span>Mat</span>
              <span>→</span>
              <span>Språk</span>
              <span>→</span>
              <span>Duodji</span>
              <span>→</span>
              <Badge className="bg-cyan-500 text-white">Du er her</Badge>
            </div>
          </div>
        </aside>

        {/* Main Feed - Mixed Content */}
        <main className="flex-1 max-w-3xl mx-auto px-6 py-6">
          {/* Explore Controls */}
          <div className="bg-white rounded-xl p-4 mb-6 border border-cyan-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-600" />
              <span className="font-medium text-gray-900">Oppdager nytt innhold for deg</span>
            </div>
            <Button variant="ghost" size="sm" className="gap-2" onClick={shuffleFeed}>
              <RefreshCw className="w-4 h-4" />
              Bland om
            </Button>
          </div>

          {/* Mixed Content Feed */}
          <div className="space-y-6">
            {mockPosts.slice(0, 8).map((post, index) => {
              const contentType = contentTypes[index % contentTypes.length];

              return (
                <div key={`${post.id}-${feedSeed}-${index}`}>
                  {/* Category Jump Indicator */}
                  {index % 3 === 0 && index !== 0 && (
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white text-center mb-6">
                      <Sparkles className="w-6 h-6 mx-auto mb-2" />
                      <p className="font-semibold">Nye perspektiver oppdaget!</p>
                      <p className="text-sm text-purple-100">Fra språk → til håndverk</p>
                    </div>
                  )}

                  {contentType === 'post' && (
                    <article className="bg-white rounded-xl p-6 border-2 border-gradient hover:shadow-xl transition-all"
                      style={{
                        borderImage: 'linear-gradient(135deg, #667eea, #764ba2, #f093fb) 1'
                      }}>
                      {/* Why you might like this */}
                      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-cyan-900 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Du vil kanskje like dette fordi: <span className="font-semibold">det er utenfor din vanlige feed</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{post.author.name}</p>
                          <p className="text-sm text-gray-500">{post.author.location}</p>
                        </div>
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          Nytt for deg
                        </Badge>
                      </div>

                      <p className="text-gray-800 mb-4">{post.content}</p>

                      {post.images && post.images[0] && (
                        <div className="mb-4 rounded-lg overflow-hidden">
                          <img src={post.images[0]} alt="Post" className="w-full" />
                        </div>
                      )}

                      {/* Diverse Perspectives Indicator */}
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="secondary">#{['duodji', 'språk', 'mat', 'joik', 'natur'][index % 5]}</Badge>
                        <Badge variant="outline" className="gap-1">
                          <Users className="w-3 h-3" />
                          3 forskjellige perspektiver
                        </Badge>
                      </div>

                      {/* Dive Deeper Button */}
                      <Button variant="outline" className="w-full gap-2">
                        <Compass className="w-4 h-4" />
                        Utforsk mer om {['duodji', 'språk', 'mat', 'joik', 'natur'][index % 5]}
                      </Button>
                    </article>
                  )}

                  {contentType === 'user' && index % 4 === 1 && (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
                      <Badge className="bg-indigo-600 text-white mb-3">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Tilfeldig bruker-spotlight
                      </Badge>
                      <div className="flex items-center gap-4">
                        <img
                          src={mockUsers[index % mockUsers.length].avatar}
                          alt="User"
                          className="w-20 h-20 rounded-full"
                        />
                        <div className="flex-1">
                          <p className="font-bold text-lg text-gray-900">{mockUsers[index % mockUsers.length].name}</p>
                          <p className="text-sm text-gray-600 mb-2">{mockUsers[index % mockUsers.length].location}</p>
                          <p className="text-sm text-gray-700">Aktiv bidragsyter innen samisk matkultur og tradisjonelle oppskrifter.</p>
                        </div>
                        <Button>Følg</Button>
                      </div>
                    </div>
                  )}

                  {contentType === 'community' && index % 4 === 2 && (
                    <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border-2 border-green-200">
                      <Badge className="bg-green-600 text-white mb-3">
                        <Users className="w-3 h-3 mr-1" />
                        Fellesskap du kanskje liker
                      </Badge>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-lg text-gray-900">Moderne duodji-teknikker</p>
                          <p className="text-sm text-gray-600 mb-3">234 medlemmer • 89 innlegg denne uken</p>
                          <p className="text-sm text-gray-700">Et aktivt fellesskap for moderne tilnærminger til tradisjonelt håndverk.</p>
                        </div>
                        <Button className="ml-4">Bli med</Button>
                      </div>
                    </div>
                  )}

                  {contentType === 'place' && index % 4 === 3 && (
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border-2 border-orange-200">
                      <Badge className="bg-orange-600 text-white mb-3">
                        <MapPin className="w-3 h-3 mr-1" />
                        Utforsk nye steder
                      </Badge>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-lg text-gray-900">Ohcejohka</p>
                          <p className="text-sm text-gray-600 mb-3">145 brukere • 67 km unna</p>
                          <p className="text-sm text-gray-700">Et livlig samisk samfunn med rik kulturhistorie og aktive arrangementer.</p>
                        </div>
                        <Button className="ml-4" variant="outline">Utforsk</Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>

        {/* Right Sidebar - Discovery Stats */}
        <aside className="hidden lg:block w-80 sticky top-16 h-[calc(100vh-64px)] p-6 overflow-y-auto">
          {/* Trending Outside Your Bubble */}
          <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl p-6 text-white mb-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Trending utenfor din boble
            </h3>
            <div className="space-y-3">
              {['#modernduodji', '#språkrevitalisering', '#tradisjonellmat'].map((tag, i) => (
                <button
                  key={tag}
                  className="w-full text-left p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm"
                >
                  <p className="font-semibold">{tag}</p>
                  <p className="text-sm text-pink-100">{234 + i * 67} innlegg</p>
                </button>
              ))}
            </div>
          </div>

          {/* Opposite Perspective */}
          <div className="bg-white rounded-xl p-6 mb-6 border-2 border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              🔄 Motsatt perspektiv
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Utforsk synspunkter som utfordrer din vanlige feed og utvid horisonten din.
            </p>
            <Button variant="outline" className="w-full gap-2">
              <Sparkles className="w-4 h-4" />
              Vis meg noe nytt
            </Button>
          </div>

          {/* Cross-Community Conversations */}
          <div className="bg-white rounded-xl p-6 border border-cyan-200">
            <h3 className="font-semibold text-gray-900 mb-4">💬 Fellesskaps-samtaler</h3>
            <div className="space-y-3">
              {[
                { communities: ['Duodji', 'Design'], topic: 'Tradisjon i moderne tid' },
                { communities: ['Mat', 'Språk'], topic: 'Kulinariske termer' },
                { communities: ['Musikk', 'Historie'], topic: 'Joik gjennom tidene' },
              ].map((convo, i) => (
                <button
                  key={i}
                  className="w-full text-left p-3 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors border border-cyan-200"
                >
                  <div className="flex items-center gap-1 mb-2">
                    {convo.communities.map((community) => (
                      <Badge key={community} className="bg-cyan-600 text-white text-xs">
                        {community}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{convo.topic}</p>
                  <p className="text-xs text-gray-600 mt-1">{Math.floor(Math.random() * 50) + 10} samtaler</p>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function TrendingUp({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}
