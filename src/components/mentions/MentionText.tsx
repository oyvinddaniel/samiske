'use client'

import { Fragment } from 'react'
import Link from 'next/link'

interface MentionTextProps {
  content: string
  className?: string
}

// Pattern for new format @[Name](type:id)
const MENTION_PATTERN = /@\[([^\]]+)\]\(([^:]+):([^)]+)\)/g
// Pattern for legacy @Name format (no ID)
const LEGACY_MENTION_PATTERN = /@([\wæøåÆØÅ]+(?:\s[\wæøåÆØÅ]+)?)/gi
// Pattern for hashtags #tag
const HASHTAG_PATTERN = /#([\wæøåÆØÅ]+)/gi

type MentionType = 'user' | 'community' | 'place' | 'municipality' | 'language_area' | 'group'

interface ParsedPart {
  type: 'text' | 'mention' | 'hashtag'
  content: string
  name?: string
  mentionType?: MentionType
  mentionId?: string
  hashtag?: string
}

interface MatchInfo {
  index: number
  length: number
  partType: 'mention' | 'hashtag'
  name?: string
  mentionType?: MentionType
  mentionId?: string
  hashtag?: string
}

function parseMentionsAndHashtags(text: string): ParsedPart[] {
  const parts: ParsedPart[] = []
  const allMatches: MatchInfo[] = []

  // Reset regexes
  MENTION_PATTERN.lastIndex = 0
  HASHTAG_PATTERN.lastIndex = 0

  // Find all @[Name](type:id) mentions
  let match
  while ((match = MENTION_PATTERN.exec(text)) !== null) {
    allMatches.push({
      index: match.index,
      length: match[0].length,
      partType: 'mention',
      name: match[1],
      mentionType: match[2] as MentionType,
      mentionId: match[3],
    })
  }

  // Find all #hashtags
  while ((match = HASHTAG_PATTERN.exec(text)) !== null) {
    // Don't match if it overlaps with a mention
    const overlaps = allMatches.some(
      m => match!.index >= m.index && match!.index < m.index + m.length
    )
    if (!overlaps) {
      allMatches.push({
        index: match.index,
        length: match[0].length,
        partType: 'hashtag',
        hashtag: match[1],
      })
    }
  }

  // Sort by index
  allMatches.sort((a, b) => a.index - b.index)

  // Build parts array
  let lastIndex = 0
  for (const matchInfo of allMatches) {
    // Add text before match
    if (matchInfo.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, matchInfo.index),
      })
    }

    if (matchInfo.partType === 'mention') {
      parts.push({
        type: 'mention',
        content: `@${matchInfo.name}`,
        name: matchInfo.name,
        mentionType: matchInfo.mentionType,
        mentionId: matchInfo.mentionId,
      })
    } else if (matchInfo.partType === 'hashtag') {
      parts.push({
        type: 'hashtag',
        content: `#${matchInfo.hashtag}`,
        hashtag: matchInfo.hashtag,
      })
    }

    lastIndex = matchInfo.index + matchInfo.length
  }

  // Add remaining text (check for legacy @Name mentions)
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex)
    let legacyLastIndex = 0
    LEGACY_MENTION_PATTERN.lastIndex = 0

    while ((match = LEGACY_MENTION_PATTERN.exec(remainingText)) !== null) {
      if (match.index > legacyLastIndex) {
        parts.push({
          type: 'text',
          content: remainingText.slice(legacyLastIndex, match.index),
        })
      }
      parts.push({
        type: 'mention',
        content: match[0],
        name: match[1],
      })
      legacyLastIndex = match.index + match[0].length
    }

    if (legacyLastIndex < remainingText.length) {
      parts.push({
        type: 'text',
        content: remainingText.slice(legacyLastIndex),
      })
    }
  }

  return parts
}

// Open the appropriate panel based on mention type
function handleMentionClick(type: MentionType | undefined, id: string | undefined) {
  if (!type || !id) return

  switch (type) {
    case 'user':
      window.dispatchEvent(
        new CustomEvent('open-user-profile-panel', { detail: { userId: id } })
      )
      break
    case 'group':
      window.dispatchEvent(
        new CustomEvent('open-group-panel', { detail: { groupId: id } })
      )
      break
    case 'community':
      window.dispatchEvent(
        new CustomEvent('open-community-panel', { detail: { communityId: id } })
      )
      break
    case 'place':
      window.dispatchEvent(
        new CustomEvent('open-place-panel', { detail: { placeId: id } })
      )
      break
    case 'municipality':
      window.dispatchEvent(
        new CustomEvent('open-municipality-panel', { detail: { municipalityId: id } })
      )
      break
    case 'language_area':
      window.dispatchEvent(
        new CustomEvent('open-language-area-panel', { detail: { areaId: id } })
      )
      break
  }
}

export function MentionText({ content, className }: MentionTextProps) {
  const parts = parseMentionsAndHashtags(content)

  if (parts.length === 0) {
    return <span className={className}>{content}</span>
  }

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'mention' && part.name) {
          const isClickable = part.mentionType && part.mentionId

          if (isClickable) {
            return (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleMentionClick(part.mentionType, part.mentionId)
                }}
                className="text-blue-600 font-medium hover:underline cursor-pointer"
              >
                @{part.name}
              </button>
            )
          }

          // Legacy mention without ID - just styled text
          return (
            <span
              key={index}
              className="text-blue-600 font-medium"
            >
              @{part.name}
            </span>
          )
        }

        // Hashtag - clickable link to hashtag page
        if (part.type === 'hashtag' && part.hashtag) {
          return (
            <Link
              key={index}
              href={`/hashtag/${encodeURIComponent(part.hashtag.toLowerCase())}`}
              onClick={(e) => e.stopPropagation()}
              className="text-blue-600 font-medium hover:underline"
            >
              #{part.hashtag}
            </Link>
          )
        }

        return <Fragment key={index}>{part.content}</Fragment>
      })}
    </span>
  )
}

// Check if content contains mentions or hashtags
export function hasMentions(content: string): boolean {
  MENTION_PATTERN.lastIndex = 0
  LEGACY_MENTION_PATTERN.lastIndex = 0
  return MENTION_PATTERN.test(content) || LEGACY_MENTION_PATTERN.test(content)
}

// Check if content contains hashtags
export function hasHashtags(content: string): boolean {
  HASHTAG_PATTERN.lastIndex = 0
  return HASHTAG_PATTERN.test(content)
}

// Extract all hashtags from content (for saving to DB)
export function extractHashtags(content: string): string[] {
  const hashtags: string[] = []
  HASHTAG_PATTERN.lastIndex = 0

  let match
  while ((match = HASHTAG_PATTERN.exec(content)) !== null) {
    const tag = match[1]
    // Don't add duplicates (case-insensitive)
    if (!hashtags.some(h => h.toLowerCase() === tag.toLowerCase())) {
      hashtags.push(tag)
    }
  }

  return hashtags
}
