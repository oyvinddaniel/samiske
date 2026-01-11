'use client';

import { useState, useRef } from 'react';
import { mockPosts } from './shared/MockData';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, Grid, Eye, Edit3, Crosshair } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type Mode = 'browse' | 'organize' | 'focus';

interface Island {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'post' | 'collection' | 'widget';
  data: any;
  color: string;
}

export function Layout09Islands() {
  const [mode, setMode] = useState<Mode>('browse');
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedIsland, setSelectedIsland] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate floating islands from posts
  const islands: Island[] = mockPosts.slice(0, 15).map((post, index) => ({
    id: post.id,
    x: (index % 4) * 350 + 100,
    y: Math.floor(index / 4) * 300 + 100,
    width: post.images ? 300 : 250,
    height: post.images ? 320 : 200,
    type: 'post' as const,
    data: post,
    color: ['border-blue-300', 'border-purple-300', 'border-green-300', 'border-pink-300'][index % 4],
  }));

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode === 'browse' && e.target === e.currentTarget) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 25, 50));
  };

  const handleReset = () => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  };

  const handleIslandClick = (id: string) => {
    if (mode === 'focus') {
      setSelectedIsland(id === selectedIsland ? null : id);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-2 flex items-center gap-2">
        {/* Mode Switcher */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={mode === 'browse' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('browse')}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Utforsk
          </Button>
          <Button
            variant={mode === 'organize' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('organize')}
            className="gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Organiser
          </Button>
          <Button
            variant={mode === 'focus' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('focus')}
            className="gap-2"
          >
            <Crosshair className="w-4 h-4" />
            Fokus
          </Button>
        </div>

        <div className="w-px h-8 bg-gray-300 mx-2"></div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Badge variant="secondary" className="min-w-16 text-center">
            {zoom}%
          </Badge>
          <Button variant="ghost" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-px h-8 bg-gray-300 mx-2"></div>

        {/* Actions */}
        <Button variant="ghost" size="icon" onClick={handleReset}>
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className={`w-full h-full ${isPanning ? 'cursor-grabbing' : mode === 'browse' ? 'cursor-grab' : 'cursor-default'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          backgroundImage: `
            radial-gradient(circle at 2px 2px, rgba(0,0,0,0.05) 1px, transparent 0)
          `,
          backgroundSize: '40px 40px',
        }}
      >
        <div
          className="relative"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
            transformOrigin: '0 0',
            transition: isPanning ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          {islands.map((island) => (
            <FloatingIsland
              key={island.id}
              island={island}
              mode={mode}
              isSelected={selectedIsland === island.id}
              onClick={() => handleIslandClick(island.id)}
            />
          ))}
        </div>
      </div>

      {/* Minimap */}
      <div className="absolute bottom-4 right-4 z-50 w-48 h-36 bg-white/90 backdrop-blur-sm rounded-lg shadow-xl border-2 border-gray-200 p-2">
        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 rounded relative overflow-hidden">
          {/* Minimap islands */}
          {islands.map((island) => (
            <div
              key={island.id}
              className="absolute bg-blue-500/50 rounded"
              style={{
                left: `${(island.x / 1400) * 100}%`,
                top: `${(island.y / 1000) * 100}%`,
                width: `${(island.width / 1400) * 100}%`,
                height: `${(island.height / 1000) * 100}%`,
              }}
            ></div>
          ))}
          {/* Viewport indicator */}
          <div
            className="absolute border-2 border-blue-600 bg-blue-500/20"
            style={{
              left: `${(-pan.x / 1400) * 100}%`,
              top: `${(-pan.y / 1000) * 100}%`,
              width: `${(window.innerWidth / 1400 / (zoom / 100)) * 100}%`,
              height: `${(window.innerHeight / 1000 / (zoom / 100)) * 100}%`,
            }}
          ></div>
        </div>
        <p className="text-xs text-gray-600 text-center mt-1">Oversiktskart</p>
      </div>

      {/* Help Hint */}
      <div className="absolute bottom-4 left-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-3 text-sm text-gray-600">
        <p className="font-semibold mb-1">Tips:</p>
        <ul className="space-y-1 text-xs">
          <li>• Dra for å panorere</li>
          <li>• Zoom in/out med knappene</li>
          <li>• Klikk kort for detaljer</li>
        </ul>
      </div>

      {/* Mode Description */}
      <div className="absolute top-20 left-4 z-40 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-3 max-w-xs">
        {mode === 'browse' && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Utforsk-modus</h3>
            <p className="text-sm text-gray-600">Dra for å panorere, zoom for å se detaljer</p>
          </div>
        )}
        {mode === 'organize' && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Organiser-modus</h3>
            <p className="text-sm text-gray-600">Dra kort for å reorganisere, grupper relatert innhold</p>
          </div>
        )}
        {mode === 'focus' && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Fokus-modus</h3>
            <p className="text-sm text-gray-600">Klikk på et kort for fullskjerm-visning</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FloatingIsland({ island, mode, isSelected, onClick }: { island: Island; mode: Mode; isSelected: boolean; onClick: () => void }) {
  const post = island.data;

  return (
    <div
      className={`absolute cursor-pointer transition-all duration-300 ${
        isSelected ? 'z-50 scale-150' : 'z-10 hover:z-20 hover:scale-105'
      }`}
      style={{
        left: island.x,
        top: island.y,
        width: island.width,
        height: island.height,
      }}
      onClick={onClick}
    >
      <div
        className={`w-full h-full bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border-2 ${island.color} p-4 overflow-hidden ${
          mode === 'organize' ? 'cursor-move' : ''
        }`}
      >
        {post.images && post.images[0] && (
          <img
            src={post.images[0]}
            alt="Post"
            className="w-full h-48 object-cover rounded-lg mb-3"
          />
        )}

        <div className="flex items-center gap-2 mb-2">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-8 h-8 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900 truncate">{post.author.name}</p>
            <p className="text-xs text-gray-500">{post.author.location}</p>
          </div>
        </div>

        <p className="text-sm text-gray-700 line-clamp-3">{post.content}</p>

        {post.location && (
          <Badge variant="secondary" className="mt-2 text-xs">
            {post.location}
          </Badge>
        )}

        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
          <span>❤️ {post.likes}</span>
          <span>💬 {post.comments}</span>
        </div>
      </div>
    </div>
  );
}
