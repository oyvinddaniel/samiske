'use client';

import { useState } from 'react';
import { mockPosts } from '../layouts/shared/MockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, Clock, EyeOff, Pause, Heart } from 'lucide-react';

/**
 * Variant 8: Mindful Moments
 * Psychology: Reduce anxiety, promote healthy usage, self-awareness
 * Features:
 * - Time spent tracker
 * - Break reminders
 * - Mindfulness mode (hide metrics)
 * - No infinite scroll (10 posts max)
 * - Positive-only feed
 * - Calm palette (greens, blues)
 * - Breathing exercises between posts
 */

export function LayoutClassic08MindfulMoments() {
  const [mindfulMode, setMindfulMode] = useState(false);
  const [timeSpent, setTimeSpent] = useState(23); // minutes

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-blue-50">
      {/* Calm Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-green-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">samiske.no</span>
            <Badge className="bg-green-100 text-green-700">Mindful</Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{timeSpent} min i dag</span>
            </div>
            <Button
              variant={mindfulMode ? "default" : "outline"}
              size="sm"
              onClick={() => setMindfulMode(!mindfulMode)}
              className="gap-2"
            >
              <EyeOff className="w-4 h-4" />
              {mindfulMode ? 'Mindful modus på' : 'Aktiver mindful modus'}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Left Sidebar - Wellness */}
        <aside className="hidden md:block w-72 sticky top-16 h-[calc(100vh-64px)] p-6">
          {/* Time Spent Widget */}
          <div className="bg-white rounded-2xl p-6 mb-6 border border-green-200">
            <h3 className="font-semibold text-gray-900 mb-4">⏰ Din tid i dag</h3>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-bold text-gray-900">{timeSpent} min</span>
                <span className="text-sm text-gray-600">/ 45 min</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-teal-500 h-3 rounded-full transition-all"
                  style={{ width: `${(timeSpent / 45) * 100}%` }}
                ></div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Du har brukt {timeSpent} minutter i dag. Husk å ta en pause! 🌿
            </p>
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Pause className="w-4 h-4" />
              Ta en pause nå
            </Button>
          </div>

          {/* Break Reminder */}
          <div className="bg-gradient-to-br from-blue-100 to-green-100 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">🧘 Påminnelse</h3>
            <p className="text-sm text-gray-700">
              Ta en liten pause hver 20. minutt. Strekk deg, drikk vann, eller ta noen dype pustetak.
            </p>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <NavItem icon={<Home className="w-5 h-5" />} label="Hjem" active />
            <NavItem icon={<Heart className="w-5 h-5" />} label="Positive innlegg" />
            <NavItem icon={<Pause className="w-5 h-5" />} label="Gratitude wall" />
          </nav>
        </aside>

        {/* Main Feed - Mindful Design */}
        <main className="flex-1 max-w-2xl mx-auto px-6 py-6">
          {/* Mindfulness Note */}
          <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl p-8 text-white mb-6 text-center">
            <div className="text-5xl mb-4">🌱</div>
            <h2 className="text-2xl font-bold mb-2">Velkommen tilbake</h2>
            <p className="text-green-100">
              Ta et øyeblikk for å sette din intensjon før du scroller.
            </p>
          </div>

          {/* Posts - No Infinite Scroll (Max 10) */}
          <div className="space-y-8">
            {mockPosts.slice(0, 5).map((post, index) => (
              <div key={post.id}>
                <article className="bg-white rounded-2xl p-8 border border-green-100 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-14 h-14 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">{post.author.name}</p>
                      <p className="text-sm text-gray-600">{post.author.location}</p>
                    </div>
                  </div>

                  <p className="text-gray-800 text-lg leading-relaxed mb-6">{post.content}</p>

                  {post.images && post.images[0] && (
                    <div className="mb-6 rounded-xl overflow-hidden">
                      <img src={post.images[0]} alt="Post" className="w-full" />
                    </div>
                  )}

                  {/* Hide counts in mindful mode */}
                  {!mindfulMode ? (
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <button className="hover:text-green-600">❤️ {post.likes}</button>
                      <button className="hover:text-green-600">💬 {post.comments}</button>
                      <button className="hover:text-green-600">🔖 Lagre</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Heart className="w-4 h-4" />
                        Like
                      </Button>
                      <Button variant="ghost" size="sm">
                        Kommenter
                      </Button>
                      <Button variant="ghost" size="sm">
                        Lagre
                      </Button>
                    </div>
                  )}
                </article>

                {/* Breathing Exercise every 5 posts */}
                {(index + 1) % 5 === 0 && (
                  <div className="my-8 bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-8 text-center border-2 border-blue-200">
                    <div className="text-5xl mb-4 animate-pulse">🧘</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Pause & Pust</h3>
                    <p className="text-gray-700 mb-4">
                      Ta tre dype pustetak før du fortsetter. Inn gjennom nesen, ut gjennom munnen.
                    </p>
                    <div className="flex items-center justify-center gap-4 text-gray-600">
                      <div className="text-center">
                        <p className="text-3xl font-bold">4</p>
                        <p className="text-xs">sek inn</p>
                      </div>
                      <span className="text-2xl">→</span>
                      <div className="text-center">
                        <p className="text-3xl font-bold">4</p>
                        <p className="text-xs">sek hold</p>
                      </div>
                      <span className="text-2xl">→</span>
                      <div className="text-center">
                        <p className="text-3xl font-bold">6</p>
                        <p className="text-xs">sek ut</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* End of Feed - Come Back Later */}
          <div className="mt-12 bg-white rounded-2xl p-12 text-center border-2 border-green-200">
            <div className="text-6xl mb-4">✓</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Du er oppdatert! 🌟</h3>
            <p className="text-gray-600 mb-6">
              Du har sett dagens innlegg. Ta en pause og kom tilbake senere.
            </p>
            <Button className="bg-gradient-to-r from-green-500 to-teal-500">
              Koble fra & recharge
            </Button>
          </div>
        </main>

        {/* Right Sidebar - Wellness Stats */}
        <aside className="hidden lg:block w-80 sticky top-16 h-[calc(100vh-64px)] p-6 overflow-y-auto">
          {/* Your Wellness */}
          <div className="bg-white rounded-2xl p-6 mb-6 border border-green-200">
            <h3 className="font-semibold text-gray-900 mb-4">💚 Ditt velvære</h3>
            <div className="space-y-4">
              <WellnessItem label="Balansert bruk" value="Bra!" color="green" />
              <WellnessItem label="Positive interaksjoner" value="5 i dag" color="green" />
              <WellnessItem label="Gjennomsnittlig økt" value="18 min" color="green" />
            </div>
          </div>

          {/* Positive Interactions */}
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 mb-6 border border-pink-200">
            <h3 className="font-semibold text-gray-900 mb-3">❤️ Du har gjort 5 glade</h3>
            <p className="text-sm text-gray-700">
              Dine likes og kommentarer har gjort en positiv forskjell i dag!
            </p>
          </div>

          {/* Disconnect Suggestions */}
          <div className="bg-white rounded-2xl p-6 border border-green-200">
            <h3 className="font-semibold text-gray-900 mb-4">🌿 Koble fra-forslag</h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span>🚶</span>
                <span>Ta en tur ute</span>
              </li>
              <li className="flex items-start gap-2">
                <span>📚</span>
                <span>Les en bok</span>
              </li>
              <li className="flex items-start gap-2">
                <span>☕</span>
                <span>Nyt en kopp te</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🧘</span>
                <span>Mediter i 10 min</span>
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
        active
          ? 'bg-green-100 text-green-700 font-medium'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function WellnessItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <Badge className={`bg-${color}-100 text-${color}-700`}>{value}</Badge>
    </div>
  );
}
