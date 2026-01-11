'use client';

import { useState, useRef } from 'react';
import { MockHeader } from './shared/MockHeader';
import { MockPostCard } from './shared/MockPostCard';
import { mockPosts } from './shared/MockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, ChevronLeft, Link2Off, Menu } from 'lucide-react';

type FeedType = 'all' | 'friends' | 'community' | 'location' | 'group' | 'bookmarks';

interface FeedConfig {
  id: string;
  type: FeedType;
  label: string;
}

const feedOptions: { value: FeedType; label: string }[] = [
  { value: 'all', label: 'Alle innlegg' },
  { value: 'friends', label: 'Venner' },
  { value: 'community', label: 'Samfunn' },
  { value: 'location', label: 'Lokasjon' },
  { value: 'group', label: 'Gruppe' },
  { value: 'bookmarks', label: 'Bokmerker' },
];

export function Layout05Split() {
  const [leftFeed, setLeftFeed] = useState<FeedType>('all');
  const [rightFeed, setRightFeed] = useState<FeedType>('friends');
  const [syncScroll, setSyncScroll] = useState(false);
  const [splitRatio, setSplitRatio] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newRatio = ((e.clientX - containerRect.left) / containerRect.width) * 100;

    // Clamp between 33% and 67%
    if (newRatio >= 33 && newRatio <= 67) {
      setSplitRatio(newRatio);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    setSplitRatio(50); // Reset to 50/50
  };

  const presets = [
    { name: 'Venner + Alle', left: 'friends' as FeedType, right: 'all' as FeedType },
    { name: 'Hjem + Trending', left: 'all' as FeedType, right: 'community' as FeedType },
    { name: 'Lokasjon + Gruppe', left: 'location' as FeedType, right: 'group' as FeedType },
    { name: 'Bokmerker + Venner', left: 'bookmarks' as FeedType, right: 'friends' as FeedType },
  ];

  return (
    <div className="min-h-screen bg-gray-50" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      {/* Header */}
      <MockHeader variant="default" />

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar - Presets */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-0'} lg:w-64 bg-white border-r border-gray-200 overflow-hidden transition-all`}>
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Forhåndsvalg</h3>
              <div className="space-y-2">
                {presets.map((preset, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left"
                    onClick={() => {
                      setLeftFeed(preset.left);
                      setRightFeed(preset.right);
                    }}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => setSplitRatio(50)}
              >
                <RefreshCw className="w-4 h-4" />
                Tilbakestill 50/50
              </Button>
            </div>
          </div>
        </div>

        {/* Dual Feed Container */}
        <div className="flex-1 flex" ref={containerRef}>
          {/* Left Feed */}
          <div className="overflow-hidden" style={{ width: `${splitRatio}%` }}>
            <FeedPanel
              feedType={leftFeed}
              onChangeFeed={setLeftFeed}
              syncScroll={syncScroll}
              onToggleSync={() => setSyncScroll(!syncScroll)}
              position="left"
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />
          </div>

          {/* Resizable Divider */}
          <div
            className={`w-2 bg-gray-300 hover:bg-blue-500 cursor-col-resize flex-shrink-0 group relative ${
              isDragging ? 'bg-blue-500' : ''
            }`}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
          >
            <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-1 bg-white/50 group-hover:bg-white"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-600 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {splitRatio.toFixed(0)}% / {(100 - splitRatio).toFixed(0)}%
            </div>
          </div>

          {/* Right Feed */}
          <div className="overflow-hidden" style={{ width: `${100 - splitRatio}%` }}>
            <FeedPanel
              feedType={rightFeed}
              onChangeFeed={setRightFeed}
              syncScroll={syncScroll}
              onToggleSync={() => setSyncScroll(!syncScroll)}
              position="right"
            />
          </div>
        </div>
      </div>

      {/* Mobile: Tabs instead of split */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex">
        <button className="flex-1 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
          {feedOptions.find(f => f.value === leftFeed)?.label}
        </button>
        <button className="flex-1 py-3 text-sm font-medium text-gray-600">
          {feedOptions.find(f => f.value === rightFeed)?.label}
        </button>
      </div>
    </div>
  );
}

interface FeedPanelProps {
  feedType: FeedType;
  onChangeFeed: (type: FeedType) => void;
  syncScroll: boolean;
  onToggleSync: () => void;
  position: 'left' | 'right';
  onToggleSidebar?: () => void;
}

function FeedPanel({ feedType, onChangeFeed, syncScroll, onToggleSync, position, onToggleSidebar }: FeedPanelProps) {
  const currentLabel = feedOptions.find(f => f.value === feedType)?.label || 'Ukjent';

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Feed Header */}
      <div className="flex-shrink-0 border-b border-gray-200 p-3">
        <div className="flex items-center gap-2 mb-2">
          {position === 'left' && onToggleSidebar && (
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onToggleSidebar}>
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <select
            value={feedType}
            onChange={(e) => onChangeFeed(e.target.value as FeedType)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {feedOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {position === 'left' && (
            <Button
              variant={syncScroll ? 'default' : 'outline'}
              size="icon"
              onClick={onToggleSync}
              title={syncScroll ? 'Synkronisert' : 'Ikke synkronisert'}
            >
              {syncScroll ? <Link2Off className="w-4 h-4 rotate-45" /> : <Link2Off className="w-4 h-4" />}
            </Button>
          )}
        </div>

        <Badge variant="secondary" className="text-xs">
          {feedType === 'all' && 'Viser alle innlegg'}
          {feedType === 'friends' && 'Kun venner'}
          {feedType === 'community' && 'Fra samfunn'}
          {feedType === 'location' && 'Fra lokasjon'}
          {feedType === 'group' && 'Fra gruppe'}
          {feedType === 'bookmarks' && 'Bokmerker'}
        </Badge>
      </div>

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mockPosts.slice(0, 10).map((post) => (
          <MockPostCard key={post.id} post={post} variant="default" />
        ))}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-gray-200 p-3 bg-gray-50">
        <Button variant="outline" size="sm" className="w-full gap-2">
          <RefreshCw className="w-4 h-4" />
          Last inn flere
        </Button>
      </div>
    </div>
  );
}
