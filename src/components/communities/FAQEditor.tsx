'use client'

import { useState, useEffect } from 'react'
import { Loader2, Plus, Trash2, HelpCircle, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  getFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  type FAQ
} from '@/lib/faqs'
import { toast } from 'sonner'

interface FAQEditorProps {
  communityId: string
  onUpdated?: () => void
}

export function FAQEditor({ communityId, onUpdated }: FAQEditorProps) {
  const [loading, setLoading] = useState(true)
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<FAQ | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state for new/edit
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')

  useEffect(() => {
    fetchFAQs()
  }, [communityId])

  const fetchFAQs = async () => {
    setLoading(true)
    const data = await getFAQs(communityId)
    setFaqs(data)
    setLoading(false)
  }

  const handleCreate = () => {
    setCreating(true)
    setEditing(null)
    setQuestion('')
    setAnswer('')
  }

  const handleEdit = (faq: FAQ) => {
    setEditing(faq.id)
    setCreating(false)
    setQuestion(faq.question)
    setAnswer(faq.answer)
  }

  const handleCancel = () => {
    setCreating(false)
    setEditing(null)
    setQuestion('')
    setAnswer('')
  }

  const handleSave = async () => {
    if (!question.trim() || !answer.trim()) {
      toast.error('Spørsmål og svar er påkrevd')
      return
    }

    setSaving(true)
    try {
      if (creating) {
        const newFaq = await createFAQ(communityId, question.trim(), answer.trim())
        if (newFaq) {
          setFaqs([...faqs, newFaq])
          toast.success('Spørsmål lagt til')
          handleCancel()
          if (onUpdated) onUpdated()
        } else {
          toast.error('Kunne ikke lagre spørsmål')
        }
      } else if (editing) {
        const success = await updateFAQ(editing, question.trim(), answer.trim())
        if (success) {
          setFaqs(faqs.map(f =>
            f.id === editing
              ? { ...f, question: question.trim(), answer: answer.trim() }
              : f
          ))
          toast.success('Spørsmål oppdatert')
          handleCancel()
          if (onUpdated) onUpdated()
        } else {
          toast.error('Kunne ikke oppdatere spørsmål')
        }
      }
    } catch (error) {
      console.error('Error saving FAQ:', error)
      toast.error('Kunne ikke lagre spørsmål')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (faq: FAQ) => {
    const success = await deleteFAQ(faq.id)
    if (success) {
      setFaqs(faqs.filter(f => f.id !== faq.id))
      toast.success('Spørsmål slettet')
      setDeleting(null)
      if (onUpdated) onUpdated()
    } else {
      toast.error('Kunne ikke slette spørsmål')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          Ofte stilte spørsmål (FAQ)
        </h3>
        <p className="text-sm text-gray-500">
          Legg til svar på vanlige spørsmål for å hjelpe besøkende.
        </p>
      </div>

      {/* Existing FAQs */}
      {faqs.length > 0 && (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="border rounded-lg p-4 space-y-3"
            >
              {editing === faq.id ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor={`question-${faq.id}`}>Spørsmål</Label>
                    <Input
                      id={`question-${faq.id}`}
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Hva er ditt spørsmål?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`answer-${faq.id}`}>Svar</Label>
                    <Textarea
                      id={`answer-${faq.id}`}
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Skriv svaret her..."
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Lagrer...
                        </>
                      ) : (
                        'Lagre'
                      )}
                    </Button>
                    <Button variant="ghost" onClick={handleCancel}>
                      Avbryt
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{faq.question}</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(faq)}
                    >
                      Rediger
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleting(faq)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New FAQ form */}
      {creating && (
        <div className="border-2 border-dashed rounded-lg p-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="new-question">Spørsmål</Label>
            <Input
              id="new-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Hva er ditt spørsmål?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-answer">Svar</Label>
            <Textarea
              id="new-answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Skriv svaret her..."
              rows={4}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Lagrer...
                </>
              ) : (
                'Lagre'
              )}
            </Button>
            <Button variant="ghost" onClick={handleCancel}>
              Avbryt
            </Button>
          </div>
        </div>
      )}

      {/* Add button */}
      {!creating && !editing && (
        <Button onClick={handleCreate} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Legg til spørsmål
        </Button>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett spørsmål?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette dette spørsmålet? Dette kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && handleDelete(deleting)}
              className="bg-red-600 hover:bg-red-700"
            >
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
