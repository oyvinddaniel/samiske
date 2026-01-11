'use client';

import { useState } from 'react';
import { mockPosts, mockUsers } from '../layouts/shared/MockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, MapPin, Users, Calendar, MessageCircle, User, Heart, Send, Sparkles } from 'lucide-react';

/**
 * Variant 4: Emotional Connection
 * Psychology: Emotional design, human connection, trust building
 * Features:
 * - Warme farger (coral/orange accents)
 * - Større avatarer (56px vs 40px)
 * - Rounded corners (16px)
 * - Soft shadows
 * - Reaction faces instead of numbers
 * - "Send hug" / "Send support" reactions
 * - Profile pictures prominent
 * - Warm palette
 */

export function LayoutClassic04EmotionalConnection() {
  const [selectedReaction, setSelectedReaction] = useState<{ [key: string]: string }>({});

  const reactions = [
    { emoji: '🤗', label: 'Send klem' },
    { emoji: '💖', label: 'Hjerte' },
    { emoji: '🌟', label: 'Inspirerende' },
    { emoji: '💪', label: 'Støtte' },
    { emoji: '🙏', label: 'Takk' },
    { emoji: '😊', label: 'Smil' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-coral-50 to-pink-50">
      {/* Warm Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-coral-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">samiske.no</span>
          </div>

          <div className="flex-1 max-w-md mx-6">
            <input
              type="search"
              placeholder="Søk etter mennesker og innhold..."
              className="w-full px-4 py-2 bg-orange-50 border border-orange-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-2xl">
              <Calendar className="w-5 h-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-2xl relative">
              <MessageCircle className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-coral-500 rounded-full"></span>
            </Button>
            <img
              src="https://i.pravatar.cc/150?img=1"
              alt="Din profil"
              className="w-10 h-10 rounded-2xl cursor-pointer hover:shadow-lg transition-shadow"
            />
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Left Sidebar - Warm Navigation */}
        <aside className="hidden md:block w-72 sticky top-16 h-[calc(100vh-64px)] p-6">
          {/* Profile Card with Larger Avatar */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-orange-100 mb-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <img
                  src="https://i.pravatar.cc/150?img=1"
                  alt="Din profil"
                  className="w-20 h-20 rounded-3xl shadow-lg"
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-400 to-coral-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm">😊</span>
                </div>
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Ávjovárri Sáráhkká</h3>
              <p className="text-sm text-gray-500 mb-4">Guovdageaidnu, Sápmi</p>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <p className="font-bold text-gray-900">234</p>
                  <p className="text-gray-500">Venner</p>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div>
                  <p className="font-bold text-gray-900">89</p>
                  <p className="text-gray-500">Innlegg</p>
                </div>
              </div>
            </div>
          </div>

          {/* Close Friends */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-orange-100 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Heart className="w-4 h-4 text-coral-500 fill-current" />
              Nære venner
            </h3>
            <div className="space-y-3">
              {mockUsers.slice(0, 4).map((user, i) => (
                <button
                  key={i}
                  className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-orange-50 transition-colors"
                >
                  <div className="relative">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-2xl"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">😊 I godt humør</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <NavItem icon={<Home className="w-5 h-5" />} label="Hjem" active />
            <NavItem icon={<MapPin className="w-5 h-5" />} label="Steder" />
            <NavItem icon={<Users className="w-5 h-5" />} label="Fellesskap" />
            <NavItem icon={<Sparkles className="w-5 h-5" />} label="Inspirasjoner" />
          </nav>
        </aside>

        {/* Main Feed - Warm Design */}
        <main className="flex-1 max-w-2xl mx-auto px-6 py-6">
          {/* Warm Composer */}
          <div className="bg-gradient-to-br from-white to-orange-50 rounded-3xl p-6 shadow-lg border border-orange-100 mb-6">
            <div className="flex items-start gap-4">
              <img
                src="https://i.pravatar.cc/150?img=1"
                alt="Du"
                className="w-14 h-14 rounded-3xl shadow-md"
              />
              <div className="flex-1">
                <textarea
                  placeholder="Del noe varmt med fellesskapet... 💛"
                  className="w-full p-4 border border-orange-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none bg-white/80 backdrop-blur-sm"
                  rows={3}
                ></textarea>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3 text-2xl">
                    <button className="hover:scale-125 transition-transform">📷</button>
                    <button className="hover:scale-125 transition-transform">😊</button>
                    <button className="hover:scale-125 transition-transform">📍</button>
                  </div>
                  <Button className="bg-gradient-to-r from-orange-400 to-coral-500 hover:from-orange-500 hover:to-coral-600 rounded-2xl shadow-lg">
                    <Heart className="w-4 h-4 mr-2" />
                    Del kjærlighet
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts with Emotional Design */}
          <div className="space-y-6">
            {mockPosts.slice(0, 5).map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-3xl shadow-lg border border-orange-100 p-8 hover:shadow-xl transition-all"
              >
                {/* Author with Large Avatar */}
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-16 h-16 rounded-3xl shadow-md"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-lg">{post.author.name}</p>
                    <p className="text-sm text-gray-500">{post.author.location}</p>
                    <p className="text-xs text-gray-400">{typeof post.timestamp === 'string' ? post.timestamp : post.timestamp.toLocaleString()}</p>
                  </div>
                  <Button variant="outline" className="rounded-2xl border-2 border-coral-200 text-coral-600 hover:bg-coral-50">
                    Følg
                  </Button>
                </div>

                {/* Content */}
                <p className="text-gray-800 text-lg leading-relaxed mb-6">{post.content}</p>

                {/* Images with Soft Rounded Corners */}
                {post.images && post.images[0] && (
                  <div className="mb-6 rounded-3xl overflow-hidden shadow-md">
                    <img src={post.images[0]} alt="Post" className="w-full" />
                  </div>
                )}

                {/* Location Badge */}
                {post.location && (
                  <Badge className="bg-orange-100 text-orange-700 rounded-full mb-6">
                    <MapPin className="w-3 h-3 mr-1" />
                    {post.location}
                  </Badge>
                )}

                {/* Reaction Faces instead of Numbers */}
                <div className="flex items-center gap-2 mb-6 pb-6 border-b border-orange-100">
                  <div className="flex -space-x-2">
                    {['😊', '💖', '🤗', '🌟', '💪'].map((emoji, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 bg-orange-50 rounded-full border-2 border-white flex items-center justify-center text-sm shadow-sm"
                      >
                        {emoji}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 font-medium">
                    {post.likes} personer sendte kjærlighet
                  </span>
                </div>

                {/* Emotional Reaction Buttons */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {reactions.slice(0, 6).map((reaction) => (
                    <Button
                      key={reaction.emoji}
                      variant={selectedReaction[post.id] === reaction.emoji ? "default" : "outline"}
                      className={`rounded-2xl gap-2 ${
                        selectedReaction[post.id] === reaction.emoji
                          ? 'bg-gradient-to-r from-orange-400 to-coral-500 text-white border-0'
                          : 'border-2 border-orange-200 hover:bg-orange-50'
                      }`}
                      onClick={() => setSelectedReaction({ ...selectedReaction, [post.id]: reaction.emoji })}
                    >
                      <span className="text-xl">{reaction.emoji}</span>
                      <span className="text-xs">{reaction.label}</span>
                    </Button>
                  ))}
                </div>

                {/* Comment Input */}
                <div className="flex items-center gap-3">
                  <img
                    src="https://i.pravatar.cc/150?img=1"
                    alt="Du"
                    className="w-10 h-10 rounded-2xl"
                  />
                  <input
                    type="text"
                    placeholder="Send en varm kommentar... 💛"
                    className="flex-1 px-4 py-2 bg-orange-50 border border-orange-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <Button size="icon" className="rounded-2xl bg-gradient-to-r from-orange-400 to-coral-500">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </main>

        {/* Right Sidebar - Your Impact */}
        <aside className="hidden lg:block w-80 sticky top-16 h-[calc(100vh-64px)] p-6 overflow-y-auto">
          {/* Your Impact Widget */}
          <div className="bg-gradient-to-br from-orange-400 to-coral-500 rounded-3xl p-6 text-white shadow-lg mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Heart className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Din påvirkning</h3>
                <p className="text-sm text-orange-100">Du sprer glede! 🌟</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-3xl font-bold mb-1">28</p>
                <p className="text-sm text-orange-100">mennesker smilte i dag</p>
              </div>
              <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-3xl font-bold mb-1">12</p>
                <p className="text-sm text-orange-100">varme meldinger sendt</p>
              </div>
            </div>
          </div>

          {/* Birthdays & Celebrations */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-orange-100 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">🎉 Markeringer</h3>
            <div className="space-y-3">
              {[
                { name: 'Máret', event: 'har bursdag i dag', emoji: '🎂' },
                { name: 'Jon Aslak', event: '1 år på samiske.no', emoji: '🎉' },
              ].map((celebration, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-orange-50 rounded-2xl"
                >
                  <span className="text-3xl">{celebration.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">{celebration.name}</p>
                    <p className="text-xs text-gray-600">{celebration.event}</p>
                  </div>
                  <Button size="sm" className="rounded-2xl bg-gradient-to-r from-orange-400 to-coral-500">
                    Si gratulerer
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Gratitude Wall */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-orange-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              🙏 Takknemlighet
            </h3>
            <div className="space-y-3">
              {mockUsers.slice(0, 3).map((user, i) => (
                <div
                  key={i}
                  className="p-3 bg-gradient-to-br from-orange-50 to-coral-50 rounded-2xl"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="font-semibold text-sm text-gray-900">{user.name}</span>
                  </div>
                  <p className="text-sm text-gray-700 italic">
                    "Takk for din støtte! Det betydde mye. 💛"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
        active
          ? 'bg-gradient-to-r from-orange-400 to-coral-500 text-white shadow-lg'
          : 'text-gray-700 hover:bg-orange-50'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}
