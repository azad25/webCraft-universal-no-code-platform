import { NextRequest, NextResponse } from 'next/server'
import { mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const { name, parent, appId } = await request.json()
    
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      )
    }

    // Sanitize folder name
    const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '_')
    const folderPath = parent ? `${parent}/${sanitizedName}` : sanitizedName
    
    // Create physical folder
    const uploadDir = join(process.cwd(), 'public', 'uploads', appId || 'default', folderPath)
    await mkdir(uploadDir, { recursive: true })
    
    // In a real implementation, you would save folder info to database
    
    return NextResponse.json({
      success: true,
      folder: {
        name: sanitizedName,
        path: folderPath,
        parent: parent || null,
        createdAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const folderPath = searchParams.get('path')
    const appId = searchParams.get('appId')
    
    if (!folderPath) {
      return NextResponse.json(
        { error: 'Folder path is required' },
        { status: 400 }
      )
    }

    // In a real implementation, you would:
    // 1. Check if folder is empty or handle files inside
    // 2. Remove physical folder
    // 3. Update database
    
    console.log(`Deleting folder: ${folderPath} for app: ${appId}`)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting folder:', error)
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    )
  }
}