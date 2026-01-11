/**
 * Reaction Picker Component
 * Shows 10 emoji reactions for images (like Facebook/LinkedIn)
 */

'use client'

import { useState } from 'react'
import type { ReactionType } from '@/lib/mediaComments'

interface ReactionPickerProps {
  currentReaction?: ReactionType | null
  onReact: (reactionType: ReactionType) => void
  disabled?: boolean
}

const reactions: Array<{ type: ReactionType; emoji: string; label: string }> = [
  { type: 'elsker', emoji: '❤️', label: 'Elsker' },
  { type: 'haha', emoji: '😂', label: 'Haha' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'trist', emoji: '😢', label: 'Trist' },
  { type: 'sint', emoji: '😡', label: 'Sint' },
  { type: 'tommel', emoji: '👍', label: 'Tommel opp' },
  { type: 'ild', emoji: '🔥', label: 'Ild' },
  { type: 'feiring', emoji: '🎉', label: 'Feiring' },
  { type: 'hundre', emoji: '💯', label: 'Hundre' },
  { type: 'takk', emoji: '🙏', label: 'Takk' }
]

export function ReactionPicker({ currentReaction, onReact, disabled }: ReactionPickerProps) {
  const [showPicker, setShowPicker] = useState(false)

  const handleReact = (reactionType: ReactionType) => {
    onReact(reactionType)
    setShowPicker(false)
  }

  // Get current reaction emoji
  const currentEmoji = currentReaction
    ? reactions.find(r => r.type === currentReaction)?.emoji || '❤️'
    : '❤️'

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        disabled={disabled}
        className={`flex items-center gap-2 transition-colors ${
          currentReaction ? 'text-rose-500' : 'text-gray-400 hover:text-rose-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={currentReaction ? `Du har reagert med ${currentReaction}` : 'Reager på bilde'}
      >
        <span className="text-lg">{currentEmoji}</span>
      </button>

      {/* Reaction Picker Popup */}
      {showPicker && (
        <>
          {/* Backdrop to close picker */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPicker(false)}
          />

          {/* Picker */}
          <div className="absolute bottom-full left-0 mb-2 z-50 bg-zinc-900 border border-white/10 rounded-full shadow-2xl px-3 py-2 flex items-center gap-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {reactions.map(({ type, emoji, label }) => (
              <button
                key={type}
                onClick={() => handleReact(type)}
                className={`
                  text-2xl hover:scale-125 transition-transform duration-150
                  ${currentReaction === type ? 'scale-125 drop-shadow-lg' : ''}
                `}
                title={label}
                aria-label={label}
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Reaction Summary Component
 * Shows aggregated reactions with counts
 */
interface ReactionSummaryProps {
  reactions: Record<ReactionType, number>
  totalCount: number
  userReaction?: ReactionType | null
  recentUsers?: Array<{
    id: string
    full_name: string
    avatar_url?: string | null
    reaction_type: ReactionType
  }>
}

export function ReactionSummary({ reactions, totalCount, userReaction, recentUsers }: ReactionSummaryProps) {
  if (totalCount === 0) return null

  // Define reactions map
  const reactionsMap: Array<{ type: ReactionType; emoji: string; label: string }> = [
    { type: 'elsker', emoji: '❤️', label: 'Elsker' },
    { type: 'haha', emoji: '😂', label: 'Haha' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
    { type: 'trist', emoji: '😢', label: 'Trist' },
    { type: 'sint', emoji: '😡', label: 'Sint' },
    { type: 'tommel', emoji: '👍', label: 'Tommel opp' },
    { type: 'ild', emoji: '🔥', label: 'Ild' },
    { type: 'feiring', emoji: '🎉', label: 'Feiring' },
    { type: 'hundre', emoji: '💯', label: 'Hundre' },
    { type: 'takk', emoji: '🙏', label: 'Takk' }
  ]

  // Get top 3 reactions by count
  const topReactions = Object.entries(reactions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => reactionsMap.find(r => r.type === type)!)
    .filter(Boolean)

  return (
    <div className="flex items-center gap-2">
      {/* Emoji stack */}
      <div className="flex items-center -space-x-1">
        {topReactions.map(reaction => (
          <span
            key={reaction.type}
            className="inline-block w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs"
            title={reaction.label}
          >
            {reaction.emoji}
          </span>
        ))}
      </div>

      {/* Count */}
      <span className="text-sm font-medium">{totalCount}</span>

      {/* Recent users (optional) */}
      {recentUsers && recentUsers.length > 0 && (
        <div className="hidden lg:flex items-center gap-1 ml-2">
          {recentUsers.slice(0, 3).map(user => (
            <img
              key={user.id}
              src={user.avatar_url || ''}
              alt={user.full_name}
              className="w-5 h-5 rounded-full border border-zinc-700"
            />
          ))}
          {recentUsers.length > 3 && (
            <span className="text-xs text-gray-400">+{recentUsers.length - 3}</span>
          )}
        </div>
      )}
    </div>
  )
}
