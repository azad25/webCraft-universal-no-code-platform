/**
 * API Client with Axios
 * Centralized HTTP client with interceptors, retry logic, and error handling
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'

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
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
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
    },
    withCredentials: true
  })
  
  // Request interceptor
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Add auth token
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
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
            const response = await axios.post(`${mergedConfig.baseURL}/auth/refresh`, {
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
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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