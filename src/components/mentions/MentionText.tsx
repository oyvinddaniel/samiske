'use client'

import { Fragment } from 'react'

interface MentionTextProps {
  content: string
  className?: string
}

// Patterns for both old format @[Name](id) and new format @Name
const OLD_MENTION_PATTERN = /@\[([^\]]+)\]\(([^)]+)\)/g
const NEW_MENTION_PATTERN = /@([\wæøåÆØÅ]+(?:\s[\wæøåÆØÅ]+)?)/gi

interface ParsedPart {
  type: 'text' | 'mention'
  content: string
  name?: string
}

function parseMentions(text: string): ParsedPart[] {
  const parts: ParsedPart[] = []
  let remaining = text
  let lastIndex = 0

  // First, handle old format @[Name](id) - convert to just the name
  OLD_MENTION_PATTERN.lastIndex = 0
  remaining = text.replace(OLD_MENTION_PATTERN, '@$1')

  // Now parse @Name mentions
  NEW_MENTION_PATTERN.lastIndex = 0
  let match

  while ((match = NEW_MENTION_PATTERN.exec(remaining)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: remaining.slice(lastIndex, match.index),
      })
    }

    // Add mention
    parts.push({
      type: 'mention',
      content: match[0],
      name: match[1],
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < remaining.length) {
    parts.push({
      type: 'text',
      content: remaining.slice(lastIndex),
    })
  }

  return parts
}

export function MentionText({ content, className }: MentionTextProps) {
  const parts = parseMentions(content)

  if (parts.length === 0) {
    return <span className={className}>{content}</span>
  }

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'mention' && part.name) {
          return (
            <span
              key={index}
              className="text-blue-600 font-medium"
            >
              @{part.name}
            </span>
          )
        }
        return <Fragment key={index}>{part.content}</Fragment>
      })}
    </span>
  )
}

// Check if content contains mentions
export function hasMentions(content: string): boolean {
  OLD_MENTION_PATTERN.lastIndex = 0
  NEW_MENTION_PATTERN.lastIndex = 0
  return OLD_MENTION_PATTERN.test(content) || NEW_MENTION_PATTERN.test(content)
}
