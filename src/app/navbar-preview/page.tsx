'use client'

const gradients = [
  {
    id: 0,
    name: 'Sámi Flag Blur',
    description: 'Samisk flagg-farger - Kulturelt sterkt',
    style: {
      background: `
        linear-gradient(90deg,
          #DC2626 0%,
          #DC2626 25%,
          #22C55E 25%,
          #22C55E 35%,
          #EAB308 35%,
          #EAB308 45%,
          #2563EB 45%,
          #2563EB 100%
        )
      `.replace(/\s+/g, ' '),
      filter: 'blur(0px)'
    }
  },
  {
    id: '0b',
    name: 'Sámi Flag Gradient',
    description: 'Myk overgang mellom flaggfargene',
    style: {
      background: 'linear-gradient(90deg, #DC2626 0%, #B91C1C 20%, #22C55E 30%, #EAB308 40%, #2563EB 50%, #1D4ED8 100%)'
    }
  },
  {
    id: '0c',
    name: 'Sámi Circle Glow',
    description: 'Sirkel-motiv fra flagget med glow',
    style: {
      background: `
        radial-gradient(circle at 30% 50%, #DC2626 0%, transparent 40%),
        radial-gradient(circle at 35% 50%, #2563EB 0%, transparent 35%),
        linear-gradient(90deg, #1E40AF 0%, #1E40AF 100%)
      `.replace(/\s+/g, ' ')
    }
  },
  {
    id: '0d',
    name: 'Sámi Flag Image (Blur)',
    description: 'Ditt uskarpe bilde',
    style: {
      backgroundImage: 'url(/images/sami-flag-blur.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  },
  {
    id: '0e',
    name: 'Sámi Flag Image (Sharp)',
    description: 'Skarpt flaggbilde - Lagre til public/images/sami-flag.jpg',
    style: {
      backgroundImage: 'url(/images/sami-flag.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  },
  {
    id: 1,
    name: 'Ocean Depth',
    description: 'Blå til mørkere blå - Subtil, profesjonell',
    style: { background: 'linear-gradient(135deg, #0143F5 0%, #0033CC 100%)' }
  },
  {
    id: 2,
    name: 'Arctic Blue',
    description: 'Blå til indigo - Moderne tech-look',
    style: { background: 'linear-gradient(135deg, #0143F5 0%, #4F46E5 100%)' }
  },
  {
    id: 3,
    name: 'Nordic Twilight',
    description: 'Samiske farger - Diskret rød stripe',
    style: { background: 'linear-gradient(135deg, #1E3A8A 0%, #DC2626 5%, #1E3A8A 10%, #1E3A8A 100%)' }
  },
  {
    id: 4,
    name: 'Midnight Pro',
    description: 'Navy til sort - Elegant dark mode',
    style: { background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)' }
  },
  {
    id: 5,
    name: 'Deep Space',
    description: 'Mørk blå til lilla - Sofistikert',
    style: { background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1E1B4B 100%)' }
  },
  {
    id: 6,
    name: 'Obsidian Glow',
    description: 'Sort med blå kant - Minimalistisk',
    style: {
      background: 'linear-gradient(180deg, #18181B 0%, #27272A 100%)',
      borderBottom: '3px solid #3B82F6'
    }
  },
  {
    id: 7,
    name: 'Stripe Inspired',
    description: 'Lilla til blå til teal - Energisk',
    style: { background: 'linear-gradient(135deg, #6366F1 0%, #3B82F6 50%, #06B6D4 100%)' }
  },
  {
    id: 8,
    name: 'Vercel Black',
    description: 'Ren sort med gradient-kant',
    style: {
      background: '#000000',
      borderBottom: '2px solid',
      borderImage: 'linear-gradient(90deg, #FF0080, #7928CA, #FF0080) 1'
    }
  },
  {
    id: 9,
    name: 'Aurora Borealis',
    description: 'Nordlys - Teal til blå til lilla',
    style: { background: 'linear-gradient(135deg, #0D9488 0%, #0EA5E9 50%, #8B5CF6 100%)' }
  },
  {
    id: 10,
    name: 'Frosted Glass',
    description: 'Glassmorphism - Semi-transparent',
    style: {
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    }
  },
  // === 20 NYE FORSLAG ===
  {
    id: 11,
    name: 'Sunset Vibes',
    description: 'Oransje til rosa til lilla - Varm og innbydende',
    style: { background: 'linear-gradient(135deg, #F97316 0%, #EC4899 50%, #8B5CF6 100%)' }
  },
  {
    id: 12,
    name: 'Forest Depths',
    description: 'Mørkegrønn gradient - Naturlig og rolig',
    style: { background: 'linear-gradient(135deg, #064E3B 0%, #065F46 50%, #047857 100%)' }
  },
  {
    id: 13,
    name: 'Electric Purple',
    description: 'Dyp lilla til rosa - Moderne og dristig',
    style: { background: 'linear-gradient(135deg, #581C87 0%, #7C3AED 50%, #A855F7 100%)' }
  },
  {
    id: 14,
    name: 'Cyber Punk',
    description: 'Neon rosa til cyan - Futuristisk',
    style: { background: 'linear-gradient(135deg, #DB2777 0%, #7C3AED 50%, #06B6D4 100%)' }
  },
  {
    id: 15,
    name: 'Ocean Sunset',
    description: 'Blå bunn med oransje topp - Dramatisk',
    style: { background: 'linear-gradient(180deg, #F97316 0%, #3B82F6 100%)' }
  },
  {
    id: 16,
    name: 'Midnight Ocean',
    description: 'Dyp blå til turkis - Dypt og mystisk',
    style: { background: 'linear-gradient(135deg, #0C4A6E 0%, #0E7490 50%, #14B8A6 100%)' }
  },
  {
    id: 17,
    name: 'Rose Gold',
    description: 'Rosa til gull - Elegant og premium',
    style: { background: 'linear-gradient(135deg, #BE185D 0%, #F472B6 50%, #FCD34D 100%)' }
  },
  {
    id: 18,
    name: 'Northern Lights',
    description: 'Grønn til blå til lilla - Naturlig nordlys',
    style: { background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 40%, #8B5CF6 70%, #EC4899 100%)' }
  },
  {
    id: 19,
    name: 'Charcoal Steel',
    description: 'Grå gradient med blå hint - Industriell',
    style: { background: 'linear-gradient(135deg, #1F2937 0%, #374151 50%, #4B5563 100%)' }
  },
  {
    id: 20,
    name: 'Warm Ember',
    description: 'Rød til oransje - Energisk og varm',
    style: { background: 'linear-gradient(135deg, #991B1B 0%, #DC2626 50%, #F97316 100%)' }
  },
  {
    id: 21,
    name: 'Cool Mint',
    description: 'Mint til teal - Frisk og moderne',
    style: { background: 'linear-gradient(135deg, #5EEAD4 0%, #2DD4BF 50%, #14B8A6 100%)' }
  },
  {
    id: 22,
    name: 'Galaxy',
    description: 'Mørk lilla med stjerner-effekt - Kosmisk',
    style: { background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 30%, #4C1D95 60%, #1E1B4B 100%)' }
  },
  {
    id: 23,
    name: 'Peach Dream',
    description: 'Fersken til rosa - Myk og vennlig',
    style: { background: 'linear-gradient(135deg, #FDBA74 0%, #FB923C 50%, #F472B6 100%)' }
  },
  {
    id: 24,
    name: 'Deep Wine',
    description: 'Vinrød gradient - Sofistikert og rik',
    style: { background: 'linear-gradient(135deg, #4C1D2D 0%, #831843 50%, #9F1239 100%)' }
  },
  {
    id: 25,
    name: 'Linear Dark',
    description: 'Inspirert av Linear.app - Mørk og clean',
    style: { background: 'linear-gradient(135deg, #0F0F0F 0%, #1A1A2E 50%, #16213E 100%)' }
  },
  {
    id: 26,
    name: 'Slack Purple',
    description: 'Inspirert av Slack - Lilla profesjonell',
    style: { background: 'linear-gradient(135deg, #4A154B 0%, #611F69 50%, #7C3085 100%)' }
  },
  {
    id: 27,
    name: 'Discord Blurple',
    description: 'Inspirert av Discord - Blålilla',
    style: { background: 'linear-gradient(135deg, #5865F2 0%, #4752C4 50%, #3C45A5 100%)' }
  },
  {
    id: 28,
    name: 'Spotify Green',
    description: 'Inspirert av Spotify - Grønn til sort',
    style: { background: 'linear-gradient(135deg, #1DB954 0%, #191414 100%)' }
  },
  {
    id: 29,
    name: 'Instagram',
    description: 'Inspirert av Instagram - Gradient regnbue',
    style: { background: 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #FCB045 100%)' }
  },
  {
    id: 30,
    name: 'Sámi Modern',
    description: 'Samiske farger - Moderne tolkning',
    style: { background: 'linear-gradient(135deg, #1E3A8A 0%, #DC2626 25%, #22C55E 50%, #EAB308 75%, #1E3A8A 100%)' }
  },
  // === 30 NYE FORSLAG (31-60) ===
  {
    id: 31,
    name: 'Twilight Zone',
    description: 'Mørk blå til lilla til rosa - Magisk',
    style: { background: 'linear-gradient(135deg, #0F172A 0%, #4C1D95 50%, #BE185D 100%)' }
  },
  {
    id: 32,
    name: 'Aquamarine',
    description: 'Havblå gradient - Frisk og klar',
    style: { background: 'linear-gradient(135deg, #0891B2 0%, #22D3EE 50%, #67E8F9 100%)' }
  },
  {
    id: 33,
    name: 'Burnt Orange',
    description: 'Dyp oransje - Høstfarger',
    style: { background: 'linear-gradient(135deg, #7C2D12 0%, #C2410C 50%, #EA580C 100%)' }
  },
  {
    id: 34,
    name: 'Lavender Fields',
    description: 'Myk lavendel - Rolig og harmonisk',
    style: { background: 'linear-gradient(135deg, #A78BFA 0%, #C4B5FD 50%, #DDD6FE 100%)' }
  },
  {
    id: 35,
    name: 'Neon Nights',
    description: 'Cyan til magenta - Nattklubbb',
    style: { background: 'linear-gradient(135deg, #00F5FF 0%, #FF00FF 100%)' }
  },
  {
    id: 36,
    name: 'Moss Green',
    description: 'Jordnær grønn - Organisk',
    style: { background: 'linear-gradient(135deg, #365314 0%, #4D7C0F 50%, #65A30D 100%)' }
  },
  {
    id: 37,
    name: 'Cherry Blossom',
    description: 'Japansk kirsebær - Delikat rosa',
    style: { background: 'linear-gradient(135deg, #FDA4AF 0%, #FB7185 50%, #F43F5E 100%)' }
  },
  {
    id: 38,
    name: 'Thunderstorm',
    description: 'Mørk grå til elektrisk blå - Dramatisk',
    style: { background: 'linear-gradient(135deg, #1F2937 0%, #374151 40%, #3B82F6 100%)' }
  },
  {
    id: 39,
    name: 'Golden Hour',
    description: 'Gyllen solnedgang - Varm og nostalgisk',
    style: { background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #FCD34D 100%)' }
  },
  {
    id: 40,
    name: 'Deep Sea',
    description: 'Havdyp - Mørk og mystisk',
    style: { background: 'linear-gradient(135deg, #042F2E 0%, #134E4A 50%, #0F766E 100%)' }
  },
  {
    id: 41,
    name: 'Coral Reef',
    description: 'Korallfarger - Levende og tropisk',
    style: { background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E72 50%, #FFA07A 100%)' }
  },
  {
    id: 42,
    name: 'Midnight Purple',
    description: 'Dyp midnattslilla - Elegant',
    style: { background: 'linear-gradient(135deg, #2E1065 0%, #4C1D95 50%, #6D28D9 100%)' }
  },
  {
    id: 43,
    name: 'Arctic Frost',
    description: 'Iskald blå til hvit - Nordisk',
    style: { background: 'linear-gradient(135deg, #0EA5E9 0%, #7DD3FC 50%, #E0F2FE 100%)' }
  },
  {
    id: 44,
    name: 'Volcano',
    description: 'Sort til rød til oransje - Eksplosiv',
    style: { background: 'linear-gradient(135deg, #18181B 0%, #B91C1C 50%, #F97316 100%)' }
  },
  {
    id: 45,
    name: 'Cotton Candy',
    description: 'Rosa til blå - Leken og søt',
    style: { background: 'linear-gradient(135deg, #F9A8D4 0%, #E9D5FF 50%, #A5F3FC 100%)' }
  },
  {
    id: 46,
    name: 'Emerald City',
    description: 'Smaragdgrønn - Rik og dyp',
    style: { background: 'linear-gradient(135deg, #047857 0%, #059669 50%, #10B981 100%)' }
  },
  {
    id: 47,
    name: 'Rust',
    description: 'Rustfarger - Vintage industriell',
    style: { background: 'linear-gradient(135deg, #78350F 0%, #92400E 50%, #B45309 100%)' }
  },
  {
    id: 48,
    name: 'Bubblegum',
    description: 'Knallrosa - Morsom og energisk',
    style: { background: 'linear-gradient(135deg, #EC4899 0%, #F472B6 50%, #FBCFE8 100%)' }
  },
  {
    id: 49,
    name: 'Slate Storm',
    description: 'Skifergrå - Profesjonell og nøytral',
    style: { background: 'linear-gradient(135deg, #334155 0%, #475569 50%, #64748B 100%)' }
  },
  {
    id: 50,
    name: 'Tropical Paradise',
    description: 'Grønn til turkis til blå - Eksotisk',
    style: { background: 'linear-gradient(135deg, #22C55E 0%, #14B8A6 50%, #0EA5E9 100%)' }
  },
  {
    id: 51,
    name: 'Plum',
    description: 'Mørk plomme - Sofistikert',
    style: { background: 'linear-gradient(135deg, #701A75 0%, #86198F 50%, #A21CAF 100%)' }
  },
  {
    id: 52,
    name: 'Sahara',
    description: 'Ørkenfarger - Sand og varme',
    style: { background: 'linear-gradient(135deg, #A16207 0%, #CA8A04 50%, #EAB308 100%)' }
  },
  {
    id: 53,
    name: 'Ice Queen',
    description: 'Kald lilla til blå - Frostig',
    style: { background: 'linear-gradient(135deg, #A78BFA 0%, #818CF8 50%, #60A5FA 100%)' }
  },
  {
    id: 54,
    name: 'Noir',
    description: 'Ren sort til grå - Minimalistisk',
    style: { background: 'linear-gradient(135deg, #000000 0%, #171717 50%, #262626 100%)' }
  },
  {
    id: 55,
    name: 'Firefly',
    description: 'Mørk med gul glød - Magisk',
    style: { background: 'linear-gradient(135deg, #1C1917 0%, #422006 50%, #FDE047 100%)' }
  },
  {
    id: 56,
    name: 'Blueberry',
    description: 'Blåbærfarger - Naturlig blå',
    style: { background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #3B82F6 100%)' }
  },
  {
    id: 57,
    name: 'Flamingo',
    description: 'Hot pink gradient - Tropisk fugl',
    style: { background: 'linear-gradient(135deg, #BE185D 0%, #DB2777 50%, #EC4899 100%)' }
  },
  {
    id: 58,
    name: 'Moonlight',
    description: 'Sølvblå månelys - Drømmende',
    style: { background: 'linear-gradient(135deg, #1E293B 0%, #334155 50%, #94A3B8 100%)' }
  },
  {
    id: 59,
    name: 'Rainforest',
    description: 'Tett regnskog - Dyp grønn',
    style: { background: 'linear-gradient(135deg, #14532D 0%, #166534 50%, #15803D 100%)' }
  },
  {
    id: 60,
    name: 'Figma',
    description: 'Inspirert av Figma - Fargerik gradient',
    style: { background: 'linear-gradient(135deg, #F24E1E 0%, #A259FF 33%, #1ABCFE 66%, #0ACF83 100%)' }
  }
]

export default function NavbarPreviewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Navbar Gradient Alternativer</h1>
        <p className="text-gray-600 mb-8">Velg din favoritt - si nummeret til meg</p>

        <div className="space-y-6">
          {gradients.map((gradient) => (
            <div key={gradient.id} className="rounded-xl overflow-hidden shadow-lg">
              {/* Preview header */}
              <div
                className="h-16 flex items-center px-6"
                style={gradient.style}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 p-1.5 rounded-xl bg-white/20 flex items-center justify-center">
                    <img
                      src="/images/sami.svg"
                      alt="Logo"
                      className="w-full h-full object-contain rounded-md"
                    />
                  </div>
                  <span className="text-white font-semibold">samiske.no</span>
                </div>

                <div className="flex-1 mx-8">
                  <div className="bg-white/20 rounded-full px-4 py-2 text-white/60 text-sm max-w-md">
                    Søk etter innlegg, personer, steder...
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-white/20" />
                  <div className="w-6 h-6 rounded-full bg-white/20" />
                  <div className="w-8 h-8 rounded-full bg-white/20" />
                </div>
              </div>

              {/* Info */}
              <div className="bg-white p-4 flex items-center justify-between">
                <div>
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm mr-3">
                    {gradient.id}
                  </span>
                  <span className="font-semibold text-gray-900">{gradient.name}</span>
                </div>
                <span className="text-gray-500 text-sm">{gradient.description}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            <strong>Tips:</strong> Gå til <code className="bg-yellow-100 px-1 rounded">/navbar-preview</code> i nettleseren for å se denne siden.
          </p>
        </div>
      </div>
    </div>
  )
}
