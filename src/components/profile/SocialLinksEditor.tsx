'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, X, Instagram, Facebook, Globe, Linkedin } from 'lucide-react'

export interface SocialLink {
  type: 'instagram' | 'facebook' | 'website' | 'linkedin' | 'twitter' | 'other'
  url: string
  label?: string
}

interface SocialLinksEditorProps {
  links: SocialLink[]
  onChange: (links: SocialLink[]) => void
  maxLinks?: number
}

export function SocialLinksEditor({
  links,
  onChange,
  maxLinks = 10,
}: SocialLinksEditorProps) {
  const [editMode, setEditMode] = useState(false)

  const handleAdd = () => {
    if (links.length >= maxLinks) return
    onChange([...links, { type: 'website', url: '', label: '' }])
  }

  const handleRemove = (index: number) => {
    onChange(links.filter((_, i) => i !== index))
  }

  const handleUpdate = (
    index: number,
    field: keyof SocialLink,
    value: string
  ) => {
    const updated = [...links]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const getIcon = (type: SocialLink['type']) => {
    switch (type) {
      case 'instagram':
        return <Instagram className="w-4 h-4" />
      case 'facebook':
        return <Facebook className="w-4 h-4" />
      case 'linkedin':
        return <Linkedin className="w-4 h-4" />
      default:
        return <Globe className="w-4 h-4" />
    }
  }

  if (!editMode) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Sosiale lenker</Label>
          <Button variant="ghost" size="sm" onClick={() => setEditMode(true)}>
            Rediger
          </Button>
        </div>

        {links.length === 0 ? (
          <p className="text-sm text-gray-500">Ingen sosiale lenker lagt til</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {getIcon(link.type)}
                <span className="text-sm">{link.label || link.type}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Sosiale lenker</Label>
        <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>
          Ferdig
        </Button>
      </div>

      {links.map((link, index) => (
        <div key={index} className="flex gap-2 items-start">
          <Select
            value={link.type}
            onValueChange={(value) =>
              handleUpdate(index, 'type', value as SocialLink['type'])
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="website">Nettside</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
              <SelectItem value="other">Annet</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="URL (https://...)"
            value={link.url}
            onChange={(e) => handleUpdate(index, 'url', e.target.value)}
            className="flex-1"
          />

          <Input
            placeholder="Label (valgfritt)"
            value={link.label || ''}
            onChange={(e) => handleUpdate(index, 'label', e.target.value)}
            className="w-[140px]"
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemove(index)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}

      {links.length < maxLinks && (
        <Button variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Legg til lenke
        </Button>
      )}

      {links.length >= maxLinks && (
        <p className="text-sm text-gray-500">
          Maks {maxLinks} lenker tillatt
        </p>
      )}
    </div>
  )
}
