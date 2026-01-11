'use client';

import { Home, Calendar, MessageCircle, Users, MapPin, Bookmark, TrendingUp, Clock, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { mockEvents, mockCommunities, mockTrendingTopics, mockStats, mockComments, formatTimestamp } from './MockData';

interface MockSidebarProps {
  side: 'left' | 'right';
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
}

export function MockSidebar({ side, variant = 'default', className = '' }: MockSidebarProps) {
  if (side === 'left') {
    return (
      <aside className={`bg-white border-r border-gray-200 ${className}`}>
        <div className="p-4 space-y-4">
          {/* User Profile Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src="https://i.pravatar.cc/150?img=1"
                  alt="User"
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">Áile Somby</p>
                  <p className="text-sm text-gray-500">Guovdageaidnu</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
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
            </CardContent>
          </Card>

          {/* Navigation */}
          <nav className="space-y-1">
            <Button variant="ghost" className="w-full justify-start gap-3 text-blue-600 bg-blue-50">
              <Home className="w-5 h-5" />
              <span>Start</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Calendar className="w-5 h-5" />
              <span>Kalender</span>
              <Badge variant="secondary" className="ml-auto">3</Badge>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <MessageCircle className="w-5 h-5" />
              <span>Meldinger</span>
              <Badge className="ml-auto bg-red-500">5</Badge>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Bookmark className="w-5 h-5" />
              <span>Bokmerker</span>
            </Button>
          </nav>

          <Separator />

          {/* Mine steder */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 px-2">Mine steder</h3>
            <div className="space-y-1">
              {['Guovdageaidnu', 'Kárášjohka', 'Romsa'].map((place, index) => (
                <Button key={index} variant="ghost" className="w-full justify-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="truncate">{place}</span>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Grupper */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 px-2">Mine grupper</h3>
            <div className="space-y-1">
              {mockCommunities.slice(0, 3).map((community) => (
                <Button key={community.id} variant="ghost" className="w-full justify-start gap-3 text-sm">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="truncate">{community.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Right sidebar
  return (
    <aside className={`bg-gray-50 border-l border-gray-200 overflow-y-auto ${className}`}>
      <div className="p-4 space-y-4">
        {/* Stats Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Statistikk
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
              <span className="text-sm text-gray-600">Kommentarer</span>
              <span className="font-semibold text-gray-900">{mockStats.commentsToday}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                Online nå
              </span>
              <span className="font-semibold text-gray-900">{mockStats.onlineNow}</span>
            </div>
          </CardContent>
        </Card>

        {/* Trending Topics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-600" />
              Populære emner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockTrendingTopics.map((topic, index) => (
              <button
                key={index}
                className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg transition-colors text-left"
              >
                <span className="text-sm font-medium text-blue-600">{topic.tag}</span>
                <span className="text-xs text-gray-500">{topic.count} innlegg</span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Kommende arrangementer */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-600" />
              Kommende arrangementer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockEvents.slice(0, 3).map((event) => (
              <div key={event.id} className="flex gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                {event.image && (
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {formatTimestamp(event.date)}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {event.location}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Nye samfunn */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              Nye samfunn
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockCommunities.slice(0, 3).map((community) => (
              <div key={community.id} className="flex items-start gap-3">
                <img
                  src={community.logo}
                  alt={community.name}
                  className="w-10 h-10 rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{community.name}</p>
                  <p className="text-xs text-gray-500">{community.members} medlemmer</p>
                  <Button size="sm" variant="outline" className="mt-2 h-7 text-xs">
                    Bli med
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Siste kommentarer */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              Siste kommentarer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockComments.slice(0, 3).map((comment) => (
              <div key={comment.id} className="flex gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                <img
                  src={comment.author.avatar}
                  alt={comment.author.name}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900">{comment.author.name}</p>
                  <p className="text-xs text-gray-600 line-clamp-2 mt-1">{comment.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatTimestamp(comment.timestamp)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
