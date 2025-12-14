'use client'

import { useState, useEffect } from 'react'
import { Loader2, Package, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductCard, ServiceCard } from '@/components/communities'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/lib/types/products'
import type { Service } from '@/lib/types/services'

type CatalogFilter = 'all' | 'products' | 'services'

export function SamfunnKatalogTab() {
  const [filter, setFilter] = useState<CatalogFilter>('all')
  const [products, setProducts] = useState<Product[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadCatalog() {
      setLoading(true)

      const [productsData, servicesData] = await Promise.all([
        supabase
          .from('products')
          .select('*, community:communities(id, name, slug, logo_url)')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('services')
          .select('*, community:communities(id, name, slug, logo_url)')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(50)
      ])

      if (productsData.data) {
        setProducts(productsData.data as any[])
      }

      if (servicesData.data) {
        setServices(servicesData.data as any[])
      }

      setLoading(false)
    }

    loadCatalog()
  }, [supabase])

  const showProducts = filter === 'all' || filter === 'products'
  const showServices = filter === 'all' || filter === 'services'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Alle
        </Button>
        <Button
          variant={filter === 'products' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('products')}
        >
          <Package className="w-4 h-4 mr-1" />
          Produkter ({products.length})
        </Button>
        <Button
          variant={filter === 'services' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('services')}
        >
          <Briefcase className="w-4 h-4 mr-1" />
          Tjenester ({services.length})
        </Button>
      </div>

      {/* Products */}
      {showProducts && products.length > 0 && (
        <section>
          <h3 className="font-semibold mb-3">Produkter</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product: any) => (
              <ProductCard
                key={product.id}
                product={product}
                communitySlug={product.community?.slug}
              />
            ))}
          </div>
        </section>
      )}

      {/* Services */}
      {showServices && services.length > 0 && (
        <section>
          <h3 className="font-semibold mb-3">Tjenester</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map((service: any) => (
              <ServiceCard
                key={service.id}
                service={service}
                communitySlug={service.community?.slug}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {products.length === 0 && services.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Ingen produkter eller tjenester ennå</p>
        </div>
      )}

      {showProducts && products.length === 0 && services.length > 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Package className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm">Ingen produkter ennå</p>
        </div>
      )}

      {showServices && services.length === 0 && products.length > 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Briefcase className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm">Ingen tjenester ennå</p>
        </div>
      )}
    </div>
  )
}
