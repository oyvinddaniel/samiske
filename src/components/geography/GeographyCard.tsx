'use client'

import Link from 'next/link'
import { Globe, Map, Building2, MapPin, ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

type CardType = 'country' | 'language_area' | 'municipality' | 'place'

interface GeographyCardProps {
  type: CardType
  id: string
  name: string
  nameSami?: string | null
  description?: string | null
  href: string
  count?: number
  countLabel?: string
}

const typeIcons: Record<CardType, React.ElementType> = {
  country: Globe,
  language_area: Map,
  municipality: Building2,
  place: MapPin,
}

const typeLabels: Record<CardType, string> = {
  country: 'Land',
  language_area: 'Sprakområde',
  municipality: 'Kommune',
  place: 'Sted',
}

export function GeographyCard({
  type,
  name,
  nameSami,
  description,
  href,
  count,
  countLabel = 'innlegg'
}: GeographyCardProps) {
  const Icon = typeIcons[type]

  return (
    <Link href={href}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                  {name}
                </CardTitle>
                {nameSami && nameSami !== name && (
                  <p className="text-sm text-muted-foreground italic">{nameSami}</p>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          {description && (
            <CardDescription className="mt-2 line-clamp-2">
              {description}
            </CardDescription>
          )}
          {count !== undefined && (
            <p className="text-xs text-muted-foreground mt-2">
              {count} {countLabel}
            </p>
          )}
        </CardHeader>
      </Card>
    </Link>
  )
}
