'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Shield } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { isPlatformAdmin, getPlatformAdminByUserId } from '@/lib/platform'
import { BransjerTab } from '@/components/admin/BransjerTab'
import { PlatformAdminsTab } from '@/components/admin/PlatformAdminsTab'

export default function PlatformAdminPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [role, setRole] = useState<'owner' | 'admin' | null>(null)

  useEffect(() => {
    async function checkAdminStatus() {
      setLoading(true)

      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/auth/login')
          return
        }

        const adminStatus = await isPlatformAdmin(user.id)

        if (!adminStatus) {
          router.push('/')
          return
        }

        const adminData = await getPlatformAdminByUserId(user.id)

        setIsAdmin(true)
        setRole(adminData?.role as 'owner' | 'admin' | null)
      } catch (error) {
        console.error('Error checking admin status:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto py-6 px-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null // Will redirect
  }

  return (
    <div className="container max-w-6xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold">Platform Administrasjon</h1>
        </div>
        <p className="text-gray-600">
          Administrer bransjer, moderering og platform-tilgang
        </p>
        {role === 'owner' && (
          <p className="text-sm text-blue-600 mt-1">
            Du er platform-eier med full tilgang
          </p>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="bransjer" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bransjer">Bransjer</TabsTrigger>
          {role === 'owner' && (
            <TabsTrigger value="admins">Administratorer</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="bransjer">
          <BransjerTab />
        </TabsContent>

        {role === 'owner' && (
          <TabsContent value="admins">
            <PlatformAdminsTab currentUserRole={role} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
