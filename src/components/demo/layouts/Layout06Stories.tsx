'use client';

import { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, Share2, Bookmark, MoreVertical, ChevronUp } from 'lucide-react';
import { mockPosts, formatTimestamp } from './shared/MockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Layout06Stories() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);

  const postsWithImages = mockPosts.filter(p => p.images && p.images.length > 0);
  const currentPost = postsWithImages[currentIndex];

  useEffect(() => {
    // Auto-hide header after 3 seconds
    const timer = setTimeout(() => setHeaderVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < postsWithImages.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsLiked(false);
      setIsBookmarked(false);
      setShowDetails(false);
      setHeaderVisible(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsLiked(false);
      setIsBookmarked(false);
      setShowDetails(false);
      setHeaderVisible(true);
    }
  };

  const handleTap = () => {
    setHeaderVisible(!headerVisible);
  };

  return (
    <div className="fixed inset-0 bg-black">
      {/* Desktop: Centered Vertical Container */}
      <div className="hidden lg:flex items-center justify-center h-full bg-black">
        <div className="relative w-[414px] h-[896px] bg-white overflow-hidden shadow-2xl">
          <StoryContent
            post={currentPost}
            currentIndex={currentIndex}
            total={postsWithImages.length}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onTap={handleTap}
            headerVisible={headerVisible}
            isLiked={isLiked}
            setIsLiked={setIsLiked}
            isBookmarked={isBookmarked}
            setIsBookmarked={setIsBookmarked}
            showDetails={showDetails}
            setShowDetails={setShowDetails}
          />
        </div>

        {/* Desktop Navigation Hints */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 text-white/60 text-sm">
          <span>← Forrige</span>
          <span className="text-white/40">|</span>
          <span>Neste →</span>
          <span className="text-white/40">|</span>
          <span>ESC for å lukke</span>
        </div>
      </div>

      {/* Mobile: Full Screen */}
      <div className="lg:hidden h-full">
        <StoryContent
          post={currentPost}
          currentIndex={currentIndex}
          total={postsWithImages.length}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onTap={handleTap}
          headerVisible={headerVisible}
          isLiked={isLiked}
          setIsLiked={setIsLiked}
          isBookmarked={isBookmarked}
          setIsBookmarked={setIsBookmarked}
          showDetails={showDetails}
          setShowDetails={setShowDetails}
        />
      </div>

      {/* Keyboard Navigation */}
      <div
        className="fixed inset-0 pointer-events-none"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') handleNext();
          if (e.key === 'ArrowLeft') handlePrevious();
          if (e.key === 'Escape') window.history.back();
        }}
        tabIndex={-1}
      ></div>
    </div>
  );
}

interface StoryContentProps {
  post: any;
  currentIndex: number;
  total: number;
  onNext: () => void;
  onPrevious: () => void;
  onTap: () => void;
  headerVisible: boolean;
  isLiked: boolean;
  setIsLiked: (liked: boolean) => void;
  isBookmarked: boolean;
  setIsBookmarked: (bookmarked: boolean) => void;
  showDetails: boolean;
  setShowDetails: (show: boolean) => void;
}

function StoryContent({
  post,
  currentIndex,
  total,
  onNext,
  onPrevious,
  onTap,
  headerVisible,
  isLiked,
  setIsLiked,
  isBookmarked,
  setIsBookmarked,
  showDetails,
  setShowDetails,
}: StoryContentProps) {
  return (
    <div className="relative w-full h-full">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={post.images[0]}
          alt="Story"
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/50"></div>
      </div>

      {/* Story Progress Indicators */}
      <div className="absolute top-0 left-0 right-0 z-50 flex gap-1 p-2">
        {Array.from({ length: total }).map((_, index) => (
          <div
            key={index}
            className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
          >
            {index < currentIndex && (
              <div className="h-full w-full bg-white"></div>
            )}
            {index === currentIndex && (
              <div className="h-full bg-white animate-progress"></div>
            )}
          </div>
        ))}
      </div>

      {/* Top Bar (Auto-hides) */}
      <div
        className={`absolute top-0 left-0 right-0 z-40 transition-opacity duration-300 ${
          headerVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center justify-between p-4 mt-3">
          <div className="flex items-center gap-3">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-10 h-10 rounded-full ring-2 ring-white/50"
            />
            <div>
              <p className="text-white font-semibold text-sm">{post.author.name}</p>
              <p className="text-white/80 text-xs">{formatTimestamp(post.timestamp)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <MoreVertical className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Text Overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 z-30 p-6"
        onClick={onTap}
      >
        <p className="text-white text-lg font-medium leading-relaxed mb-4 drop-shadow-lg">
          {post.content}
        </p>

        {post.location && (
          <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 mb-4">
            {post.location}
          </Badge>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="absolute bottom-0 right-0 z-40 p-4 flex flex-col gap-4">
        <button
          className="flex flex-col items-center gap-1"
          onClick={() => setIsLiked(!isLiked)}
        >
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Heart
              className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`}
            />
          </div>
          <span className="text-white text-xs font-medium drop-shadow">
            {post.likes + (isLiked ? 1 : 0)}
          </span>
        </button>

        <button
          className="flex flex-col items-center gap-1"
          onClick={() => setShowDetails(!showDetails)}
        >
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-medium drop-shadow">
            {post.comments}
          </span>
        </button>

        <button className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-medium drop-shadow">
            Del
          </span>
        </button>

        <button
          className="flex flex-col items-center gap-1"
          onClick={() => setIsBookmarked(!isBookmarked)}
        >
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Bookmark
              className={`w-6 h-6 ${isBookmarked ? 'fill-white text-white' : 'text-white'}`}
            />
          </div>
        </button>
      </div>

      {/* Swipe Up Indicator */}
      {!showDetails && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-30 flex flex-col items-center gap-2 animate-bounce">
          <ChevronUp className="w-6 h-6 text-white/60" />
          <p className="text-white/60 text-xs">Sveip opp for detaljer</p>
        </div>
      )}

      {/* Details Bottom Sheet */}
      {showDetails && (
        <div
          className="absolute inset-0 z-50 bg-black/80 flex items-end"
          onClick={() => setShowDetails(false)}
        >
          <div
            className="w-full bg-white rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>

            <h3 className="text-xl font-bold text-gray-900 mb-4">Kommentarer</h3>

            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3">
                  <img
                    src={`https://i.pravatar.cc/150?img=${i + 10}`}
                    alt="User"
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">Bruker {i}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Dette er en kommentar på innlegget. Veldig bra!
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{i} timer siden</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Areas (Tap to navigate) */}
      <div className="absolute inset-0 z-20 flex">
        <div className="flex-1" onClick={onPrevious}></div>
        <div className="flex-1" onClick={onNext}></div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        .animate-progress {
          animation: progress 5s linear forwards;
        }
      `}</style>
    </div>
  );
}
