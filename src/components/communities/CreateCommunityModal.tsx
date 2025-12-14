'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  Building2,
  Briefcase,
  Landmark,
  Users,
  Palette,
  GraduationCap,
  Building,
  CircleDot,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createCommunity, generateSlug } from '@/lib/communities'
import { getIndustries } from '@/lib/industries'
import type { CommunityCategory } from '@/lib/types/communities'
import type { Industry } from '@/lib/types/industries'
import { categoryLabels } from '@/lib/types/communities'
import { toast } from 'sonner'
import { IndustryMultiSelect } from '@/components/communities/IndustryMultiSelect'
import { CreateIndustryModal } from '@/components/communities/CreateIndustryModal'

interface CreateCommunityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (slug: string) => void
}

const categoryOptions: { value: CommunityCategory; icon: React.ReactNode }[] = [
  { value: 'organization', icon: <Building2 className="w-4 h-4" /> },
  { value: 'business', icon: <Briefcase className="w-4 h-4" /> },
  { value: 'association', icon: <Users className="w-4 h-4" /> },
  { value: 'cultural', icon: <Palette className="w-4 h-4" /> },
  { value: 'educational', icon: <GraduationCap className="w-4 h-4" /> },
  { value: 'institution', icon: <Landmark className="w-4 h-4" /> },
  { value: 'government', icon: <Building className="w-4 h-4" /> },
  { value: 'other', icon: <CircleDot className="w-4 h-4" /> },
]

const STEPS = ['Grunnleggende', 'Kontaktinfo', 'Lokasjon', 'Bilder'] as const
type Step = (typeof STEPS)[number]

export function CreateCommunityModal({ open, onOpenChange, onCreated }: CreateCommunityModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showCreateIndustry, setShowCreateIndustry] = useState(false)

  // Step 1: Grunnleggende
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<CommunityCategory>('organization')
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])

  // Step 2: Kontaktinfo
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [address, setAddress] = useState('')

  // Step 3: Lokasjon (simplified for now - can be expanded later)
  // TODO: Add municipality/place selector

  // Step 4: Bilder (simplified for now - can be expanded later)
  // TODO: Add image upload functionality

  const canGoNext = () => {
    if (currentStep === 0) {
      return name.trim().length > 0
    }
    return true
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setCategory('organization')
    setSelectedIndustries([])
    setEmail('')
    setPhone('')
    setWebsite('')
    setAddress('')
    setCurrentStep(0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Navn er påkrevd')
      return
    }

    setLoading(true)

    try {
      const communityId = await createCommunity({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        websiteUrl: website.trim() || undefined,
        industryIds: selectedIndustries.length > 0 ? selectedIndustries : undefined,
      })

      if (communityId) {
        const slug = generateSlug(name.trim())
        toast.success('Side opprettet')
        onOpenChange(false)
        resetForm()

        // Notify sidebar to refresh communities list
        window.dispatchEvent(new CustomEvent('community-created'))

        if (onCreated) {
          onCreated(slug)
        } else {
          router.push(`/samfunn/${slug}`)
        }
      } else {
        toast.error('Kunne ikke opprette side')
      }
    } catch (error) {
      console.error('Error creating community:', error)
      console.error('Full error:', JSON.stringify(error, null, 2))
      toast.error('Noe gikk galt')
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Navn <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Navn på siden"
                maxLength={100}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Fortell litt om siden..."
                maxLength={500}
                rows={3}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Kategori</Label>
              <RadioGroup
                value={category}
                onValueChange={(value) => setCategory(value as CommunityCategory)}
                className="grid grid-cols-2 gap-2"
              >
                {categoryOptions.map((option) => (
                  <div key={option.value}>
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={option.value}
                      className="flex items-center gap-2 rounded-lg border-2 border-gray-200 p-3 cursor-pointer hover:bg-gray-50 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 transition-colors"
                    >
                      <span className="text-gray-500 peer-data-[state=checked]:text-blue-600">
                        {option.icon}
                      </span>
                      <span className="text-sm font-medium">
                        {categoryLabels[option.value]}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Industries */}
            <div className="space-y-2">
              <Label>Bransjer</Label>
              <IndustryMultiSelect
                selectedIds={selectedIndustries}
                onChange={setSelectedIndustries}
                onCreateNew={() => setShowCreateIndustry(true)}
              />
              <p className="text-sm text-gray-500">
                Velg én eller flere bransjer som beskriver siden
              </p>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kontakt@eksempel.no"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+47 123 45 678"
              />
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website">Nettside</Label>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://eksempel.no"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Gateadresse, postnummer, sted"
                rows={2}
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Lokasjon-velger kommer snart. Du kan legge til stedinformasjon senere.
            </p>
            {/* TODO: Add geography selector (language area → municipality → place) */}
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Bildeopplasting kommer snart. Du kan legge til bilder senere.
            </p>
            {/* TODO: Add image upload for logo, cover, and gallery */}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Opprett side</DialogTitle>
              <DialogDescription>
                Opprett en side for din organisasjon, bedrift eller forening.
              </DialogDescription>
            </DialogHeader>

            {/* Progress indicator */}
            <div className="py-4">
              <div className="flex items-center justify-between mb-2">
                {STEPS.map((step, index) => (
                  <div
                    key={step}
                    className={`flex-1 text-center text-xs font-medium ${
                      index === currentStep
                        ? 'text-blue-600'
                        : index < currentStep
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {step}
                  </div>
                ))}
              </div>
              <div className="flex gap-1">
                {STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full ${
                      index <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Step content */}
            <div className="py-4">{renderStepContent()}</div>

            <DialogFooter className="flex-row gap-2">
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Tilbake
                </Button>
              )}

              {currentStep < STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canGoNext()}
                  className="flex-1"
                >
                  Neste
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading || !name.trim()} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Oppretter...
                    </>
                  ) : (
                    'Opprett side'
                  )}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CreateIndustryModal
        open={showCreateIndustry}
        onOpenChange={setShowCreateIndustry}
        onCreated={() => {
          toast.success('Bransje-forslag sendt til moderering')
        }}
      />
    </>
  )
}
