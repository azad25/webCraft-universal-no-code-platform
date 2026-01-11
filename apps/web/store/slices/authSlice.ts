/**
 * Authentication State Slice
 * Manages user authentication, tokens, and session
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { apiClient } from '@/lib/api-client'

// Types
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

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  isInitialized: boolean
}

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  email: string
  username: string
  password: string
  fullName?: string
  termsAccepted: boolean
}

interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: User
}

// Initial state
const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false
}

// Async thunks
export const login = createAsyncThunk<AuthResponse, LoginCredentials>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/login', credentials)
      
      // Map API response to expected format
      const authResponse: AuthResponse = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        tokenType: response.data.token_type,
        expiresIn: response.data.expires_in,
        user: {
          id: response.data.user.id,
          email: response.data.user.email,
          username: response.data.user.username,
          fullName: response.data.user.full_name,
          avatarUrl: response.data.user.avatar_url,
          isVerified: response.data.user.is_verified,
          isPremium: response.data.user.is_premium,
          subscriptionTier: response.data.user.subscription_tier,
          createdAt: response.data.user.created_at
        }
      }
      
      // Store tokens in localStorage for persistence
      localStorage.setItem('accessToken', authResponse.accessToken)
      localStorage.setItem('refreshToken', authResponse.refreshToken)
      
      return authResponse
    } catch (error: any) {
      return rejectWithValue(error.message || error.response?.data?.detail || 'Login failed')
    }
  }
)

export const register = createAsyncThunk<AuthResponse, RegisterData>(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/register', {
        email: data.email,
        username: data.username,
        password: data.password,
        full_name: data.fullName,
        terms_accepted: data.termsAccepted
      })
      
      // Map API response to expected format
      const authResponse: AuthResponse = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        tokenType: response.data.token_type,
        expiresIn: response.data.expires_in,
        user: {
          id: response.data.user.id,
          email: response.data.user.email,
          username: response.data.user.username,
          fullName: response.data.user.full_name,
          avatarUrl: response.data.user.avatar_url,
          isVerified: response.data.user.is_verified,
          isPremium: response.data.user.is_premium,
          subscriptionTier: response.data.user.subscription_tier,
          createdAt: response.data.user.created_at
        }
      }
      
      localStorage.setItem('accessToken', authResponse.accessToken)
      localStorage.setItem('refreshToken', authResponse.refreshToken)
      
      return authResponse
    } catch (error: any) {
      return rejectWithValue(error.message || error.response?.data?.detail || 'Registration failed')
    }
  }
)

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }
)

export const refreshAccessToken = createAsyncThunk<AuthResponse, void>(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      
      if (!refreshToken) {
        throw new Error('No refresh token')
      }
      
      const response = await apiClient.post('/auth/refresh', {
        refresh_token: refreshToken
      })
      
      // Map API response to expected format
      const authResponse: AuthResponse = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        tokenType: response.data.token_type,
        expiresIn: response.data.expires_in,
        user: response.data.user
      }
      
      localStorage.setItem('accessToken', authResponse.accessToken)
      localStorage.setItem('refreshToken', authResponse.refreshToken)
      
      return authResponse
    } catch (error: any) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      return rejectWithValue('Session expired')
    }
  }
)

export const fetchCurrentUser = createAsyncThunk<User, void>(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<User>('/auth/me')
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch user')
    }
  }
)

export const initializeAuth = createAsyncThunk<User | null, void>(
  'auth/initialize',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const accessToken = localStorage.getItem('accessToken')
      
      if (!accessToken) {
        return null
      }
      
      // Try to fetch current user
      const response = await apiClient.get<User>('/auth/me')
      return response.data
    } catch (error: any) {
      // Try to refresh token
      try {
        await dispatch(refreshAccessToken()).unwrap()
        const response = await apiClient.get<User>('/auth/me')
        return response.data
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        return null
      }
    }
  }
)

export const updateProfile = createAsyncThunk<User, Partial<User>>(
  'auth/updateProfile',
  async (data, { rejectWithValue }) => {
    try {
      const response = await apiClient.put<User>('/auth/me', data)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update profile')
    }
  }
)

export const changePassword = createAsyncThunk<void, { currentPassword: string; newPassword: string }>(
  'auth/changePassword',
  async (data, { rejectWithValue }) => {
    try {
      await apiClient.post('/auth/change-password', {
        current_password: data.currentPassword,
        new_password: data.newPassword
      })
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to change password')
    }
  }
)

// OAuth thunks
export const loginWithGoogle = createAsyncThunk<AuthResponse, string>(
  'auth/loginWithGoogle',
  async (code, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/oauth/callback', {
        provider: 'google',
        code,
        state: localStorage.getItem('oauth_state')
      })
      
      // Map API response to expected format
      const authResponse: AuthResponse = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        tokenType: response.data.token_type,
        expiresIn: response.data.expires_in,
        user: response.data.user
      }
      
      localStorage.setItem('accessToken', authResponse.accessToken)
      localStorage.setItem('refreshToken', authResponse.refreshToken)
      localStorage.removeItem('oauth_state')
      
      return authResponse
    } catch (error: any) {
      return rejectWithValue(error.message || error.response?.data?.detail || 'Google login failed')
    }
  }
)

export const loginWithApple = createAsyncThunk<AuthResponse, { code: string; idToken: string }>(
  'auth/loginWithApple',
  async ({ code, idToken }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/oauth/callback', {
        provider: 'apple',
        code,
        id_token: idToken,
        state: localStorage.getItem('oauth_state')
      })
      
      // Map API response to expected format
      const authResponse: AuthResponse = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        tokenType: response.data.token_type,
        expiresIn: response.data.expires_in,
        user: response.data.user
      }
      
      localStorage.setItem('accessToken', authResponse.accessToken)
      localStorage.setItem('refreshToken', authResponse.refreshToken)
      localStorage.removeItem('oauth_state')
      
      return authResponse
    } catch (error: any) {
      return rejectWithValue(error.message || error.response?.data?.detail || 'Apple login failed')
    }
  }
)

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.isAuthenticated = true
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    }
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
    
    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
    
    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.accessToken = null
        state.refreshToken = null
        state.isAuthenticated = false
        state.error = null
      })
    
    // Refresh token
    builder
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken
        state.user = action.payload.user
        state.isAuthenticated = true
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.user = null
        state.accessToken = null
        state.refreshToken = null
        state.isAuthenticated = false
      })
    
    // Initialize auth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false
        state.isInitialized = true
        if (action.payload) {
          state.user = action.payload
          state.isAuthenticated = true
          state.accessToken = localStorage.getItem('accessToken')
          state.refreshToken = localStorage.getItem('refreshToken')
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false
        state.isInitialized = true
        state.isAuthenticated = false
      })
    
    // Update profile
    builder
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload
      })
    
    // OAuth logins
    builder
      .addCase(loginWithGoogle.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
    
    builder
      .addCase(loginWithApple.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginWithApple.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken
      })
      .addCase(loginWithApple.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  }
})

export const { clearError, setTokens, updateUser } = authSlice.actions
export default authSlice.reducer

// Selectors
export const selectUser = (state: { auth: AuthState }) => state.auth.user
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error
export const selectIsInitialized = (state: { auth: AuthState }) => state.auth.isInitialized
export const selectIsPremium = (state: { auth: AuthState }) => state.auth.user?.isPremium ?? false