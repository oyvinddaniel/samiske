/**
 * Sentralisert slug-generering
 * Brukes av communities, products, services, industries, events
 */

/**
 * Generer URL-vennlig slug fra tekst
 * Håndterer norske og samiske tegn
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Norske tegn
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'o')
    .replace(/[å]/g, 'a')
    // Samiske tegn
    .replace(/[áàâä]/g, 'a')
    .replace(/[čć]/g, 'c')
    .replace(/[đ]/g, 'd')
    .replace(/[éèêë]/g, 'e')
    .replace(/[ǧ]/g, 'g')
    .replace(/[ǩ]/g, 'k')
    .replace(/[ŋ]/g, 'n')
    .replace(/[óòôö]/g, 'o')
    .replace(/[šś]/g, 's')
    .replace(/[ŧ]/g, 't')
    .replace(/[úùûü]/g, 'u')
    .replace(/[žź]/g, 'z')
    // Fjern alle andre spesialtegn
    .replace(/[^a-z0-9]+/g, '-')
    // Fjern ledende/etterfølgende bindestreker
    .replace(/^-+|-+$/g, '')
    // Begrens lengde
    .substring(0, 100)
}

/**
 * Generer unik slug med suffix hvis nødvendig
 * Brukes ved opprettelse av nye elementer
 */
export function generateUniqueSlug(
  text: string,
  existingSlugs: string[]
): string {
  const baseSlug = generateSlug(text)

  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug
  }

  // Legg til nummer-suffix
  let counter = 1
  let uniqueSlug = `${baseSlug}-${counter}`

  while (existingSlugs.includes(uniqueSlug)) {
    counter++
    uniqueSlug = `${baseSlug}-${counter}`
  }

  return uniqueSlug
}

/**
 * Valider at en slug er gyldig
 */
export function isValidSlug(slug: string): boolean {
  // Må være minst 1 tegn
  if (!slug || slug.length === 0) return false

  // Maks 100 tegn
  if (slug.length > 100) return false

  // Kun små bokstaver, tall og bindestreker
  if (!/^[a-z0-9-]+$/.test(slug)) return false

  // Kan ikke starte eller slutte med bindestrek
  if (slug.startsWith('-') || slug.endsWith('-')) return false

  // Kan ikke ha doble bindestreker
  if (slug.includes('--')) return false

  return true
}

/**
 * Generer slug for event basert på tittel og dato
 */
export function generateEventSlug(title: string, date: Date): string {
  const baseSlug = generateSlug(title)
  const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
  return `${baseSlug}-${dateStr}`
}
