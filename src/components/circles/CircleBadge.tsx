'use client'

import { Users, Heart, Star, Briefcase, Home, GraduationCap, Music, Gamepad2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CircleBadgeProps {
  name: string
  color: string
  icon?: string
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  onClick?: () => void
  selected?: boolean
}

const iconMap: Record<string, React.ReactNode> = {
  users: <Users className="w-full h-full" />,
  heart: <Heart className="w-full h-full" />,
  star: <Star className="w-full h-full" />,
  briefcase: <Briefcase className="w-full h-full" />,
  home: <Home className="w-full h-full" />,
  'graduation-cap': <GraduationCap className="w-full h-full" />,
  music: <Music className="w-full h-full" />,
  'gamepad-2': <Gamepad2 className="w-full h-full" />,
}

const sizeClasses = {
  sm: 'w-5 h-5 p-1',
  md: 'w-7 h-7 p-1.5',
  lg: 'w-9 h-9 p-2',
}

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

export function CircleBadge({
  name,
  color,
  icon = 'users',
  size = 'md',
  showName = true,
  onClick,
  selected = false,
}: CircleBadgeProps) {
  const IconComponent = iconMap[icon] || iconMap.users

  const badge = (
    <div
      className={cn(
        'flex items-center gap-2',
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity'
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          'rounded-full flex items-center justify-center text-white',
          sizeClasses[size],
          selected && 'ring-2 ring-offset-2 ring-blue-500'
        )}
        style={{ backgroundColor: color }}
      >
        {IconComponent}
      </div>
      {showName && (
        <span className={cn('font-medium', textSizeClasses[size])}>
          {name}
        </span>
      )}
    </div>
  )

  return badge
}
