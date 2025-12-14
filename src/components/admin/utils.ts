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

export const getReasonLabel = (reason: string) => {
  const labels: Record<string, string> = {
    spam: 'Spam',
    harassment: 'Trakassering',
    hate: 'Hatefullt',
    misinformation: 'Feilinformasjon',
    inappropriate: 'Upassende',
    other: 'Annet',
  }
  return labels[reason] || reason
}
