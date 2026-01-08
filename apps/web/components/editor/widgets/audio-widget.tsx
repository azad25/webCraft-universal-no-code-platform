'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Edit2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

interface AudioWidgetProps {
  src?: string
  title?: string
  artist?: string
  coverImage?: string
  variant?: 'minimal' | 'full' | 'compact'
  autoplay?: boolean
  loop?: boolean
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: Partial<AudioWidgetProps>) => void
}

export function AudioWidget({
  src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  title = 'Sample Track',
  artist = 'Unknown Artist',
  coverImage = '',
  variant = 'full',
  autoplay = false,
  loop = false,
  isEditing = false,
  isPreview = false,
  onChange
}: AudioWidgetProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const handleSeek = (value: number[]) => {
    const newTime = value[0]
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (isEditing) {
    return (
      <div className="p-4 border rounded-lg space-y-4">
        <div className="space-y-2">
          <Label>Audio Source URL</Label>
          <Input
            value={src}
            onChange={(e) => onChange?.({ src: e.target.value })}
            placeholder="https://example.com/audio.mp3"
          />
        </div>
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => onChange?.({ title: e.target.value })}
            placeholder="Track Title"
          />
        </div>
        <div className="space-y-2">
          <Label>Artist</Label>
          <Input
            value={artist}
            onChange={(e) => onChange?.({ artist: e.target.value })}
            placeholder="Artist Name"
          />
        </div>
        <div className="space-y-2">
          <Label>Cover Image URL</Label>
          <Input
            value={coverImage}
            onChange={(e) => onChange?.({ coverImage: e.target.value })}
            placeholder="https://example.com/cover.jpg"
          />
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "bg-card rounded-lg p-4",
      variant === 'minimal' && "p-2",
      variant === 'compact' && "p-3"
    )}>
      <audio ref={audioRef} src={src} loop={loop} autoPlay={autoplay} />

      <div className="flex items-center gap-4">
        {variant === 'full' && coverImage && (
          <img src={coverImage} alt={title} className="w-16 h-16 rounded object-cover" />
        )}

        <div className="flex-1">
          {variant !== 'minimal' && (
            <div className="mb-2">
              <h4 className="font-medium">{title}</h4>
              <p className="text-sm text-muted-foreground">{artist}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={togglePlay}>
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>

            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="flex-1"
            />

            <span className="text-xs text-muted-foreground min-w-[80px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {variant === 'full' && (
              <>
                <Button size="sm" variant="ghost" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>

                <Slider
                  value={[volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
