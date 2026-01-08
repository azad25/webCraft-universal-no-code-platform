'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { MediaManager } from '../admin/media-manager'
import { Upload, Link, Image, Video, Music, FileText } from 'lucide-react'

interface MediaPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (url: string, file?: any) => void
  acceptedTypes?: string[]
  title?: string
  description?: string
  currentValue?: string
}

export function MediaPicker({
  isOpen,
  onClose,
  onSelect,
  acceptedTypes = ['image/*', 'video/*'],
  title = 'Select Media',
  description = 'Choose from your media library or enter a URL',
  currentValue = ''
}: MediaPickerProps) {
  const [urlInput, setUrlInput] = useState(currentValue)
  const [activeTab, setActiveTab] = useState<'library' | 'url'>('library')

  const handleMediaSelect = (file: any) => {
    onSelect(file.url, file)
    onClose()
  }

  const handleUrlSelect = () => {
    if (urlInput.trim()) {
      onSelect(urlInput.trim())
      onClose()
    }
  }

  const getAcceptedTypeIcon = () => {
    if (acceptedTypes.includes('image/*')) return Image
    if (acceptedTypes.includes('video/*')) return Video
    if (acceptedTypes.includes('audio/*')) return Music
    return FileText
  }

  const AcceptedIcon = getAcceptedTypeIcon()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AcceptedIcon className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library" className="gap-2">
              <Upload className="w-4 h-4" />
              Media Library
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-2">
              <Link className="w-4 h-4" />
              URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="flex-1 mt-4">
            <div className="h-full">
              <MediaManager
                isOpen={true}
                onSelect={handleMediaSelect}
                acceptedTypes={acceptedTypes}
                allowMultiple={false}
              />
            </div>
          </TabsContent>

          <TabsContent value="url" className="flex-1 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="media-url">Media URL</Label>
                <Input
                  id="media-url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="mt-1"
                />
              </div>

              {urlInput && (
                <div className="border rounded-lg p-4">
                  <Label className="text-sm font-medium">Preview</Label>
                  <div className="mt-2">
                    {acceptedTypes.includes('image/*') && urlInput.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img
                        src={urlInput}
                        alt="Preview"
                        className="max-w-full h-32 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : acceptedTypes.includes('video/*') && urlInput.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video
                        src={urlInput}
                        className="max-w-full h-32 object-cover rounded"
                        controls
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-4 bg-muted rounded">
                        <AcceptedIcon className="w-6 h-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {urlInput}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleUrlSelect} disabled={!urlInput.trim()}>
                  Use URL
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}