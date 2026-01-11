'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Pencil, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface InlineEditFieldProps {
  userId: string
  fieldName: string
  value: string | null
  displayValue?: string
  placeholder?: string
  multiline?: boolean
  maxLength?: number
  isEditable: boolean
  onSave?: (newValue: string) => void
}

export function InlineEditField({
  userId,
  fieldName,
  value,
  displayValue,
  placeholder = 'Klikk for å redigere',
  multiline = false,
  maxLength,
  isEditable,
  onSave,
}: InlineEditFieldProps) {
  const [editing, setEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value || '')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleSave = async () => {
    if (tempValue === value) {
      setEditing(false)
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({ [fieldName]: tempValue || null })
      .eq('id', userId)

    if (error) {
      console.error('Error saving field:', error)
      toast.error('Kunne ikke lagre endring')
      setTempValue(value || '')
    } else {
      toast.success('Endring lagret')
      if (onSave) onSave(tempValue)
    }

    setSaving(false)
    setEditing(false)
  }

  const handleCancel = () => {
    setTempValue(value || '')
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel()
    } else if (e.key === 'Enter' && !multiline && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
  }

  if (!isEditable) {
    return (
      <span className="text-gray-700">
        {displayValue || value || (
          <span className="text-gray-400 italic">{placeholder}</span>
        )}
      </span>
    )
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="group inline-flex items-center gap-2 hover:bg-gray-100 rounded px-2 py-1 -mx-2 transition-colors text-left w-full"
      >
        <span className="text-gray-700 flex-1">
          {displayValue || value || (
            <span className="text-gray-400 italic">{placeholder}</span>
          )}
        </span>
        <Pencil className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </button>
    )
  }

  const InputComponent = multiline ? Textarea : Input

  return (
    <div className="flex items-start gap-2 w-full">
      <InputComponent
        ref={inputRef as any}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={maxLength}
        disabled={saving}
        className="flex-1"
        rows={multiline ? 3 : undefined}
      />
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={handleSave}
          disabled={saving}
          className="p-2 text-green-600 hover:bg-green-50 rounded disabled:opacity-50 transition-colors"
          title="Lagre"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 transition-colors"
          title="Avbryt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
