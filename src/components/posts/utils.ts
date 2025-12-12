// Utility functions for post components

import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'

export const getInitials = (name: string | null) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const formatDate = (dateString: string) => {
  try {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: nb,
    })
  } catch {
    return dateString
  }
}

export const formatEventDate = (date: string, time?: string | null) => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }
  const dateObj = new Date(date)
  let formatted = dateObj.toLocaleDateString('nb-NO', options)
  if (time) {
    formatted += ` kl. ${time.slice(0, 5)}`
  }
  return formatted
}
