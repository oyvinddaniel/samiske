'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface MentionUser {
  id: string
  full_name: string
  avatar_url: string | null
}

interface MentionTextareaProps {
  value: string
  onChange: (value: string, mentionedUserIds: string[]) => void
  placeholder?: string
  rows?: number
  className?: string
  required?: boolean
  id?: string
}

export function MentionTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
  required,
  id,
}: MentionTextareaProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<MentionUser[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionStart, setMentionStart] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  // Track mentioned users with their IDs
  const [mentionedUsers, setMentionedUsers] = useState<Map<string, string>>(new Map())

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Search users when mention query changes
  useEffect(() => {
    if (!mentionQuery || mentionQuery.length < 1) {
      setSuggestions([])
      return
    }

    const searchUsers = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .ilike('full_name', `%${mentionQuery}%`)
          .limit(5)

        if (error) throw error
        setSuggestions(data || [])
      } catch (err) {
        console.error('Error searching users:', err)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(searchUsers, 150)
    return () => clearTimeout(debounce)
  }, [mentionQuery, supabase])

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(0)
  }, [suggestions])

  // Detect @ character and track mention position
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart || 0

    // Check if we're typing a mention
    const textBeforeCursor = newValue.slice(0, cursorPos)
    const mentionMatch = textBeforeCursor.match(/@([\wæøåÆØÅ]*)$/i)

    if (mentionMatch) {
      setMentionStart(cursorPos - mentionMatch[0].length)
      setMentionQuery(mentionMatch[1])
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
      setMentionQuery('')
      setMentionStart(null)
    }

    // Check which mentions are still in the text and update tracked users
    const newMentionedUsers = new Map<string, string>()
    mentionedUsers.forEach((userId, name) => {
      if (newValue.includes(`@${name}`)) {
        newMentionedUsers.set(name, userId)
      }
    })
    setMentionedUsers(newMentionedUsers)

    onChange(newValue, Array.from(newMentionedUsers.values()))
  }

  // Insert selected user mention
  const insertMention = useCallback((user: MentionUser) => {
    if (mentionStart === null || !textareaRef.current) return

    const textarea = textareaRef.current
    const cursorPos = textarea.selectionStart || 0
    const beforeMention = value.slice(0, mentionStart)
    const afterMention = value.slice(cursorPos)

    // Just insert @Name (clean format)
    const mentionText = `@${user.full_name} `
    const newValue = beforeMention + mentionText + afterMention

    // Track this mentioned user
    const newMentionedUsers = new Map(mentionedUsers)
    newMentionedUsers.set(user.full_name, user.id)
    setMentionedUsers(newMentionedUsers)

    onChange(newValue, Array.from(newMentionedUsers.values()))

    // Reset state
    setShowSuggestions(false)
    setMentionQuery('')
    setMentionStart(null)

    // Set cursor position after mention
    const newCursorPos = mentionStart + mentionText.length
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }, [mentionStart, value, mentionedUsers, onChange])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => (i + 1) % suggestions.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => (i - 1 + suggestions.length) % suggestions.length)
        break
      case 'Enter':
        if (showSuggestions && suggestions[selectedIndex]) {
          e.preventDefault()
          insertMention(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowSuggestions(false)
        setMentionQuery('')
        setMentionStart(null)
        break
      case 'Tab':
        if (showSuggestions && suggestions[selectedIndex]) {
          e.preventDefault()
          insertMention(suggestions[selectedIndex])
        }
        break
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className={cn(
          "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none",
          className
        )}
      />

      {/* Suggestions dropdown */}
      {showSuggestions && (mentionQuery.length >= 1 || loading) && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500">Søker...</div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              Ingen brukere funnet
            </div>
          ) : (
            suggestions.map((user, index) => (
              <button
                key={user.id}
                type="button"
                onClick={() => insertMention(user)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors",
                  index === selectedIndex && "bg-blue-50"
                )}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-gray-100">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.full_name}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// Helper to extract @mentions from text (just names, for display styling)
export function extractMentions(content: string): string[] {
  const mentionPattern = /@([\wæøåÆØÅ]+(?:\s+[\wæøåÆØÅ]+)*)/gi
  const mentions: string[] = []
  let match
  while ((match = mentionPattern.exec(content)) !== null) {
    mentions.push(match[1])
  }
  return mentions
}

// For backwards compatibility - extract IDs from old format
export function extractMentionIds(content: string): string[] {
  const mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g
  const ids: string[] = []
  let match
  while ((match = mentionPattern.exec(content)) !== null) {
    ids.push(match[2])
  }
  return ids
}

export interface MentionData {
  userId: string
  name: string
}
