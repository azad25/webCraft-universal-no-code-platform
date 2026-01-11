'use client'

import { useState, useRef, useEffect } from 'react'
import { m } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Settings,
  Youtube,
  Video,
  Upload,
  Link as LinkIcon,
  X
} from 'lucide-react'

interface VideoWidgetProps {
  // Video source
  videoType?: 'youtube' | 'vimeo' | 'file' | 'url'
  src?: string
  youtubeId?: string
  vimeoId?: string
  
  // Display options
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  controls?: boolean
  poster?: string
  
  // Styling
  aspectRatio?: '16:9' | '4:3' | '1:1' | '9:16' | 'auto'
  borderRadius?: string
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  
  // Editor
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

const SHADOW_CLASSES = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl'
}

const ASPECT_RATIOS = {
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  '1:1': 'aspect-square',
  '9:16': 'aspect-[9/16]',
  'auto': ''
}

// Extract YouTube video ID from various URL formats
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// Extract Vimeo video ID
function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/)
  return match ? match[1] : null
}

export function VideoWidget({
  videoType = 'youtube',
  src,
  youtubeId,
  vimeoId,
  autoplay = false,
  muted = false,
  loop = false,
  controls = true,
  poster,
  aspectRatio = '16:9',
  borderRadius = '8px',
  shadow = 'md',
  isEditing,
  isPreview,
  onChange
}: VideoWidgetProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(muted)
  const [showEditModal, setShowEditModal] = useState(false)
  const [inputUrl, setInputUrl] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)

  // Determine the actual video ID/source
  const resolvedYoutubeId = youtubeId || (src ? extractYouTubeId(src) : null)
  const resolvedVimeoId = vimeoId || (src ? extractVimeoId(src) : null)

  // Handle URL input
  const handleUrlSubmit = () => {
    if (!inputUrl || !onChange) return

    const ytId = extractYouTubeId(inputUrl)
    const vimeoIdExtracted = extractVimeoId(inputUrl)

    if (ytId) {
      onChange({ videoType: 'youtube', youtubeId: ytId, src: inputUrl })
    } else if (vimeoIdExtracted) {
      onChange({ videoType: 'vimeo', vimeoId: vimeoIdExtracted, src: inputUrl })
    } else {
      onChange({ videoType: 'url', src: inputUrl })
    }
    
    setShowEditModal(false)
    setInputUrl('')
  }

  // Native video controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  // Render YouTube embed
  const renderYouTubeEmbed = () => {
    if (!resolvedYoutubeId) return null

    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      mute: muted ? '1' : '0',
      loop: loop ? '1' : '0',
      controls: controls ? '1' : '0',
      rel: '0',
      modestbranding: '1',
      playsinline: '1'
    })

    if (loop) {
      params.set('playlist', resolvedYoutubeId)
    }

    return (
      <iframe
        src={`https://www.youtube.com/embed/${resolvedYoutubeId}?${params.toString()}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
        style={{ borderRadius }}
      />
    )
  }

  // Render Vimeo embed
  const renderVimeoEmbed = () => {
    if (!resolvedVimeoId) return null

    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      muted: muted ? '1' : '0',
      loop: loop ? '1' : '0',
      controls: controls ? '1' : '0',
      dnt: '1'
    })

    return (
      <iframe
        src={`https://player.vimeo.com/video/${resolvedVimeoId}?${params.toString()}`}
        title="Vimeo video player"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
        style={{ borderRadius }}
      />
    )
  }

  // Render native video player
  const renderNativeVideo = () => {
    if (!src) return null

    return (
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoplay}
        muted={muted}
        loop={loop}
        controls={controls}
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ borderRadius }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    )
  }

  // Render placeholder when no video
  const renderPlaceholder = () => (
    <div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-muted border-2 border-dashed border-muted-foreground/30"
      style={{ borderRadius }}
    >
      <Video className="w-16 h-16 text-muted-foreground/40 mb-4" />
      <p className="text-muted-foreground text-sm mb-4">No video selected</p>
      {isEditing && (
        <Button 
          size="sm" 
          variant="secondary"
          onClick={() => setShowEditModal(true)}
        >
          <Upload className="w-4 h-4 mr-2" />
          Add Video
        </Button>
      )}
    </div>
  )

  // Determine what to render
  const hasVideo = resolvedYoutubeId || resolvedVimeoId || (videoType === 'file' && src) || (videoType === 'url' && src)

  return (
    <div className="w-full px-4 py-6">
      <div
        className={cn(
          "relative w-full overflow-hidden",
          ASPECT_RATIOS[aspectRatio],
          SHADOW_CLASSES[shadow]
        )}
        style={{ borderRadius }}
      >
        {/* Video Content */}
        {!hasVideo && renderPlaceholder()}
        
        {hasVideo && videoType === 'youtube' && renderYouTubeEmbed()}
        {hasVideo && videoType === 'vimeo' && renderVimeoEmbed()}
        {hasVideo && (videoType === 'file' || videoType === 'url') && renderNativeVideo()}
        
        {/* Auto-detect from src */}
        {hasVideo && !videoType && resolvedYoutubeId && renderYouTubeEmbed()}
        {hasVideo && !videoType && resolvedVimeoId && renderVimeoEmbed()}

        {/* Edit Overlay */}
        {isEditing && hasVideo && (
          <m.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 z-10"
          >
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => setShowEditModal(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Change Video
            </Button>
          </m.div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowEditModal(false)}
        >
          <m.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Add Video</h3>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowEditModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Video Type Tabs */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors",
                  "hover:border-primary/50",
                  videoType === 'youtube' ? "border-primary bg-primary/5" : "border-muted"
                )}
                onClick={() => onChange?.({ videoType: 'youtube' })}
              >
                <Youtube className="w-6 h-6 text-red-500" />
                <span className="text-xs font-medium">YouTube</span>
              </button>
              <button
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors",
                  "hover:border-primary/50",
                  videoType === 'vimeo' ? "border-primary bg-primary/5" : "border-muted"
                )}
                onClick={() => onChange?.({ videoType: 'vimeo' })}
              >
                <Video className="w-6 h-6 text-blue-500" />
                <span className="text-xs font-medium">Vimeo</span>
              </button>
              <button
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors",
                  "hover:border-primary/50",
                  videoType === 'url' ? "border-primary bg-primary/5" : "border-muted"
                )}
                onClick={() => onChange?.({ videoType: 'url' })}
              >
                <LinkIcon className="w-6 h-6 text-green-500" />
                <span className="text-xs font-medium">URL</span>
              </button>
            </div>

            {/* URL Input */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {videoType === 'youtube' && 'YouTube URL or Video ID'}
                  {videoType === 'vimeo' && 'Vimeo URL or Video ID'}
                  {videoType === 'url' && 'Video URL (MP4, WebM)'}
                  {!videoType && 'Video URL'}
                </label>
                <Input
                  placeholder={
                    videoType === 'youtube' 
                      ? 'https://youtube.com/watch?v=... or video ID'
                      : videoType === 'vimeo'
                      ? 'https://vimeo.com/...'
                      : 'https://example.com/video.mp4'
                  }
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                />
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={autoplay}
                    onChange={(e) => onChange?.({ autoplay: e.target.checked })}
                    className="rounded"
                  />
                  Autoplay
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={muted}
                    onChange={(e) => onChange?.({ muted: e.target.checked })}
                    className="rounded"
                  />
                  Muted
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={loop}
                    onChange={(e) => onChange?.({ loop: e.target.checked })}
                    className="rounded"
                  />
                  Loop
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={controls}
                    onChange={(e) => onChange?.({ controls: e.target.checked })}
                    className="rounded"
                  />
                  Show Controls
                </label>
              </div>

              <Button 
                className="w-full" 
                onClick={handleUrlSubmit}
                disabled={!inputUrl}
              >
                Add Video
              </Button>
            </div>
          </m.div>
        </m.div>
      )}
    </div>
  )
}
