'use client';

import { useState } from 'react';
import { MockHeader } from './shared/MockHeader';
import { MockPostCard } from './shared/MockPostCard';
import { mockPosts, mockStats, mockTrendingTopics, mockEvents } from './shared/MockData';
import { Button } from '@/components/ui/button';
import { Home, Search, MessageCircle, Calendar, Bookmark, User, PenSquare, TrendingUp, Sparkles, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Layout03Minimal() {
  const [leftSidebarExpanded, setLeftSidebarExpanded] = useState(false);
  const [rightSidebarExpanded, setRightSidebarExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <MockHeader variant="minimal" />

      {/* Main Layout */}
      <div className="relative">
        {/* Floating Left Sidebar */}
        <div
          className={`hidden lg:block fixed left-0 top-12 bottom-0 z-40 transition-all duration-300 ease-in-out ${
            leftSidebarExpanded ? 'w-[280px]' : 'w-14'
          }`}
          onMouseEnter={() => setLeftSidebarExpanded(true)}
          onMouseLeave={() => setLeftSidebarExpanded(false)}
        >
          <div className={`h-full bg-white border-r border-gray-100 ${leftSidebarExpanded ? 'shadow-lg' : ''}`}>
            <nav className="p-2 space-y-2">
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 text-blue-600 bg-blue-50 ${
                  leftSidebarExpanded ? 'px-4' : 'px-2'
                }`}
              >
                <Home className="w-5 h-5 flex-shrink-0" />
                {leftSidebarExpanded && <span>Start</span>}
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 ${leftSidebarExpanded ? 'px-4' : 'px-2'}`}
              >
                <Search className="w-5 h-5 flex-shrink-0" />
                {leftSidebarExpanded && <span>Utforsk</span>}
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 relative ${leftSidebarExpanded ? 'px-4' : 'px-2'}`}
              >
                <MessageCircle className="w-5 h-5 flex-shrink-0" />
                {leftSidebarExpanded && <span>Meldinger</span>}
                <Badge className="absolute top-1 right-1 w-2 h-2 p-0 bg-red-500" />
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 ${leftSidebarExpanded ? 'px-4' : 'px-2'}`}
              >
                <Calendar className="w-5 h-5 flex-shrink-0" />
                {leftSidebarExpanded && <span>Kalender</span>}
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 ${leftSidebarExpanded ? 'px-4' : 'px-2'}`}
              >
                <Bookmark className="w-5 h-5 flex-shrink-0" />
                {leftSidebarExpanded && <span>Bokmerker</span>}
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 ${leftSidebarExpanded ? 'px-4' : 'px-2'}`}
              >
                <User className="w-5 h-5 flex-shrink-0" />
                {leftSidebarExpanded && <span>Profil</span>}
              </Button>
            </nav>
          </div>
        </div>

        {/* Main Content - Centered */}
        <main className={`min-h-screen transition-all duration-300 ${
          leftSidebarExpanded ? 'lg:ml-[280px]' : 'lg:ml-14'
        } ${
          rightSidebarExpanded ? 'lg:mr-[320px]' : 'lg:mr-12'
        }`}>
          <div className="max-w-[600px] mx-auto px-4 pt-20 pb-32">
            {/* Feed */}
            <div className="space-y-8">
              {mockPosts.map((post) => (
                <MockPostCard key={post.id} post={post} variant="minimal" />
              ))}
            </div>
          </div>
        </main>

        {/* Floating Right Sidebar */}
        <div
          className={`hidden lg:block fixed right-0 top-12 bottom-0 z-40 transition-all duration-300 ease-in-out ${
            rightSidebarExpanded ? 'w-[320px]' : 'w-12'
          }`}
          onMouseEnter={() => setRightSidebarExpanded(true)}
          onMouseLeave={() => setRightSidebarExpanded(false)}
        >
          <div className={`h-full bg-white border-l border-gray-100 overflow-y-auto ${
            rightSidebarExpanded ? 'shadow-lg' : ''
          }`}>
            {!rightSidebarExpanded ? (
              // Icon-only peek
              <div className="p-2 space-y-4 flex flex-col items-center">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <TrendingUp className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Sparkles className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <User className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            ) : (
              // Expanded content
              <div className="p-4 space-y-4">
                {/* Stats */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      Statistikk
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Medlemmer</span>
                      <span className="font-semibold">{mockStats.totalMembers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Online</span>
                      <span className="font-semibold text-green-600">{mockStats.onlineNow}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Trending */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-orange-600" />
                      Populært
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {mockTrendingTopics.slice(0, 5).map((topic, index) => (
                      <button
                        key={index}
                        className="w-full flex justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                      >
                        <span className="text-sm font-medium text-blue-600">{topic.tag}</span>
                        <span className="text-xs text-gray-500">{topic.count}</span>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                {/* Events */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4 text-red-600" />
                      Kommende
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockEvents.slice(0, 3).map((event) => (
                      <div key={event.id} className="text-sm">
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{event.location}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Button */}
        <button
          className="fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-200 flex items-center justify-center group"
          aria-label="Nytt innlegg"
        >
          <PenSquare className="w-6 h-6 text-white" />
          <span className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Nytt innlegg
          </span>
        </button>

        {/* Mobile Bottom Nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 h-16">
          <div className="flex items-center justify-around h-full px-2">
            <Button variant="ghost" size="icon" className="text-blue-600">
              <Home className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="icon">
              <Search className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <MessageCircle className="w-6 h-6" />
              <Badge className="absolute top-0 right-0 w-2 h-2 p-0 bg-red-500" />
            </Button>
            <Button variant="ghost" size="icon">
              <Calendar className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="icon">
              <User className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
