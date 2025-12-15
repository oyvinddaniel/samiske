'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings, Globe, Mail, Phone, MapPin, BadgeCheck, Plus, MessageCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FollowButton } from '@/components/communities'
import { Feed } from '@/components/feed/Feed'
import { CreatePostSheet } from '@/components/posts/CreatePostSheet'
import { ProductCard } from '@/components/communities/ProductCard'
import { ServiceCard } from '@/components/communities/ServiceCard'
import { CreateProductModal } from '@/components/communities/CreateProductModal'
import { CreateServiceModal } from '@/components/communities/CreateServiceModal'
import { SendMessageToCommunityModal } from '@/components/communities/SendMessageToCommunityModal'
import {
  getCommunityBySlug,
  getCommunityAdmins,
  getCommunityFollowers,
  isFollowingCommunity,
  isCommunityAdmin
} from '@/lib/communities'
import { getProductsByCommunity } from '@/lib/products'
import { getServicesByCommunity } from '@/lib/services'
import { getCommunityIndustries } from '@/lib/industries'
import { createClient } from '@/lib/supabase/client'
import type { Community, CommunityAdmin, CommunityFollower, AdminRole } from '@/lib/types/communities'
import type { Product } from '@/lib/types/products'
import type { Service } from '@/lib/types/services'
import type { Industry } from '@/lib/types/industries'
import { categoryLabels, adminRoleLabels } from '@/lib/types/communities'
import { getIndustryDisplayName } from '@/lib/types/industries'

interface CommunityPageViewProps {
  slug: string
  onClose: () => void
}

