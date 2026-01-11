'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import {
  X,
  Check,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  SlidersHorizontal,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Maximize2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
export interface ImageEdits {
  crop?: CropData
  filters: FilterSettings
  rotation: number
  flipH: boolean
  flipV: boolean
}

export interface CropData {
  x: number
  y: number
  width: number
  height: number
}

export interface FilterSettings {
  brightness: number
  contrast: number
  saturation: number
  blur: number
  grayscale: number
  sepia: number
}

export const DEFAULT_FILTERS: FilterSettings = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  grayscale: 0,
  sepia: 0,
}

// Preset filters
export interface FilterPreset {
  name: string
  filters: FilterSettings
}

export const FILTER_PRESETS: FilterPreset[] = [
  { name: 'Normal', filters: DEFAULT_FILTERS },
  { name: 'Varm', filters: { ...DEFAULT_FILTERS, saturation: 130, sepia: 20 } },
  { name: 'Kald', filters: { ...DEFAULT_FILTERS, saturation: 80, brightness: 105 } },
  { name: 'Vintage', filters: { ...DEFAULT_FILTERS, sepia: 40, contrast: 90, saturation: 80 } },
  { name: 'Drama', filters: { ...DEFAULT_FILTERS, contrast: 130, saturation: 120 } },
  { name: 'Svart/hvit', filters: { ...DEFAULT_FILTERS, grayscale: 100 } },
  { name: 'Lys', filters: { ...DEFAULT_FILTERS, brightness: 115, contrast: 95 } },
  { name: 'Mørk', filters: { ...DEFAULT_FILTERS, brightness: 85, contrast: 110 } },
]

// Aspect ratios
export type AspectRatioKey = 'free' | '1:1' | '4:3' | '3:4' | '16:9' | '9:16'

export interface AspectRatioOption {
  key: AspectRatioKey
  label: string
  value: number | undefined
  icon: React.ElementType
}

export const ASPECT_RATIOS: AspectRatioOption[] = [
  { key: 'free', label: 'Fri', value: undefined, icon: Maximize2 },
  { key: '1:1', label: '1:1', value: 1, icon: Square },
  { key: '4:3', label: '4:3', value: 4 / 3, icon: RectangleHorizontal },
  { key: '3:4', label: '3:4', value: 3 / 4, icon: RectangleVertical },
  { key: '16:9', label: '16:9', value: 16 / 9, icon: RectangleHorizontal },
  { key: '9:16', label: '9:16', value: 9 / 16, icon: RectangleVertical },
]

// Props
interface ImageEditorProps {
  imageUrl: string
  initialEdits?: Partial<ImageEdits>
  onSave: (edits: ImageEdits, croppedImageBlob: Blob) => void
  onCancel: () => void
}

