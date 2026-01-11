/**
 * API Client with Axios
 * Centralized HTTP client with interceptors, retry logic, and error handling
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import { getAuthToken } from './dev-auth'

// Types
interface RetryConfig {
  retries: number
  retryDelay: number
  retryCondition: (error: AxiosError) => boolean
}

interface ApiClientConfig {
  baseURL: string
  timeout: number
  retry: RetryConfig
}

// Default configuration
const defaultConfig: ApiClientConfig = {
  baseURL: '/api/v2', // Use V2 API by default
  timeout: 30000,
  retry: {
    retries: 3,
    retryDelay: 1000,
    retryCondition: (error: AxiosError) => {
      // Retry on network errors or 5xx errors
      return !error.response || (error.response.status >= 500 && error.response.status < 600)
    }
  }
}

// Create axios instance
const createApiClient = (config: Partial<ApiClientConfig> = {}): AxiosInstance => {
  const mergedConfig = { ...defaultConfig, ...config }
  
  const instance = axios.create({
    baseURL: mergedConfig.baseURL,
    timeout: mergedConfig.timeout,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  })
  
  // Request interceptor
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Debug: Log the request URL
      if (process.env.NODE_ENV === 'development') {
        console.log('API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          fullURL: `${config.baseURL}${config.url}`
        })
      }
      
      // Add auth token (but not for auth endpoints)
      const isAuthEndpoint = config.url?.includes('/auth/login') || 
                            config.url?.includes('/auth/register') || 
                            config.url?.includes('/auth/refresh')
      
      if (!isAuthEndpoint) {
        let token = typeof window !== 'undefined' ? getAuthToken() : null
        
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
          console.log('🔑 Added auth token:', token.substring(0, 10) + '...')
        } else {
          console.log('❌ No auth token available')
        }
      }
      
      // Add correlation ID for request tracing
      config.headers['X-Correlation-ID'] = generateCorrelationId()
      
      // Add timestamp
      config.headers['X-Request-Time'] = new Date().toISOString()
      
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )
  
  // Response interceptor
  instance.interceptors.response.use(
    (response) => {
      // Log response time in development
      if (process.env.NODE_ENV === 'development') {
        const requestTime = response.config.headers['X-Request-Time']
        if (requestTime) {
          const duration = Date.now() - new Date(requestTime as string).getTime()
          console.debug(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`)
        }
      }
      
      return response
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number }
      
      // Handle 401 - Token expired
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true
        
        try {
          const refreshToken = localStorage.getItem('refreshToken')
          
          if (refreshToken) {
            const response = await instance.post(`/auth/refresh`, {
              refresh_token: refreshToken
            })
            
            const { access_token, refresh_token } = response.data
            
            localStorage.setItem('accessToken', access_token)
            localStorage.setItem('refreshToken', refresh_token)
            
            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access_token}`
            }
            
            return instance(originalRequest)
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
          
          return Promise.reject(refreshError)
        }
      }
      
      // Retry logic for network errors
      if (mergedConfig.retry.retryCondition(error)) {
        originalRequest._retryCount = originalRequest._retryCount || 0
        
        if (originalRequest._retryCount < mergedConfig.retry.retries) {
          originalRequest._retryCount++
          
          // Exponential backoff
          const delay = mergedConfig.retry.retryDelay * Math.pow(2, originalRequest._retryCount - 1)
          
          await new Promise(resolve => setTimeout(resolve, delay))
          
          return instance(originalRequest)
        }
      }
      
      // Debug: Log the error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('🚨 API Error Details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          fullURL: error.config?.baseURL && error.config?.url ? error.config.baseURL + error.config.url : 'N/A',
          message: error.message,
          code: error.code,
          headers: error.config?.headers,
          errorType: error.constructor.name,
          isAxiosError: error.isAxiosError,
          stack: error.stack
        })
      }
      
      // Transform error for consistent handling
      const transformedError = transformError(error)
      
      return Promise.reject(transformedError)
    }
  )
  
  return instance
}

// Error transformation
interface ApiError {
  status: number
  code: string
  message: string
  details?: Record<string, any>
  originalError: AxiosError
}

const transformError = (error: AxiosError): ApiError => {
  const response = error.response
  
  return {
    status: response?.status || 0,
    code: (response?.data as any)?.code || 'UNKNOWN_ERROR',
    message: (response?.data as any)?.detail || (response?.data as any)?.message || error.message || 'An unexpected error occurred',
    details: (response?.data as any)?.details,
    originalError: error
  }
}

// Generate correlation ID
const generateCorrelationId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

// Create default client
export const apiClient = createApiClient()

// Export factory for custom clients
export { createApiClient }

// Utility functions
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => 
    apiClient.get<T>(url, config),
  
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.post<T>(url, data, config),
  
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.put<T>(url, data, config),
  
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.patch<T>(url, data, config),
  
  delete: <T>(url: string, config?: AxiosRequestConfig) => 
    apiClient.delete<T>(url, config)
}

// V2 API utilities
export const v2Api = {
  get: <T>(endpoint: string, config?: AxiosRequestConfig) => 
    apiClient.get<T>(`/api/v2${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`, config),
  
  post: <T>(endpoint: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.post<T>(`/api/v2${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`, data, config),
  
  put: <T>(endpoint: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.put<T>(`/api/v2${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`, data, config),
  
  patch: <T>(endpoint: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.patch<T>(`/api/v2${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`, data, config),
  
  delete: <T>(endpoint: string, config?: AxiosRequestConfig) => 
    apiClient.delete<T>(`/api/v2${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`, config)
}

// V1 API utilities (for backward compatibility)
export const v1Api = {
  get: <T>(endpoint: string, config?: AxiosRequestConfig) => 
    apiClient.get<T>(`/api/v1${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`, config),
  
  post: <T>(endpoint: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.post<T>(`/api/v1${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`, data, config),
  
  put: <T>(endpoint: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.put<T>(`/api/v1${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`, data, config),
  
  patch: <T>(endpoint: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.patch<T>(`/api/v1${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`, data, config),
  
  delete: <T>(endpoint: string, config?: AxiosRequestConfig) => 
    apiClient.delete<T>(`/api/v1${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`, config)
}

// SWR fetcher
export const swrFetcher = async (url: string) => {
  const response = await apiClient.get(url)
  return response.data
}

// React Query fetcher
export const queryFetcher = async ({ queryKey }: { queryKey: string[] }) => {
  const [url, ...params] = queryKey
  const response = await apiClient.get(url, { params: params[0] })
  return response.data
}