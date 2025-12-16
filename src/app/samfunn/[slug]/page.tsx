'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, notFound } from 'next/navigation'
import { Building2, Users, Settings, Globe, Mail, Phone, MapPin, BadgeCheck, ExternalLink, Package, Briefcase, Plus, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FollowButton } from '@/components/communities'
import { Feed } from '@/components/feed/Feed'
import { ProductCard } from '@/components/communities/ProductCard'
import { ServiceCard } from '@/components/communities/ServiceCard'
import { CreateProductModal } from '@/components/communities/CreateProductModal'
import { CreateServiceModal } from '@/components/communities/CreateServiceModal'
import { SendMessageToCommunityModal } from '@/components/communities/SendMessageToCommunityModal'
import { CommunitySettingsDialog } from '@/components/communities/CommunitySettingsDialog'
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

export default function CommunityPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string

  // Map URL tab param to internal tab values
  const tabParam = searchParams.get('tab')
  const getInitialTab = () => {
    if (tabParam === 'produkter') return 'products'
    if (tabParam === 'tjenester') return 'services'
    if (tabParam === 'om') return 'about'
    return 'posts'
  }

  const [community, setCommunity] = useState<Community | null>(null)
  const [admins, setAdmins] = useState<CommunityAdmin[]>([])
  const [followers, setFollowers] = useState<CommunityFollower[]>([])
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
  const [showSettings, setShowSettings] = useState(false)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)

    // Fetch community
    const communityData = await getCommunityBySlug(slug)
    if (!communityData) {
      setLoading(false)
      return
    }
    setCommunity(communityData)

    // Fetch all community data in parallel
    const [
      adminData,
      followerData,
      productsData,
      servicesData,
      industriesData
    ] = await Promise.all([
      getCommunityAdmins(communityData.id),
      getCommunityFollowers(communityData.id, 20),
      getProductsByCommunity(communityData.id),
      getServicesByCommunity(communityData.id),
      getCommunityIndustries(communityData.id)
    ])

    setAdmins(adminData)
    setFollowers(followerData)
    setProducts(productsData)
    setServices(servicesData)
    setIndustries(industriesData)

    // Check user status
    if (user) {
      const [followStatus, adminStatusData] = await Promise.all([
        isFollowingCommunity(communityData.id),
        isCommunityAdmin(communityData.id)
      ])
      setIsFollowing(followStatus)
      setAdminStatus(adminStatusData)
    }

    setLoading(false)
  }, [slug, supabase])

  useEffect(() => {
     
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg" />
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    )
  }

  if (!community) {
    notFound()
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      {/* Cover image */}
      {community.cover_image_url && (
        <div className="h-48 rounded-xl overflow-hidden mb-6">
          <img
            src={community.cover_image_url}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {community.logo_url ? (
              <img
                src={community.logo_url}
                alt={community.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-10 h-10 text-gray-400" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{community.name}</h1>
              {community.is_verified && (
                <BadgeCheck className="w-5 h-5 text-blue-500" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="secondary">
                {categoryLabels[community.category]}
              </Badge>
              {industries.slice(0, 3).map((industry) => (
                <Badge key={industry.id} variant="outline">
                  {getIndustryDisplayName(industry)}
                </Badge>
              ))}
              {industries.length > 3 && (
                <Badge variant="outline">
                  +{industries.length - 3}
                </Badge>
              )}
            </div>

            {community.description && (
              <p className="text-gray-600 mb-4">{community.description}</p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {community.follower_count} {community.follower_count === 1 ? 'følger' : 'følgere'}
              </span>
              <span>{community.post_count} innlegg</span>
            </div>

            {/* Contact info */}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
              {community.website_url && (
                <a
                  href={community.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <Globe className="w-4 h-4" />
                  Nettside
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {community.email && (
                <a
                  href={`mailto:${community.email}`}
                  className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
                >
                  <Mail className="w-4 h-4" />
                  {community.email}
                </a>
              )}
              {community.phone && (
                <a
                  href={`tel:${community.phone}`}
                  className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
                >
                  <Phone className="w-4 h-4" />
                  {community.phone}
                </a>
              )}
              {community.address && (
                <span className="flex items-center gap-1 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {community.address}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {currentUserId && (
              <FollowButton
                communityId={community.id}
                isFollowing={isFollowing}
                onStatusChange={fetchData}
              />
            )}

            {currentUserId && !adminStatus.isAdmin && (
              <Button
                variant="outline"
                onClick={() => setShowSendMessage(true)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Send melding
              </Button>
            )}

            {adminStatus.isAdmin && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content tabs */}
      <Tabs defaultValue={getInitialTab()} className="space-y-4">
        <TabsList>
          <TabsTrigger value="posts">Innlegg</TabsTrigger>
          <TabsTrigger value="products">
            <Package className="w-4 h-4 mr-1" />
            Produkter ({products.length})
          </TabsTrigger>
          <TabsTrigger value="services">
            <Briefcase className="w-4 h-4 mr-1" />
            Tjenester ({services.length})
          </TabsTrigger>
          <TabsTrigger value="about">Om</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <Feed communityIds={[community.id]} />
        </TabsContent>

        <TabsContent value="products">
          <div className="space-y-4">
            {adminStatus.isAdmin && (
              <div className="bg-white rounded-lg p-4 border-2 border-dashed flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Legg til produkter</h3>
                  <p className="text-sm text-gray-600">
                    Vis frem produkter samfunnet tilbyr
                  </p>
                </div>
                <Button onClick={() => setShowCreateProduct(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Nytt produkt
                </Button>
              </div>
            )}

            {products.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Ingen produkter ennå</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    communitySlug={community.slug}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="services">
          <div className="space-y-4">
            {adminStatus.isAdmin && (
              <div className="bg-white rounded-lg p-4 border-2 border-dashed flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Legg til tjenester</h3>
                  <p className="text-sm text-gray-600">
                    Vis frem tjenester samfunnet tilbyr
                  </p>
                </div>
                <Button onClick={() => setShowCreateService(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Ny tjeneste
                </Button>
              </div>
            )}

            {services.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center text-gray-500">
                <Briefcase className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Ingen tjenester ennå</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    communitySlug={community.slug}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="about">
          <div className="bg-white rounded-lg p-6 space-y-6">
            {/* Description */}
            {community.description && (
              <div>
                <h3 className="font-semibold mb-2">Om {community.name}</h3>
                <p className="text-gray-600">{community.description}</p>
              </div>
            )}

            {/* Industries */}
            {industries.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Bransjer</h3>
                <div className="flex flex-wrap gap-2">
                  {industries.map((industry) => (
                    <Badge key={industry.id} variant="secondary">
                      {getIndustryDisplayName(industry)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Admins */}
            {admins.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Administratorer</h3>
                <div className="space-y-3">
                  {admins.map((admin) => (
                    <div key={admin.id} className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={admin.user?.avatar_url || undefined} />
                        <AvatarFallback>
                          {admin.user?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{admin.user?.full_name || 'Ukjent'}</p>
                        <p className="text-sm text-gray-500">
                          {adminRoleLabels[admin.role]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            <div>
              <h3 className="font-semibold mb-3">Kontaktinformasjon</h3>
              <dl className="space-y-2 text-sm">
                {community.website_url && (
                  <div className="flex gap-2">
                    <dt className="text-gray-500 w-20">Nettside:</dt>
                    <dd>
                      <a
                        href={community.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {community.website_url}
                      </a>
                    </dd>
                  </div>
                )}
                {community.email && (
                  <div className="flex gap-2">
                    <dt className="text-gray-500 w-20">E-post:</dt>
                    <dd>
                      <a href={`mailto:${community.email}`} className="text-blue-600 hover:underline">
                        {community.email}
                      </a>
                    </dd>
                  </div>
                )}
                {community.phone && (
                  <div className="flex gap-2">
                    <dt className="text-gray-500 w-20">Telefon:</dt>
                    <dd>{community.phone}</dd>
                  </div>
                )}
                {community.address && (
                  <div className="flex gap-2">
                    <dt className="text-gray-500 w-20">Adresse:</dt>
                    <dd>{community.address}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="followers">
          <div className="bg-white rounded-lg divide-y">
            {followers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Ingen følgere enda
              </div>
            ) : (
              followers.map((follower) => (
                <div key={follower.id} className="flex items-center gap-3 p-4">
                  <Avatar>
                    <AvatarImage src={follower.user?.avatar_url || undefined} />
                    <AvatarFallback>
                      {follower.user?.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{follower.user?.full_name || 'Ukjent'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateProductModal
        open={showCreateProduct}
        onOpenChange={setShowCreateProduct}
        communityId={community.id}
        onCreated={fetchData}
      />

      <CreateServiceModal
        open={showCreateService}
        onOpenChange={setShowCreateService}
        communityId={community.id}
        onCreated={fetchData}
      />

      <SendMessageToCommunityModal
        open={showSendMessage}
        onOpenChange={setShowSendMessage}
        communityId={community.id}
        communityName={community.name}
      />

      <CommunitySettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        community={community}
      />
    </div>
  )
}
