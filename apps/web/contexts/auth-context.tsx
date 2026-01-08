'use client'

import React, { createContext, useContext, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  login,
  register,
  logout,
  initializeAuth,
  loginWithGoogle,
  loginWithApple,
  updateProfile,
  changePassword,
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectAuthError,
  selectIsInitialized,
  selectIsPremium,
  clearError
} from '@/store/slices/authSlice'
import { addToast } from '@/store/slices/uiSlice'

interface User {
  id: string
  email: string
  username: string
  fullName: string | null
  avatarUrl: string | null
  isVerified: boolean
  isPremium: boolean
  subscriptionTier: 'free' | 'pro' | 'enterprise'
  createdAt: string
}

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  isPremium: boolean
  error: string | null
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    email: string
    username: string
    password: string
    fullName?: string
  }) => Promise<void>
  logout: () => Promise<void>
  loginWithGoogle: (code: string) => Promise<void>
  loginWithApple: (code: string, idToken: string) => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  clearError: () => void
  
  // OAuth URLs
  getGoogleAuthUrl: () => Promise<string>
  getAppleAuthUrl: () => Promise<string>
  getGitHubAuthUrl: () => Promise<string>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  
  const user = useAppSelector(selectUser)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const isLoading = useAppSelector(selectIsLoading)
  const isInitialized = useAppSelector(selectIsInitialized)
  const isPremium = useAppSelector(selectIsPremium)
  const error = useAppSelector(selectAuthError)
  
  // Initialize auth on mount
  useEffect(() => {
    dispatch(initializeAuth())
  }, [dispatch])
  
  // Login
  const handleLogin = useCallback(async (email: string, password: string) => {
    try {
      await dispatch(login({ email, password })).unwrap()
      
      dispatch(addToast({
        type: 'success',
        title: 'Welcome back!',
        message: 'You have successfully logged in.'
      }))
      
      router.push('/dashboard')
    } catch (error: any) {
      dispatch(addToast({
        type: 'error',
        title: 'Login failed',
        message: error || 'Please check your credentials and try again.'
      }))
      throw error
    }
  }, [dispatch, router])
  
  // Register
  const handleRegister = useCallback(async (data: {
    email: string
    username: string
    password: string
    fullName?: string
  }) => {
    try {
      await dispatch(register({
        ...data,
        termsAccepted: true
      })).unwrap()
      
      dispatch(addToast({
        type: 'success',
        title: 'Account created!',
        message: 'Please check your email to verify your account.'
      }))
      
      router.push('/dashboard')
    } catch (error: any) {
      dispatch(addToast({
        type: 'error',
        title: 'Registration failed',
        message: error || 'Please try again.'
      }))
      throw error
    }
  }, [dispatch, router])
  
  // Logout
  const handleLogout = useCallback(async () => {
    try {
      await dispatch(logout()).unwrap()
      
      dispatch(addToast({
        type: 'info',
        title: 'Logged out',
        message: 'You have been logged out successfully.'
      }))
      
      router.push('/')
    } catch (error) {
      // Still redirect even if API call fails
      router.push('/')
    }
  }, [dispatch, router])
  
  // Google OAuth
  const handleLoginWithGoogle = useCallback(async (code: string) => {
    try {
      await dispatch(loginWithGoogle(code)).unwrap()
      
      dispatch(addToast({
        type: 'success',
        title: 'Welcome!',
        message: 'You have successfully logged in with Google.'
      }))
      
      router.push('/dashboard')
    } catch (error: any) {
      dispatch(addToast({
        type: 'error',
        title: 'Google login failed',
        message: error || 'Please try again.'
      }))
      throw error
    }
  }, [dispatch, router])
  
  // Apple OAuth
  const handleLoginWithApple = useCallback(async (code: string, idToken: string) => {
    try {
      await dispatch(loginWithApple({ code, idToken })).unwrap()
      
      dispatch(addToast({
        type: 'success',
        title: 'Welcome!',
        message: 'You have successfully logged in with Apple.'
      }))
      
      router.push('/dashboard')
    } catch (error: any) {
      dispatch(addToast({
        type: 'error',
        title: 'Apple login failed',
        message: error || 'Please try again.'
      }))
      throw error
    }
  }, [dispatch, router])
  
  // Update profile
  const handleUpdateProfile = useCallback(async (data: Partial<User>) => {
    try {
      await dispatch(updateProfile(data)).unwrap()
      
      dispatch(addToast({
        type: 'success',
        title: 'Profile updated',
        message: 'Your profile has been updated successfully.'
      }))
    } catch (error: any) {
      dispatch(addToast({
        type: 'error',
        title: 'Update failed',
        message: error || 'Please try again.'
      }))
      throw error
    }
  }, [dispatch])
  
  // Change password
  const handleChangePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      await dispatch(changePassword({ currentPassword, newPassword })).unwrap()
      
      dispatch(addToast({
        type: 'success',
        title: 'Password changed',
        message: 'Your password has been changed successfully.'
      }))
    } catch (error: any) {
      dispatch(addToast({
        type: 'error',
        title: 'Password change failed',
        message: error || 'Please check your current password and try again.'
      }))
      throw error
    }
  }, [dispatch])
  
  // Clear error
  const handleClearError = useCallback(() => {
    dispatch(clearError())
  }, [dispatch])
  
  // Get OAuth URLs
  const getGoogleAuthUrl = useCallback(async () => {
    const response = await fetch(`/api/v1/auth/oauth/google/url`)
    const data = await response.json()
    localStorage.setItem('oauth_state', data.state)
    return data.authorization_url
  }, [])
  
  const getAppleAuthUrl = useCallback(async () => {
    const response = await fetch(`/api/v1/auth/oauth/apple/url`)
    const data = await response.json()
    localStorage.setItem('oauth_state', data.state)
    return data.authorization_url
  }, [])
  
  const getGitHubAuthUrl = useCallback(async () => {
    const response = await fetch(`/api/v1/auth/oauth/github/url`)
    const data = await response.json()
    localStorage.setItem('oauth_state', data.state)
    return data.authorization_url
  }, [])
  
  const value: AuthContextValue = {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    isPremium,
    error,
    
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    loginWithGoogle: handleLoginWithGoogle,
    loginWithApple: handleLoginWithApple,
    updateProfile: handleUpdateProfile,
    changePassword: handleChangePassword,
    clearError: handleClearError,
    
    getGoogleAuthUrl,
    getAppleAuthUrl,
    getGitHubAuthUrl
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}