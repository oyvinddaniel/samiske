'use client';

import { Search, Bell, Menu, X, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface MockHeaderProps {
  variant?: 'default' | 'minimal' | 'dark' | 'top-nav';
  showSearch?: boolean;
  onMenuClick?: () => void;
  className?: string;
}

export function MockHeader({
  variant = 'default',
  showSearch = true,
  onMenuClick,
  className = ''
}: MockHeaderProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <header className={`sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100 ${className}`}>
        <div className="flex items-center justify-between h-12 px-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
          </div>

          {/* Right actions - icon only */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Search className="w-5 h-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <Badge className="absolute top-1 right-1 w-2 h-2 p-0 bg-red-500" />
            </Button>
            <Button variant="ghost" size="icon">
              <img
                src="https://i.pravatar.cc/150?img=1"
                alt="User"
                className="w-8 h-8 rounded-full"
              />
            </Button>
          </div>
        </div>
      </header>
    );
  }

  // Dark variant (for Command Center)
  if (variant === 'dark') {
    return (
      <header className={`sticky top-0 z-50 bg-gray-900 border-b border-gray-800 ${className}`}>
        <div className="flex items-center justify-between h-14 px-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {onMenuClick && (
              <Button variant="ghost" size="icon" onClick={onMenuClick} className="text-gray-400 hover:text-white">
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <span className="text-white font-semibold hidden sm:inline">samiske.no</span>
          </div>

          {/* Search with Command palette hint */}
          {showSearch && (
            <div className="flex-1 max-w-2xl mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Søk... (⌘K)"
                  className="w-full pl-10 pr-4 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                />
                <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs bg-gray-700 text-gray-400 rounded">
                  ⌘K
                </kbd>
              </div>
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white">
              <Bell className="w-5 h-5" />
              <Badge className="absolute top-1 right-1 w-2 h-2 p-0 bg-red-500" />
            </Button>
            <Button variant="ghost" size="icon">
              <img
                src="https://i.pravatar.cc/150?img=1"
                alt="User"
                className="w-8 h-8 rounded-full ring-2 ring-gray-700"
              />
            </Button>
          </div>
        </div>
      </header>
    );
  }

  // Top nav variant (for Professional Dashboard)
  if (variant === 'top-nav') {
    return (
      <header className={`sticky top-0 z-50 bg-white border-b border-gray-200 ${className}`}>
        <div className="flex items-center h-16 px-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mr-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <span className="text-gray-900 font-bold text-lg hidden sm:inline">samiske.no</span>
          </div>

          {/* Primary navigation */}
          <nav className="hidden md:flex items-center gap-1 mr-auto">
            <Button variant="ghost" className="text-blue-600 border-b-2 border-blue-600 rounded-none px-4">
              Start
            </Button>
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900 rounded-none px-4">
              Nettverk
            </Button>
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900 rounded-none px-4">
              Meldinger
            </Button>
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900 rounded-none px-4">
              Arrangementer
            </Button>
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900 rounded-none px-4">
              Meg
            </Button>
          </nav>

          {/* Search */}
          {showSearch && (
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Søk..."
                  className="w-full pl-10 pr-4 bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-3 ml-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <Badge className="absolute top-1 right-1 w-2 h-2 p-0 bg-red-500" />
            </Button>
            <Button variant="ghost" className="gap-2">
              <img
                src="https://i.pravatar.cc/150?img=1"
                alt="User"
                className="w-8 h-8 rounded-full"
              />
              <span className="hidden lg:inline text-sm font-medium">Áile Somby</span>
            </Button>
          </div>
        </div>
      </header>
    );
  }

  // Default variant
  return (
    <header className={`sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg ${className}`}>
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left: Logo + Mobile menu */}
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <Button variant="ghost" size="icon" onClick={onMenuClick} className="text-white md:hidden">
              <Menu className="w-6 h-6" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <span className="text-white font-bold text-lg hidden sm:inline">samiske.no</span>
          </div>
        </div>

        {/* Center: Search */}
        {showSearch && (
          <div className="hidden min-[500px]:flex flex-1 max-w-2xl mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Søk i samiske.no..."
                className="w-full pl-10 pr-4 bg-white/95 backdrop-blur-sm border-none focus:ring-2 focus:ring-white/50"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
            </div>
          </div>
        )}

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 relative">
            <Bell className="w-5 h-5" />
            <Badge className="absolute top-1 right-1 w-5 h-5 p-0 bg-red-500 flex items-center justify-center text-xs">
              3
            </Badge>
          </Button>
          <Button variant="ghost" className="gap-2 text-white hover:bg-white/20">
            <img
              src="https://i.pravatar.cc/150?img=1"
              alt="User"
              className="w-8 h-8 rounded-full ring-2 ring-white/30"
            />
            <span className="hidden lg:inline font-medium">Áile Somby</span>
          </Button>
        </div>
      </div>

      {/* Mobile search (below header) */}
      {showSearch && (
        <div className="min-[500px]:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Søk..."
              className="w-full pl-10 pr-4 bg-white/95"
            />
          </div>
        </div>
      )}
    </header>
  );
}
