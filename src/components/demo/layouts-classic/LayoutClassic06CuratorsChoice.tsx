'use client';

import { mockPosts } from '../layouts/shared/MockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, MapPin, Users, Star, TrendingUp, Bookmark, Award, Info } from 'lucide-react';

/**
 * Variant 6: Curator's Choice
 * Psychology: Information scent, curation reduces decision fatigue
 * Features:
 * - Quality score ratings
 * - "Why you're seeing this" explanations
 * - Featured posts (gold border)
 * - "Read next" recommendations
 * - Topic tags cloud
 * - Editorial comments
 */

export function LayoutClassic06CuratorsChoice() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-indigo-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">samiske.no</span>
            <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white">Kuratert</Badge>
          </div>

          {/* Quality Filter */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-current" />
              Editor's Pick
            </Button>
            <Button variant="ghost" size="sm">Høy kvalitet</Button>
            <Button variant="ghost" size="sm">Inspirerende</Button>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Left Sidebar */}
        <aside className="hidden md:block w-72 sticky top-16 h-[calc(100vh-64px)] p-6">
          <div className="bg-white rounded-xl p-6 mb-6 border border-indigo-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-indigo-600" />
              Dine samlinger
            </h3>
            <div className="space-y-2">
              {['Inspirasjon', 'Læring', 'Favoritter', 'Les senere'].map((collection) => (
                <button
                  key={collection}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50 text-sm text-gray-700"
                >
                  📁 {collection}
                </button>
              ))}
            </div>
          </div>

          <nav className="space-y-1">
            <NavItem icon={<Home className="w-5 h-5" />} label="Kuratert feed" active />
            <NavItem icon={<Star className="w-5 h-5" />} label="Editor's Picks" />
            <NavItem icon={<TrendingUp className="w-5 h-5" />} label="Beste denne uken" />
            <NavItem icon={<MapPin className="w-5 h-5" />} label="Steder" />
            <NavItem icon={<Users className="w-5 h-5" />} label="Fellesskap" />
          </nav>
        </aside>

        {/* Main Feed */}
        <main className="flex-1 max-w-3xl mx-auto px-6 py-6">
          {/* Featured Post (Magazine Style) */}
          <article className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-8 mb-8 border-4 border-amber-300 shadow-xl">
            <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white mb-4">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Editor's Pick
            </Badge>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Duodji i moderne tid: Tradisjon møter innovasjon
            </h2>
            <div className="flex items-center gap-3 mb-6">
              <img
                src={mockPosts[0].author.avatar}
                alt={mockPosts[0].author.name}
                className="w-14 h-14 rounded-full"
              />
              <div>
                <p className="font-semibold text-gray-900">{mockPosts[0].author.name}</p>
                <p className="text-sm text-gray-600">{mockPosts[0].author.location}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-current" />
                <span className="font-bold text-lg">4.9</span>
              </div>
            </div>

            {mockPosts[0].images && mockPosts[0].images[0] && (
              <div className="mb-6 rounded-xl overflow-hidden">
                <img src={mockPosts[0].images[0]} alt="Featured" className="w-full" />
              </div>
            )}

            <p className="text-lg text-gray-800 leading-relaxed mb-6">{mockPosts[0].content}</p>

            <div className="flex items-center justify-between pt-4 border-t border-amber-200">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>❤️ 234</span>
                <span>💬 67</span>
                <span>📖 5 min lesning</span>
              </div>
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600">
                Les hele historien
              </Button>
            </div>
          </article>

          {/* Curated Posts with Quality Scores */}
          <div className="space-y-6">
            {mockPosts.slice(1, 7).map((post, index) => {
              const qualityScore = (4.2 + Math.random() * 0.7).toFixed(1);
              const isHighQuality = parseFloat(qualityScore) > 4.5;

              return (
                <article
                  key={post.id}
                  className={`bg-white rounded-xl p-6 border-2 ${
                    isHighQuality ? 'border-amber-300' : 'border-gray-200'
                  } hover:shadow-lg transition-all`}
                >
                  {/* Why you're seeing this */}
                  <div className="flex items-start gap-2 mb-4 p-3 bg-indigo-50 rounded-lg">
                    <Info className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-indigo-900">
                      Anbefalt fordi du liker innhold om <span className="font-semibold">samisk kultur</span> og følger{' '}
                      <span className="font-semibold">{post.author.name}</span>
                    </p>
                  </div>

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{post.author.name}</p>
                        <p className="text-sm text-gray-500">{post.author.location}</p>
                      </div>
                    </div>

                    {/* Quality Score */}
                    <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-lg">
                      <Star className="w-4 h-4 text-amber-500 fill-current" />
                      <span className="font-bold text-amber-700">{qualityScore}</span>
                    </div>
                  </div>

                  <p className="text-gray-800 mb-4">{post.content}</p>

                  {post.images && post.images[0] && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img src={post.images[0]} alt="Post" className="w-full" />
                    </div>
                  )}

                  {/* Topic Tags */}
                  <div className="flex items-center gap-2 mb-4">
                    {['#duodji', '#tradisjon', '#håndverk'].map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <button className="hover:text-gray-900">❤️ {post.likes}</button>
                      <button className="hover:text-gray-900">💬 {post.comments}</button>
                      <button className="hover:text-gray-900">🔖 Lagre</button>
                    </div>
                    <span className="text-xs text-gray-500">📖 {Math.ceil(Math.random() * 5)} min lesning</span>
                  </div>

                  {/* Read Next Recommendation */}
                  {index === 2 && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                      <p className="text-sm font-semibold text-indigo-900 mb-2">📚 Les videre</p>
                      <p className="text-xs text-indigo-700">
                        Basert på dette innlegget, vil du kanskje like: "Tradisjonelle teknikker i moderne design"
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </main>

        {/* Right Sidebar - Editorial & Topics */}
        <aside className="hidden lg:block w-80 sticky top-16 h-[calc(100vh-64px)] p-6 overflow-y-auto">
          {/* Best of the Week */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-6 text-white mb-6">
            <h3 className="font-bold text-lg mb-4">⭐ Beste denne uken</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 bg-white/20 rounded-lg backdrop-blur-sm cursor-pointer hover:bg-white/30 transition">
                  <p className="font-semibold text-sm mb-1">Samisk matkultur gjennom tidene</p>
                  <p className="text-xs text-amber-100">4.9 ⭐ • 234 likes</p>
                </div>
              ))}
            </div>
          </div>

          {/* Topic Tags Cloud (Weighted by Quality) */}
          <div className="bg-white rounded-xl p-6 mb-6 border border-indigo-200">
            <h3 className="font-semibold text-gray-900 mb-4">Populære emner</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { tag: 'duodji', size: 'text-xl' },
                { tag: 'språk', size: 'text-base' },
                { tag: 'mat', size: 'text-lg' },
                { tag: 'joik', size: 'text-sm' },
                { tag: 'tradisjon', size: 'text-xl' },
                { tag: 'natur', size: 'text-base' },
              ].map(({ tag, size }) => (
                <button
                  key={tag}
                  className={`${size} font-medium text-indigo-600 hover:text-indigo-800 transition-colors`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Editorial Comment */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✍️</span>
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">Fra redaksjonen</p>
                <p className="text-xs text-gray-600">Anbefalt av Máret</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 italic">
              "Denne uken har vi sett fantastisk innhold om samisk håndverk. Spesielt imponert over hvordan tradisjon møter moderne design."
            </p>
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
          ? 'bg-indigo-100 text-indigo-700 font-medium'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}