export function ImageEditor({ imageUrl, initialEdits, onSave, onCancel }: ImageEditorProps) {
  // Tabs
  type EditorTab = 'crop' | 'filter'
  const [activeTab, setActiveTab] = useState<EditorTab>('crop')

  // Crop state
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(initialEdits?.rotation || 0)
  const [flipH, setFlipH] = useState(initialEdits?.flipH || false)
  const [flipV, setFlipV] = useState(initialEdits?.flipV || false)
  const [aspectRatio, setAspectRatio] = useState<AspectRatioKey>('free')
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  // Filter state
  const [filters, setFilters] = useState<FilterSettings>(
    initialEdits?.filters || DEFAULT_FILTERS
  )

  // Handle crop complete
  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  // Rotate
  const rotateLeft = () => setRotation((r) => r - 90)
  const rotateRight = () => setRotation((r) => r + 90)

  // Flip
  const toggleFlipH = () => setFlipH((f) => !f)
  const toggleFlipV = () => setFlipV((f) => !f)

  // Reset
  const resetAll = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setFlipH(false)
    setFlipV(false)
    setFilters(DEFAULT_FILTERS)
    setAspectRatio('free')
  }

  // Apply filter preset
  const applyPreset = (preset: FilterPreset) => {
    setFilters(preset.filters)
  }

  // Update single filter
  const updateFilter = (key: keyof FilterSettings, value: number) => {
    setFilters((f) => ({ ...f, [key]: value }))
  }

  // Build CSS filter string
  const getCssFilter = () => {
    return `
      brightness(${filters.brightness}%)
      contrast(${filters.contrast}%)
      saturate(${filters.saturation}%)
      blur(${filters.blur}px)
      grayscale(${filters.grayscale}%)
      sepia(${filters.sepia}%)
    `.trim()
  }

  // Build CSS transform for flip
  const getTransform = () => {
    const scaleX = flipH ? -1 : 1
    const scaleY = flipV ? -1 : 1
    return `scale(${scaleX}, ${scaleY})`
  }

  // Get current aspect ratio value
  const currentAspectRatio = ASPECT_RATIOS.find((ar) => ar.key === aspectRatio)?.value

  // Save the edited image
  const handleSave = async () => {
    if (!croppedAreaPixels) {
      // If no crop area, use full image
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      onSave(
        {
          filters,
          rotation,
          flipH,
          flipV,
        },
        blob
      )
      return
    }

    // Create cropped image with filters
    const croppedBlob = await getCroppedImage(
      imageUrl,
      croppedAreaPixels,
      rotation,
      flipH,
      flipV,
      filters
    )

    onSave(
      {
        crop: {
          x: croppedAreaPixels.x,
          y: croppedAreaPixels.y,
          width: croppedAreaPixels.width,
          height: croppedAreaPixels.height,
        },
        filters,
        rotation,
        flipH,
        flipV,
      },
      croppedBlob
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('crop')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'crop'
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white'
            )}
          >
            <Crop className="w-4 h-4" />
            Beskjær
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('filter')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'filter'
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filter
          </button>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Check className="w-4 h-4" />
          Bruk
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Cropper */}
        <div
          className="absolute inset-0"
          style={{
            filter: getCssFilter(),
          }}
        >
          <div style={{ transform: getTransform(), width: '100%', height: '100%' }}>
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={currentAspectRatio}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              showGrid={activeTab === 'crop'}
              style={{
                containerStyle: {
                  background: '#000',
                },
                cropAreaStyle: {
                  border: activeTab === 'crop' ? '2px solid #fff' : 'none',
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="bg-gray-900 border-t border-gray-800">
        {activeTab === 'crop' ? (
          <div className="p-4 space-y-4">
            {/* Aspect ratio */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16">Format:</span>
              <div className="flex gap-1 flex-wrap">
                {ASPECT_RATIOS.map((ar) => {
                  const Icon = ar.icon
                  return (
                    <button
                      key={ar.key}
                      type="button"
                      onClick={() => setAspectRatio(ar.key)}
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
                        aspectRatio === ar.key
                          ? 'bg-white text-black'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      {ar.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Rotation and flip */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-16">Roter:</span>
                <button
                  type="button"
                  onClick={rotateLeft}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={rotateRight}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-12">Speil:</span>
                <button
                  type="button"
                  onClick={toggleFlipH}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    flipH
                      ? 'bg-white text-black'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  )}
                >
                  <FlipHorizontal className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={toggleFlipV}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    flipV
                      ? 'bg-white text-black'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  )}
                >
                  <FlipVertical className="w-5 h-5" />
                </button>
              </div>

              <button
                type="button"
                onClick={resetAll}
                className="ml-auto text-xs text-gray-500 hover:text-white transition-colors"
              >
                Nullstill alt
              </button>
            </div>

            {/* Zoom slider */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-16">Zoom:</span>
              <Slider
                value={[zoom]}
                onValueChange={([v]: number[]) => setZoom(v)}
                min={1}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <span className="text-xs text-gray-400 w-12 text-right">{zoom.toFixed(1)}x</span>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Filter presets */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {FILTER_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="flex-shrink-0 flex flex-col items-center gap-1"
                >
                  <div
                    className={cn(
                      'w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors',
                      JSON.stringify(filters) === JSON.stringify(preset.filters)
                        ? 'border-white'
                        : 'border-transparent'
                    )}
                  >
                    <img
                      src={imageUrl}
                      alt={preset.name}
                      className="w-full h-full object-cover"
                      style={{
                        filter: `
                          brightness(${preset.filters.brightness}%)
                          contrast(${preset.filters.contrast}%)
                          saturate(${preset.filters.saturation}%)
                          grayscale(${preset.filters.grayscale}%)
                          sepia(${preset.filters.sepia}%)
                        `,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{preset.name}</span>
                </button>
              ))}
            </div>

            {/* Manual adjustments */}
            <div className="space-y-3">
              <FilterSlider
                label="Lysstyrke"
                value={filters.brightness}
                onChange={(v) => updateFilter('brightness', v)}
                min={50}
                max={150}
                defaultValue={100}
              />
              <FilterSlider
                label="Kontrast"
                value={filters.contrast}
                onChange={(v) => updateFilter('contrast', v)}
                min={50}
                max={150}
                defaultValue={100}
              />
              <FilterSlider
                label="Metning"
                value={filters.saturation}
                onChange={(v) => updateFilter('saturation', v)}
                min={0}
                max={200}
                defaultValue={100}
              />
              <FilterSlider
                label="Svart/hvit"
                value={filters.grayscale}
                onChange={(v) => updateFilter('grayscale', v)}
                min={0}
                max={100}
                defaultValue={0}
              />
              <FilterSlider
                label="Sepia"
                value={filters.sepia}
                onChange={(v) => updateFilter('sepia', v)}
                min={0}
                max={100}
                defaultValue={0}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Filter slider component
interface FilterSliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  defaultValue: number
}

function FilterSlider({ label, value, onChange, min, max, defaultValue }: FilterSliderProps) {
  return (
    <div className="flex items-center gap-3">
      <Label className="text-xs text-gray-500 w-20">{label}</Label>
      <Slider
        value={[value]}
        onValueChange={([v]: number[]) => onChange(v)}
        min={min}
        max={max}
        step={1}
        className="flex-1"
      />
      <button
        type="button"
        onClick={() => onChange(defaultValue)}
        className={cn(
          'text-xs w-10 text-right transition-colors',
          value !== defaultValue ? 'text-blue-400 hover:text-blue-300' : 'text-gray-500'
        )}
      >
        {value}
      </button>
    </div>
  )
}

// Helper function to crop and apply filters to image
async function getCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number,
  flipH: boolean,
  flipV: boolean,
  filters: FilterSettings
): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  // Calculate bounding box of rotated image
  const rotRad = (rotation * Math.PI) / 180
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  )

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth
  canvas.height = bBoxHeight

  // Apply filters
  ctx.filter = `
    brightness(${filters.brightness}%)
    contrast(${filters.contrast}%)
    saturate(${filters.saturation}%)
    blur(${filters.blur}px)
    grayscale(${filters.grayscale}%)
    sepia(${filters.sepia}%)
  `

  // Translate canvas context to center for rotation
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
  ctx.translate(-image.width / 2, -image.height / 2)

  // Draw rotated image
  ctx.drawImage(image, 0, 0)

  // Extract the cropped area
  const croppedCanvas = document.createElement('canvas')
  const croppedCtx = croppedCanvas.getContext('2d')

  if (!croppedCtx) {
    throw new Error('Could not get cropped canvas context')
  }

  // Set cropped canvas size
  croppedCanvas.width = pixelCrop.width
  croppedCanvas.height = pixelCrop.height

  // Draw cropped area
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  // Convert to blob
  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Could not create blob'))
        }
      },
      'image/jpeg',
      0.92
    )
  })
}

// Create image element from source
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.crossOrigin = 'anonymous'
    image.src = url
  })
}

// Calculate size of image after rotation
function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = (rotation * Math.PI) / 180
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}
