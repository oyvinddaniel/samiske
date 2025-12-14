'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { Bug, Lightbulb, HelpCircle, MoreHorizontal, Loader2, Upload, X } from 'lucide-react'
import type { BugReportCategory, BugReportContextData } from '@/lib/types/bug-reports'

const CATEGORIES = [
  { value: 'bug' as BugReportCategory, label: 'Bug / Feil', icon: Bug, description: 'Noe fungerer ikke som det skal' },
  { value: 'improvement' as BugReportCategory, label: 'Forbedring', icon: Lightbulb, description: 'Forslag til forbedringer' },
  { value: 'question' as BugReportCategory, label: 'Spørsmål', icon: HelpCircle, description: 'Jeg lurer på noe' },
  { value: 'other' as BugReportCategory, label: 'Annet', icon: MoreHorizontal, description: 'Noe annet' },
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

const bugReportSchema = z.object({
  category: z.enum(['bug', 'improvement', 'question', 'other']),
  title: z.string().min(5, 'Tittel må være minst 5 tegn').max(100, 'Tittel kan maks være 100 tegn'),
  description: z.string().min(10, 'Beskrivelse må være minst 10 tegn').max(2000, 'Beskrivelse kan maks være 2000 tegn'),
})

type BugReportFormValues = z.infer<typeof bugReportSchema>

interface BugReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserId?: string | null
  initialUrl?: string
}

export function BugReportDialog({
  open,
  onOpenChange,
  currentUserId,
  initialUrl,
}: BugReportDialogProps) {
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BugReportFormValues>({
    resolver: zodResolver(bugReportSchema),
    defaultValues: {
      category: 'bug',
    },
  })

  const category = watch('category')
  const description = watch('description') || ''

  // Auto-capture context data
  const captureContext = (): BugReportContextData => {
    return {
      url: initialUrl || window.location.href,
      userAgent: navigator.userAgent,
      screenSize: `${window.screen.width}x${window.screen.height}`,
    }
  }

  // Handle screenshot upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Kun bilder (JPG, PNG, WebP) er tillatt')
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Bildet kan maks være 5MB')
      return
    }

    setScreenshot(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setScreenshotPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeScreenshot = () => {
    setScreenshot(null)
    setScreenshotPreview(null)
  }

  // Upload screenshot to Supabase Storage
  const uploadScreenshot = async (userId: string): Promise<string | null> => {
    if (!screenshot) return null

    const fileExt = screenshot.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('bug-screenshots')
      .upload(fileName, screenshot, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Screenshot upload error:', uploadError)
      toast.error('Kunne ikke laste opp skjermbilde')
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('bug-screenshots')
      .getPublicUrl(fileName)

    return publicUrl
  }

  const onSubmit = async (data: BugReportFormValues) => {
    setSubmitting(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id || null

      // Capture context
      const context = captureContext()

      // Upload screenshot if present
      let screenshotUrl: string | null = null
      if (screenshot && userId) {
        screenshotUrl = await uploadScreenshot(userId)
      }

      // Insert bug report
      const { error: insertError } = await supabase.from('bug_reports').insert({
        user_id: userId,
        category: data.category,
        title: data.title,
        description: data.description,
        url: context.url,
        user_agent: context.userAgent,
        screen_size: context.screenSize,
        screenshot_url: screenshotUrl,
      })

      if (insertError) {
        console.error('Bug report insert error:', insertError)
        toast.error('Kunne ikke sende rapport. Prøv igjen.')
        return
      }

      toast.success('Takk for rapporten! Vi vil se på den.')
      reset()
      setScreenshot(null)
      setScreenshotPreview(null)
      onOpenChange(false)
    } catch (error) {
      console.error('Bug report submission error:', error)
      toast.error('Noe gikk galt. Prøv igjen.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      reset()
      setScreenshot(null)
      setScreenshotPreview(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-orange-500" />
            Rapporter problem
          </DialogTitle>
          <DialogDescription>
            Fortell oss om en bug, foreslå en forbedring, eller still et spørsmål.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Category selection */}
          <div className="space-y-3">
            <Label>Hva gjelder det? *</Label>
            <RadioGroup
              value={category}
              onValueChange={(value) => setValue('category', value as BugReportCategory)}
            >
              {CATEGORIES.map((cat) => (
                <div
                  key={cat.value}
                  className="flex items-start space-x-3 border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <RadioGroupItem value={cat.value} id={cat.value} />
                  <div className="flex-1">
                    <Label
                      htmlFor={cat.value}
                      className="font-medium cursor-pointer flex items-center gap-2"
                    >
                      <cat.icon className="w-4 h-4" />
                      {cat.label}
                    </Label>
                    <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category.message}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Tittel *</Label>
            <Input
              id="title"
              placeholder="F.eks. 'Kan ikke laste opp bilde' eller 'Knappen fungerer ikke'"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse *</Label>
            <Textarea
              id="description"
              placeholder="Beskriv problemet så detaljert som mulig..."
              rows={5}
              maxLength={2000}
              {...register('description')}
            />
            <div className="flex items-center justify-between">
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
              <p className="text-xs text-gray-500 ml-auto">{description.length}/2000</p>
            </div>
          </div>

          {/* Screenshot upload */}
          <div className="space-y-2">
            <Label htmlFor="screenshot">Skjermbilde (valgfritt)</Label>
            {!screenshotPreview ? (
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  id="screenshot"
                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="screenshot" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Klikk for å laste opp et skjermbilde
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG eller WebP (maks 5MB)
                  </p>
                </label>
              </div>
            ) : (
              <div className="relative border rounded-lg p-2">
                <button
                  type="button"
                  onClick={removeScreenshot}
                  className="absolute top-3 right-3 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                  aria-label="Fjern skjermbilde"
                >
                  <X className="w-4 h-4" />
                </button>
                <img
                  src={screenshotPreview}
                  alt="Screenshot preview"
                  className="w-full h-auto rounded"
                />
              </div>
            )}
          </div>

          {/* Auto-captured info */}
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-gray-600">
            <p className="font-medium mb-1">Automatisk samlet info:</p>
            <p>• URL: {initialUrl || window.location.href}</p>
            <p>• Skjermstørrelse: {window.screen.width}x{window.screen.height}</p>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sender...
              </>
            ) : (
              'Send rapport'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
