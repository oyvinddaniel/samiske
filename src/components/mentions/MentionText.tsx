'use client'

import Link from 'next/link'
import { Fragment } from 'react'

interface MentionTextProps {
  content: string
  className?: string
}

// Pattern for @[Name](userId)
const MENTION_PATTERN = /@\[([^\]]+)\]\(([^)]+)\)/g

interface ParsedPart {
  type: 'text' | 'mention'
  content: string
  userId?: string
  name?: string
}

function parseMentions(text: string): ParsedPart[] {
  const parts: ParsedPart[] = []
  let lastIndex = 0
  let match

  // Reset regex state
  MENTION_PATTERN.lastIndex = 0

  while ((match = MENTION_PATTERN.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      })
    }

    // Add mention
    parts.push({
      type: 'mention',
      content: match[0],
      name: match[1],
      userId: match[2],
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex),
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
        if (part.type === 'mention' && part.userId && part.name) {
          return (
            <Link
              key={index}
              href={`/bruker/${part.userId}`}
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              @{part.name}
            </Link>
          )
        }
        return <Fragment key={index}>{part.content}</Fragment>
      })}
    </span>
  )
}

// Check if content contains mentions
export function hasMentions(content: string): boolean {
  MENTION_PATTERN.lastIndex = 0
  return MENTION_PATTERN.test(content)
}
