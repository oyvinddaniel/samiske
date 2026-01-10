import { Suspense } from 'react'
import { HomeLayout } from '@/components/layout/HomeLayout'
import { GroupsContent } from './GroupsContent'

function GroupsPageContent() {
  return (
    <HomeLayout>
      <GroupsContent />
    </HomeLayout>
  )
}

export default function GroupsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">Laster...</div>
      </div>
    }>
      <GroupsPageContent />
    </Suspense>
  )
}
