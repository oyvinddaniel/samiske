'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { User, Users, MapPin, Building2, Globe, Languages } from 'lucide-react'

// Mention types that can be extended
export type MentionType = 'user' | 'community' | 'place' | 'municipality' | 'language_area' | 'group'

interface MentionResult {
  id: string
  type: MentionType
  name: string
  displayName: string // What gets inserted
  subtitle?: string
  avatar_url?: string | null
  icon?: React.ReactNode
  isFullName?: boolean // For user full name option
}

interface MentionTextareaProps {
  value: string
  onChange: (value: string, mentions: MentionData[]) => void
  placeholder?: string
  rows?: number
  className?: string
  required?: boolean
  id?: string
  // Which mention types to enable (default: all)
  enabledTypes?: MentionType[]
}

export interface MentionData {
  id: string
  type: MentionType
  name: string
}

const TYPE_ICONS: Record<MentionType, React.ReactNode> = {
  user: <User className="w-4 h-4 text-blue-600" />,
  community: <Building2 className="w-4 h-4 text-purple-600" />,
  place: <MapPin className="w-4 h-4 text-green-600" />,
  municipality: <MapPin className="w-4 h-4 text-emerald-600" />,
  language_area: <Languages className="w-4 h-4 text-teal-600" />,
  group: <Users className="w-4 h-4 text-orange-600" />,
}

const TYPE_LABELS: Record<MentionType, string> = {
  user: 'Brukere',
  community: 'Samfunn',
  place: 'Steder',
  municipality: 'Kommuner',
  language_area: 'Språkområder',
  group: 'Grupper',
}

