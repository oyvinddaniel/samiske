'use client'

import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'

interface FilterChipProps {
  icon?: LucideIcon
  label: string
  active: boolean
  onClick: () => void
  className?: string
}

export function FilterChip({ icon: Icon, label, active, onClick, className }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // Base styles (32px height, 12px horizontal padding, rounded-full for chip look)
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
        'transition-all duration-200 whitespace-nowrap',
        'border border-gray-200',
        // Active state (blue bg, white text)
        active
          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
          : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300',
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{label}</span>
    </button>
  )
}
