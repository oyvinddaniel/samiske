'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createIndustry } from '@/lib/industries'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface CreateIndustryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

export function CreateIndustryModal({ open, onOpenChange, onCreated }: CreateIndustryModalProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [nameNo, setNameNo] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nameNo.trim()) {
      toast.error('Navn er påkrevd')
      return
    }

    if (!user) {
      toast.error('Du må være innlogget')
      return
    }

    setLoading(true)

    try {
      const result = await createIndustry(nameNo.trim(), user.id)

      if (result.success) {
        toast.success('Bransje-forslag sendt til moderering', {
          description: 'Din bransje vil bli gjennomgått av plattformadministratorer.'
        })
        onOpenChange(false)
        setNameNo('')

        if (onCreated) {
          onCreated()
        }
      } else {
        toast.error(result.error || 'Kunne ikke opprette bransje')
      }
    } catch (error) {
      console.error('Error creating industry:', error)
      toast.error('Noe gikk galt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Foreslå ny bransje</DialogTitle>
            <DialogDescription>
              Foreslå en ny bransje som skal legges til i listen. Forslaget vil bli gjennomgått av
              plattformadministratorer før det blir godkjent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="industry-name">
                Navn på bransje (norsk) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="industry-name"
                value={nameNo}
                onChange={(e) => setNameNo(e.target.value)}
                placeholder="F.eks. Reiseliv, Konsulent, Mediaproduks jon"
                maxLength={100}
                required
              />
              <p className="text-xs text-gray-500">
                Skriv navnet på norsk. Samiske oversettelser kan legges til senere av
                administratorer.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={loading || !nameNo.trim()}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sender...
                </>
              ) : (
                'Send forslag'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
