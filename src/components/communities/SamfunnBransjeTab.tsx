'use client'

import { useState, useEffect } from 'react'
import { Loader2, Briefcase } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CommunityCard } from '@/components/communities'
import { getIndustries } from '@/lib/industries'
import { createClient } from '@/lib/supabase/client'
import type { Industry } from '@/lib/types/industries'
import type { Community } from '@/lib/types/communities'
import { getIndustryDisplayName } from '@/lib/types/industries'

export function SamfunnBransjeTab() {
  const [industries, setIndustries] = useState<Industry[]>([])
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null)
  const [showAllIndustries, setShowAllIndustries] = useState(false)
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingCommunities, setLoadingCommunities] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function loadIndustries() {
      setLoading(true)
      const data = await getIndustries()
      setIndustries(data)
      setLoading(false)
    }
    loadIndustries()
  }, [])

  useEffect(() => {
    async function loadCommunitiesByIndustry() {
      if (!selectedIndustry && !showAllIndustries) {
        setCommunities([])
        return
      }

      setLoadingCommunities(true)

      if (showAllIndustries) {
        // Load all communities
        const { data, error } = await supabase
          .from('communities')
          .select('*')
          .order('name', { ascending: true })
          .limit(100)

        if (error) {
          console.error('Error fetching all communities:', error)
          setLoadingCommunities(false)
          return
        }

        setCommunities(data || [])
        setLoadingCommunities(false)
        return
      }

      // Load communities by industry
      const { data, error } = await supabase
        .from('community_industries')
        .select(`
          community:communities(*)
        `)
        .eq('industry_id', selectedIndustry!.id)

      if (error) {
        console.error('Error fetching communities by industry:', error)
        setLoadingCommunities(false)
        return
      }

      const communityData = (data
        ?.map((item: { community: Community | Community[] | null }) => {
          // Handle both single object and array responses from Supabase
          if (Array.isArray(item.community)) {
            return item.community[0] ?? null
          }
          return item.community
        })
        .filter((community): community is Community => community !== null)) ?? []

      setCommunities(communityData)
      setLoadingCommunities(false)
    }

    loadCommunitiesByIndustry()
  }, [selectedIndustry, showAllIndustries, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Industries */}
      <div>
        <h3 className="font-semibold mb-3">Velg bransje</h3>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={showAllIndustries ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-gray-100"
            onClick={() => {
              setShowAllIndustries(!showAllIndustries)
              setSelectedIndustry(null)
            }}
          >
            Alle bransjer
          </Badge>
          {industries.map((industry) => (
            <Badge
              key={industry.id}
              variant={selectedIndustry?.id === industry.id ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => {
                setSelectedIndustry(
                  selectedIndustry?.id === industry.id ? null : industry
                )
                setShowAllIndustries(false)
              }}
            >
              {getIndustryDisplayName(industry)}
            </Badge>
          ))}
        </div>
      </div>

      {/* Communities */}
      {(selectedIndustry || showAllIndustries) && (
        <div>
          <h3 className="font-semibold mb-3">
            {showAllIndustries
              ? 'Alle sider'
              : `Sider i ${getIndustryDisplayName(selectedIndustry!)}`
            }
          </h3>

          {loadingCommunities ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : communities.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">
                {showAllIndustries
                  ? 'Ingen sider ennå'
                  : 'Ingen sider i denne bransjen ennå'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {communities.map((community) => (
                <CommunityCard key={community.id} community={community} />
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedIndustry && !showAllIndustries && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">
            Velg en bransje for å se sider
          </p>
        </div>
      )}
    </div>
  )
}
