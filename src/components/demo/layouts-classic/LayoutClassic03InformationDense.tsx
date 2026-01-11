'use client';

import { useState } from 'react';
import { mockPosts, mockTrendingTopics, mockStats } from '../layouts/shared/MockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, MapPin, Users, FolderOpen, Calendar, MessageCircle, User, Settings, TrendingUp, BarChart3, Grid, List } from 'lucide-react';

/**
 * Variant 3: Information Dense
 * Psychology: For power users som vil scanne mye innhold raskt
 * Features:
 * - Compact post cards (8px padding vs 16px)
 * - Grid view option (2 columns)
 * - Thumbnails instead of full images
 * - 12 posts visible vs 5
 * - Smaller font (14px base)
 * - Dense navigation
 * - Tabbed right sidebar
 */

export function LayoutClassic03InformationDense() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [rightTab, setRightTab] = useState<'stats' | 'trending' | 'activity'>('stats');

  return (
    <div className="min-h-screen bg-gray-50 text-sm">
      {/* Dense Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 h-12">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-700 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">samiske.no</span>
          </div>

          <div className="flex-1 max-w-md mx-4">
            <input
              type="search"
              placeholder="Søk (Ctrl+K)"
              className="w-full h-8 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Calendar className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MessageCircle className="w-4 h-4" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-red-500">3</Badge>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <User className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Compact Left Sidebar */}
        <aside className="hidden md:block w-48 sticky top-12 h-[calc(100vh-48px)] bg-white border-r border-gray-200 py-2">
          <nav className="px-2 space-y-0.5">
            <CompactNavItem icon={<Home className="w-4 h-4" />} label="Hjem" active />
            <CompactNavItem icon={<MapPin className="w-4 h-4" />} label="Steder" />
            <CompactNavItem icon={<Users className="w-4 h-4" />} label="Grupper" />
            <CompactNavItem icon={<FolderOpen className="w-4 h-4" />} label="Samfunn" />
            <CompactNavItem icon={<Calendar className="w-4 h-4" />} label="Kalender" badge={5} />
            <CompactNavItem icon={<MessageCircle className="w-4 h-4" />} label="Meldinger" badge={3} />
            <CompactNavItem icon={<User className="w-4 h-4" />} label="Min profil" />
            <CompactNavItem icon={<Settings className="w-4 h-4" />} label="Innstillinger" />
          </nav>

          {/* Keyboard Shortcuts */}
          <div className="mt-6 px-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">Snarveier</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center justify-between px-2">
                <span>Søk</span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">⌘K</kbd>
              </div>
              <div className="flex items-center justify-between px-2">
                <span>Nytt innlegg</span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">C</kbd>
              </div>
              <div className="flex items-center justify-between px-2">
                <span>Neste</span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">J</kbd>
              </div>
              <div className="flex items-center justify-between px-2">
                <span>Forrige</span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">K</kbd>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Feed - Dense Layout */}
        <main className="flex-1 max-w-5xl mx-auto px-4 py-4">
          {/* Compact Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {['Alle', 'Venner', 'Grupper', 'Samfunn', 'Steder'].map((filter) => (
                <Button
                  key={filter}
                  variant={filter === 'Alle' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-3 text-xs"
                >
                  {filter}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode('list')}
              >
                <List className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Dense Post Grid */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
            {mockPosts.slice(0, 12).map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start gap-2 mb-2">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-xs truncate">{post.author.name}</p>
                    <p className="text-xs text-gray-500 truncate">{post.author.location}</p>
                  </div>
                  <span className="text-xs text-gray-400">{post.timestamp.toLocaleString()}</span>
                </div>

                <p className="text-sm text-gray-700 mb-2 line-clamp-3">{post.content}</p>

                {post.images && post.images[0] && (
                  <div className="mb-2 rounded overflow-hidden">
                    <img
                      src={post.images[0]}
                      alt="Post"
                      className="w-full h-32 object-cover"
                    />
                  </div>
                )}

                {post.location && (
                  <Badge variant="secondary" className="text-xs mb-2">
                    {post.location}
                  </Badge>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <button className="flex items-center gap-1 hover:text-blue-600">
                    <span>❤️</span>
                    <span>{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-blue-600">
                    <span>💬</span>
                    <span>{post.comments}</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-blue-600">
                    <span>↗️</span>
                    <span>{post.shares}</span>
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-4">
            <Button variant="outline" size="sm">
              Last inn flere (Shift+L)
            </Button>
          </div>
        </main>

        {/* Compact Right Sidebar with Tabs */}
        <aside className="hidden lg:block w-64 sticky top-12 h-[calc(100vh-48px)] bg-white border-l border-gray-200">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                rightTab === 'stats'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setRightTab('stats')}
            >
              <BarChart3 className="w-3.5 h-3.5 inline-block mr-1" />
              Stats
            </button>
            <button
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                rightTab === 'trending'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setRightTab('trending')}
            >
              <TrendingUp className="w-3.5 h-3.5 inline-block mr-1" />
              Trend
            </button>
            <button
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                rightTab === 'activity'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setRightTab('activity')}
            >
              Activity
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-3 space-y-3 overflow-y-auto h-[calc(100%-40px)]">
            {rightTab === 'stats' && (
              <>
                {Object.entries(mockStats).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">{key}</span>
                      <span className="text-sm font-bold text-gray-900">{value}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-green-600">
                        +5%
                      </span>
                      <span className="text-gray-500">siste uke</span>
                    </div>
                  </div>
                ))}
              </>
            )}

            {rightTab === 'trending' && (
              <div className="space-y-2">
                {mockTrendingTopics.map((topic, index) => (
                  <button
                    key={index}
                    className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-900">#{topic.tag}</span>
                      <span className="text-xs text-gray-500">{topic.count} innlegg</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {rightTab === 'activity' && (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded hover:bg-gray-50">
                    <img
                      src={`https://i.pravatar.cc/150?img=${i}`}
                      alt="User"
                      className="w-7 h-7 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-900 line-clamp-2">
                        <span className="font-semibold">User {i}</span> likte ditt innlegg
                      </p>
                      <span className="text-xs text-gray-500">{i}m siden</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function CompactNavItem({ icon, label, active = false, badge }: { icon: React.ReactNode; label: string; active?: boolean; badge?: number }) {
  return (
    <button
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-colors relative text-xs ${
        active
          ? 'bg-blue-50 text-blue-600 font-medium'
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <div className="flex-shrink-0">{icon}</div>
      <span className="flex-1 text-left truncate">{label}</span>
      {badge && badge > 0 && (
        <Badge className="h-4 px-1.5 text-xs bg-red-500 text-white">{badge}</Badge>
      )}
    </button>
  );
}
