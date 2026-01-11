'use client';

import { useState } from 'react';
import { MockHeader } from '../layouts/shared/MockHeader';
import { mockPosts } from '../layouts/shared/MockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, MapPin, Users, FolderOpen, Calendar, MessageCircle, User, Settings, PenSquare, ChevronRight, ChevronDown } from 'lucide-react';

/**
 * Variant 1: Focus Flow
 * Psychology: Minimere kognitiv belastning, maksimere dyplesing
 * Features:
 * - Ultra-slim left sidebar (160px, icons only)
 * - Larger fonts (18px base)
 * - Increased line-height (1.8)
 * - One post visible at a time (scroll-snap)
 * - Hidden right sidebar
 * - Minimal distractions
 */

export function LayoutClassic01FocusFlow() {
  const [leftExpanded, setLeftExpanded] = useState(false);
  const [rightVisible, setRightVisible] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('Alle');
  const [currentPostIndex, setCurrentPostIndex] = useState(0);

  const filteredPosts = mockPosts.slice(0, 10);
  const progress = ((currentPostIndex + 1) / filteredPosts.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Slim Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 h-12">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">samiske.no</span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {currentPostIndex + 1} / {filteredPosts.length}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setRightVisible(!rightVisible)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="sticky top-12 z-30 bg-blue-600 h-1">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="flex">
        {/* Ultra-Slim Left Sidebar */}
        <div
          className={`hidden md:block sticky top-13 h-[calc(100vh-52px)] border-r border-gray-200 bg-white transition-all duration-300 ${
            leftExpanded ? 'w-64' : 'w-16'
          }`}
          onMouseEnter={() => setLeftExpanded(true)}
          onMouseLeave={() => setLeftExpanded(false)}
        >
          <nav className="p-3 space-y-2">
            <NavItem icon={<Home className="w-5 h-5" />} label="Hjem" expanded={leftExpanded} />
            <NavItem icon={<MapPin className="w-5 h-5" />} label="Steder" expanded={leftExpanded} />
            <NavItem icon={<Users className="w-5 h-5" />} label="Grupper" expanded={leftExpanded} />
            <NavItem icon={<FolderOpen className="w-5 h-5" />} label="Samfunn" expanded={leftExpanded} />
            <NavItem icon={<Calendar className="w-5 h-5" />} label="Kalender" expanded={leftExpanded} />
            <NavItem icon={<MessageCircle className="w-5 h-5" />} label="Meldinger" expanded={leftExpanded} badge={3} />
            <NavItem icon={<User className="w-5 h-5" />} label="Profil" expanded={leftExpanded} />
          </nav>
        </div>

        {/* Main Feed - Focus Mode */}
        <main className="flex-1 max-w-3xl mx-auto px-6 py-8">
          {/* Filter Dropdown */}
          <div className="mb-8">
            <Button variant="outline" className="w-full justify-between">
              <span>Vis: {currentFilter}</span>
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Single Post View with Scroll Snap */}
          <div className="space-y-12">
            {filteredPosts.map((post, index) => (
              <article
                key={post.id}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 scroll-mt-24"
                style={{
                  fontSize: '18px',
                  lineHeight: '1.8',
                }}
              >
                {/* Author */}
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-14 h-14 rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">{post.author.name}</p>
                    <p className="text-sm text-gray-500">{post.author.location}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="prose prose-lg max-w-none mb-6">
                  <p className="text-gray-800 leading-relaxed">{post.content}</p>
                </div>

                {/* Images */}
                {post.images && post.images.length > 0 && (
                  <div className="mb-6 rounded-xl overflow-hidden">
                    <img
                      src={post.images[0]}
                      alt="Post"
                      className="w-full h-auto"
                    />
                  </div>
                )}

                {/* Location */}
                {post.location && (
                  <Badge variant="secondary" className="mb-6">
                    <MapPin className="w-3 h-3 mr-1" />
                    {post.location}
                  </Badge>
                )}

                {/* Minimal Actions */}
                <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <span className="text-2xl">❤️</span>
                    <span className="text-gray-600">{post.likes}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <span className="text-2xl">💬</span>
                    <span className="text-gray-600">{post.comments}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <span className="text-2xl">🔖</span>
                  </Button>
                </div>
              </article>
            ))}
          </div>

          {/* Completion Message */}
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Du er oppdatert!</h3>
            <p className="text-gray-600">Du har lest alle innlegg i denne feeden.</p>
            <Button className="mt-6 gap-2">
              <PenSquare className="w-4 h-4" />
              Lag nytt innlegg
            </Button>
          </div>
        </main>

        {/* Right Sidebar - Hidden by default */}
        {rightVisible && (
          <aside className="hidden lg:block w-80 sticky top-13 h-[calc(100vh-52px)] bg-white border-l border-gray-200 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">Innstillinger</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setRightVisible(false)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Reading Mode Settings */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Lesemodus</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" className="rounded" defaultChecked />
                    Stor tekst (18px)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" className="rounded" defaultChecked />
                    Økt linjehøyde
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" className="rounded" defaultChecked />
                    Skjul distraksjoner
                  </label>
                </div>
              </div>

              {/* Reading Stats */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Din lesing</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Lest i dag</span>
                      <span className="font-semibold">{currentPostIndex + 1}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Gj.snitt lesetid: <span className="font-semibold">2 min 30s</span></p>
                  </div>
                </div>
              </div>

              {/* Focus Tips */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Fokus-tips</h4>
                <p className="text-xs text-blue-800">
                  Lesemodus reduserer distraksjoner og hjelper deg med å fordype deg i innholdet. Ta pauser hver 20. minutt for optimal konsentrasjon.
                </p>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Floating Action Button - Composer */}
      <button
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all flex items-center justify-center"
        aria-label="Lag nytt innlegg"
      >
        <PenSquare className="w-6 h-6" />
      </button>
    </div>
  );
}

function NavItem({ icon, label, expanded, badge }: { icon: React.ReactNode; label: string; expanded: boolean; badge?: number }) {
  return (
    <button
      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors relative group"
    >
      <div className="text-gray-600 group-hover:text-gray-900">{icon}</div>
      {expanded && (
        <span className="text-sm text-gray-700 group-hover:text-gray-900 whitespace-nowrap">
          {label}
        </span>
      )}
      {badge && badge > 0 && (
        <Badge className={`bg-red-500 text-white text-xs ${expanded ? '' : 'absolute top-1 right-1'}`}>
          {badge}
        </Badge>
      )}
      {!expanded && (
        <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {label}
        </div>
      )}
    </button>
  );
}
