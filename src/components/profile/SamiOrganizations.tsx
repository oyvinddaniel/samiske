'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, ExternalLink } from 'lucide-react'

interface Organization {
  id: string
  name: string
  name_sami: string | null
  type: string
  website: string | null
  role?: string
  since_year?: number
}

interface SamiOrganizationsProps {
  userId: string
  isEditable?: boolean
}

export function SamiOrganizations({ userId, isEditable = false }: SamiOrganizationsProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchOrganizations()
  }, [userId])

  const fetchOrganizations = async () => {
    const { data, error } = await supabase
      .from('user_sami_organizations')
      .select(`
        role,
        since_year,
        organization:sami_organizations!inner(
          id,
          name,
          name_sami,
          type,
          website
        )
      `)
      .eq('user_id', userId)
      .eq('is_public', true)

    if (error) {
      console.error('Error fetching organizations:', error)
    } else if (data) {
      setOrganizations(
        data.map((d) => ({
          ...(d.organization as unknown as Omit<Organization, 'role' | 'since_year'>),
          role: d.role,
          since_year: d.since_year,
        }))
      )
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (organizations.length === 0 && !isEditable) {
    return null
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Samiske organisasjoner</CardTitle>
        {isEditable && (
          <Button variant="ghost" size="sm" onClick={() => {
            // TODO: Open modal to add organization
            console.log('Add organization modal')
          }}>
            <Plus className="w-4 h-4 mr-1" />
            Legg til
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {organizations.length === 0 ? (
          <p className="text-sm text-gray-500">Ingen organisasjoner lagt til</p>
        ) : (
          <div className="space-y-3">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{org.name}</p>
                    {org.website && (
                      <a
                        href={org.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  {org.name_sami && (
                    <p className="text-sm text-gray-500">{org.name_sami}</p>
                  )}
                  {org.role && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {org.role}
                    </Badge>
                  )}
                </div>
                {org.since_year && (
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    Siden {org.since_year}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
