'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getCommunityBySlug,
  getCommunityById,
  getCommunityAdmins,
  getCommunityFollowers,
  isFollowingCommunity,
  isCommunityAdmin
} from '@/lib/communities'
import { getProductsByCommunity } from '@/lib/products'
import { getServicesByCommunity } from '@/lib/services'
import { getCommunityIndustries } from '@/lib/industries'
import { getCommunityAttributes } from '@/lib/attributes'
import type { Community, CommunityAdmin, CommunityFollower, AdminRole, Attribute } from '@/lib/types/communities'
import type { Product } from '@/lib/types/products'
import type { Service } from '@/lib/types/services'
import type { Industry } from '@/lib/types/industries'

interface UseCommunityOptions {
  /** Community slug to fetch */
  slug?: string
  /** Community ID to fetch (alternative to slug) */
  id?: string
  /** Whether to fetch products */
  fetchProducts?: boolean
  /** Whether to fetch services */
  fetchServices?: boolean
  /** Whether to fetch industries */
  fetchIndustries?: boolean
  /** Whether to fetch attributes */
  fetchAttributes?: boolean
  /** Whether to fetch followers */
  fetchFollowers?: boolean
  /** Number of followers to fetch */
  followerLimit?: number
}

interface UseCommunityReturn {
  // Data
  community: Community | null
  admins: CommunityAdmin[]
  followers: CommunityFollower[]
  products: Product[]
  services: Service[]
  industries: Industry[]
  attributes: Attribute[]

  // User status
  currentUserId: string | null
  isFollowing: boolean
  adminStatus: { isAdmin: boolean; role: AdminRole | null }

  // Loading/error states
  loading: boolean
  error: string | null

  // Actions
  refetch: () => Promise<void>
  setIsFollowing: (value: boolean) => void
}

const defaultOptions: Required<UseCommunityOptions> = {
  slug: '',
  id: '',
  fetchProducts: true,
  fetchServices: true,
  fetchIndustries: true,
  fetchAttributes: false,
  fetchFollowers: false,
  followerLimit: 20
}

/**
 * Custom hook for managing community data and state
 * Centralizes all community-related state management to reduce code duplication
 */
export function useCommunity(options: UseCommunityOptions): UseCommunityReturn {
  const opts = { ...defaultOptions, ...options }

  // Core data
  const [community, setCommunity] = useState<Community | null>(null)
  const [admins, setAdmins] = useState<CommunityAdmin[]>([])
  const [followers, setFollowers] = useState<CommunityFollower[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [industries, setIndustries] = useState<Industry[]>([])
  const [attributes, setAttributes] = useState<Attribute[]>([])

  // User status
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [adminStatus, setAdminStatus] = useState<{ isAdmin: boolean; role: AdminRole | null }>({
    isAdmin: false,
    role: null
  })

  // Loading/error
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    if (!opts.slug && !opts.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      // Fetch community
      let communityData: Community | null = null
      if (opts.slug) {
        communityData = await getCommunityBySlug(opts.slug)
      } else if (opts.id) {
        communityData = await getCommunityById(opts.id)
      }

      if (!communityData) {
        setLoading(false)
        setError('Community not found')
        return
      }

      setCommunity(communityData)

      // Build parallel fetch array based on options
      const fetchPromises: Promise<unknown>[] = [
        getCommunityAdmins(communityData.id)
      ]

      // Track which index corresponds to which data
      const fetchKeys: string[] = ['admins']

      if (opts.fetchFollowers) {
        fetchPromises.push(getCommunityFollowers(communityData.id, opts.followerLimit))
        fetchKeys.push('followers')
      }

      if (opts.fetchProducts) {
        fetchPromises.push(getProductsByCommunity(communityData.id))
        fetchKeys.push('products')
      }

      if (opts.fetchServices) {
        fetchPromises.push(getServicesByCommunity(communityData.id))
        fetchKeys.push('services')
      }

      if (opts.fetchIndustries) {
        fetchPromises.push(getCommunityIndustries(communityData.id))
        fetchKeys.push('industries')
      }

      if (opts.fetchAttributes) {
        fetchPromises.push(getCommunityAttributes(communityData.id))
        fetchKeys.push('attributes')
      }

      // Fetch all data in parallel
      const results = await Promise.all(fetchPromises)

      // Map results to state
      results.forEach((result, index) => {
        const key = fetchKeys[index]
        switch (key) {
          case 'admins':
            setAdmins(result as CommunityAdmin[])
            break
          case 'followers':
            setFollowers(result as CommunityFollower[])
            break
          case 'products':
            setProducts(result as Product[])
            break
          case 'services':
            setServices(result as Service[])
            break
          case 'industries':
            setIndustries(result as Industry[])
            break
          case 'attributes':
            setAttributes(result as Attribute[])
            break
        }
      })

      // Check user status if logged in
      if (user) {
        const [followStatus, adminStatusData] = await Promise.all([
          isFollowingCommunity(communityData.id),
          isCommunityAdmin(communityData.id)
        ])
        setIsFollowing(followStatus)
        setAdminStatus(adminStatusData)
      }
    } catch (err) {
      console.error('Error fetching community data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load community')
    } finally {
      setLoading(false)
    }
  }, [opts.slug, opts.id, opts.fetchProducts, opts.fetchServices, opts.fetchIndustries, opts.fetchAttributes, opts.fetchFollowers, opts.followerLimit, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    // Data
    community,
    admins,
    followers,
    products,
    services,
    industries,
    attributes,

    // User status
    currentUserId,
    isFollowing,
    adminStatus,

    // Loading/error
    loading,
    error,

    // Actions
    refetch: fetchData,
    setIsFollowing
  }
}
