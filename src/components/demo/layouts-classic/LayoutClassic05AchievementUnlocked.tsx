'use client';

import { useState } from 'react';
import { mockPosts } from '../layouts/shared/MockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, MapPin, Users, Calendar, Trophy, Target, Flame, Star, Award } from 'lucide-react';

/**
 * Variant 5: Achievement Unlocked
 * Psychology: Motivation through rewards, progress visibility, status
 * Features:
 * - Level badges and XP system
 * - Progress bars everywhere
 * - Streak counter
 * - Daily challenges
 * - Leaderboard
 * - Achievement toasts
 * - Badge collection
 */

export function LayoutClassic05AchievementUnlocked() {
  const [streak, setStreak] = useState(7);
  const userLevel = 12;
  const currentXP = 2340;
  const nextLevelXP = 3000;
  const xpProgress = (currentXP / nextLevelXP) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
      {/* Header with XP */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">samiske.no</span>
          </div>

          {/* XP Counter */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-lg">
              <Star className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-900">{currentXP} XP</span>
            </div>
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
              Level {userLevel}
            </Badge>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Left Sidebar - Progress & Badges */}
        <aside className="hidden md:block w-72 sticky top-16 h-[calc(100vh-64px)] p-4 overflow-y-auto">
          {/* Profile with Level */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white mb-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <img
                    src="https://i.pravatar.cc/150?img=1"
                    alt="Profile"
                    className="w-16 h-16 rounded-full border-4 border-white/30"
                  />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center text-amber-600 font-bold text-xs">
                    {userLevel}
                  </div>
                </div>
                <div>
                  <p className="font-bold text-lg">Community Builder</p>
                  <p className="text-sm text-amber-100">Guovdageaidnu</p>
                </div>
              </div>

              <div className="mb-2">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Progress til Level {userLevel + 1}</span>
                  <span className="font-bold">{Math.round(xpProgress)}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div
                    className="bg-white h-3 rounded-full transition-all duration-500"
                    style={{ width: `${xpProgress}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-xs text-amber-100">{nextLevelXP - currentXP} XP til neste level</p>
            </div>
          </div>

          {/* Streak Counter */}
          <div className="bg-white rounded-xl p-4 mb-4 border-2 border-orange-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-2xl text-gray-900">{streak} dager</p>
                <p className="text-sm text-gray-600">Aktiv streak 🔥</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Post 1 gang i dag for å fortsette streaken din!</p>
          </div>

          {/* Badge Collection */}
          <div className="bg-white rounded-xl p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              Dine badges
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {['🏆', '⭐', '💎', '🎯', '🔥', '👑'].map((emoji, i) => (
                <div
                  key={i}
                  className="aspect-square bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform cursor-pointer"
                >
                  {emoji}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <NavItem icon={<Home className="w-5 h-5" />} label="Hjem" active />
            <NavItem icon={<Target className="w-5 h-5" />} label="Utfordringer" />
            <NavItem icon={<Trophy className="w-5 h-5" />} label="Leaderboard" />
            <NavItem icon={<MapPin className="w-5 h-5" />} label="Steder" />
            <NavItem icon={<Users className="w-5 h-5" />} label="Grupper" />
          </nav>
        </aside>

        {/* Main Feed */}
        <main className="flex-1 max-w-2xl mx-auto px-6 py-6">
          {/* Daily Challenge */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white mb-6 shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Badge className="bg-white/20 text-white mb-2">Dagens utfordring</Badge>
                <h3 className="font-bold text-xl mb-2">Del en tradisjon</h3>
                <p className="text-sm text-purple-100 mb-4">
                  Post om en samisk tradisjon eller skikk i dag og få 50 XP bonus!
                </p>
                <Button className="bg-white text-purple-600 hover:bg-purple-50">
                  <Target className="w-4 h-4 mr-2" />
                  Start utfordring
                </Button>
              </div>
              <div className="text-5xl">🎯</div>
            </div>
          </div>

          {/* Posts with XP */}
          <div className="space-y-4">
            {mockPosts.slice(0, 6).map((post, index) => {
              const xpGain = [5, 10, 15, 5, 20, 10][index];
              return (
                <article
                  key={post.id}
                  className="bg-white rounded-xl p-6 border border-amber-200 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{post.author.name}</p>
                        <Badge className="bg-amber-100 text-amber-700 text-xs">Lvl 8</Badge>
                      </div>
                      <p className="text-sm text-gray-500">{post.author.location}</p>
                    </div>
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                      +{xpGain} XP
                    </Badge>
                  </div>

                  <p className="text-gray-800 mb-4">{post.content}</p>

                  {post.images && post.images[0] && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img src={post.images[0]} alt="Post" className="w-full" />
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <button className="flex items-center gap-1 hover:text-amber-600">
                      ❤️ {post.likes} (+2 XP)
                    </button>
                    <button className="flex items-center gap-1 hover:text-amber-600">
                      💬 {post.comments} (+5 XP)
                    </button>
                    <button className="flex items-center gap-1 hover:text-amber-600">
                      🔖 Lagre
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </main>

        {/* Right Sidebar - Leaderboard */}
        <aside className="hidden lg:block w-80 sticky top-16 h-[calc(100vh-64px)] p-6 overflow-y-auto">
          {/* Your Stats */}
          <div className="bg-white rounded-xl p-6 mb-6 border border-amber-200">
            <h3 className="font-semibold text-gray-900 mb-4">Dine stats</h3>
            <div className="space-y-3">
              <StatItem label="Innlegg denne uken" value="12" xp="+60 XP" />
              <StatItem label="Likes mottatt" value="89" xp="+178 XP" />
              <StatItem label="Kommentarer" value="34" xp="+170 XP" />
              <StatItem label="Streak dager" value={streak.toString()} xp="+35 XP" />
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-600" />
              Top bidragsytere (uke)
            </h3>
            <div className="space-y-3">
              {[
                { rank: 1, name: 'Máret S.', xp: 3420, emoji: '🥇' },
                { rank: 2, name: 'Jon Aslak', xp: 3180, emoji: '🥈' },
                { rank: 3, name: 'Elle Sofe', xp: 2890, emoji: '🥉' },
                { rank: 4, name: 'Du', xp: 2340, emoji: '🔥', highlight: true },
                { rank: 5, name: 'Nils H.', xp: 2210, emoji: '' },
              ].map((user) => (
                <div
                  key={user.rank}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    user.highlight
                      ? 'bg-gradient-to-r from-amber-200 to-orange-200 font-bold'
                      : 'bg-white'
                  }`}
                >
                  <span className="text-2xl w-8 text-center">
                    {user.emoji || `#${user.rank}`}
                  </span>
                  <img
                    src={`https://i.pravatar.cc/150?img=${user.rank}`}
                    alt={user.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-600">{user.xp} XP</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Challenges */}
          <div className="bg-white rounded-xl p-6 mt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Aktive utfordringer</h3>
            <div className="space-y-3">
              {[
                { name: 'Early Bird', desc: 'Post før kl. 10', progress: 60, xp: 25 },
                { name: 'Social Butterfly', desc: 'Kommenter på 5 innlegg', progress: 80, xp: 30 },
                { name: 'Storyteller', desc: 'Del 3 innlegg med bilde', progress: 33, xp: 50 },
              ].map((challenge, i) => (
                <div key={i} className="p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm text-gray-900">{challenge.name}</p>
                    <Badge className="bg-amber-600 text-white text-xs">+{challenge.xp} XP</Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{challenge.desc}</p>
                  <div className="w-full bg-amber-200 rounded-full h-2">
                    <div
                      className="bg-amber-600 h-2 rounded-full"
                      style={{ width: `${challenge.progress}%` }}
                    ></div>
                  </div>
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
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        active
          ? 'bg-amber-100 text-amber-700 font-medium'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

function StatItem({ label, value, xp }: { label: string; value: string; xp: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="text-right">
        <p className="font-bold text-gray-900">{value}</p>
        <p className="text-xs text-amber-600">{xp}</p>
      </div>
    </div>
  );
}
