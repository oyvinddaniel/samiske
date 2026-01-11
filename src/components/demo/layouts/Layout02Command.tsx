'use client';

import { useState } from 'react';
import { MockHeader } from './shared/MockHeader';
import { MockPostCard } from './shared/MockPostCard';
import { mockPosts } from './shared/MockData';
import { Button } from '@/components/ui/button';
import { Home, MapPin, Users, FolderOpen, Calendar, MessageCircle, Settings, Plus, X, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type Space = 'home' | 'sapmi' | 'groups' | 'communities' | 'bookmarks';
type View = 'feed' | 'calendar' | 'messages' | 'settings';

export function Layout02Command() {
  const [activeSpace, setActiveSpace] = useState<Space>('home');
  const [activeView, setActiveView] = useState<View>('feed');
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Dark Header */}
      <MockHeader variant="dark" />

      {/* Main 4-Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* 1. Space Switcher (72px) */}
        <div className="w-18 bg-gray-950 border-r border-gray-800 flex flex-col items-center py-4 gap-3">
          <SpaceButton
            icon={<Home className="w-6 h-6" />}
            active={activeSpace === 'home'}
            onClick={() => setActiveSpace('home')}
            label="Hjem"
          />
          <SpaceButton
            icon={<MapPin className="w-6 h-6" />}
            active={activeSpace === 'sapmi'}
            onClick={() => setActiveSpace('sapmi')}
            label="Sápmi"
          />
          <SpaceButton
            icon={<Users className="w-6 h-6" />}
            active={activeSpace === 'groups'}
            onClick={() => setActiveSpace('groups')}
            label="Grupper"
          />
          <SpaceButton
            icon={<FolderOpen className="w-6 h-6" />}
            active={activeSpace === 'communities'}
            onClick={() => setActiveSpace('communities')}
            label="Samfunn"
          />

          <div className="flex-1"></div>

          <button className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Navigation Sidebar (240px) */}
        <div className="hidden md:block w-60 bg-gray-900 border-r border-gray-800 overflow-y-auto">
          <NavigationSidebar activeSpace={activeSpace} activeView={activeView} setActiveView={setActiveView} />
        </div>

        {/* 3. Main Content (flex-1) */}
        <div className="flex-1 bg-gray-800 overflow-y-auto">
          <MainContent activeSpace={activeSpace} activeView={activeView} onSelectPost={setSelectedPost} />
        </div>

        {/* 4. Inspector Panel (320px, toggleable) */}
        {inspectorOpen && (
          <div className="hidden lg:block w-80 bg-gray-900 border-l border-gray-800 overflow-y-auto">
            <InspectorPanel selectedPost={selectedPost} onClose={() => setInspectorOpen(false)} />
          </div>
        )}

        {!inspectorOpen && (
          <button
            onClick={() => setInspectorOpen(true)}
            className="hidden lg:block w-8 bg-gray-900 border-l border-gray-800 hover:bg-gray-800 transition-colors"
          >
            <ChevronRight className="w-5 h-5 mx-auto text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
}

function SpaceButton({ icon, active, onClick, label }: { icon: React.ReactNode; active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all relative group ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {icon}
      {active && <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r"></div>}

      {/* Tooltip */}
      <div className="absolute left-full ml-2 px-3 py-2 bg-gray-950 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {label}
      </div>
    </button>
  );
}

function NavigationSidebar({ activeSpace, activeView, setActiveView }: { activeSpace: Space; activeView: View; setActiveView: (view: View) => void }) {
  const getNavItems = () => {
    switch (activeSpace) {
      case 'home':
        return [
          { id: 'feed', label: 'Feed', icon: <Home className="w-5 h-5" />, badge: null },
          { id: 'calendar', label: 'Kalender', icon: <Calendar className="w-5 h-5" />, badge: 3 },
          { id: 'messages', label: 'Meldinger', icon: <MessageCircle className="w-5 h-5" />, badge: 5 },
          { id: 'settings', label: 'Innstillinger', icon: <Settings className="w-5 h-5" />, badge: null },
        ];
      case 'sapmi':
        return [
          { id: 'feed', label: 'Alle steder', icon: <MapPin className="w-5 h-5" />, badge: null },
          { id: 'feed', label: 'Guovdageaidnu', icon: <MapPin className="w-5 h-5" />, badge: null },
          { id: 'feed', label: 'Kárášjohka', icon: <MapPin className="w-5 h-5" />, badge: null },
          { id: 'feed', label: 'Romsa', icon: <MapPin className="w-5 h-5" />, badge: null },
        ];
      case 'groups':
        return [
          { id: 'feed', label: 'Duodji i praksis', icon: <Users className="w-5 h-5" />, badge: 2 },
          { id: 'feed', label: 'Samisk matkultur', icon: <Users className="w-5 h-5" />, badge: null },
          { id: 'feed', label: 'Nordsamisk språk', icon: <Users className="w-5 h-5" />, badge: 1 },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="p-4 space-y-1">
      <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3 px-2">
        {activeSpace === 'home' && 'Navigasjon'}
        {activeSpace === 'sapmi' && 'Steder'}
        {activeSpace === 'groups' && 'Dine grupper'}
        {activeSpace === 'communities' && 'Samfunn'}
      </h3>

      {navItems.map((item) => (
        <button
          key={item.label}
          onClick={() => setActiveView(item.id as View)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            activeView === item.id
              ? 'bg-gray-800 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
        >
          {item.icon}
          <span className="flex-1 text-left text-sm">{item.label}</span>
          {item.badge && (
            <Badge className="bg-red-500 text-white text-xs">{item.badge}</Badge>
          )}
        </button>
      ))}
    </div>
  );
}

function MainContent({ activeSpace, activeView, onSelectPost }: { activeSpace: Space; activeView: View; onSelectPost: (post: any) => void }) {
  return (
    <div className="p-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <span className="capitalize">{activeSpace}</span>
        <ChevronRight className="w-4 h-4" />
        <span className="capitalize text-white">{activeView}</span>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {mockPosts.slice(0, 5).map((post) => (
          <div key={post.id} onClick={() => onSelectPost(post)} className="cursor-pointer">
            <MockPostCard post={post} variant="default" />
          </div>
        ))}
      </div>
    </div>
  );
}

function InspectorPanel({ selectedPost, onClose }: { selectedPost: any; onClose: () => void }) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-300">Detaljer</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {selectedPost ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img
              src={selectedPost.author.avatar}
              alt={selectedPost.author.name}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <p className="font-semibold text-white">{selectedPost.author.name}</p>
              <p className="text-sm text-gray-400">{selectedPost.author.location}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-300 leading-relaxed">{selectedPost.content}</p>
          </div>

          {selectedPost.images && selectedPost.images[0] && (
            <img
              src={selectedPost.images[0]}
              alt="Post"
              className="w-full rounded-lg"
            />
          )}

          <div className="space-y-2 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Likes</span>
              <span className="text-white font-semibold">{selectedPost.likes}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Kommentarer</span>
              <span className="text-white font-semibold">{selectedPost.comments}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Delinger</span>
              <span className="text-white font-semibold">{selectedPost.shares}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">Velg et innlegg for å se detaljer</p>
        </div>
      )}
    </div>
  );
}
