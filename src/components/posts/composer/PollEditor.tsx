'use client'

import { useState } from 'react'
import { Plus, X, GripVertical, BarChart3, Clock, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { PollData, PollOption } from './types'

interface PollEditorProps {
  value: PollData | null
  onChange: (poll: PollData | null) => void
  maxOptions?: number
  className?: string
}

export function PollEditor({
  value,
  onChange,
  maxOptions = 10,
  className,
}: PollEditorProps) {
  const [isOpen, setIsOpen] = useState(!!value)

  const handleOpen = () => {
    if (!value) {
      // Create initial poll structure
      onChange({
        question: '',
        options: [
          { id: crypto.randomUUID(), text: '', sortOrder: 0 },
          { id: crypto.randomUUID(), text: '', sortOrder: 1 },
        ],
        allowMultiple: false,
      })
    }
    setIsOpen(true)
  }

  const handleClose = () => {
    onChange(null)
    setIsOpen(false)
  }

  const handleQuestionChange = (question: string) => {
    if (!value) return
    onChange({ ...value, question })
  }

  const handleOptionChange = (id: string, text: string) => {
    if (!value) return
    onChange({
      ...value,
      options: value.options.map((opt) =>
        opt.id === id ? { ...opt, text } : opt
      ),
    })
  }

  const handleAddOption = () => {
    if (!value || value.options.length >= maxOptions) return
    onChange({
      ...value,
      options: [
        ...value.options,
        {
          id: crypto.randomUUID(),
          text: '',
          sortOrder: value.options.length,
        },
      ],
    })
  }

  const handleRemoveOption = (id: string) => {
    if (!value || value.options.length <= 2) return
    onChange({
      ...value,
      options: value.options
        .filter((opt) => opt.id !== id)
        .map((opt, index) => ({ ...opt, sortOrder: index })),
    })
  }

  const handleToggleMultiple = (allowMultiple: boolean) => {
    if (!value) return
    onChange({ ...value, allowMultiple })
  }

  const handleSetExpiry = (days: number | null) => {
    if (!value) return
    if (days === null) {
      onChange({ ...value, expiresAt: undefined })
    } else {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + days)
      onChange({ ...value, expiresAt })
    }
  }

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleOpen}
        className={cn('gap-2', className)}
      >
        <BarChart3 className="w-4 h-4" />
        <span>Legg til avstemning</span>
      </Button>
    )
  }

  if (!value) return null

  return (
    <div className={cn('border border-gray-200 rounded-lg p-4 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <span className="font-medium">Avstemning</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="h-8 w-8 text-gray-500 hover:text-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Question */}
      <div>
        <input
          type="text"
          value={value.question}
          onChange={(e) => handleQuestionChange(e.target.value)}
          placeholder="Still et spørsmål..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Options */}
      <div className="space-y-2">
        {value.options.map((option, index) => (
          <div key={option.id} className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-gray-300" />
            <input
              type="text"
              value={option.text}
              onChange={(e) => handleOptionChange(option.id, e.target.value)}
              placeholder={`Valg ${index + 1}`}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            {value.options.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveOption(option.id)}
                className="h-8 w-8 text-gray-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}

        {value.options.length < maxOptions && (
          <button
            type="button"
            onClick={handleAddOption}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Legg til valg</span>
          </button>
        )}
      </div>

      {/* Settings */}
      <div className="pt-3 border-t border-gray-100 space-y-3">
        {/* Multiple choice */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Tillat flervalg</span>
          <Switch
            checked={value.allowMultiple}
            onCheckedChange={handleToggleMultiple}
          />
        </div>

        {/* Expiry */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Utløper</span>
          </div>
          <select
            value={
              value.expiresAt
                ? Math.round(
                    (new Date(value.expiresAt).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  )
                : 'never'
            }
            onChange={(e) =>
              handleSetExpiry(e.target.value === 'never' ? null : parseInt(e.target.value))
            }
            className="px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="never">Aldri</option>
            <option value="1">Om 1 dag</option>
            <option value="3">Om 3 dager</option>
            <option value="7">Om 1 uke</option>
            <option value="14">Om 2 uker</option>
            <option value="30">Om 1 måned</option>
          </select>
        </div>
      </div>

      {/* Validation */}
      {value.question && value.options.filter((o) => o.text).length < 2 && (
        <p className="text-xs text-amber-600">
          Minst 2 valg med tekst kreves
        </p>
      )}
    </div>
  )
}
