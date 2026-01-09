/**
 * Development Authentication Utilities
 * Provides consistent user simulation in development mode
 */

export function getDevToken(): string {
  if (process.env.NODE_ENV !== 'development') {
    return ''
  }

  // Get or create a user-specific dev token based on browser session
  let devUserId = localStorage.getItem('dev-user-id')
  if (!devUserId) {
    // Create a random user ID for this browser session
    devUserId = Math.random().toString(36).substring(2, 8)
    localStorage.setItem('dev-user-id', devUserId)
    console.log(`🔧 Created new dev user ID: ${devUserId}`)
  }

  return `dev-bypass-token-${devUserId}`
}

export function getAuthToken(): string {
  // Always check localStorage first for real tokens from login
  const accessToken = localStorage.getItem('accessToken')
  if (accessToken) {
    return accessToken
  }

  // No fallback token - let the real login system work
  return ''
}

export function useAdminTestUser(): void {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('useAdminTestUser only works in development mode')
    return
  }

  localStorage.setItem('use-admin-token', 'true')
  console.log('🔧 Switched to admin@test.com user')
  
  // Reload the page to apply the new user context
  window.location.reload()
}

export function useDevUser(): void {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('useDevUser only works in development mode')
    return
  }

  localStorage.removeItem('use-admin-token')
  console.log('🔧 Switched back to dev user')
  
  // Reload the page to apply the new user context
  window.location.reload()
}

export function switchDevUser(userId?: string): void {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('switchDevUser only works in development mode')
    return
  }

  if (userId) {
    localStorage.setItem('dev-user-id', userId)
  } else {
    // Generate new random user ID
    const newUserId = Math.random().toString(36).substring(2, 8)
    localStorage.setItem('dev-user-id', newUserId)
  }

  console.log(`🔧 Switched to dev user: ${localStorage.getItem('dev-user-id')}`)
  
  // Reload the page to apply the new user context
  window.location.reload()
}

export function getCurrentDevUserId(): string | null {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  return localStorage.getItem('dev-user-id')
}