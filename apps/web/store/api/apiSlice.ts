/**
 * RTK Query API Slice
 * Centralized API definitions with caching and automatic refetching
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../index'

// Base query with auth header
const baseQuery = fetchBaseQuery({
  baseUrl: '/', // Use relative URLs, Next.js will handle the rewrites
  prepareHeaders: (headers, { getState }) => {
    // Try to get token from Redux state first
    const token = (getState() as RootState).auth.accessToken
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    } else {
      // Development bypass - use a dummy token if no real token exists
      if (process.env.NODE_ENV === 'development') {
        headers.set('Authorization', 'Bearer dev-bypass-token')
        console.log('🔧 RTK Query using development bypass token')
      }
    }
    
    headers.set('Content-Type', 'application/json')
    return headers
  },
  credentials: 'include'
})

// Base query with automatic token refresh
const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  console.log('🔄 RTK Query request:', args)
  
  let result = await baseQuery(args, api, extraOptions)
  
  console.log('📡 RTK Query response:', result)
  
  if (result.error && result.error.status === 401) {
    console.log('🔒 401 error, attempting token refresh...')
    
    // Try to refresh token
    const refreshToken = localStorage.getItem('refreshToken')
    
    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: '/api/auth/refresh',
          method: 'POST',
          body: { refresh_token: refreshToken }
        },
        api,
        extraOptions
      )
      
      if (refreshResult.data) {
        const data = refreshResult.data as any
        localStorage.setItem('accessToken', data.access_token)
        localStorage.setItem('refreshToken', data.refresh_token)
        
        // Retry original request
        result = await baseQuery(args, api, extraOptions)
        console.log('🔄 Retry after refresh:', result)
      } else {
        // Refresh failed, logout
        console.log('❌ Token refresh failed, logging out')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        api.dispatch({ type: 'auth/logout' })
      }
    } else {
      console.log('❌ No refresh token available')
    }
  }
  
  if (result.error) {
    console.error('🚨 RTK Query error:', {
      status: result.error.status,
      data: result.error.data,
      error: result.error.error,
      originalStatus: result.error.originalStatus,
      endpointName: result.error.endpointName,
      // Serialize the full error object
      fullError: JSON.parse(JSON.stringify(result.error))
    })
  }
  
  return result
}

// API slice
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'App',
    'Apps',
    'Template',
    'Templates',
    'Widget',
    'Widgets',
    'User',
    'Subscription',
    'Analytics',
    'Comments'
  ],
  endpoints: (builder) => ({
    // ==================== Apps ====================
    getApps: builder.query<any, { page?: number; perPage?: number; appType?: string }>({
      query: (params) => ({
        url: '/api/apps',
        params
      }),
      providesTags: ['Apps']
    }),
    
    getApp: builder.query<any, string>({
      query: (id) => `/api/apps/${id}`,
      providesTags: (result, error, id) => [{ type: 'App', id }]
    }),
    
    createApp: builder.mutation<any, any>({
      query: (body) => ({
        url: '/api/apps',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Apps']
    }),
    
    updateApp: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/api/apps/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'App', id }, 'Apps']
    }),
    
    deleteApp: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/apps/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Apps']
    }),
    
    publishApp: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/api/apps/${id}/publish`,
        method: 'POST',
        body
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'App', id }, 'Apps']
    }),
    
    unpublishApp: builder.mutation<any, string>({
      query: (id) => ({
        url: `/api/apps/${id}/unpublish`,
        method: 'POST'
      }),
      invalidatesTags: (result, error, id) => [{ type: 'App', id }, 'Apps']
    }),
    
    getAppAnalytics: builder.query<any, { id: string; days?: number }>({
      query: ({ id, days = 30 }) => `/api/apps/${id}/analytics?days=${days}`,
      providesTags: ['Analytics']
    }),
    
    // ==================== Templates ====================
    getTemplates: builder.query<any, { category?: string; search?: string; page?: number }>({
      query: (params) => ({
        url: '/api/templates',
        params
      }),
      providesTags: ['Templates']
    }),
    
    getTemplate: builder.query<any, string>({
      query: (id) => `/api/templates/${id}`,
      providesTags: (result, error, id) => [{ type: 'Template', id }]
    }),
    
    getFeaturedTemplates: builder.query<any, number>({
      query: (limit = 6) => `/api/templates/featured?limit=${limit}`,
      providesTags: ['Templates']
    }),
    
    installTemplate: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/api/templates/${id}/install`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['Apps']
    }),
    
    // ==================== Widgets ====================
    getWidgets: builder.query<any, { category?: string }>({
      query: (params) => ({
        url: '/api/widgets',
        params
      }),
      providesTags: ['Widgets']
    }),
    
    getWidget: builder.query<any, string>({
      query: (id) => `/api/widgets/${id}`,
      providesTags: (result, error, id) => [{ type: 'Widget', id }]
    }),
    
    // ==================== AI ====================
    generateContent: builder.mutation<any, any>({
      query: (body) => ({
        url: '/api/ai/generate-content',
        method: 'POST',
        body
      })
    }),
    
    generateImage: builder.mutation<any, any>({
      query: (body) => ({
        url: '/api/ai/generate-image',
        method: 'POST',
        body
      })
    }),
    
    getAISuggestions: builder.query<any, { appId: string; type: string }>({
      query: ({ appId, type }) => `/api/ai/apps/${appId}/suggestions?suggestion_type=${type}`
    }),
    
    // ==================== User ====================
    getCurrentUser: builder.query<any, void>({
      query: () => '/api/auth/me',
      providesTags: ['User']
    }),
    
    updateProfile: builder.mutation<any, any>({
      query: (body) => ({
        url: '/api/auth/me',
        method: 'PUT',
        body
      }),
      invalidatesTags: ['User']
    }),
    
    // ==================== Subscription ====================
    getSubscriptionStatus: builder.query<any, void>({
      query: () => '/api/payment/subscription-status',
      providesTags: ['Subscription']
    }),
    
    getUsageStats: builder.query<any, void>({
      query: () => '/api/payment/usage',
      providesTags: ['Subscription']
    }),
    
    getBillingHistory: builder.query<any, void>({
      query: () => '/api/payment/billing-history',
      providesTags: ['Subscription']
    }),
    
    createSubscription: builder.mutation<any, any>({
      query: (body) => ({
        url: '/api/payment/create-subscription',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Subscription', 'User']
    }),
    
    cancelSubscription: builder.mutation<any, void>({
      query: () => ({
        url: '/api/payment/cancel-subscription',
        method: 'POST'
      }),
      invalidatesTags: ['Subscription', 'User']
    }),
    
    // ==================== Comments ====================
    getComments: builder.query<any, { appId: string; pageId?: string }>({
      query: ({ appId, pageId }) => ({
        url: `/api/apps/${appId}/comments`,
        params: pageId ? { page_id: pageId } : undefined
      }),
      providesTags: ['Comments']
    }),
    
    addComment: builder.mutation<any, { appId: string; body: any }>({
      query: ({ appId, body }) => ({
        url: `/api/apps/${appId}/comments`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['Comments']
    }),
    
    resolveComment: builder.mutation<any, { appId: string; commentId: string }>({
      query: ({ appId, commentId }) => ({
        url: `/api/apps/${appId}/comments/${commentId}/resolve`,
        method: 'POST'
      }),
      invalidatesTags: ['Comments']
    }),
    
    deleteComment: builder.mutation<any, { appId: string; commentId: string }>({
      query: ({ appId, commentId }) => ({
        url: `/api/apps/${appId}/comments/${commentId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Comments']
    })
  })
})

// Export hooks
export const {
  // Apps
  useGetAppsQuery,
  useGetAppQuery,
  useCreateAppMutation,
  useUpdateAppMutation,
  useDeleteAppMutation,
  usePublishAppMutation,
  useUnpublishAppMutation,
  useGetAppAnalyticsQuery,
  
  // Templates
  useGetTemplatesQuery,
  useGetTemplateQuery,
  useGetFeaturedTemplatesQuery,
  useInstallTemplateMutation,
  
  // Widgets
  useGetWidgetsQuery,
  useGetWidgetQuery,
  
  // AI
  useGenerateContentMutation,
  useGenerateImageMutation,
  useGetAISuggestionsQuery,
  
  // User
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  
  // Subscription
  useGetSubscriptionStatusQuery,
  useGetUsageStatsQuery,
  useGetBillingHistoryQuery,
  useCreateSubscriptionMutation,
  useCancelSubscriptionMutation,
  
  // Comments
  useGetCommentsQuery,
  useAddCommentMutation,
  useResolveCommentMutation,
  useDeleteCommentMutation
} = apiSlice