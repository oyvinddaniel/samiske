'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreateCommunityModal } from './CreateCommunityModal'
import {
  SamfunnInnleggTab,
  SamfunnStedTab,
  SamfunnBransjeTab,
  SamfunnKatalogTab
} from '.'
import { createClient } from '@/lib/supabase/client'

interface CommunityFeedViewProps {
  onClose: () => void
}

export function CommunityFeedView({ onClose }: CommunityFeedViewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function getCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getCurrentUser()
  }, [supabase])

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">Samfunn</h1>
          {currentUserId && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Opprett side
            </Button>
          )}
        </div>
        <div className="text-gray-600 space-y-3">
          <p>
            Utforsk samiske næringsliv, produkter, tjenester, institusjoner og andre sider. Se innlegg fra samfunn-sider, filtrer etter sted eller bransje, eller bla gjennom katalogen.
          </p>
          <p>
            Hvis du holder foredrag, er artist, forfatter, er historieforteller, oversetter eller tilbyr andre tjenester vil vi gjerne at du lager en side. På denne måten blir det enklere å finne frem til alle samiske ressurser.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="innlegg" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="innlegg">Innlegg</TabsTrigger>
          <TabsTrigger value="sted">Sted</TabsTrigger>
          <TabsTrigger value="bransje">Bransje</TabsTrigger>
          <TabsTrigger value="katalog">Katalog</TabsTrigger>
        </TabsList>

        <TabsContent value="innlegg">
          <SamfunnInnleggTab currentUserId={currentUserId} />
        </TabsContent>

        <TabsContent value="sted">
          <SamfunnStedTab />
        </TabsContent>

        <TabsContent value="bransje">
          <SamfunnBransjeTab />
        </TabsContent>

        <TabsContent value="katalog">
          <SamfunnKatalogTab />
        </TabsContent>
      </Tabs>

      {/* Create modal */}
      <CreateCommunityModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreated={() => {
          setShowCreateModal(false)
          // Refresh could be triggered here if needed
        }}
      />
    </div>
  )
}
