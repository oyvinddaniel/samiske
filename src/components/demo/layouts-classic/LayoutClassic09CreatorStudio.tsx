'use client';

import { mockPosts } from '../layouts/shared/MockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, PenSquare, BarChart3, Calendar, Clock, TrendingUp, Eye, Heart } from 'lucide-react';

/**
 * Variant 9: Creator Studio
 * Psychology: Reduce creative friction, showcase work, creator tools
 * Features:
 * - Large always-visible composer
 * - Drafts list prominent
 * - Scheduled posts
 * - Post analytics
 * - Best time to post suggestions
 * - Templates
 * - Audience insights
 */

export function LayoutClassic09CreatorStudio() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      {/* Header with Create Button */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-purple-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <PenSquare className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">Creator Studio</span>
            <Badge className="bg-purple-100 text-purple-700">Pro</Badge>
          </div>

          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 gap-2 text-lg px-6">
            <PenSquare className="w-5 h-5" />
            Nytt innlegg
          </Button>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Left Sidebar - Drafts & Scheduled */}
        <aside className="hidden md:block w-72 sticky top-16 h-[calc(100vh-64px)] p-4 overflow-y-auto">
          {/* Drafts */}
          <div className="bg-white rounded-xl p-4 mb-4 border border-purple-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              📝 Kladder
              <Badge className="bg-purple-100 text-purple-700">3</Badge>
            </h3>
            <div className="space-y-2">
              {[
                { title: 'Samisk matkultur...', time: '2 timer siden' },
                { title: 'Workshop i Guovdagea...', time: 'I går' },
                { title: 'Ny duodji-teknikk', time: '3 dager siden' },
              ].map((draft, i) => (
                <button
                  key={i}
                  className="w-full text-left p-3 rounded-lg hover:bg-purple-50 transition-colors border border-gray-200"
                >
                  <p className="font-medium text-sm text-gray-900 truncate">{draft.title}</p>
                  <p className="text-xs text-gray-500">{draft.time}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Scheduled Posts */}
          <div className="bg-white rounded-xl p-4 mb-4 border border-purple-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              Planlagt
            </h3>
            <div className="space-y-2">
              {[
                { title: 'Tradisjonell joik', date: 'I morgen kl. 19:00' },
                { title: 'Duodji-tips', date: 'Fredag kl. 18:00' },
              ].map((scheduled, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-purple-50 border border-purple-200"
                >
                  <p className="font-medium text-sm text-gray-900 truncate">{scheduled.title}</p>
                  <p className="text-xs text-purple-700">📅 {scheduled.date}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <NavItem icon={<Home className="w-5 h-5" />} label="Studio" active />
            <NavItem icon={<BarChart3 className="w-5 h-5" />} label="Analytics" />
            <NavItem icon={<PenSquare className="w-5 h-5" />} label="Innhold" />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-3xl mx-auto px-6 py-6">
          {/* Large Composer - Always Expanded */}
          <div className="bg-white rounded-2xl p-8 border-2 border-purple-200 mb-6 shadow-lg">
            <div className="flex items-start gap-4 mb-6">
              <img
                src="https://i.pravatar.cc/150?img=1"
                alt="Du"
                className="w-14 h-14 rounded-full"
              />
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 mb-2">Skap noe fantastisk</h3>
                <textarea
                  placeholder="Del din historie, kunnskap eller kreativitet..."
                  className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-lg"
                  rows={6}
                ></textarea>
              </div>
            </div>

            {/* Templates */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Maler:</p>
              <div className="flex flex-wrap gap-2">
                {['📷 Photo Story', '🎓 Tutorial', '📢 Announcement', '💡 Tip', '📝 Article'].map((template) => (
                  <Button key={template} variant="outline" size="sm">
                    {template}
                  </Button>
                ))}
              </div>
            </div>

            {/* Rich Toolbar */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm">📷 Bilder</Button>
                <Button variant="ghost" size="sm">🎥 Video</Button>
                <Button variant="ghost" size="sm">📍 Sted</Button>
                <Button variant="ghost" size="sm">😊 Emoji</Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">💾 Lagre kladd</Button>
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-1" />
                  Planlegg
                </Button>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                  Publiser
                </Button>
              </div>
            </div>
          </div>

          {/* Best Time to Post */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white mb-6">
            <div className="flex items-start gap-4">
              <Clock className="w-8 h-8 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg mb-2">⚡ Beste tid å poste</h3>
                <p className="text-purple-100 text-sm mb-3">
                  Basert på når dine følgere er mest aktive
                </p>
                <div className="flex items-center gap-4">
                  <Badge className="bg-white text-purple-700 px-3 py-1">
                    I dag kl. 19:00
                  </Badge>
                  <Badge className="bg-white/20 text-white px-3 py-1">
                    I morgen kl. 18:30
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Your Recent Posts with Analytics */}
          <div className="space-y-4">
            <h3 className="font-bold text-xl text-gray-900">Dine innlegg</h3>
            <div className="grid grid-cols-2 gap-4">
              {mockPosts.slice(0, 4).map((post, index) => {
                const views = Math.floor(Math.random() * 1000) + 200;
                const engagement = Math.floor(Math.random() * 30) + 5;

                return (
                  <article
                    key={post.id}
                    className="bg-white rounded-xl border border-purple-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    {post.images && post.images[0] && (
                      <div className="relative h-48">
                        <img
                          src={post.images[0]}
                          alt="Post"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-lg text-xs">
                          {index === 0 && '🔥 Trending'}
                          {index === 1 && '⭐ Top post'}
                          {index === 2 && '📈 Growing'}
                          {index === 3 && '💪 Strong'}
                        </div>
                      </div>
                    )}

                    <div className="p-4">
                      <p className="text-sm text-gray-800 line-clamp-2 mb-3">{post.content}</p>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-purple-50 rounded-lg">
                          <p className="font-bold text-purple-700">{views}</p>
                          <p className="text-gray-600">Visninger</p>
                        </div>
                        <div className="text-center p-2 bg-pink-50 rounded-lg">
                          <p className="font-bold text-pink-700">{post.likes}</p>
                          <p className="text-gray-600">Likes</p>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                          <p className="font-bold text-blue-700">{engagement}%</p>
                          <p className="text-gray-600">Engagement</p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </main>

        {/* Right Sidebar - Analytics */}
        <aside className="hidden lg:block w-80 sticky top-16 h-[calc(100vh-64px)] p-6 overflow-y-auto">
          {/* Your Analytics */}
          <div className="bg-white rounded-xl p-6 mb-6 border border-purple-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Dine stats (7 dager)
            </h3>
            <div className="space-y-4">
              <AnalyticItem icon={<Eye className="w-5 h-5 text-blue-600" />} label="Totale visninger" value="2,345" change="+12%" />
              <AnalyticItem icon={<Heart className="w-5 h-5 text-red-600" />} label="Likes" value="456" change="+8%" />
              <AnalyticItem icon={<TrendingUp className="w-5 h-5 text-green-600" />} label="Engagement rate" value="18.2%" change="+3%" />
            </div>
          </div>

          {/* Audience Insights */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 mb-6 border border-purple-200">
            <h3 className="font-semibold text-gray-900 mb-4">👥 Ditt publikum</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">Guovdageaidnu</span>
                  <span className="text-sm font-bold text-gray-900">45%</span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">Romsa</span>
                  <span className="text-sm font-bold text-gray-900">30%</span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">Andre</span>
                  <span className="text-sm font-bold text-gray-900">25%</span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Tips */}
          <div className="bg-white rounded-xl p-6 border border-purple-200">
            <h3 className="font-semibold text-gray-900 mb-4">💡 Tips for bedre engagement</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Post med bilder får 2.3x mer engagement</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Bruk 3-5 relevante hashtags</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Svar på kommentarer innen 1 time</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✓</span>
                <span>Post konsekvent (3-5 ganger per uke)</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        active
          ? 'bg-purple-100 text-purple-700 font-medium'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

function AnalyticItem({ icon, label, value, change }: { icon: React.ReactNode; label: string; value: string; change: string }) {
  const isPositive = change.startsWith('+');

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
      </div>
      <Badge className={`${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {change}
      </Badge>
    </div>
  );
}
