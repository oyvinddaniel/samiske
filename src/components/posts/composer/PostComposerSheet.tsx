'use client'

import { BottomSheet } from '@/components/ui/bottom-sheet'
import { PostComposerCore } from './PostComposerCore'
import { usePostComposer } from './usePostComposer'
import type { GeographySelection } from '@/components/geography'

interface PostComposerSheetProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  userId: string
  defaultGeography?: GeographySelection | null
  groupId?: string | null
  communityId?: string | null
}

export function PostComposerSheet({
  open,
  onClose,
  onSuccess,
  userId,
  defaultGeography,
  groupId,
  communityId,
}: PostComposerSheetProps) {
  const composer = usePostComposer({
    userId,
    defaultGeography,
    groupId,
    communityId,
    onSuccess: () => {
      onSuccess?.()
      onClose()
    },
  })

  const handleClose = () => {
    if (composer.state.isDirty) {
      // BottomSheet handles confirmation
    }
    composer.reset()
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      title="Opprett innlegg"
      confirmClose={composer.state.isDirty}
      confirmMessage="Er du sikker på at du vil avbryte? Innholdet vil gå tapt."
    >
      <div className="py-2">
        <PostComposerCore
          composer={composer}
          variant="sheet"
          showGeography={!defaultGeography && !groupId && !communityId}
        />
      </div>
    </BottomSheet>
  )
}
