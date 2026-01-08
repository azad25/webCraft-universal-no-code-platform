import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/')
    
    // In a real implementation, you would generate thumbnails using Sharp or similar
    // For now, we'll just serve the original image with cache headers
    
    const fullPath = join(process.cwd(), 'public', 'uploads', filePath)
    
    if (!existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'Thumbnail not found' },
        { status: 404 }
      )
    }

    const fileBuffer = await readFile(fullPath)
    const mimeType = getMimeType(filePath)
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving thumbnail:', error)
    return NextResponse.json(
      { error: 'Failed to serve thumbnail' },
      { status: 500 }
    )
  }
}

function getMimeType(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase()
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    case 'svg':
      return 'image/svg+xml'
    default:
      return 'application/octet-stream'
  }
}