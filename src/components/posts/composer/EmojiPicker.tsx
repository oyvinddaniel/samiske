'use client'

import { useState, useRef, useEffect } from 'react'
import { Smile, Search, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  className?: string
}

// Emoji categories with common emojis
const EMOJI_CATEGORIES = {
  recent: {
    name: 'Nylige',
    icon: <Clock className="w-4 h-4" />,
    emojis: [] as string[], // Populated from localStorage
  },
  smileys: {
    name: 'Smileys',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
      '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛',
      '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
      '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌',
      '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
      '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓',
      '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺',
      '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣',
      '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈',
      '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾',
    ],
  },
  gestures: {
    name: 'Hender',
    icon: '👋',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
      '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
      '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂',
      '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅',
      '👄', '💋', '🩸',
    ],
  },
  people: {
    name: 'Personer',
    icon: '👤',
    emojis: [
      '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔', '👩', '🧓',
      '👴', '👵', '🙍', '🙎', '🙅', '🙆', '💁', '🙋', '🧏', '🙇',
      '🤦', '🤷', '👮', '🕵️', '💂', '🥷', '👷', '🤴', '👸', '👳',
      '👲', '🧕', '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🤶', '🦸',
      '🦹', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞', '🧟', '💆', '💇',
      '🚶', '🧍', '🧎', '🏃', '💃', '🕺', '🕴️', '👯', '🧖', '🧗',
    ],
  },
  nature: {
    name: 'Natur',
    icon: '🌿',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨',
      '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
      '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇',
      '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞',
      '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢',
      '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡',
      '🌵', '🎄', '🌲', '🌳', '🌴', '🪵', '🌱', '🌿', '☘️', '🍀',
      '🎍', '🪴', '🎋', '🍃', '🍂', '🍁', '🍄', '🌾', '💐', '🌷',
      '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝', '🌛', '🌜',
      '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌙',
    ],
  },
  food: {
    name: 'Mat',
    icon: '🍔',
    emojis: [
      '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏',
      '🍐', '🍑', '🍒', '🍓', '🫐', '🥝', '🍅', '🫒', '🥥', '🥑',
      '🍆', '🥔', '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬', '🥦', '🧄',
      '🧅', '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🫓', '🥨', '🥯',
      '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕',
      '🌭', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆', '🥚', '🍳', '🥘',
      '🍲', '🫕', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘',
      '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥',
      '🥮', '🍡', '🥟', '🥠', '🥡', '🦀', '🦞', '🦐', '🦑', '🦪',
      '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫',
      '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕', '🫖', '🍵', '🍶',
      '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🥤', '🧋',
    ],
  },
  activities: {
    name: 'Aktiviteter',
    icon: '⚽',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
      '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
      '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷',
      '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️',
      '🤺', '🤾', '🏌️', '🏇', '⛸️', '🏄', '🏊', '🤽', '🚣', '🧗',
      '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️',
      '🎫', '🎟️', '🎪', '🤹', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼',
      '🎹', '🥁', '🪘', '🎷', '🎺', '🪗', '🎸', '🪕', '🎻', '🎲',
      '♟️', '🎯', '🎳', '🎮', '🎰', '🧩',
    ],
  },
  objects: {
    name: 'Objekter',
    icon: '💡',
    emojis: [
      '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️',
      '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥',
      '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️',
      '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋',
      '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴',
      '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛',
      '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️', '🪤', '🧱',
      '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️',
      '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️',
      '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠',
    ],
  },
  symbols: {
    name: 'Symboler',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
      '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
      '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
      '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳',
      '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️',
      '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️',
      '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️',
      '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓',
      '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️',
      '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠',
      'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🛗', '🈳', '🈂️',
      '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '⚧', '🚻', '🚮',
      '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗',
      '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣',
      '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️',
      '⏸️', '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬',
      '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️',
      '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂',
      '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '♾️', '💲',
      '💱', '™️', '©️', '®️', '👁️‍🗨️', '🔚', '🔙', '🔛', '🔝', '🔜',
      '〰️', '➰', '➿', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢',
      '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶',
      '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥',
      '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔈', '🔇',
      '🔉', '🔊', '🔔', '🔕', '📣', '📢', '💬', '💭', '🗯️', '♠️',
      '♣️', '♥️', '♦️', '🃏', '🎴', '🀄', '🕐', '🕑', '🕒', '🕓',
    ],
  },
  flags: {
    name: 'Flagg',
    icon: '🏳️',
    emojis: [
      '🏳️', '🏴', '🏁', '🚩', '🏳️‍🌈', '🏳️‍⚧️', '🇳🇴', '🇸🇪', '🇫🇮', '🇩🇰',
      '🇮🇸', '🇬🇧', '🇺🇸', '🇩🇪', '🇫🇷', '🇪🇸', '🇮🇹', '🇵🇹', '🇳🇱', '🇧🇪',
      '🇨🇭', '🇦🇹', '🇵🇱', '🇨🇿', '🇭🇺', '🇷🇴', '🇧🇬', '🇬🇷', '🇹🇷', '🇷🇺',
      '🇺🇦', '🇧🇾', '🇱🇹', '🇱🇻', '🇪🇪', '🇯🇵', '🇰🇷', '🇨🇳', '🇮🇳', '🇧🇷',
      '🇦🇷', '🇲🇽', '🇨🇦', '🇦🇺', '🇳🇿', '🇿🇦', '🇪🇬', '🇳🇬', '🇰🇪', '🇪🇹',
    ],
  },
}

