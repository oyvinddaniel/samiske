'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Construction, Loader2 } from 'lucide-react'
import { useMaintenanceMode } from '@/components/maintenance/MaintenanceBanner'

interface LoginModalProps {
  open: boolean
  onClose: () => void
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const maintenance = useMaintenanceMode()

  // Show maintenance message if enabled
  if (maintenance.enabled) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
              <Construction className="w-6 h-6 text-amber-600" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">Vedlikehold pågår</DialogTitle>
            <DialogDescription className="text-center">
              {maintenance.message}
            </DialogDescription>
          </DialogHeader>
          <Button variant="outline" onClick={onClose} className="w-full">
            Lukk
          </Button>
        </DialogContent>
      </Dialog>
    )
  }

  // Show loading state while checking maintenance
  if (maintenance.loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="py-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Feil e-post eller passord'
        : error.message)
      setLoading(false)
    } else {
      // Use hard reload to ensure all client-side components get fresh auth state
      window.location.href = '/'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Logg inn</DialogTitle>
          <DialogDescription>
            Velkommen tilbake til samiske.no
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="modal-email">E-post</Label>
            <Input
              id="modal-email"
              type="email"
              placeholder="din@epost.no"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="modal-password">Passord</Label>
              <Link href="/glemt-passord" className="text-xs text-blue-600 hover:underline">
                Glemt passord?
              </Link>
            </div>
            <Input
              id="modal-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logger inn...' : 'Logg inn'}
          </Button>
          <p className="text-sm text-gray-600 text-center">
            Har du ikke konto?{' '}
            <Link href="/register" className="text-blue-600 hover:underline" onClick={onClose}>
              Registrer deg
            </Link>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
