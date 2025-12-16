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
                      src="/images/sami.png"
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
