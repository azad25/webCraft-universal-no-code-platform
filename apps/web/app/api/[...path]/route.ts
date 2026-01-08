import { NextRequest, NextResponse } from 'next/server'

// Try to determine the correct API URL
async function getApiBaseUrl(): Promise<string> {
  // If DOCKER_ENV is explicitly set, we're in Docker
  if (process.env.DOCKER_ENV === 'true') {
    return 'http://api:8000'
  }
  
  // Otherwise use the public API URL
  return process.env.NEXT_PUBLIC_API_URL || 'http://192.168.0.109:8000'
}

async function handler(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/')
  const apiBaseUrl = await getApiBaseUrl()
  
  // Don't add /api/v1/ prefix for health endpoint and other root endpoints
  const isRootEndpoint = ['health'].includes(path)
  const url = isRootEndpoint 
    ? `${apiBaseUrl}/${path}`
    : `${apiBaseUrl}/api/v1/${path}`
  
  console.log(`🔄 Proxying ${request.method} ${request.url} -> ${url}`)
  console.log('🔧 Environment:', {
    DOCKER_ENV: process.env.DOCKER_ENV,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    apiBaseUrl
  })
  
  try {
    const headers: Record<string, string> = {}
    
    // Copy relevant headers from the original request
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      headers['authorization'] = authHeader
    }
    
    const contentType = request.headers.get('content-type')
    if (contentType) {
      headers['content-type'] = contentType
    }
    
    // Get request body if it exists
    let body: string | undefined
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.text()
    }
    
    console.log('📤 Request details:', {
      method: request.method,
      url,
      headers,
      bodyLength: body?.length || 0
    })
    
    // Use fetch with explicit timeout and error handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    const response = await fetch(url, {
      method: request.method,
      headers,
      body,
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    
    const responseText = await response.text()
    
    console.log(`📡 API Response: ${response.status} ${response.statusText}`)
    console.log('📥 Response body:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''))
    
    return new NextResponse(responseText, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json',
      },
    })
  } catch (error) {
    console.error('🚨 API Proxy Error:', error)
    console.error('🚨 Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      cause: error instanceof Error ? error.cause : undefined,
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Check if it's a timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { 
          error: 'Request timeout', 
          details: 'The API request timed out after 30 seconds',
          url: url
        },
        { status: 504 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to proxy request', 
        details: error instanceof Error ? error.message : 'Unknown error',
        url: url
      },
      { status: 500 }
    )
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH }