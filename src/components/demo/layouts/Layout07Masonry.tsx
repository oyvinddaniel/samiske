'use client';

import { useState } from 'react';
import { X, Grid3x3, List, Columns, Heart, MessageCircle, Share2, MapPin, Users, Calendar } from 'lucide-react';
import { MockHeader } from './shared/MockHeader';
import { mockPosts, mockEvents, mockCommunities, formatTimestamp } from './shared/MockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

type ViewMode = 'masonry' | 'grid' | 'list';

export function Layout07Masonry() {
  const [viewMode, setViewMode] = useState<ViewMode>('masonry');
  const [selectedPost, setSelectedPost] = useState<any>(null);

  // Create diverse card types from posts
  const cards = [
    // Featured posts
    ...mockPosts.slice(0, 2).map((post, index) => ({ ...post, cardType: 'featured', key: `featured-${index}` })),
    // Standard posts with images
    ...mockPosts.slice(2, 10).filter(p => p.images).map((post, index) => ({ ...post, cardType: 'standard', key: `standard-${index}` })),
    // Events
    ...mockEvents.slice(0, 3).map((event, index) => ({ ...event, cardType: 'event', key: `event-${index}` })),
    // Quote/text posts
    ...mockPosts.slice(10, 13).filter(p => !p.images).map((post, index) => ({ ...post, cardType: 'quote', key: `quote-${index}` })),
    // Communities
    ...mockCommunities.slice(0, 3).map((community, index) => ({ ...community, cardType: 'community', key: `community-${index}` })),
    // More standard
    ...mockPosts.slice(13, 20).map((post, index) => ({ ...post, cardType: 'standard', key: `standard2-${index}` })),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <MockHeader variant="default" />

      {/* Toolbar */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">Utforsk</h2>
            <Badge variant="secondary" className="text-xs">
              {cards.length} elementer
            </Badge>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">Visning:</span>
            <Button
              variant={viewMode === 'masonry' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('masonry')}
              className="gap-2"
            >
              <Grid3x3 className="w-4 h-4" />
              Masonry
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="gap-2"
            >
              <Columns className="w-4 h-4" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-2"
            >
              <List className="w-4 h-4" />
              Liste
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto p-4 md:p-6">
        {/* Masonry Grid */}
        {viewMode === 'masonry' && (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-4 md:gap-6">
            {cards.map((card) => (
              <div key={card.key} className="break-inside-avoid mb-4 md:mb-6">
                <MasonryCard card={card} onClick={() => setSelectedPost(card)} />
              </div>
            ))}
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {cards.map((card) => (
              <GridCard key={card.key} card={card} onClick={() => setSelectedPost(card)} />
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="max-w-4xl mx-auto space-y-3">
            {cards.map((card) => (
              <ListCard key={card.key} card={card} onClick={() => setSelectedPost(card)} />
            ))}
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setSelectedPost(null)}
          >
            <X className="w-6 h-6" />
          </Button>

          <div className="max-w-5xl w-full bg-white rounded-xl overflow-hidden max-h-[90vh] flex flex-col">
            {selectedPost.images && selectedPost.images[0] && (
              <div className="flex-shrink-0">
                <img
                  src={selectedPost.images[0]}
                  alt="Post"
                  className="w-full h-auto max-h-[60vh] object-contain bg-gray-100"
                />
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-start gap-3 mb-4">
                <img
                  src={selectedPost.author?.avatar || selectedPost.logo}
                  alt="Author"
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {selectedPost.author?.name || selectedPost.name || selectedPost.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedPost.timestamp && formatTimestamp(selectedPost.timestamp)}
                  </p>
                </div>
              </div>

              <p className="text-gray-800 leading-relaxed mb-4">
                {selectedPost.content || selectedPost.description}
              </p>

              {selectedPost.location && (
                <Badge variant="secondary" className="mb-4">
                  <MapPin className="w-3 h-3 mr-1" />
                  {selectedPost.location}
                </Badge>
              )}

              {selectedPost.likes !== undefined && (
                <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
                  <button className="flex items-center gap-2 text-gray-600 hover:text-red-500">
                    <Heart className="w-5 h-5" />
                    <span>{selectedPost.likes}</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500">
                    <MessageCircle className="w-5 h-5" />
                    <span>{selectedPost.comments || 0}</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Masonry Card Component
function MasonryCard({ card, onClick }: { card: any; onClick: () => void }) {
  if (card.cardType === 'featured') {
    return (
      <Card className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer" onClick={onClick}>
        {card.images && card.images[0] && (
          <div className="relative h-96">
            <img src={card.images[0]} alt="Featured" className="w-full h-full object-cover" />
            {card.community && (
              <Badge className="absolute top-4 left-4 bg-blue-600 text-white">
                <Users className="w-3 h-3 mr-1" />
                {card.community}
              </Badge>
            )}
          </div>
        )}
        <CardContent className="p-4">
          <p className="font-bold text-lg text-gray-900 mb-2">{card.content?.slice(0, 100)}...</p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <img src={card.author.avatar} alt="" className="w-6 h-6 rounded-full" />
            <span>{card.author.name}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (card.cardType === 'event') {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
        {card.image && (
          <img src={card.image} alt={card.title} className="w-full h-48 object-cover" />
        )}
        <CardContent className="p-4">
          <Badge variant="secondary" className="mb-2">
            <Calendar className="w-3 h-3 mr-1" />
            Arrangement
          </Badge>
          <p className="font-semibold text-gray-900 mb-2">{card.title}</p>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {card.location}
          </p>
          <p className="text-sm text-gray-500 mt-1">{card.attendees} deltar</p>
        </CardContent>
      </Card>
    );
  }

  if (card.cardType === 'quote') {
    const colors = ['from-blue-500 to-purple-600', 'from-pink-500 to-rose-600', 'from-green-500 to-teal-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    return (
      <Card className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br ${randomColor}`} onClick={onClick}>
        <CardContent className="p-6">
          <p className="text-white text-lg font-medium leading-relaxed">
            "{card.content}"
          </p>
          <p className="text-white/80 text-sm mt-4">— {card.author.name}</p>
        </CardContent>
      </Card>
    );
  }

  if (card.cardType === 'community') {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <img src={card.logo} alt={card.name} className="w-16 h-16 rounded-lg" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{card.name}</p>
              <p className="text-sm text-gray-500">{card.members} medlemmer</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-3">{card.description}</p>
          <Button size="sm" className="w-full">Bli med</Button>
        </CardContent>
      </Card>
    );
  }

  // Standard card
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      {card.images && card.images[0] && (
        <img src={card.images[0]} alt="Post" className="w-full h-auto object-cover" />
      )}
      <CardContent className="p-4">
        <p className="text-gray-800 text-sm line-clamp-3 mb-3">{card.content}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <img src={card.author.avatar} alt="" className="w-6 h-6 rounded-full" />
            <span className="text-xs">{card.author.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {card.likes}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Grid Card Component
function GridCard({ card, onClick }: { card: any; onClick: () => void }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <div className="aspect-square bg-gray-100">
        {card.images?.[0] && (
          <img src={card.images[0]} alt="" className="w-full h-full object-cover" />
        )}
        {card.image && (
          <img src={card.image} alt="" className="w-full h-full object-cover" />
        )}
        {!card.images && !card.image && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
            <p className="text-white font-semibold text-center p-4">
              {card.name || card.title || card.content?.slice(0, 50)}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

// List Card Component
function ListCard({ card, onClick }: { card: any; onClick: () => void }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className="flex gap-4 p-4">
        {(card.images?.[0] || card.image || card.logo) && (
          <img
            src={card.images?.[0] || card.image || card.logo}
            alt=""
            className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 mb-1">
            {card.author?.name || card.name || card.title}
          </p>
          <p className="text-sm text-gray-600 line-clamp-2">
            {card.content || card.description}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            {card.likes !== undefined && <span>{card.likes} likes</span>}
            {card.members && <span>{card.members} medlemmer</span>}
            {card.attendees && <span>{card.attendees} deltar</span>}
          </div>
        </div>
      </div>
    </Card>
  );
}
