'use client';

import { useState, useEffect } from 'react';
import { MockHeader } from './shared/MockHeader';
import { MockPostCard } from './shared/MockPostCard';
import { mockPosts } from './shared/MockData';
import { Command, Search, Home, Calendar, MessageCircle, Bookmark, User, PenSquare, Settings, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type CommandItem = {
  id: string;
  category: 'actions' | 'navigation' | 'users' | 'posts' | 'recent';
  label: string;
  description?: string;
  shortcut?: string;
  icon?: React.ReactNode;
  action?: () => void;
};

export function Layout08Keyboard() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedPostIndex, setFocusedPostIndex] = useState(0);

  const commands: CommandItem[] = [
    { id: 'new-post', category: 'actions', label: 'Nytt innlegg', shortcut: '⌘N', icon: <PenSquare className="w-4 h-4" /> },
    { id: 'search', category: 'actions', label: 'Søk', shortcut: '⌘K', icon: <Search className="w-4 h-4" /> },
    { id: 'home', category: 'navigation', label: 'Gå til Hjem', shortcut: 'G H', icon: <Home className="w-4 h-4" /> },
    { id: 'messages', category: 'navigation', label: 'Gå til Meldinger', shortcut: 'G M', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'calendar', category: 'navigation', label: 'Gå til Kalender', shortcut: 'G C', icon: <Calendar className="w-4 h-4" /> },
    { id: 'bookmarks', category: 'navigation', label: 'Gå til Bokmerker', shortcut: 'G B', icon: <Bookmark className="w-4 h-4" /> },
    { id: 'profile', category: 'navigation', label: 'Gå til Profil', shortcut: 'G P', icon: <User className="w-4 h-4" /> },
    { id: 'settings', category: 'navigation', label: 'Innstillinger', shortcut: 'G S', icon: <Settings className="w-4 h-4" /> },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command Palette (⌘K or Ctrl+K)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(!paletteOpen);
      }

      // Show shortcuts (? or ⌘/)
      if (e.key === '?' || ((e.metaKey || e.ctrlKey) && e.key === '/')) {
        e.preventDefault();
        setShortcutsOpen(!shortcutsOpen);
      }

      // Navigation shortcuts
      if (e.key === 'j' && !paletteOpen) {
        e.preventDefault();
        setFocusedPostIndex((prev) => Math.min(prev + 1, mockPosts.length - 1));
      }
      if (e.key === 'k' && !paletteOpen) {
        e.preventDefault();
        setFocusedPostIndex((prev) => Math.max(prev - 1, 0));
      }

      // ESC to close
      if (e.key === 'Escape') {
        setPaletteOpen(false);
        setShortcutsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paletteOpen, shortcutsOpen]);

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <MockHeader variant="minimal" />

      {/* Main Content - Minimal & Centered */}
      <main className="max-w-3xl mx-auto px-4 pt-20 pb-32">
        <div className="space-y-8">
          {mockPosts.slice(0, 10).map((post, index) => (
            <div
              key={post.id}
              className={`transition-all ${
                index === focusedPostIndex
                  ? 'ring-2 ring-blue-500 ring-offset-2 rounded-xl'
                  : ''
              }`}
            >
              <MockPostCard post={post} variant="minimal" />
            </div>
          ))}
        </div>
      </main>

      {/* Command Palette */}
      {paletteOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 pt-32">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* Search Input */}
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Søk etter kommandoer..."
                  className="flex-1 outline-none text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <kbd className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">ESC</kbd>
              </div>
            </div>

            {/* Commands List */}
            <div className="max-h-96 overflow-y-auto p-2">
              {/* Actions */}
              {filteredCommands.some((cmd) => cmd.category === 'actions') && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">Handlinger</p>
                  {filteredCommands
                    .filter((cmd) => cmd.category === 'actions')
                    .map((cmd) => (
                      <CommandItem key={cmd.id} command={cmd} />
                    ))}
                </div>
              )}

              {/* Navigation */}
              {filteredCommands.some((cmd) => cmd.category === 'navigation') && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">Navigasjon</p>
                  {filteredCommands
                    .filter((cmd) => cmd.category === 'navigation')
                    .map((cmd) => (
                      <CommandItem key={cmd.id} command={cmd} />
                    ))}
                </div>
              )}

              {filteredCommands.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Ingen kommandoer funnet</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-3 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white rounded">↑↓</kbd>
                  Naviger
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white rounded">↵</kbd>
                  Velg
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white rounded">?</kbd>
                Vis alle snarveier
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Shortcuts Overlay */}
      {shortcutsOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Tastatursnarveier</h2>
              <button
                onClick={() => setShortcutsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <kbd className="px-3 py-2 bg-gray-100 rounded">ESC</kbd>
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Global */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Globale snarveier</h3>
                  <div className="space-y-3">
                    <ShortcutItem shortcut="⌘K" description="Åpne kommandopalett" />
                    <ShortcutItem shortcut="⌘N" description="Nytt innlegg" />
                    <ShortcutItem shortcut="?" description="Vis denne oversikten" />
                    <ShortcutItem shortcut="ESC" description="Lukk modal" />
                  </div>
                </div>

                {/* Navigation */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Navigasjon</h3>
                  <div className="space-y-3">
                    <ShortcutItem shortcut="G H" description="Gå til Hjem" />
                    <ShortcutItem shortcut="G M" description="Gå til Meldinger" />
                    <ShortcutItem shortcut="G C" description="Gå til Kalender" />
                    <ShortcutItem shortcut="G B" description="Gå til Bokmerker" />
                    <ShortcutItem shortcut="G P" description="Gå til Profil" />
                  </div>
                </div>

                {/* Post Actions */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Innlegg-handlinger</h3>
                  <div className="space-y-3">
                    <ShortcutItem shortcut="J" description="Neste innlegg" />
                    <ShortcutItem shortcut="K" description="Forrige innlegg" />
                    <ShortcutItem shortcut="L" description="Like fokusert innlegg" />
                    <ShortcutItem shortcut="C" description="Kommenter" />
                    <ShortcutItem shortcut="S" description="Del" />
                    <ShortcutItem shortcut="B" description="Bokmerk" />
                  </div>
                </div>

                {/* Search */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Søk</h3>
                  <div className="space-y-3">
                    <ShortcutItem shortcut="/" description="Fokuser søkefelt" />
                    <ShortcutItem shortcut="⌘F" description="Søk på siden" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Hint Badge */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
        >
          <Command className="w-5 h-5" />
          <span className="text-sm">Trykk</span>
          <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">⌘K</kbd>
        </button>
      </div>
    </div>
  );
}

function CommandItem({ command }: { command: CommandItem }) {
  return (
    <button className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors group">
      <div className="flex items-center gap-3">
        {command.icon && <div className="text-gray-400 group-hover:text-gray-600">{command.icon}</div>}
        <span className="text-sm text-gray-900">{command.label}</span>
      </div>
      {command.shortcut && (
        <kbd className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs group-hover:bg-gray-200">
          {command.shortcut}
        </kbd>
      )}
    </button>
  );
}

function ShortcutItem({ shortcut, description }: { shortcut: string; description: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{description}</span>
      <kbd className="px-3 py-1 bg-gray-100 text-gray-900 rounded text-sm font-mono">
        {shortcut}
      </kbd>
    </div>
  );
}
