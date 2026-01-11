'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'

interface InterestsTagEditorProps {
  interests: string[]
  onChange: (interests: string[]) => void
  maxInterests?: number
  maxLength?: number
}

// Predefined Sami-related interests
const SUGGESTED_INTERESTS = [
  // Tradisjonell kultur
  'Duodji',
  'Joik',
  'Reindrift',
  'Samisk språk',
  'Tradisjonell kunnskap',
  'Samisk historie',

  // Språk
  'Nordsamisk',
  'Lulesamisk',
  'Sørsamisk',
  'Språkbevaring',

  // Håndverk
  'Sølvarbeid',
  'Skinnsying',
  'Trearbeid',
  'Tekstiler',
  'Perleutbroderi',

  // Musikk og kunst
  'Samisk musikk',
  'Samisk kunst',
  'Fotografi',
  'Film',

  // Natur og friluftsliv
  'Friluftsliv',
  'Jakt',
  'Fiske',
  'Bærplukking',
  'Fjellvandring',

  // Samfunn og politikk
  'Urfolksrettigheter',
  'Samepolitikk',
  'Miljøvern',
  'Språkpolitikk',

  // Moderne aktiviteter
  'Teknologi',
  'Entreprenørskap',
  'Utdanning',
  'Helse',
  'Idrett',
  'Matlaging',
  'Lesing',
  'Skriving',
]

export function InterestsTagEditor({
  interests,
  onChange,
  maxInterests = 20,
  maxLength = 50,
}: InterestsTagEditorProps) {
  const [editMode, setEditMode] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleAdd = (interest: string) => {
    const trimmed = interest.trim()

    if (!trimmed) {
      toast.error('Interessefeltet kan ikke være tomt')
      return
    }

    if (trimmed.length > maxLength) {
      toast.error(`Interesse kan maks være ${maxLength} tegn`)
      return
    }

    if (interests.length >= maxInterests) {
      toast.error(`Du kan maks ha ${maxInterests} interesser`)
      return
    }

    if (interests.some(i => i.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Denne interessen er allerede lagt til')
      return
    }

    onChange([...interests, trimmed])
    setInputValue('')
    setShowSuggestions(false)
  }

  const handleRemove = (index: number) => {
    onChange(interests.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (inputValue.trim()) {
        handleAdd(inputValue)
      }
    }
  }

  // Filter suggestions based on input and exclude already added
  const filteredSuggestions = SUGGESTED_INTERESTS.filter(
    suggestion =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !interests.some(i => i.toLowerCase() === suggestion.toLowerCase())
  ).slice(0, 10)

  if (!editMode) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Interesser</Label>
          <Button variant="ghost" size="sm" onClick={() => setEditMode(true)}>
            Rediger
          </Button>
        </div>

        {interests.length === 0 ? (
          <p className="text-sm text-gray-500">Ingen interesser lagt til</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {interests.map((interest, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 hover:bg-blue-200"
              >
                {interest}
              </Badge>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Interesser</Label>
        <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>
          Ferdig
        </Button>
      </div>

      {/* Current interests */}
      {interests.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {interests.map((interest, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="px-3 py-1 text-sm bg-blue-100 text-blue-800 flex items-center gap-2"
            >
              <span>{interest}</span>
              <button
                onClick={() => handleRemove(index)}
                className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add new interest */}
      {interests.length < maxInterests && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Legg til interesse..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                maxLength={maxLength}
              />

              {/* Suggestions dropdown */}
              {showSuggestions && inputValue.length > 0 && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleAdd(suggestion)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => inputValue.trim() && handleAdd(inputValue)}
              disabled={!inputValue.trim()}
            >
              <Plus className="w-4 h-4 mr-1" />
              Legg til
            </Button>
          </div>

          {/* Popular suggestions (when input is empty) */}
          {inputValue.length === 0 && interests.length < maxInterests && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Populære interesser:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_INTERESTS.filter(
                  s => !interests.some(i => i.toLowerCase() === s.toLowerCase())
                )
                  .slice(0, 8)
                  .map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleAdd(suggestion)}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      + {suggestion}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Counter */}
      <p className="text-xs text-gray-500">
        {interests.length} / {maxInterests} interesser
      </p>

      {interests.length >= maxInterests && (
        <p className="text-sm text-amber-600">
          Du har nådd maksgrensen på {maxInterests} interesser
        </p>
      )}
    </div>
  )
}