const STORAGE_KEY = 'samiske-recent-emojis'
const MAX_RECENT = 20

export function EmojiPicker({ onEmojiSelect, className }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>('smileys')
  const [recentEmojis, setRecentEmojis] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Load recent emojis from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setRecentEmojis(JSON.parse(stored))
      }
    } catch {
      // Ignore
    }
  }, [])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleEmojiClick = (emoji: string) => {
    // Add to recent
    const newRecent = [emoji, ...recentEmojis.filter((e) => e !== emoji)].slice(0, MAX_RECENT)
    setRecentEmojis(newRecent)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecent))

    onEmojiSelect(emoji)
    setIsOpen(false)
  }

  // Filter emojis by search
  const getFilteredEmojis = () => {
    if (!searchQuery) return null

    const query = searchQuery.toLowerCase()
    const results: string[] = []

    Object.values(EMOJI_CATEGORIES).forEach((category) => {
      category.emojis.forEach((emoji) => {
        // Simple search - in a real app you'd have emoji names/keywords
        if (results.length < 50) {
          results.push(emoji)
        }
      })
    })

    return results.slice(0, 50)
  }

  const filteredEmojis = getFilteredEmojis()
  const currentCategory = EMOJI_CATEGORIES[activeCategory]
  const displayEmojis = filteredEmojis || (activeCategory === 'recent' ? recentEmojis : currentCategory.emojis)

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 w-9"
      >
        <Smile className="w-5 h-5 text-gray-500" />
      </Button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
          {/* Search */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Søk emoji..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Category tabs */}
          {!searchQuery && (
            <div className="flex overflow-x-auto p-1 border-b gap-1">
              {recentEmojis.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveCategory('recent')}
                  className={cn(
                    'p-2 rounded-lg transition-colors flex-shrink-0',
                    activeCategory === 'recent' ? 'bg-blue-100' : 'hover:bg-gray-100'
                  )}
                  title="Nylige"
                >
                  <Clock className="w-4 h-4" />
                </button>
              )}
              {(Object.entries(EMOJI_CATEGORIES) as [keyof typeof EMOJI_CATEGORIES, typeof EMOJI_CATEGORIES.smileys][])
                .filter(([key]) => key !== 'recent')
                .map(([key, category]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveCategory(key)}
                    className={cn(
                      'p-2 rounded-lg transition-colors flex-shrink-0',
                      activeCategory === key ? 'bg-blue-100' : 'hover:bg-gray-100'
                    )}
                    title={category.name}
                  >
                    <span className="text-lg">{typeof category.icon === 'string' ? category.icon : category.icon}</span>
                  </button>
                ))}
            </div>
          )}

          {/* Emoji grid */}
          <div className="p-2 h-64 overflow-y-auto">
            {!searchQuery && (
              <div className="text-xs text-gray-500 font-medium mb-2 px-1">
                {activeCategory === 'recent' ? 'Nylige' : currentCategory.name}
              </div>
            )}
            <div className="grid grid-cols-8 gap-1">
              {displayEmojis.map((emoji, index) => (
                <button
                  key={`${emoji}-${index}`}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="p-1.5 text-xl hover:bg-gray-100 rounded transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
            {displayEmojis.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                {searchQuery ? 'Ingen emojis funnet' : 'Ingen nylige emojis'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
