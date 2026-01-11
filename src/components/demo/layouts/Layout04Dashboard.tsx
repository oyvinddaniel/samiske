'use client';

import { useState } from 'react';
import { MockHeader } from './shared/MockHeader';
import { MockPostCard } from './shared/MockPostCard';
import { mockPosts, mockEvents, mockCommunities, mockStats, mockTrendingTopics, formatTimestamp } from './shared/MockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, TrendingUp, Calendar, MessageCircle, Users, MapPin, Activity } from 'lucide-react';

type WidgetType = 'feed' | 'profile' | 'stats' | 'calendar' | 'trending' | 'messages' | 'suggestions' | 'communities' | 'map' | 'activity';

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  span: number; // Grid columns to span (1-12)
  visible: boolean;
}

const defaultWidgets: Widget[] = [
  { id: 'feed', type: 'feed', title: 'Feed', span: 8, visible: true },
  { id: 'profile', type: 'profile', title: 'Min profil', span: 4, visible: true },
  { id: 'stats', type: 'stats', title: 'Statistikk', span: 4, visible: true },
  { id: 'calendar', type: 'calendar', title: 'Kalender', span: 4, visible: true },
  { id: 'trending', type: 'trending', title: 'Populært', span: 4, visible: true },
  { id: 'communities', type: 'communities', title: 'Samfunn', span: 4, visible: true },
];

export function Layout04Dashboard() {
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets);
  const [customizeMode, setCustomizeMode] = useState(false);

  const toggleWidget = (id: string) => {
    setWidgets(widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Header */}
      <MockHeader variant="top-nav" />

      {/* Subheader */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
            <Badge variant="secondary">
              {widgets.filter(w => w.visible).length} widgets
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={customizeMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCustomizeMode(!customizeMode)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Tilpass
            </Button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {widgets.filter(w => w.visible).map((widget) => (
            <div
              key={widget.id}
              className={`col-span-12 md:col-span-${widget.span}`}
              style={{
                gridColumn: window.innerWidth >= 768 ? `span ${widget.span} / span ${widget.span}` : 'span 12 / span 12'
              }}
            >
              <WidgetRenderer widget={widget} customizeMode={customizeMode} onToggle={() => toggleWidget(widget.id)} />
            </div>
          ))}
        </div>

        {/* Customize Panel */}
        {customizeMode && (
          <Card className="mt-6 border-2 border-blue-500">
            <CardHeader>
              <CardTitle>Tilpass dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Velg hvilke widgets du vil vise på dashboardet ditt
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {widgets.map((widget) => (
                  <Button
                    key={widget.id}
                    variant={widget.visible ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleWidget(widget.id)}
                    className="justify-start"
                  >
                    {widget.title}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Om oss</h4>
              <ul className="space-y-1">
                <li><a href="#" className="hover:text-gray-900">Om samiske.no</a></li>
                <li><a href="#" className="hover:text-gray-900">Karriere</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Støtte</h4>
              <ul className="space-y-1">
                <li><a href="#" className="hover:text-gray-900">Hjelp</a></li>
                <li><a href="#" className="hover:text-gray-900">Kontakt</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Legal</h4>
              <ul className="space-y-1">
                <li><a href="#" className="hover:text-gray-900">Personvern</a></li>
                <li><a href="#" className="hover:text-gray-900">Vilkår</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Følg oss</h4>
              <ul className="space-y-1">
                <li><a href="#" className="hover:text-gray-900">Facebook</a></li>
                <li><a href="#" className="hover:text-gray-900">Instagram</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            © 2026 samiske.no. Alle rettigheter reservert.
          </div>
        </div>
      </footer>
    </div>
  );
}

function WidgetRenderer({ widget, customizeMode, onToggle }: { widget: Widget; customizeMode: boolean; onToggle: () => void }) {
  if (widget.type === 'feed') {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{widget.title}</span>
            {customizeMode && <Button variant="ghost" size="sm" onClick={onToggle}>Skjul</Button>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockPosts.slice(0, 3).map((post) => (
            <MockPostCard key={post.id} post={post} variant="compact" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (widget.type === 'profile') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{widget.title}</span>
            {customizeMode && <Button variant="ghost" size="sm" onClick={onToggle}>Skjul</Button>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center text-center">
            <img
              src="https://i.pravatar.cc/150?img=1"
              alt="Profile"
              className="w-20 h-20 rounded-full mb-3"
            />
            <h3 className="font-semibold text-gray-900">Áile Somby</h3>
            <p className="text-sm text-gray-500 mb-4">Guovdageaidnu</p>
            <div className="grid grid-cols-3 gap-4 w-full text-center">
              <div>
                <p className="font-semibold text-gray-900">234</p>
                <p className="text-xs text-gray-500">Innlegg</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">589</p>
                <p className="text-xs text-gray-500">Venner</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">12</p>
                <p className="text-xs text-gray-500">Grupper</p>
              </div>
            </div>
            <Button className="w-full mt-4" size="sm">Rediger profil</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (widget.type === 'stats') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              {widget.title}
            </span>
            {customizeMode && <Button variant="ghost" size="sm" onClick={onToggle}>Skjul</Button>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Medlemmer</span>
            <span className="font-semibold text-gray-900">{mockStats.totalMembers.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Innlegg i dag</span>
            <span className="font-semibold text-gray-900">{mockStats.postsToday}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Online nå</span>
            <span className="font-semibold text-green-600">{mockStats.onlineNow}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (widget.type === 'calendar') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-600" />
              {widget.title}
            </span>
            {customizeMode && <Button variant="ghost" size="sm" onClick={onToggle}>Skjul</Button>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockEvents.slice(0, 3).map((event) => (
            <div key={event.id} className="flex gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex flex-col items-center justify-center">
                <span className="text-xs text-red-600 font-semibold">
                  {event.date.toLocaleDateString('no-NO', { day: 'numeric' })}
                </span>
                <span className="text-xs text-red-600">
                  {event.date.toLocaleDateString('no-NO', { month: 'short' })}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{event.title}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.location}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (widget.type === 'trending') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-600" />
              {widget.title}
            </span>
            {customizeMode && <Button variant="ghost" size="sm" onClick={onToggle}>Skjul</Button>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {mockTrendingTopics.map((topic, index) => (
            <button
              key={index}
              className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
            >
              <span className="text-sm font-medium text-blue-600">{topic.tag}</span>
              <span className="text-xs text-gray-500">{topic.count}</span>
            </button>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (widget.type === 'communities') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              {widget.title}
            </span>
            {customizeMode && <Button variant="ghost" size="sm" onClick={onToggle}>Skjul</Button>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockCommunities.slice(0, 3).map((community) => (
            <div key={community.id} className="flex items-center gap-3">
              <img src={community.logo} alt={community.name} className="w-10 h-10 rounded-lg" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{community.name}</p>
                <p className="text-xs text-gray-500">{community.members} medlemmer</p>
              </div>
              <Button size="sm" variant="outline">Bli med</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <span>{widget.title}</span>
          {customizeMode && <Button variant="ghost" size="sm" onClick={onToggle}>Skjul</Button>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500">Widget innhold kommer her</p>
      </CardContent>
    </Card>
  );
}
