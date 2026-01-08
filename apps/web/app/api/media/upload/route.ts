import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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

// Helper function to determine file type from mime type
function getFileType(mimeType: string): MediaFile['type'] {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive'
  return 'other'
}

// Helper function to generate thumbnail for images
async function generateThumbnail(filePath: string, mimeType: string): Promise<string | undefined> {
  if (!mimeType.startsWith('image/')) return undefined
  
  // In a real implementation, you would use a library like Sharp to generate thumbnails
  // For now, we'll just return the original image URL
  return filePath.replace('/uploads/', '/api/media/thumbnails/')
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || ''
    const appId = formData.get('appId') as string || 'default'
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Create upload directory structure
    const uploadDir = join(process.cwd(), 'public', 'uploads', appId, folder)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = join(uploadDir, fileName)
    
    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Generate file URL
    const fileUrl = `/uploads/${appId}/${folder ? folder + '/' : ''}${fileName}`
    
    // Generate thumbnail if it's an image
    const thumbnailUrl = await generateThumbnail(fileUrl, file.type)

    // Create media file object
    const mediaFile: MediaFile = {
      id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: getFileType(file.type),
      mimeType: file.type,
      size: file.size,
      url: fileUrl,
      thumbnailUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      folder: folder || undefined,
      alt: file.name.split('.')[0], // Use filename without extension as default alt
      description: `Uploaded file: ${file.name}`
    }

    // In a real implementation, you would save this to a database
    // For now, we'll just return the file info
    
    return NextResponse.json(mediaFile)
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}