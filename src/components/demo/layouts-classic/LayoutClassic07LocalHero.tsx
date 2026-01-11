'use client';

import { mockPosts } from '../layouts/shared/MockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Home, Calendar, Users, Navigation, Map } from 'lucide-react';

/**
 * Variant 7: Local Hero
 * Psychology: Local identity, community pride, proximity bias
 * Features:
 * - Large map preview
 * - Distance indicators
 * - Regional stats prominent
 * - Place-based navigation
 * - Local heroes showcase
 * - Nearby events
 */

export function LayoutClassic07LocalHero() {
  const userLocation = 'Guovdageaidnu';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header with Location Selector */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-emerald-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">samiske.no</span>
          </div>

          {/* Location Selector (Primary) */}
          <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 gap-2">
            <MapPin className="w-4 h-4" />
            {userLocation} ▼
          </Button>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Left Sidebar - Map & Places */}
        <aside className="hidden md:block w-80 sticky top-16 h-[calc(100vh-64px)] p-4 overflow-y-auto">
          {/* Map Preview */}
          <div className="bg-white rounded-xl overflow-hidden border-2 border-emerald-200 mb-4 shadow-lg">
            <div className="h-48 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center relative">
              <Map className="w-16 h-16 text-emerald-600 opacity-20 absolute" />
              <div className="relative z-10 text-center">
                <MapPin className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <p className="font-bold text-gray-900">{userLocation}</p>
                <p className="text-sm text-gray-600">Din region</p>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold">234</p>
                  <p className="text-xs text-emerald-100">Brukere</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">89</p>
                  <p className="text-xs text-emerald-100">Innlegg i dag</p>
                </div>
              </div>
            </div>
          </div>

          {/* Place-based Navigation */}
          <div className="bg-white rounded-xl p-4 mb-4 border border-emerald-200">
            <h3 className="font-semibold text-gray-900 mb-3">Utforsk Sápmi</h3>
            <nav className="space-y-1">
              <PlaceItem name="Guovdageaidnu" active users={234} />
              <PlaceItem name="Kárášjohka" users={189} distance="45 km" />
              <PlaceItem name="Romsa" users={567} distance="120 km" />
              <PlaceItem name="Ohcejohka" users={145} distance="67 km" />
            </nav>
          </div>

          {/* Regular Navigation */}
          <nav className="space-y-1">
            <NavItem icon={<Home className="w-5 h-5" />} label="Hjem" />
            <NavItem icon={<MapPin className="w-5 h-5" />} label="Nærområdet" active />
            <NavItem icon={<Calendar className="w-5 h-5" />} label="Lokale arrangementer" />
            <NavItem icon={<Users className="w-5 h-5" />} label="Lokalsamfunn" />
          </nav>
        </aside>

        {/* Main Feed - Location-focused */}
        <main className="flex-1 max-w-2xl mx-auto px-6 py-6">
          {/* Location Weather Widget */}
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-6 text-white mb-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cyan-100 mb-1">Akkurat nå i {userLocation}</p>
                <p className="text-4xl font-bold">-8°C</p>
                <p className="text-cyan-100">Lett snøvær ❄️</p>
              </div>
              <div className="text-6xl">🌨️</div>
            </div>
          </div>

          {/* Nearby Tab */}
          <div className="flex items-center gap-2 mb-6">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Navigation className="w-4 h-4 mr-2" />
              Nært deg
            </Button>
            <Button variant="outline">Hele Sápmi</Button>
            <Button variant="outline">Fra venner</Button>
          </div>

          {/* Posts with Distance */}
          <div className="space-y-6">
            {mockPosts.slice(0, 6).map((post, index) => {
              const distances = ['I {userLocation}', '4 km unna', '12 km unna', '25 km unna', 'I {userLocation}', '8 km unna'];
              const isNearby = index % 3 === 0;

              return (
                <article
                  key={post.id}
                  className={`bg-white rounded-xl p-6 border-2 ${
                    isNearby ? 'border-emerald-300 shadow-lg' : 'border-gray-200'
                  } hover:shadow-xl transition-all`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{post.author.name}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">{post.author.location}</span>
                          <Badge className={`${isNearby ? 'bg-emerald-500' : 'bg-gray-500'} text-white text-xs`}>
                            <Navigation className="w-3 h-3 mr-1" />
                            {distances[index].replace('{userLocation}', userLocation)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-800 mb-4">{post.content}</p>

                  {post.images && post.images[0] && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img src={post.images[0]} alt="Post" className="w-full" />
                    </div>
                  )}

                  {/* Prominent Location Badge */}
                  {post.location && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-emerald-600" />
                        <div>
                          <p className="font-semibold text-emerald-900">{post.location}</p>
                          <p className="text-xs text-emerald-700">Klikk for å se på kart</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <button className="hover:text-emerald-600">❤️ {post.likes}</button>
                    <button className="hover:text-emerald-600">💬 {post.comments}</button>
                    <button className="hover:text-emerald-600">🔖 Lagre</button>
                  </div>
                </article>
              );
            })}
          </div>
        </main>

        {/* Right Sidebar - Local Activity */}
        <aside className="hidden lg:block w-80 sticky top-16 h-[calc(100vh-64px)] p-6 overflow-y-auto">
          {/* Regional Stats */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl p-6 text-white mb-6">
            <h3 className="font-bold text-lg mb-4">📍 {userLocation} i dag</h3>
            <div className="space-y-3">
              <StatItem label="Aktive brukere" value="89" />
              <StatItem label="Nye innlegg" value="23" />
              <StatItem label="Arrangementer" value="3" />
            </div>
          </div>

          {/* Local Heroes */}
          <div className="bg-white rounded-xl p-6 mb-6 border border-emerald-200">
            <h3 className="font-semibold text-gray-900 mb-4">🌟 Lokale helter</h3>
            <p className="text-xs text-gray-600 mb-4">Mest aktive fra {userLocation}</p>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <img
                    src={`https://i.pravatar.cc/150?img=${i}`}
                    alt="User"
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">Bruker {i}</p>
                    <p className="text-xs text-gray-600">{20 + i * 3} innlegg denne uken</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nearby Events */}
          <div className="bg-white rounded-xl p-6 border border-emerald-200">
            <h3 className="font-semibold text-gray-900 mb-4">📅 Arrangementer nært deg</h3>
            <div className="space-y-3">
              {[
                { name: 'Duodji-workshop', distance: '2 km', date: 'I morgen' },
                { name: 'Samisk språkkafe', distance: 'I {userLocation}', date: 'Fredag' },
                { name: 'Joik-konsert', distance: '15 km', date: 'Lørdag' },
              ].map((event, i) => (
                <div key={i} className="p-3 bg-emerald-50 rounded-lg cursor-pointer hover:bg-emerald-100 transition">
                  <p className="font-semibold text-sm text-gray-900">{event.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                    <span>📍 {event.distance.replace('{userLocation}', userLocation)}</span>
                    <span>•</span>
                    <span>{event.date}</span>
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

function PlaceItem({ name, users, distance, active = false }: { name: string; users: number; distance?: string; active?: boolean }) {
  return (
    <button
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
        active ? 'bg-emerald-100 text-emerald-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        <span className="text-sm">{name}</span>
      </div>
      <div className="text-right">
        <p className="text-xs font-semibold">{users}</p>
        {distance && <p className="text-xs text-gray-500">{distance}</p>}
      </div>
    </button>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        active ? 'bg-emerald-100 text-emerald-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-emerald-100">{label}</span>
      <span className="text-2xl font-bold">{value}</span>
    </div>
  );
}
