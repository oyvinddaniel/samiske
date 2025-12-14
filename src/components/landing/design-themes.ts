export type DesignTheme =
  | 'minimal-clean'
  | 'dark-mode'
  | 'gradient-modern'
  | 'screenshot-first'
  | 'split-screen'
  | 'browser-mockup'
  | 'feature-grid'
  | 'social-proof'
  | 'glassmorphism'
  | 'bento-box'

export interface DesignThemeConfig {
  id: DesignTheme
  name: string
  description: string
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
    accent: string
  }
  features: string[]
}

export const designThemes: Record<DesignTheme, DesignThemeConfig> = {
  'minimal-clean': {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'Hvit bakgrunn, mye luft, enkel typografi - inspirert av Stripe og Linear',
    colors: {
      primary: '#0143F5',
      secondary: '#64748b',
      background: '#ffffff',
      text: '#0f172a',
      accent: '#3b82f6',
    },
    features: ['Stor luft', 'Minimalistisk', 'Fokus på innhold'],
  },
  'dark-mode': {
    id: 'dark-mode',
    name: 'Dark Mode',
    description: 'Mørk bakgrunn med vibrante aksenter - moderne og elegant',
    colors: {
      primary: '#60a5fa',
      secondary: '#94a3b8',
      background: '#0f172a',
      text: '#f8fafc',
      accent: '#818cf8',
    },
    features: ['Mørk estetikk', 'Høy kontrast', 'Moderne'],
  },
  'gradient-modern': {
    id: 'gradient-modern',
    name: 'Gradient Modern',
    description: 'Fargerike gradienter og glass-morfisme effekter',
    colors: {
      primary: '#ec4899',
      secondary: '#8b5cf6',
      background: '#fdf4ff',
      text: '#1e293b',
      accent: '#f472b6',
    },
    features: ['Fargerik', 'Glassmorfisme', 'Moderne gradienter'],
  },
  'screenshot-first': {
    id: 'screenshot-first',
    name: 'Screenshot First',
    description: 'Stort app-screenshot som hero - produktet i fokus',
    colors: {
      primary: '#0143F5',
      secondary: '#475569',
      background: '#f8fafc',
      text: '#1e293b',
      accent: '#3b82f6',
    },
    features: ['Produkt først', 'Visuelt', 'Stor screenshot'],
  },
  'split-screen': {
    id: 'split-screen',
    name: 'Split Screen',
    description: '50/50 split - innhold på venstre, screenshot på høyre',
    colors: {
      primary: '#0143F5',
      secondary: '#64748b',
      background: '#ffffff',
      text: '#0f172a',
      accent: '#2563eb',
    },
    features: ['Balansert', '50/50 layout', 'Symmetrisk'],
  },
  'browser-mockup': {
    id: 'browser-mockup',
    name: 'Browser Mockup',
    description: 'App i nettleser-mockup med skygge og 3D-effekt',
    colors: {
      primary: '#0143F5',
      secondary: '#64748b',
      background: '#f1f5f9',
      text: '#0f172a',
      accent: '#3b82f6',
    },
    features: ['3D mockup', 'Nettleser-vindu', 'Profesjonell'],
  },
  'feature-grid': {
    id: 'feature-grid',
    name: 'Feature Grid',
    description: 'Grid av funksjoner med små screenshots',
    colors: {
      primary: '#0143F5',
      secondary: '#64748b',
      background: '#ffffff',
      text: '#1e293b',
      accent: '#3b82f6',
    },
    features: ['Grid layout', 'Mange screenshots', 'Funksjonsfokus'],
  },
  'social-proof': {
    id: 'social-proof',
    name: 'Social Proof',
    description: 'Testimonials og statistikk fremtredende',
    colors: {
      primary: '#0143F5',
      secondary: '#64748b',
      background: '#ffffff',
      text: '#0f172a',
      accent: '#10b981',
    },
    features: ['Tillit', 'Testimonials', 'Statistikk'],
  },
  'glassmorphism': {
    id: 'glassmorphism',
    name: 'Glassmorphism',
    description: 'Moderne glass-effekter med blur og transparens',
    colors: {
      primary: '#6366f1',
      secondary: '#a78bfa',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      text: '#ffffff',
      accent: '#8b5cf6',
    },
    features: ['Glass-effekt', 'Blur', 'Transparent'],
  },
  'bento-box': {
    id: 'bento-box',
    name: 'Bento Box',
    description: 'Moderne bento grid layout med app-previews',
    colors: {
      primary: '#0143F5',
      secondary: '#64748b',
      background: '#fafafa',
      text: '#0a0a0a',
      accent: '#3b82f6',
    },
    features: ['Bento grid', 'Moderne', 'Asymmetrisk'],
  },
}
