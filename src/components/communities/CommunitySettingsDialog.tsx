'use client'

import { Settings, User, Mail, Users, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BasicSettingsTab,
  ContactSettingsTab,
  TeamSettingsTab,
  DangerZoneTab,
} from './settings'
import type { Community } from '@/lib/types/communities'

interface CommunitySettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  community: Community
  onUpdated?: () => void
}

export function CommunitySettingsDialog({
  open,
  onOpenChange,
  community,
  onUpdated,
}: CommunitySettingsDialogProps) {
  const handleUpdated = () => {
    if (onUpdated) {
      onUpdated()
    }
  }

  const handleDeleted = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Sideinnstillinger
          </DialogTitle>
          <DialogDescription>
            Administrer innstillinger for {community.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Grunnleggende</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-1.5">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Kontakt</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
            <TabsTrigger value="danger" className="flex items-center gap-1.5 text-red-600 data-[state=active]:text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Faresone</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="basic" className="mt-0">
              <BasicSettingsTab community={community} onUpdated={handleUpdated} />
            </TabsContent>

            <TabsContent value="contact" className="mt-0">
              <ContactSettingsTab community={community} onUpdated={handleUpdated} />
            </TabsContent>

            <TabsContent value="team" className="mt-0">
              <TeamSettingsTab community={community} onUpdated={handleUpdated} />
            </TabsContent>

            <TabsContent value="danger" className="mt-0">
              <DangerZoneTab community={community} onDeleted={handleDeleted} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