export function MentionTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
  required,
  id,
  enabledTypes = ['user', 'community', 'place', 'municipality', 'language_area', 'group'],
}: MentionTextareaProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<MentionResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionStart, setMentionStart] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [mentions, setMentions] = useState<Map<string, MentionData>>(new Map())

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Search all enabled entity types
  useEffect(() => {
    if (!mentionQuery || mentionQuery.length < 1) {
      setSuggestions([])
      return
    }

    const searchEntities = async () => {
      setLoading(true)
      const results: MentionResult[] = []

      try {
        const searches: Promise<void>[] = []

        // Search users - show both first name (recommended) and full name options
        if (enabledTypes.includes('user')) {
          searches.push(
            (async () => {
              const { data } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .ilike('full_name', `%${mentionQuery}%`)
                .limit(3)
              data?.forEach(user => {
                const firstName = user.full_name.split(' ')[0]
                const hasLastName = user.full_name.includes(' ')

                // First name option (recommended)
                results.push({
                  id: user.id,
                  type: 'user',
                  name: user.full_name,
                  displayName: firstName,
                  subtitle: hasLastName ? 'Fornavn (anbefalt)' : undefined,
                  avatar_url: user.avatar_url,
                  icon: TYPE_ICONS.user,
                })

                // Full name option (only if they have a last name)
                if (hasLastName) {
                  results.push({
                    id: user.id,
                    type: 'user',
                    name: user.full_name,
                    displayName: user.full_name,
                    subtitle: 'Fullt navn (formelt)',
                    avatar_url: user.avatar_url,
                    icon: TYPE_ICONS.user,
                    isFullName: true,
                  })
                }
              })
            })()
          )
        }

        // Search communities
        if (enabledTypes.includes('community')) {
          searches.push(
            (async () => {
              const { data } = await supabase
                .from('communities')
                .select('id, name, logo_url, category')
                .eq('is_active', true)
                .ilike('name', `%${mentionQuery}%`)
                .limit(3)
              data?.forEach(community => {
                results.push({
                  id: community.id,
                  type: 'community',
                  name: community.name,
                  displayName: community.name,
                  subtitle: community.category,
                  avatar_url: community.logo_url,
                  icon: TYPE_ICONS.community,
                })
              })
            })()
          )
        }

        // Search places
        if (enabledTypes.includes('place')) {
          searches.push(
            (async () => {
              const { data } = await supabase
                .from('places')
                .select('id, name, name_sami, municipality:municipalities(name)')
                .or(`name.ilike.%${mentionQuery}%,name_sami.ilike.%${mentionQuery}%`)
                .limit(3)
              data?.forEach(place => {
                const municipality = Array.isArray(place.municipality)
                  ? place.municipality[0]
                  : place.municipality
                const placeName = place.name_sami || place.name
                results.push({
                  id: place.id,
                  type: 'place',
                  name: placeName,
                  displayName: placeName,
                  subtitle: municipality?.name ? `Sted i ${municipality.name}` : 'Sted',
                  icon: TYPE_ICONS.place,
                })
              })
            })()
          )
        }

        // Search municipalities (kommuner)
        if (enabledTypes.includes('municipality')) {
          searches.push(
            (async () => {
              const { data } = await supabase
                .from('municipalities')
                .select('id, name, name_sami, country:countries(name)')
                .or(`name.ilike.%${mentionQuery}%,name_sami.ilike.%${mentionQuery}%`)
                .limit(3)
              data?.forEach(muni => {
                const country = Array.isArray(muni.country)
                  ? muni.country[0]
                  : muni.country
                const muniName = muni.name_sami || muni.name
                results.push({
                  id: muni.id,
                  type: 'municipality',
                  name: muniName,
                  displayName: muniName,
                  subtitle: country?.name ? `Kommune i ${country.name}` : 'Kommune',
                  icon: TYPE_ICONS.municipality,
                })
              })
            })()
          )
        }

        // Search language areas (språkområder) + Sápmi
        if (enabledTypes.includes('language_area')) {
          searches.push(
            (async () => {
              // Add Sápmi as a special option if query matches
              const samiTerms = ['sápmi', 'sapmi', 'sameland', 'sami']
              if (samiTerms.some(term => term.includes(mentionQuery.toLowerCase()) || mentionQuery.toLowerCase().includes(term.slice(0, 2)))) {
                results.push({
                  id: 'sapmi',
                  type: 'language_area',
                  name: 'Sápmi',
                  displayName: 'Sápmi',
                  subtitle: 'Hele det samiske området',
                  icon: <Globe className="w-4 h-4 text-teal-600" />,
                })
              }

              const { data } = await supabase
                .from('language_areas')
                .select('id, name, name_sami')
                .or(`name.ilike.%${mentionQuery}%,name_sami.ilike.%${mentionQuery}%`)
                .limit(3)
              data?.forEach(area => {
                const areaName = area.name_sami || area.name
                results.push({
                  id: area.id,
                  type: 'language_area',
                  name: areaName,
                  displayName: areaName,
                  subtitle: 'Språkområde',
                  icon: TYPE_ICONS.language_area,
                })
              })
            })()
          )
        }

        // Search groups
        if (enabledTypes.includes('group')) {
          searches.push(
            (async () => {
              const { data } = await supabase
                .from('groups')
                .select('id, name, avatar_url')
                .ilike('name', `%${mentionQuery}%`)
                .limit(3)
              data?.forEach(group => {
                results.push({
                  id: group.id,
                  type: 'group',
                  name: group.name,
                  displayName: group.name,
                  avatar_url: group.avatar_url,
                  icon: TYPE_ICONS.group,
                })
              })
            })()
          )
        }

        await Promise.all(searches)
        setSuggestions(results)
      } catch (err) {
        console.error('Error searching entities:', err)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(searchEntities, 150)
    return () => clearTimeout(debounce)
  }, [mentionQuery, supabase, enabledTypes])

  useEffect(() => {
    setSelectedIndex(0)
  }, [suggestions])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart || 0

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

    // Update tracked mentions
    const newMentions = new Map<string, MentionData>()
    mentions.forEach((data, key) => {
      if (newValue.includes(`@${data.name}`)) {
        newMentions.set(key, data)
      }
    })
    setMentions(newMentions)

    onChange(newValue, Array.from(newMentions.values()))
  }

  const insertMention = useCallback((result: MentionResult) => {
    if (mentionStart === null || !textareaRef.current) return

    const textarea = textareaRef.current
    const cursorPos = textarea.selectionStart || 0
    const beforeMention = value.slice(0, mentionStart)
    const afterMention = value.slice(cursorPos)

    // Use displayName from the result (can be first name or full name for users)
    const mentionText = `@${result.displayName} `
    const newValue = beforeMention + mentionText + afterMention

    // Track this mention - use unique key including fullName flag for users
    const key = result.isFullName
      ? `${result.type}:${result.id}:full`
      : `${result.type}:${result.id}`
    const newMentions = new Map(mentions)
    newMentions.set(key, {
      id: result.id,
      type: result.type,
      name: result.displayName,
    })
    setMentions(newMentions)

    onChange(newValue, Array.from(newMentions.values()))

    setShowSuggestions(false)
    setMentionQuery('')
    setMentionStart(null)

    const newCursorPos = mentionStart + mentionText.length
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }, [mentionStart, value, mentions, onChange])

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

  // Group suggestions by type
  const groupedSuggestions = suggestions.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = []
    acc[item.type].push(item)
    return acc
  }, {} as Record<MentionType, MentionResult[]>)

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

      {showSuggestions && (mentionQuery.length >= 1 || loading) && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto"
        >
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500">Søker...</div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              Ingen resultater for &quot;{mentionQuery}&quot;
            </div>
          ) : (
            Object.entries(groupedSuggestions).map(([type, items]) => (
              <div key={type}>
                <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 sticky top-0">
                  {TYPE_LABELS[type as MentionType]}
                </div>
                {items.map((item) => {
                  const globalIndex = suggestions.indexOf(item)
                  return (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={() => insertMention(item)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors",
                        globalIndex === selectedIndex && "bg-blue-50"
                      )}
                    >
                      {item.avatar_url ? (
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={item.avatar_url} />
                          <AvatarFallback className="text-xs bg-gray-100">
                            {getInitials(item.name)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          {item.icon}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        {item.subtitle && (
                          <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// Helper functions
export function extractMentions(content: string): string[] {
  const mentionPattern = /@([\wæøåÆØÅ]+(?:\s+[\wæøåÆØÅ]+)*)/gi
  const mentions: string[] = []
  let match
  while ((match = mentionPattern.exec(content)) !== null) {
    mentions.push(match[1])
  }
  return mentions
}

export function extractMentionIds(content: string): string[] {
  const mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g
  const ids: string[] = []
  let match
  while ((match = mentionPattern.exec(content)) !== null) {
    ids.push(match[2])
  }
  return ids
}
