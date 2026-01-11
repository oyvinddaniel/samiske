'use client'

import { useEffect, useState } from 'react'
import { ImageIcon, Video, Music, ExternalLink, Loader2 } from 'lucide-react'
import { getPortfolioItems, type PortfolioItem, type MediaType } from '@/lib/portfolio'
import Image from 'next/image'
import Link from 'next/link'

interface PortfolioGalleryProps {
  communityId: string
}

export function PortfolioGallery({ communityId }: PortfolioGalleryProps) {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null)

  useEffect(() => {
    const fetchItems = async () => {
      const data = await getPortfolioItems(communityId)
      setItems(data)
      setLoading(false)
    }

    fetchItems()
  }, [communityId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (items.length === 0) {
    return null
  }

  const getMediaTypeIcon = (mediaType: MediaType) => {
    switch (mediaType) {
      case 'image':
        return <ImageIcon className="w-4 h-4" />
      case 'video':
        return <Video className="w-4 h-4" />
      case 'audio':
        return <Music className="w-4 h-4" />
      case 'link':
        return <ExternalLink className="w-4 h-4" />
    }
  }

  return (
    <>
      <div className="space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Portefølje
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-blue-500 transition-all"
            >
              {item.media_type === 'image' ? (
                <Image
                  src={item.thumbnail_url || item.media_url}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                  <div className="text-white">
                    {getMediaTypeIcon(item.media_type)}
                  </div>
                </div>
              )}

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />

              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                {item.title}
              </div>

              <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5">
                {getMediaTypeIcon(item.media_type)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modal for viewing item details */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">{selectedItem.title}</h3>
                  {selectedItem.description && (
                    <p className="text-gray-600 mt-2">{selectedItem.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Media content */}
              <div className="rounded-lg overflow-hidden bg-gray-100">
                {selectedItem.media_type === 'image' && (
                  <div className="relative aspect-video">
                    <Image
                      src={selectedItem.media_url}
                      alt={selectedItem.title}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}

                {selectedItem.media_type === 'video' && (
                  <div className="aspect-video">
                    {selectedItem.media_url.includes('youtube.com') || selectedItem.media_url.includes('youtu.be') ? (
                      <iframe
                        src={selectedItem.media_url.replace('watch?v=', 'embed/')}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : selectedItem.media_url.includes('vimeo.com') ? (
                      <iframe
                        src={selectedItem.media_url.replace('vimeo.com/', 'player.vimeo.com/video/')}
                        className="w-full h-full"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={selectedItem.media_url}
                        controls
                        className="w-full h-full"
                      />
                    )}
                  </div>
                )}

                {selectedItem.media_type === 'audio' && (
                  <div className="p-8 flex items-center justify-center">
                    <audio
                      src={selectedItem.media_url}
                      controls
                      className="w-full max-w-md"
                    />
                  </div>
                )}

                {selectedItem.media_type === 'link' && selectedItem.external_link && (
                  <div className="p-8 text-center">
                    <Link
                      href={selectedItem.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Åpne ekstern lenke
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
