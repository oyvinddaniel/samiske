'use client';

import { useState } from 'react';
import { MockHeader } from '../layouts/shared/MockHeader';
import { mockPosts, mockUsers } from '../layouts/shared/MockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, MapPin, Users, Calendar, MessageCircle, User, Heart, MessageSquare, Share2, Bookmark, TrendingUp, Zap } from 'lucide-react';

/**
 * Variant 2: Social Butterfly
 * Psychology: Social proof, FOMO, community bonding
 * Features:
 * - Live activity feed in left sidebar
 * - "X venner har liket dette" under posts
 * - Inline mini-threads (3 top comments)
 * - Quick-react emoji bar always visible
 * - Real-time stats prominent
 * - Pulsing badges on new activity
 * - "Who to follow" with mutual friends
 */

export function LayoutClassic02SocialButterfly() {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const toggleLike = (postId: string) => {
    const newLiked = new Set(likedPosts);
    if (newLiked.has(postId)) {
      newLiked.delete(postId);
    } else {
      newLiked.add(postId);
    }
    setLikedPosts(newLiked);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-rose-50">
      <MockHeader variant="default" />

      <div className="flex max-w-7xl mx-auto">
        {/* Left Sidebar - Live Activity */}
        <aside className="hidden md:block w-72 sticky top-16 h-[calc(100vh-64px)] border-r border-orange-200 bg-white/80 backdrop-blur-sm p-4 overflow-y-auto">
          {/* Who's Online */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                Online nå
              </h3>
              <Badge className="bg-green-500 text-white">24</Badge>
            </div>
            <div className="flex -space-x-2">
              {mockUsers.slice(0, 8).map((user, i) => (
                <img
                  key={i}
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border-2 border-white hover:z-10 cursor-pointer transition-transform hover:scale-110"
                  title={user.name}
                />
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                +16
              </div>
            </div>
          </div>

          {/* Live Activity Feed */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              Live aktivitet
            </h3>
            <div className="space-y-2">
              {[
                { user: 'Máret', action: 'likte ditt innlegg', time: '2s', type: 'like' },
                { user: 'Jon Aslak', action: 'kommenterte på innlegg', time: '15s', type: 'comment' },
                { user: 'Elle Sofe', action: 'følger deg nå', time: '1m', type: 'follow' },
                { user: 'Nils', action: 'delte ditt innlegg', time: '2m', type: 'share' },
                { user: 'Inga', action: 'likte din kommentar', time: '3m', type: 'like' },
              ].map((activity, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer group"
                >
                  <img
                    src={mockUsers[i].avatar}
                    alt={activity.user}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">{activity.user}</span>{' '}
                      <span className="text-gray-600">{activity.action}</span>
                    </p>
                    <span className="text-xs text-gray-500">{activity.time} siden</span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {activity.type === 'like' && <Heart className="w-4 h-4 text-red-500" />}
                    {activity.type === 'comment' && <MessageSquare className="w-4 h-4 text-blue-500" />}
                    {activity.type === 'follow' && <User className="w-4 h-4 text-green-500" />}
                    {activity.type === 'share' && <Share2 className="w-4 h-4 text-purple-500" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <NavItem icon={<Home className="w-5 h-5" />} label="Hjem" active />
            <NavItem icon={<MapPin className="w-5 h-5" />} label="Steder" />
            <NavItem icon={<Users className="w-5 h-5" />} label="Grupper" badge={3} pulse />
            <NavItem icon={<Calendar className="w-5 h-5" />} label="Arrangementer" badge={2} />
            <NavItem icon={<MessageCircle className="w-5 h-5" />} label="Meldinger" badge={5} pulse />
          </nav>
        </aside>

        {/* Main Feed */}
        <main className="flex-1 max-w-2xl mx-auto px-6 py-6">
          {/* Composer */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100 mb-6">
            <div className="flex items-start gap-3">
              <img
                src="https://i.pravatar.cc/150?img=1"
                alt="Du"
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Hva skjer? Del med fellesskapet..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>📷</span>
                    <span>📍</span>
                    <span>😊</span>
                  </div>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                    Del
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts with Social Proof */}
          <div className="space-y-6">
            {mockPosts.slice(0, 6).map((post) => {
              const isLiked = likedPosts.has(post.id);
              const friendsWhoLiked = Math.floor(Math.random() * 5) + 1;
              const mutualFriends = ['Máret', 'Jon Aslak', 'Elle Sofe'];

              return (
                <article
                  key={post.id}
                  className="bg-white rounded-xl shadow-sm border border-orange-100 p-6 hover:shadow-md transition-all"
                >
                  {/* Author */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{post.author.name}</p>
                        <p className="text-sm text-gray-500">{post.author.location} • {post.timestamp.toLocaleString()}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Følg
                    </Button>
                  </div>

                  {/* Content */}
                  <p className="text-gray-800 mb-4">{post.content}</p>

                  {/* Images */}
                  {post.images && post.images[0] && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img src={post.images[0]} alt="Post" className="w-full" />
                    </div>
                  )}

                  {/* Social Proof - Friends who liked */}
                  {friendsWhoLiked > 0 && (
                    <div className="mb-3 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="flex -space-x-2">
                          {mutualFriends.slice(0, friendsWhoLiked).map((friend, i) => (
                            <img
                              key={i}
                              src={mockUsers[i].avatar}
                              alt={friend}
                              className="w-6 h-6 rounded-full border-2 border-white"
                            />
                          ))}
                        </div>
                        <span>
                          <span className="font-semibold">{mutualFriends.slice(0, friendsWhoLiked).join(', ')}</span>
                          {friendsWhoLiked > 1 ? ' liker' : ' liker'} dette
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Engagement Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{post.likes + (isLiked ? 1 : 0)} likes</span>
                    <div className="flex items-center gap-3">
                      <span>{post.comments} kommentarer</span>
                      <span>{post.shares} delinger</span>
                    </div>
                  </div>

                  {/* Quick React Emoji Bar */}
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
                    {['❤️', '👍', '😊', '🎉', '💪', '🔥'].map((emoji) => (
                      <button
                        key={emoji}
                        className="text-2xl hover:scale-125 transition-transform"
                        onClick={() => toggleLike(post.id)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mb-4">
                    <Button
                      variant={isLiked ? "default" : "ghost"}
                      size="sm"
                      className={`flex-1 gap-2 ${isLiked ? 'bg-red-500 hover:bg-red-600' : ''}`}
                      onClick={() => toggleLike(post.id)}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                      Like
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Kommenter
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 gap-2">
                      <Share2 className="w-4 h-4" />
                      Del
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Bookmark className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Inline Mini-Thread (Top 3 Comments) */}
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-start gap-2">
                        <img
                          src={mockUsers[i].avatar}
                          alt="Commenter"
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1 bg-gray-50 rounded-lg p-3">
                          <p className="font-semibold text-sm text-gray-900">{mockUsers[i].name}</p>
                          <p className="text-sm text-gray-700">Dette er et flott innlegg! 👏</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <button className="hover:text-gray-700">Like</button>
                            <button className="hover:text-gray-700">Svar</button>
                            <span>2m</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button variant="link" size="sm" className="text-orange-600">
                      Vis alle {post.comments} kommentarer
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </main>

        {/* Right Sidebar - Engagement Stats */}
        <aside className="hidden lg:block w-80 sticky top-16 h-[calc(100vh-64px)] border-l border-orange-200 bg-white/80 backdrop-blur-sm p-6 overflow-y-auto">
          {/* Your Stats Today */}
          <div className="bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl p-4 text-white mb-6">
            <h3 className="font-semibold mb-3">Din aktivitet i dag 🔥</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-2xl font-bold">28</p>
                <p className="text-sm text-orange-100">Likes mottatt</p>
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-orange-100">Kommentarer</p>
              </div>
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-orange-100">Nye følgere</p>
              </div>
              <div>
                <p className="text-2xl font-bold">156</p>
                <p className="text-sm text-orange-100">Profilvisninger</p>
              </div>
            </div>
          </div>

          {/* Trending Now */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              Trending nå
            </h3>
            <div className="space-y-3">
              {['#duodji', '#samiskmat', '#nordsamisk', '#joik', '#sápmi'].map((tag, i) => (
                <button
                  key={tag}
                  className="w-full text-left p-3 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900">{tag}</span>
                    <Badge className="bg-orange-500 text-white">Hot</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{234 + i * 43} innlegg i dag</p>
                </button>
              ))}
            </div>
          </div>

          {/* Who to Follow */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Hvem å følge</h3>
            <div className="space-y-3">
              {mockUsers.slice(0, 4).map((user, i) => (
                <div key={i} className="flex items-center gap-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500">
                      {Math.floor(Math.random() * 5) + 1} felles venner
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Følg
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false, badge, pulse = false }: { icon: React.ReactNode; label: string; active?: boolean; badge?: number; pulse?: boolean }) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative ${
        active
          ? 'bg-orange-100 text-orange-600 font-medium'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {badge && badge > 0 && (
        <Badge className={`${pulse ? 'animate-pulse' : ''} bg-red-500 text-white`}>
          {badge}
        </Badge>
      )}
    </button>
  );
}
