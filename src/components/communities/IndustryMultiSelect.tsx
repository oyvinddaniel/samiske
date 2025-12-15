'use client'

import { useState, useEffect } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { getIndustries } from '@/lib/industries'
import { getIndustryDisplayName } from '@/lib/types/industries'
import type { Industry } from '@/lib/types/industries'
import { cn } from '@/lib/utils'

interface IndustryMultiSelectProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  onCreateNew?: () => void
}

export function IndustryMultiSelect({ selectedIds, onChange, onCreateNew }: IndustryMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [industries, setIndustries] = useState<Industry[]>([])

  useEffect(() => {
    async function loadIndustries() {
      const data = await getIndustries()
      setIndustries(data)
    }
    loadIndustries()
  }, [])

  const selectedIndustries = industries.filter(industry => selectedIds.includes(industry.id))

  const toggleIndustry = (industryId: string) => {
    if (selectedIds.includes(industryId)) {
      onChange(selectedIds.filter(id => id !== industryId))
    } else {
      onChange([...selectedIds, industryId])
    }
  }

  const removeIndustry = (industryId: string) => {
    onChange(selectedIds.filter(id => id !== industryId))
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedIds.length > 0
              ? `${selectedIds.length} bransje${selectedIds.length === 1 ? '' : 'r'} valgt`
              : 'Velg bransjer...'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Søk bransjer..." />
            <CommandEmpty>
              <div className="text-center py-6">
                <p className="text-sm text-gray-600 mb-3">Ingen bransjer funnet</p>
                {onCreateNew && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setOpen(false)
                      onCreateNew()
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Foreslå ny bransje
                  </Button>
                )}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {industries.map((industry) => (
                <CommandItem
                  key={industry.id}
                  onSelect={() => toggleIndustry(industry.id)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedIds.includes(industry.id) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {getIndustryDisplayName(industry)}
                </CommandItem>
              ))}
            </CommandGroup>
            {onCreateNew && (
              <div className="border-t p-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setOpen(false)
                    onCreateNew()
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Foreslå ny bransje
                </Button>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected industries */}
      {selectedIndustries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedIndustries.map((industry) => (
            <Badge
              key={industry.id}
              variant="secondary"
              className="pl-3 pr-1 py-1"
            >
              {getIndustryDisplayName(industry)}
              <button
                type="button"
                onClick={() => removeIndustry(industry.id)}
                className="ml-1 rounded-full hover:bg-gray-300 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
