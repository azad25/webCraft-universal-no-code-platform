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
      // Development bypass - always use admin@test.com
      if (process.env.NODE_ENV === 'development') {
        headers.set('Authorization', `Bearer admin-test-token`)
        console.log(`🔧 RTK Query using admin@test.com token`)
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
    'Page',
    'Pages',
    'Template',
    'Templates',
    'Widget',
    'Widgets',
    'User',
    'Subscription',
    'Analytics',
    'Comments',
    'Automation',
    'Automations'
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
    
    // ==================== Preview ====================
    createPreview: builder.mutation<any, { id: string; device?: string }>({
      query: ({ id, device = 'desktop' }) => ({
        url: `/api/apps/${id}/preview?device=${device}`,
        method: 'GET'
      })
    }),
    
    getPreviewData: builder.query<any, { token: string; device?: string }>({
      query: ({ token, device = 'desktop' }) => `/api/apps/preview/${token}?device=${device}`
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
    
    // ==================== Pages ====================
    getPages: builder.query<any, string>({
      query: (appId) => `/api/apps/${appId}/pages`,
      providesTags: (result, error, appId) => [
        { type: 'App', id: appId },
        ...(result?.pages || []).map((page: any) => ({ type: 'Page' as const, id: page.id }))
      ]
    }),
    
    getPage: builder.query<any, { appId: string; pageId: string }>({
      query: ({ appId, pageId }) => `/api/apps/${appId}/pages/${pageId}`,
      providesTags: (result, error, { pageId }) => [{ type: 'Page', id: pageId }]
    }),
    
    createPage: builder.mutation<any, { appId: string; body: any }>({
      query: ({ appId, body }) => ({
        url: `/api/apps/${appId}/pages`,
        method: 'POST',
        body
      }),
      invalidatesTags: (result, error, { appId }) => [{ type: 'App', id: appId }]
    }),
    
    updatePage: builder.mutation<any, { appId: string; pageId: string; body: any }>({
      query: ({ appId, pageId, body }) => ({
        url: `/api/apps/${appId}/pages/${pageId}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (result, error, { appId, pageId }) => [
        { type: 'App', id: appId },
        { type: 'Page', id: pageId }
      ]
    }),
    
    updatePageContent: builder.mutation<any, { appId: string; pageId: string; content: any }>({
      query: ({ appId, pageId, content }) => ({
        url: `/api/apps/${appId}/pages/${pageId}/content`,
        method: 'PUT',
        body: content
      }),
      invalidatesTags: (result, error, { pageId }) => [{ type: 'Page', id: pageId }]
    }),
    
    deletePage: builder.mutation<void, { appId: string; pageId: string }>({
      query: ({ appId, pageId }) => ({
        url: `/api/apps/${appId}/pages/${pageId}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, { appId }) => [{ type: 'App', id: appId }]
    }),
    
    duplicatePage: builder.mutation<any, { appId: string; pageId: string; newTitle: string; newSlug: string }>({
      query: ({ appId, pageId, newTitle, newSlug }) => ({
        url: `/api/apps/${appId}/pages/${pageId}/duplicate?new_title=${encodeURIComponent(newTitle)}&new_slug=${encodeURIComponent(newSlug)}`,
        method: 'POST'
      }),
      invalidatesTags: (result, error, { appId }) => [{ type: 'App', id: appId }]
    }),
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
    }),
    
    // ==================== Automations ====================
    getAutomations: builder.query<any, { appId: string; isEnabled?: boolean; triggerType?: string }>({
      query: ({ appId, isEnabled, triggerType }) => ({
        url: `/api/apps/${appId}/automations`,
        params: { is_enabled: isEnabled, trigger_type: triggerType }
      }),
      providesTags: (result, error, { appId }) => [
        { type: 'Automations', id: appId },
        ...(result?.automations || []).map((automation: any) => ({ type: 'Automation' as const, id: automation.id }))
      ]
    }),
    
    getAutomation: builder.query<any, { appId: string; automationId: string }>({
      query: ({ appId, automationId }) => `/api/apps/${appId}/automations/${automationId}`,
      providesTags: (result, error, { automationId }) => [{ type: 'Automation', id: automationId }]
    }),
    
    createAutomation: builder.mutation<any, { appId: string; body: any }>({
      query: ({ appId, body }) => ({
        url: `/api/apps/${appId}/automations`,
        method: 'POST',
        body
      }),
      invalidatesTags: (result, error, { appId }) => [{ type: 'Automations', id: appId }]
    }),
    
    updateAutomation: builder.mutation<any, { appId: string; automationId: string; body: any }>({
      query: ({ appId, automationId, body }) => ({
        url: `/api/apps/${appId}/automations/${automationId}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (result, error, { appId, automationId }) => [
        { type: 'Automations', id: appId },
        { type: 'Automation', id: automationId }
      ]
    }),
    
    deleteAutomation: builder.mutation<any, { appId: string; automationId: string }>({
      query: ({ appId, automationId }) => ({
        url: `/api/apps/${appId}/automations/${automationId}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, { appId }) => [{ type: 'Automations', id: appId }]
    }),
    
    executeAutomation: builder.mutation<any, { appId: string; automationId: string; triggerData?: any }>({
      query: ({ appId, automationId, triggerData = {} }) => ({
        url: `/api/apps/${appId}/automations/${automationId}/execute`,
        method: 'POST',
        body: triggerData
      })
    }),
    
    testAutomation: builder.mutation<any, { appId: string; automationId: string; testData?: any }>({
      query: ({ appId, automationId, testData = {} }) => ({
        url: `/api/apps/${appId}/automations/${automationId}/test`,
        method: 'POST',
        body: testData
      })
    }),
    
    getAutomationLogs: builder.query<any, { appId: string; automationId: string; status?: string; limit?: number }>({
      query: ({ appId, automationId, status, limit = 50 }) => ({
        url: `/api/apps/${appId}/automations/${automationId}/logs`,
        params: { status, limit }
      })
    }),
    
    enableAutomation: builder.mutation<any, { appId: string; automationId: string }>({
      query: ({ appId, automationId }) => ({
        url: `/api/apps/${appId}/automations/${automationId}/enable`,
        method: 'POST'
      }),
      invalidatesTags: (result, error, { appId, automationId }) => [
        { type: 'Automations', id: appId },
        { type: 'Automation', id: automationId }
      ]
    }),
    
    disableAutomation: builder.mutation<any, { appId: string; automationId: string }>({
      query: ({ appId, automationId }) => ({
        url: `/api/apps/${appId}/automations/${automationId}/disable`,
        method: 'POST'
      }),
      invalidatesTags: (result, error, { appId, automationId }) => [
        { type: 'Automations', id: appId },
        { type: 'Automation', id: automationId }
      ]
    }),
    
    getAutomationTemplates: builder.query<any, { category?: string }>({
      query: ({ category }) => ({
        url: '/api/automation-templates',
        params: { category }
      })
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
  
  // Preview
  useCreatePreviewMutation,
  useGetPreviewDataQuery,
  
  // Templates
  useGetTemplatesQuery,
  useGetTemplateQuery,
  useGetFeaturedTemplatesQuery,
  useInstallTemplateMutation,
  
  // Widgets
  useGetWidgetsQuery,
  useGetWidgetQuery,
  
  // Pages
  useGetPagesQuery,
  useGetPageQuery,
  useCreatePageMutation,
  useUpdatePageMutation,
  useUpdatePageContentMutation,
  useDeletePageMutation,
  useDuplicatePageMutation,
  
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
  useDeleteCommentMutation,
  
  // Automations
  useGetAutomationsQuery,
  useGetAutomationQuery,
  useCreateAutomationMutation,
  useUpdateAutomationMutation,
  useDeleteAutomationMutation,
  useExecuteAutomationMutation,
  useTestAutomationMutation,
  useGetAutomationLogsQuery,
  useEnableAutomationMutation,
  useDisableAutomationMutation,
  useGetAutomationTemplatesQuery
} = apiSlice