export function CommunityPageView({ slug, onClose }: CommunityPageViewProps) {
  const [community, setCommunity] = useState<Community | null>(null)
  const [admins, setAdmins] = useState<CommunityAdmin[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [industries, setIndustries] = useState<Industry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [adminStatus, setAdminStatus] = useState<{ isAdmin: boolean; role: AdminRole | null }>({
    isAdmin: false,
    role: null
  })
  const [showCreateProduct, setShowCreateProduct] = useState(false)
  const [showCreateService, setShowCreateService] = useState(false)
  const [showSendMessage, setShowSendMessage] = useState(false)
  const [showCreatePost, setShowCreatePost] = useState(false)

  const supabase = createClient()

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getUser()
  }, [supabase])

  // Fetch community data
  const fetchCommunityData = useCallback(async () => {
    if (!slug) return

    setLoading(true)
    try {
      // First, fetch the community to get its UUID
      const communityData = await getCommunityBySlug(slug)

      if (!communityData) {
        setLoading(false)
        return
      }

      setCommunity(communityData)

      // Now fetch related data using the community UUID
      const [
        adminsData,
        followersData,
        productsData,
        servicesData,
        industriesData
      ] = await Promise.all([
        getCommunityAdmins(communityData.id),
        getCommunityFollowers(communityData.id, 10, 0),
        getProductsByCommunity(communityData.id),
        getServicesByCommunity(communityData.id),
        getCommunityIndustries(communityData.id)
      ])

      setAdmins(adminsData)
      setProducts(productsData)
      setServices(servicesData)
      setIndustries(industriesData)

      // Check if current user is following
      if (currentUserId && communityData.id) {
        const following = await isFollowingCommunity(communityData.id)
        setIsFollowing(following)

        const admin = await isCommunityAdmin(communityData.id)
        setAdminStatus(admin)
      }
    } catch (error) {
      console.error('Error fetching community data:', error)
    } finally {
      setLoading(false)
    }
  }, [slug, currentUserId, supabase])

  useEffect(() => {
    fetchCommunityData()
  }, [fetchCommunityData])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-gray-600">Samfunn ikke funnet</p>
        <Button onClick={onClose} className="mt-4">Tilbake</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with close button */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Close button */}
        <div className="flex justify-end p-4 border-b border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Lukk
          </Button>
        </div>

        {/* Cover image */}
        {community.cover_image_url && (
          <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600">
            <img
              src={community.cover_image_url}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Community info */}
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
              <AvatarImage src={community.logo_url || undefined} alt={community.name} />
              <AvatarFallback className="bg-orange-100 text-orange-600 text-2xl">
                {community.name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{community.name}</h1>
                {community.is_verified && (
                  <BadgeCheck className="w-6 h-6 text-blue-500" />
                )}
              </div>

              {/* Industries */}
              {industries.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {industries.map((industry) => (
                    <Badge key={industry.id} variant="secondary" className="text-xs">
                      {getIndustryDisplayName(industry)}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <span>{community.follower_count} følgere</span>
                <span>{products.length} produkter</span>
                <span>{services.length} tjenester</span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {currentUserId && community.id && (
                  <>
                    <FollowButton
                      communityId={community.id}
                      isFollowing={isFollowing}
                      onStatusChange={() => setIsFollowing(!isFollowing)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSendMessage(true)}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send melding
                    </Button>
                  </>
                )}
                {adminStatus.isAdmin && (
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Innstillinger
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {community.description && (
            <p className="text-gray-700 mb-4">{community.description}</p>
          )}

          {/* Contact info */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {community.website_url && (
              <a
                href={community.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-blue-600"
              >
                <Globe className="w-4 h-4" />
                Nettside
              </a>
            )}
            {community.email && (
              <a
                href={`mailto:${community.email}`}
                className="flex items-center gap-1 hover:text-blue-600"
              >
                <Mail className="w-4 h-4" />
                {community.email}
              </a>
            )}
            {community.phone && (
              <a
                href={`tel:${community.phone}`}
                className="flex items-center gap-1 hover:text-blue-600"
              >
                <Phone className="w-4 h-4" />
                {community.phone}
              </a>
            )}
            {community.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {community.address}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Create post button - only show for admins */}
      {adminStatus.isAdmin && currentUserId && (
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setShowCreatePost(true)}
            className="group flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-full shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="font-medium text-sm">Nytt innlegg</span>
          </button>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="innlegg" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="innlegg">Innlegg</TabsTrigger>
          <TabsTrigger value="produkter">
            Produkter ({products.length})
          </TabsTrigger>
          <TabsTrigger value="tjenester">
            Tjenester ({services.length})
          </TabsTrigger>
          <TabsTrigger value="om">Om</TabsTrigger>
        </TabsList>

        <TabsContent value="innlegg">
          {community.id && (
            <Feed
              communityIds={[community.id]}
              hideCreateButton={false}
            />
          )}
        </TabsContent>

        <TabsContent value="produkter">
          <div className="space-y-4">
            {adminStatus.isAdmin && (
              <Button onClick={() => setShowCreateProduct(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Legg til produkt
              </Button>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isAdmin={adminStatus.isAdmin}
                  communityId={community.id}
                />
              ))}
              {products.length === 0 && (
                <p className="text-gray-500 col-span-2">Ingen produkter ennå</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tjenester">
          <div className="space-y-4">
            {adminStatus.isAdmin && (
              <Button onClick={() => setShowCreateService(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Legg til tjeneste
              </Button>
            )}
            <div className="space-y-4">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isAdmin={adminStatus.isAdmin}
                  communityId={community.id}
                />
              ))}
              {services.length === 0 && (
                <p className="text-gray-500">Ingen tjenester ennå</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="om">
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            {/* Admins */}
            <div>
              <h3 className="font-semibold mb-3">Administratorer</h3>
              <div className="space-y-2">
                {admins.map((admin) => (
                  <div key={admin.id} className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={admin.user?.avatar_url || undefined} />
                      <AvatarFallback>
                        {admin.user?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{admin.user?.full_name || 'Ukjent'}</p>
                      <p className="text-sm text-gray-500">{adminRoleLabels[admin.role]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <h3 className="font-semibold mb-2">Kategori</h3>
              <p className="text-gray-700">{categoryLabels[community.category]}</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {adminStatus.isAdmin && community.id && currentUserId && (
        <>
          <CreatePostSheet
            open={showCreatePost}
            onClose={() => setShowCreatePost(false)}
            userId={currentUserId}
            communityId={community.id}
            onSuccess={() => {
              setShowCreatePost(false)
              // Refresh posts in the feed
              window.dispatchEvent(new CustomEvent('post-created'))
            }}
          />
          <CreateProductModal
            open={showCreateProduct}
            onOpenChange={setShowCreateProduct}
            communityId={community.id}
            onCreated={fetchCommunityData}
          />
          <CreateServiceModal
            open={showCreateService}
            onOpenChange={setShowCreateService}
            communityId={community.id}
            onCreated={fetchCommunityData}
          />
        </>
      )}
      {currentUserId && community.id && (
        <SendMessageToCommunityModal
          open={showSendMessage}
          onOpenChange={setShowSendMessage}
          communityId={community.id}
          communityName={community.name}
        />
      )}
    </div>
  )
}
