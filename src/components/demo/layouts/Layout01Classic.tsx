'use client';

import { useState } from 'react';
import { MockHeader } from './shared/MockHeader';
import { MockSidebar } from './shared/MockSidebar';
import { MockPostCard } from './shared/MockPostCard';
import { mockPosts } from './shared/MockData';
import { Button } from '@/components/ui/button';
import { PenSquare, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function Layout01Classic() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const filters = [
    { id: 'all', label: 'Alle innlegg' },
    { id: 'friends', label: 'Venner' },
    { id: 'groups', label: 'Grupper' },
    { id: 'communities', label: 'Samfunn' },
    { id: 'places', label: 'Steder' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <MockHeader variant="default" />

      {/* Main Layout Container */}
      <div className="flex">
        {/* Left Sidebar - 272px, hidden on mobile/tablet */}
        <div className="hidden md:block w-[272px] sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <MockSidebar side="left" />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <div className="max-w-[768px] mx-auto p-4 md:p-6">
            {/* Inline Composer */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
              <div className="flex items-start gap-3">
                <img
                  src="https://i.pravatar.cc/150?img=1"
                  alt="User"
                  className="w-10 h-10 rounded-full"
                />
                <button
                  className="flex-1 text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                >
                  Hva tenker du på, Áile?
                </button>
                <Button size="icon" className="rounded-full bg-blue-600 hover:bg-blue-700">
                  <PenSquare className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <Filter className="w-4 h-4" />
              </Button>
              {filters.map((filter) => (
                <Badge
                  key={filter.id}
                  variant={selectedFilter === filter.id ? 'default' : 'secondary'}
                  className={`cursor-pointer px-4 py-2 flex-shrink-0 ${
                    selectedFilter === filter.id
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-white hover:bg-gray-100 border border-gray-200'
                  }`}
                  onClick={() => setSelectedFilter(filter.id)}
                >
                  {filter.label}
                </Badge>
              ))}
            </div>

            {/* Feed */}
            <div className="space-y-4">
              {mockPosts.map((post) => (
                <MockPostCard key={post.id} post={post} variant="default" />
              ))}
            </div>

            {/* Load More */}
            <div className="mt-8 text-center">
              <Button variant="outline" size="lg">
                Last inn flere innlegg
              </Button>
            </div>
          </div>
        </main>

        {/* Right Sidebar - 304px, hidden on mobile/small tablets */}
        <div className="hidden lg:block w-[304px] sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <MockSidebar side="right" />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 h-16 safe-area-bottom">
        <div className="flex items-center justify-around h-full px-2">
          <Button variant="ghost" size="icon" className="flex-col gap-1 h-auto py-2">
            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="text-xs text-blue-600 font-medium">Hjem</span>
          </Button>
          <Button variant="ghost" size="icon" className="flex-col gap-1 h-auto py-2">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-gray-500">Kalender</span>
          </Button>
          <Button variant="ghost" size="icon" className="flex-col gap-1 h-auto py-2 relative">
            <PenSquare className="w-6 h-6 text-gray-500" />
            <span className="text-xs text-gray-500">Nytt</span>
          </Button>
          <Button variant="ghost" size="icon" className="flex-col gap-1 h-auto py-2 relative">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs text-gray-500">Meldinger</span>
            <Badge className="absolute top-1 right-1 w-5 h-5 p-0 bg-red-500 flex items-center justify-center text-xs">
              5
            </Badge>
          </Button>
          <Button variant="ghost" size="icon" className="flex-col gap-1 h-auto py-2">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs text-gray-500">Profil</span>
          </Button>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
