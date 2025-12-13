'use client'

import Link from 'next/link'
import { ChevronRight, Globe, MapPin, Map, Building2 } from 'lucide-react'
import type { GeographyBreadcrumb as BreadcrumbType } from '@/lib/types/geography'

interface GeographyBreadcrumbProps {
  breadcrumbs: BreadcrumbType[]
  className?: string
}

const typeIcons: Record<BreadcrumbType['type'], React.ElementType> = {
  region: Globe,
  country: Globe,
  language_area: Map,
  municipality: Building2,
  place: MapPin,
}

export function GeographyBreadcrumb({ breadcrumbs, className = '' }: GeographyBreadcrumbProps) {
  if (breadcrumbs.length === 0) return null

  return (
    <nav className={`flex items-center gap-1 text-sm text-muted-foreground ${className}`}>
      {breadcrumbs.map((crumb, index) => {
        const Icon = typeIcons[crumb.type]
        const isLast = index === breadcrumbs.length - 1

        return (
          <span key={crumb.id} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            )}
            {isLast ? (
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Icon className="h-4 w-4" />
                {crumb.name}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Icon className="h-4 w-4" />
                {crumb.name}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
