/**
 * Sentraliserte formateringsfunksjoner
 * Brukes av ProductCard, ServiceCard, EventCard, etc.
 */

/**
 * Formater pris med valuta
 */
export function formatPrice(
  price: number | null | undefined,
  currency: string = 'NOK',
  priceType: string = 'fixed'
): string | null {
  if (price === null || price === undefined) return null

  const formattedPrice = new Intl.NumberFormat('no-NO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)

  switch (priceType) {
    case 'from':
      return `fra ${formattedPrice}`
    case 'hourly':
      return `${formattedPrice}/time`
    case 'contact':
      return 'Ta kontakt for pris'
    default:
      return formattedPrice
  }
}

/**
 * Formater pris uten valuta-symbol (for inputs)
 */
export function formatPriceInput(price: number | null | undefined): string {
  if (price === null || price === undefined) return ''
  return new Intl.NumberFormat('no-NO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price)
}

/**
 * Parse pris fra input-streng
 */
export function parsePriceInput(value: string): number | null {
  if (!value || value.trim() === '') return null

  // Fjern mellomrom og erstatt komma med punktum
  const cleaned = value.replace(/\s/g, '').replace(',', '.')

  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? null : parsed
}

/**
 * Formater telefonnummer
 */
export function formatPhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null

  // Fjern alle ikke-numeriske tegn
  const digits = phone.replace(/\D/g, '')

  // Norsk format: +47 XXX XX XXX
  if (digits.length === 8) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`
  }

  if (digits.length === 10 && digits.startsWith('47')) {
    return `+47 ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`
  }

  if (digits.length === 11 && digits.startsWith('47')) {
    return `+47 ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`
  }

  // Returner original hvis vi ikke kan formatere
  return phone
}

/**
 * Formater dato til norsk format
 */
export function formatDate(
  date: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
): string | null {
  if (!date) return null

  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) return null

  return d.toLocaleDateString('no-NO', options)
}

/**
 * Formater dato og tid
 */
export function formatDateTime(
  date: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
): string | null {
  if (!date) return null

  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) return null

  return d.toLocaleDateString('no-NO', options)
}

/**
 * Formater tid (for åpningstider)
 */
export function formatTime(time: string | null | undefined): string | null {
  if (!time) return null

  // Forventer format HH:MM:SS eller HH:MM
  const parts = time.split(':')
  if (parts.length < 2) return time

  return `${parts[0]}:${parts[1]}`
}

/**
 * Formater relativ tid ("2 timer siden", "i morgen")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string | null {
  if (!date) return null

  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) return null

  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    const diffHours = Math.round(diffMs / (1000 * 60 * 60))
    if (diffHours === 0) {
      const diffMinutes = Math.round(diffMs / (1000 * 60))
      if (diffMinutes === 0) return 'nå'
      if (diffMinutes > 0) return `om ${diffMinutes} min`
      return `${Math.abs(diffMinutes)} min siden`
    }
    if (diffHours > 0) return `om ${diffHours} timer`
    return `${Math.abs(diffHours)} timer siden`
  }

  if (diffDays === 1) return 'i morgen'
  if (diffDays === -1) return 'i går'
  if (diffDays > 0 && diffDays <= 7) return `om ${diffDays} dager`
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} dager siden`

  return formatDate(d)
}

/**
 * Formater tall med tusen-separator
 */
export function formatNumber(num: number | null | undefined): string | null {
  if (num === null || num === undefined) return null

  return new Intl.NumberFormat('no-NO').format(num)
}

/**
 * Trunkér tekst med ellipsis
 */
export function truncateText(
  text: string | null | undefined,
  maxLength: number = 100
): string | null {
  if (!text) return null
  if (text.length <= maxLength) return text

  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Formater URL (fjern https:// for visning)
 */
export function formatUrl(url: string | null | undefined): string | null {
  if (!url) return null

  return url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
}

/**
 * Valider e-postadresse
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valider URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Formater filstørrelse
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Kapitaliser første bokstav
 */
export function capitalize(text: string | null | undefined): string | null {
  if (!text) return null
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Formater åpningstider for visning
 */
export function formatOpeningHours(
  opensAt: string | null,
  closesAt: string | null,
  isClosed: boolean,
  note: string | null
): string {
  if (isClosed) return 'Stengt'

  if (!opensAt || !closesAt) return 'Ukjent'

  const opens = formatTime(opensAt)
  const closes = formatTime(closesAt)

  let result = `${opens} - ${closes}`
  if (note) result += ` (${note})`

  return result
}
