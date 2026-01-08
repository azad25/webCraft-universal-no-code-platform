import { NextRequest, NextResponse } from 'next/server'

interface MediaFile {
  id: string
  name: string
  type: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other'
  mimeType: string
  size: number
  url: string
  thumbnailUrl?: string
  createdAt: string
  updatedAt: string
  folder?: string
  alt?: string
  description?: string
}

// Mock data - replace with actual database calls
let mediaFiles: MediaFile[] = [
  {
    id: '1',
    name: 'hero-image.jpg',
    type: 'image',
    mimeType: 'image/jpeg',
    size: 1024000,
    url: '/api/media/files/hero-image.jpg',
    thumbnailUrl: '/api/media/thumbnails/hero-image.jpg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    folder: '',
    alt: 'Hero image',
    description: 'Main hero image for landing page'
  },
  {
    id: '2',
    name: 'product-demo.mp4',
    type: 'video',
    mimeType: 'video/mp4',
    size: 5120000,
    url: '/api/media/files/product-demo.mp4',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    folder: 'videos',
    description: 'Product demonstration video'
  }
]

let folders: string[] = ['images', 'videos', 'documents']

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder') || ''
    const appId = searchParams.get('appId')
    
    // Filter files by folder
    const filteredFiles = mediaFiles.filter(file => 
      (file.folder || '') === folder
    )
    
    // Filter folders to show only immediate children
    const filteredFolders = folders.filter(f => {
      if (!folder) {
        return !f.includes('/')
      }
      return f.startsWith(folder + '/') && 
             f.substring(folder.length + 1).indexOf('/') === -1
    })
    
    return NextResponse.json({
      files: filteredFiles,
      folders: filteredFolders,
      total: filteredFiles.length
    })
  } catch (error) {
    console.error('Error fetching media files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media files' },
      { status: 500 }
    )
  }
}