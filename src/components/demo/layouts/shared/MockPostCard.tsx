'use client';

import { Heart, MessageCircle, Share2, Bookmark, MapPin, Users } from 'lucide-react';
import { MockPost, formatTimestamp, formatNumber } from './MockData';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useState } from 'react';

interface MockPostCardProps {
  post: MockPost;
  variant?: 'default' | 'minimal' | 'compact' | 'featured';
  className?: string;
}

export function MockPostCard({ post, variant = 'default', className = '' }: MockPostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <article className={`bg-white border-b border-gray-100 p-6 hover:bg-gray-50/50 transition-colors ${className}`}>
        <div className="flex items-start gap-3">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-900">{post.author.name}</span>
              {post.author.location && (
                <>
                  <span className="text-gray-400">·</span>
                  <span className="text-sm text-gray-500">{post.author.location}</span>
                </>
              )}
              <span className="text-gray-400">·</span>
              <span className="text-sm text-gray-500">{formatTimestamp(post.timestamp)}</span>
            </div>

            <p className="text-gray-800 text-lg leading-relaxed mb-3">
              {post.content}
            </p>

            {post.images && post.images.length > 0 && (
              <div className="rounded-xl overflow-hidden mb-3">
                <img
                  src={post.images[0]}
                  alt="Post image"
                  className="w-full h-auto"
                />
              </div>
            )}

            <div className="flex items-center gap-6 text-gray-500">
              <button onClick={handleLike} className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                <span className="text-sm">{formatNumber(likeCount)}</span>
              </button>
              <button className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">{formatNumber(post.comments)}</span>
              </button>
              <button className="flex items-center gap-2 hover:text-blue-600 transition-colors ml-auto">
                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-blue-600 text-blue-600' : ''}`} onClick={handleBookmark} />
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <Card className={`overflow-hidden hover:shadow-md transition-shadow ${className}`}>
        {post.images && post.images.length > 0 && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={post.images[0]}
              alt="Post image"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{post.author.name}</p>
              <p className="text-xs text-gray-500">{formatTimestamp(post.timestamp)}</p>
            </div>
          </div>

          <p className="text-sm text-gray-700 line-clamp-3 mb-3">
            {post.content}
          </p>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              {formatNumber(post.likes)}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {formatNumber(post.comments)}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Featured variant
  if (variant === 'featured') {
    return (
      <Card className={`overflow-hidden hover:shadow-xl transition-shadow ${className}`}>
        {post.images && post.images.length > 0 && (
          <div className="relative h-96 overflow-hidden">
            <img
              src={post.images[0]}
              alt="Post image"
              className="w-full h-full object-cover"
            />
            {post.community && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-blue-600 text-white">
                  <Users className="w-3 h-3 mr-1" />
                  {post.community}
                </Badge>
              </div>
            )}
          </div>
        )}

        <CardHeader>
          <div className="flex items-start gap-3">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-12 h-12 rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-bold text-gray-900">{post.author.name}</span>
                {post.author.location && (
                  <Badge variant="secondary" className="text-xs">
                    <MapPin className="w-3 h-3 mr-1" />
                    {post.author.location}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">{formatTimestamp(post.timestamp)}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-lg text-gray-800 leading-relaxed">
            {post.content}
          </p>
        </CardContent>

        <CardFooter className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={isLiked ? 'text-red-500' : ''}
            >
              <Heart className={`w-5 h-5 mr-2 ${isLiked ? 'fill-current' : ''}`} />
              {formatNumber(likeCount)}
            </Button>
            <Button variant="ghost" size="sm">
              <MessageCircle className="w-5 h-5 mr-2" />
              {formatNumber(post.comments)}
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="w-5 h-5 mr-2" />
              {formatNumber(post.shares)}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBookmark}
            className={isBookmarked ? 'text-blue-600' : ''}
          >
            <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={`overflow-hidden hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-gray-900">{post.author.name}</span>
                {post.author.location && (
                  <>
                    <span className="text-gray-400">·</span>
                    <span className="text-sm text-gray-500">{post.author.location}</span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-500">{formatTimestamp(post.timestamp)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {post.location && (
              <Badge variant="secondary" className="text-xs">
                <MapPin className="w-3 h-3 mr-1" />
                {post.location}
              </Badge>
            )}
            {post.community && (
              <Badge className="bg-blue-600 text-white text-xs">
                <Users className="w-3 h-3 mr-1" />
                {post.community}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-gray-800 leading-relaxed mb-4">
          {post.content}
        </p>

        {post.images && post.images.length > 0 && (
          <div className={`grid gap-2 rounded-lg overflow-hidden ${
            post.images.length === 1 ? 'grid-cols-1' :
            post.images.length === 2 ? 'grid-cols-2' :
            'grid-cols-2'
          }`}>
            {post.images.map((image, index) => (
              <div
                key={index}
                className={`relative ${
                  post.images!.length === 3 && index === 0 ? 'col-span-2' : ''
                }`}
              >
                <img
                  src={image}
                  alt={`Post image ${index + 1}`}
                  className="w-full h-64 object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`gap-2 ${isLiked ? 'text-red-500' : 'text-gray-600'}`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span>{formatNumber(likeCount)}</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 text-gray-600">
            <MessageCircle className="w-5 h-5" />
            <span>{formatNumber(post.comments)}</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 text-gray-600">
            <Share2 className="w-5 h-5" />
            <span>{formatNumber(post.shares)}</span>
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBookmark}
          className={isBookmarked ? 'text-blue-600' : 'text-gray-600'}
        >
          <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
        </Button>
      </CardFooter>
    </Card>
  );
}
