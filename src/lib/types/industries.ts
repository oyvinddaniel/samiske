// Industry (Bransje) types

export type SamiLanguage = 'no' | 'sma' | 'sju' | 'sje' | 'smj' | 'se'

export interface Industry {
  id: string
  slug: string

  // Multilingual names
  name_no: string         // Norwegian (required)
  name_sma: string | null // South Sami (Sørsamisk)
  name_sju: string | null // Ume Sami (Umesamisk)
  name_sje: string | null // Pite Sami (Pitesamisk)
  name_smj: string | null // Lule Sami (Lulesamisk)
  name_se: string | null  // North Sami (Nordsamisk)

  created_by: string | null
  created_at: string
  updated_at: string

  // Moderation
  is_approved: boolean
  approved_by: string | null
  approved_at: string | null

  is_active: boolean
}

export interface IndustryNames {
  no: string
  sma?: string
  sju?: string
  sje?: string
  smj?: string
  se?: string
}

// Helper to get available language names for an industry
export function getIndustryNames(industry: Industry): IndustryNames {
  const names: IndustryNames = {
    no: industry.name_no
  }

  if (industry.name_sma) names.sma = industry.name_sma
  if (industry.name_sju) names.sju = industry.name_sju
  if (industry.name_sje) names.sje = industry.name_sje
  if (industry.name_smj) names.smj = industry.name_smj
  if (industry.name_se) names.se = industry.name_se

  return names
}

// Helper to get display name for an industry (prioritizes Norwegian)
export function getIndustryDisplayName(industry: Industry, language?: SamiLanguage): string {
  if (language && language !== 'no') {
    const langName = industry[`name_${language}` as keyof Industry]
    if (langName && typeof langName === 'string') return langName
  }

  return industry.name_no
}

// Language labels for UI
export const languageLabels: Record<SamiLanguage, string> = {
  no: 'Norsk',
  sma: 'Sørsamisk',
  sju: 'Umesamisk',
  sje: 'Pitesamisk',
  smj: 'Lulesamisk',
  se: 'Nordsamisk'
}
