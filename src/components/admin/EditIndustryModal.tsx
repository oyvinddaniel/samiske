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
import { updateIndustry } from '@/lib/industries'
import type { Industry } from '@/lib/types/industries'
import { toast } from 'sonner'

interface EditIndustryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  industry: Industry
  onUpdated: () => void
}

export function EditIndustryModal({
  open,
  onOpenChange,
  industry,
  onUpdated
}: EditIndustryModalProps) {
  const [loading, setLoading] = useState(false)
  const [nameNo, setNameNo] = useState('')
  const [nameSma, setNameSma] = useState('')
  const [nameSju, setNameSju] = useState('')
  const [nameSje, setNameSje] = useState('')
  const [nameSmj, setNameSmj] = useState('')
  const [nameSe, setNameSe] = useState('')

  useEffect(() => {
    if (industry) {
      setNameNo(industry.name_no || '')
      setNameSma(industry.name_sma || '')
      setNameSju(industry.name_sju || '')
      setNameSje(industry.name_sje || '')
      setNameSmj(industry.name_smj || '')
      setNameSe(industry.name_se || '')
    }
  }, [industry])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nameNo.trim()) {
      toast.error('Norsk navn er påkrevd')
      return
    }

    setLoading(true)

    try {
      const result = await updateIndustry(industry.id, {
        name_no: nameNo.trim(),
        name_sma: nameSma.trim() || null,
        name_sju: nameSju.trim() || null,
        name_sje: nameSje.trim() || null,
        name_smj: nameSmj.trim() || null,
        name_se: nameSe.trim() || null,
      })

      if (result.success) {
        toast.success('Bransje oppdatert')
        onOpenChange(false)
        onUpdated()
      } else {
        toast.error(result.error || 'Kunne ikke oppdatere bransje')
      }
    } catch (error) {
      console.error('Error updating industry:', error)
      toast.error('Noe gikk galt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rediger bransje</DialogTitle>
            <DialogDescription>
              Oppdater bransjenavn på alle språk. Kun norsk er påkrevd.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Norwegian (required) */}
            <div className="space-y-2">
              <Label htmlFor="name-no">
                Norsk <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name-no"
                value={nameNo}
                onChange={(e) => setNameNo(e.target.value)}
                placeholder="F.eks. Håndverk"
                required
              />
            </div>

            {/* South Sami */}
            <div className="space-y-2">
              <Label htmlFor="name-sma">Sørsamisk (Åarjelsaemien)</Label>
              <Input
                id="name-sma"
                value={nameSma}
                onChange={(e) => setNameSma(e.target.value)}
                placeholder="Valgfritt"
              />
            </div>

            {/* Ume Sami */}
            <div className="space-y-2">
              <Label htmlFor="name-sju">Umesamisk (Ubmejensámien)</Label>
              <Input
                id="name-sju"
                value={nameSju}
                onChange={(e) => setNameSju(e.target.value)}
                placeholder="Valgfritt"
              />
            </div>

            {/* Pite Sami */}
            <div className="space-y-2">
              <Label htmlFor="name-sje">Pitesamisk (Bidumsámegiella)</Label>
              <Input
                id="name-sje"
                value={nameSje}
                onChange={(e) => setNameSje(e.target.value)}
                placeholder="Valgfritt"
              />
            </div>

            {/* Lule Sami */}
            <div className="space-y-2">
              <Label htmlFor="name-smj">Lulesamisk (Julevsámegiella)</Label>
              <Input
                id="name-smj"
                value={nameSmj}
                onChange={(e) => setNameSmj(e.target.value)}
                placeholder="Valgfritt"
              />
            </div>

            {/* North Sami */}
            <div className="space-y-2">
              <Label htmlFor="name-se">Nordsamisk (Davvisámegiella)</Label>
              <Input
                id="name-se"
                value={nameSe}
                onChange={(e) => setNameSe(e.target.value)}
                placeholder="Valgfritt"
              />
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
                  Lagrer...
                </>
              ) : (
                'Lagre endringer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
