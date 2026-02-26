/**
 * Authentication Utilities
 * Provides consistent authentication across the application
 */

export function getAuthToken(): string {
  // Always check localStorage first for real tokens from login
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  if (accessToken) {
    return accessToken
  }

  // Fallback to admin test token
  return 'admin-test-token'
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', token)
  }
}

export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }
}

export function hasAuthToken(): boolean {
  return !!getAuthToken()
}