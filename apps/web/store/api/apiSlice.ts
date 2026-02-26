/**
 * RTK Query API Slice
 * Centralized API definitions with caching and automatic refetching
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../index'

// Base query with auth header
const baseQuery = fetchBaseQuery({
  baseUrl: '/api/v2', // Use V2 API as base - all routes will automatically use V2
  prepareHeaders: (headers, { getState }) => {
    // Try to get token from Redux state first
    const token = (getState() as RootState).auth.accessToken
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    } else {
      // Try to get token from localStorage
      const localToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      if (localToken) {
        headers.set('Authorization', `Bearer ${localToken}`)
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
          url: '/auth/refresh',
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
    'Automations',
    'DataSources',
    'Actions',
    'Webhooks',
    'Collections',
    'Assets',
    'Deployment',
    'Integrations',
    'SEO',
    'CrossApp',
    'WidgetLayers'
  ],
  endpoints: (builder) => ({
    // ==================== Apps ====================
    getApps: builder.query<any, { page?: number; perPage?: number; appType?: string }>({
      query: (params) => ({
        url: '/apps',
        params
      }),
      providesTags: ['Apps']
    }),
    
    getApp: builder.query<any, string>({
      query: (id) => `/apps/${id}`,
      providesTags: (result, error, id) => [{ type: 'App', id }]
    }),
    
    createApp: builder.mutation<any, any>({
      query: (body) => ({
        url: '/apps',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Apps']
    }),
    
    updateApp: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/apps/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'App', id }, 'Apps']
    }),
    
    deleteApp: builder.mutation<void, string>({
      query: (id) => ({
        url: `/apps/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Apps']
    }),
    
    publishApp: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/apps/${id}/publish`,
        method: 'POST',
        body
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'App', id }, 'Apps']
    }),
    
    unpublishApp: builder.mutation<any, string>({
      query: (id) => ({
        url: `/apps/${id}/unpublish`,
        method: 'POST'
      }),
      invalidatesTags: (result, error, id) => [{ type: 'App', id }, 'Apps']
    }),
    
    getAppAnalytics: builder.query<any, { id: string; days?: number }>({
      query: ({ id, days = 30 }) => `/apps/${id}/analytics?days=${days}`,
      providesTags: ['Analytics']
    }),
    
    // ==================== Preview ====================
    createPreview: builder.mutation<any, { id: string; device?: string }>({
      query: ({ id, device = 'desktop' }) => ({
        url: `/apps/${id}/preview?device=${device}`,
        method: 'GET'
      })
    }),
    
    getPreviewData: builder.query<any, { token: string; device?: string }>({
      query: ({ token, device = 'desktop' }) => `/apps/preview/${token}?device=${device}`
    }),
    
    // ==================== Templates ====================
    getTemplates: builder.query<any, { category?: string; search?: string; page?: number }>({
      query: (params) => ({
        url: '/templates',
        params
      }),
      providesTags: ['Templates']
    }),
    
    getTemplate: builder.query<any, string>({
      query: (id) => `/templates/${id}`,
      providesTags: (result, error, id) => [{ type: 'Template', id }]
    }),
    
    getFeaturedTemplates: builder.query<any, number>({
      query: (limit = 6) => `/templates/featured?limit=${limit}`,
      providesTags: ['Templates']
    }),
    
    installTemplate: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/templates/${id}/install`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['Apps']
    }),
    
    // ==================== Widgets ====================
    getWidgets: builder.query<any, { appId: string; category?: string }>({
      query: ({ appId, ...params }) => ({
        url: `/apps/${appId}/widgets`,
        params
      }),
      providesTags: ['Widgets']
    }),
    
    getWidget: builder.query<any, { appId: string; widgetId: string }>({
      query: ({ appId, widgetId }) => `/apps/${appId}/widgets/${widgetId}`,
      providesTags: (result, error, { widgetId }) => [{ type: 'Widget', id: widgetId }]
    }),
    
    // ==================== Pages ====================
    getPages: builder.query<any, string>({
      query: (appId) => `/apps/${appId}/pages`,
      providesTags: (result, error, appId) => [
        { type: 'App', id: appId },
        ...(result?.pages || []).map((page: any) => ({ type: 'Page' as const, id: page.id }))
      ]
    }),
    
    getPage: builder.query<any, { appId: string; pageId: string }>({
      query: ({ appId, pageId }) => `/apps/${appId}/pages/${pageId}`,
      providesTags: (result, error, { pageId }) => [{ type: 'Page', id: pageId }]
    }),
    
    createPage: builder.mutation<any, { appId: string; body: any }>({
      query: ({ appId, body }) => ({
        url: `/apps/${appId}/pages`,
        method: 'POST',
        body
      }),
      invalidatesTags: (result, error, { appId }) => [{ type: 'App', id: appId }]
    }),
    
    updatePage: builder.mutation<any, { appId: string; pageId: string; body: any }>({
      query: ({ appId, pageId, body }) => ({
        url: `/apps/${appId}/pages/${pageId}`,
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
        url: `/apps/${appId}/pages/${pageId}/content`,
        method: 'PUT',
        body: content
      }),
      invalidatesTags: (result, error, { pageId }) => [{ type: 'Page', id: pageId }]
    }),
    
    deletePage: builder.mutation<void, { appId: string; pageId: string }>({
      query: ({ appId, pageId }) => ({
        url: `/apps/${appId}/pages/${pageId}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, { appId }) => [{ type: 'App', id: appId }]
    }),
    
    duplicatePage: builder.mutation<any, { appId: string; pageId: string; newTitle: string; newSlug: string }>({
      query: ({ appId, pageId, newTitle, newSlug }) => ({
        url: `/apps/${appId}/pages/${pageId}/duplicate?new_title=${encodeURIComponent(newTitle)}&new_slug=${encodeURIComponent(newSlug)}`,
        method: 'POST'
      }),
      invalidatesTags: (result, error, { appId }) => [{ type: 'App', id: appId }]
    }),
    generateContent: builder.mutation<any, any>({
      query: (body) => ({
        url: '/ai/generate-content',
        method: 'POST',
        body
      })
    }),
    
    generateImage: builder.mutation<any, any>({
      query: (body) => ({
        url: '/ai/generate-image',
        method: 'POST',
        body
      })
    }),
    
    getAISuggestions: builder.query<any, { appId: string; type: string }>({
      query: ({ appId, type }) => `/ai/apps/${appId}/suggestions?suggestion_type=${type}`
    }),
    
    // ==================== User ====================
    getCurrentUser: builder.query<any, void>({
      query: () => '/auth/me',
      providesTags: ['User']
    }),
    
    updateProfile: builder.mutation<any, any>({
      query: (body) => ({
        url: '/auth/me',
        method: 'PUT',
        body
      }),
      invalidatesTags: ['User']
    }),
    
    // ==================== Subscription ====================
    getSubscriptionStatus: builder.query<any, void>({
      query: () => '/payment/subscription-status',
      providesTags: ['Subscription']
    }),
    
    getUsageStats: builder.query<any, void>({
      query: () => '/payment/usage',
      providesTags: ['Subscription']
    }),
    
    getBillingHistory: builder.query<any, void>({
      query: () => '/payment/billing-history',
      providesTags: ['Subscription']
    }),
    
    createSubscription: builder.mutation<any, any>({
      query: (body) => ({
        url: '/payment/create-subscription',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Subscription', 'User']
    }),
    
    cancelSubscription: builder.mutation<any, void>({
      query: () => ({
        url: '/payment/cancel-subscription',
        method: 'POST'
      }),
      invalidatesTags: ['Subscription', 'User']
    }),
    
    // ==================== Comments ====================
    getComments: builder.query<any, { appId: string; pageId?: string }>({
      query: ({ appId, pageId }) => ({
        url: `/apps/${appId}/comments`,
        params: pageId ? { page_id: pageId } : undefined
      }),
      providesTags: ['Comments']
    }),
    
    addComment: builder.mutation<any, { appId: string; body: any }>({
      query: ({ appId, body }) => ({
        url: `/apps/${appId}/comments`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['Comments']
    }),
    
    resolveComment: builder.mutation<any, { appId: string; commentId: string }>({
      query: ({ appId, commentId }) => ({
        url: `/apps/${appId}/comments/${commentId}/resolve`,
        method: 'POST'
      }),
      invalidatesTags: ['Comments']
    }),
    
    deleteComment: builder.mutation<any, { appId: string; commentId: string }>({
      query: ({ appId, commentId }) => ({
        url: `/apps/${appId}/comments/${commentId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Comments']
    }),
    
    // ==================== Automations ====================
    getAutomations: builder.query<any, { appId: string; isEnabled?: boolean; triggerType?: string }>({
      query: ({ appId, isEnabled, triggerType }) => ({
        url: `/apps/${appId}/automations`,
        params: { is_enabled: isEnabled, trigger_type: triggerType }
      }),
      providesTags: (result, error, { appId }) => [
        { type: 'Automations', id: appId },
        ...(result?.automations || []).map((automation: any) => ({ type: 'Automation' as const, id: automation.id }))
      ]
    }),
    
    getAutomation: builder.query<any, { appId: string; automationId: string }>({
      query: ({ appId, automationId }) => `/apps/${appId}/automations/${automationId}`,
      providesTags: (result, error, { automationId }) => [{ type: 'Automation', id: automationId }]
    }),
    
    createAutomation: builder.mutation<any, { appId: string; body: any }>({
      query: ({ appId, body }) => ({
        url: `/apps/${appId}/automations`,
        method: 'POST',
        body
      }),
      invalidatesTags: (result, error, { appId }) => [{ type: 'Automations', id: appId }]
    }),
    
    updateAutomation: builder.mutation<any, { appId: string; automationId: string; body: any }>({
      query: ({ appId, automationId, body }) => ({
        url: `/apps/${appId}/automations/${automationId}`,
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
        url: `/apps/${appId}/automations/${automationId}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, { appId }) => [{ type: 'Automations', id: appId }]
    }),
    
    executeAutomation: builder.mutation<any, { appId: string; automationId: string; triggerData?: any }>({
      query: ({ appId, automationId, triggerData = {} }) => ({
        url: `/apps/${appId}/automations/${automationId}/execute`,
        method: 'POST',
        body: triggerData
      })
    }),
    
    testAutomation: builder.mutation<any, { appId: string; automationId: string; testData?: any }>({
      query: ({ appId, automationId, testData = {} }) => ({
        url: `/apps/${appId}/automations/${automationId}/test`,
        method: 'POST',
        body: testData
      })
    }),
    
    getAutomationLogs: builder.query<any, { appId: string; automationId: string; status?: string; limit?: number }>({
      query: ({ appId, automationId, status, limit = 50 }) => ({
        url: `/apps/${appId}/automations/${automationId}/logs`,
        params: { status, limit }
      })
    }),
    
    enableAutomation: builder.mutation<any, { appId: string; automationId: string }>({
      query: ({ appId, automationId }) => ({
        url: `/apps/${appId}/automations/${automationId}/enable`,
        method: 'POST'
      }),
      invalidatesTags: (result, error, { appId, automationId }) => [
        { type: 'Automations', id: appId },
        { type: 'Automation', id: automationId }
      ]
    }),
    
    disableAutomation: builder.mutation<any, { appId: string; automationId: string }>({
      query: ({ appId, automationId }) => ({
        url: `/apps/${appId}/automations/${automationId}/disable`,
        method: 'POST'
      }),
      invalidatesTags: (result, error, { appId, automationId }) => [
        { type: 'Automations', id: appId },
        { type: 'Automation', id: automationId }
      ]
    }),
    
    getAutomationTemplates: builder.query<any, { category?: string }>({
      query: ({ category }) => ({
        url: '/automation-templates',
        params: { category }
      })
    }),

    // ==================== Data Sources (V2) ====================
    getDataSources: builder.query<any, { appId: string }>({
      query: ({ appId }) => ({
        url: '/data-sources',
        params: { app_id: appId }
      }),
      providesTags: ['DataSources']
    }),

    createDataSource: builder.mutation<any, { appId: string; body: any }>({
      query: ({ appId, body }) => ({
        url: '/data-sources',
        method: 'POST',
        body,
        params: { app_id: appId }
      }),
      invalidatesTags: ['DataSources']
    }),

    updateDataSource: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/data-sources/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['DataSources']
    }),

    deleteDataSource: builder.mutation<any, string>({
      query: (id) => ({
        url: `/data-sources/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['DataSources']
    }),

    testDataSource: builder.mutation<any, string>({
      query: (id) => ({
        url: `/data-sources/${id}/test`,
        method: 'POST'
      })
    }),

    // ==================== Actions (V2) ====================
    getActions: builder.query<any, { appId: string }>({
      query: ({ appId }) => `/actions/apps/${appId}`,
      providesTags: ['Actions']
    }),

    createAction: builder.mutation<any, { appId: string; body: any }>({
      query: ({ appId, body }) => ({
        url: `/actions/apps/${appId}`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['Actions']
    }),

    updateAction: builder.mutation<any, { appId: string; actionId: string; body: any }>({
      query: ({ appId, actionId, body }) => ({
        url: `/actions/apps/${appId}/${actionId}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['Actions']
    }),

    deleteAction: builder.mutation<any, { appId: string; actionId: string }>({
      query: ({ appId, actionId }) => ({
        url: `/actions/apps/${appId}/${actionId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Actions']
    }),

    executeAction: builder.mutation<any, { appId: string; actionId: string; body: any }>({
      query: ({ appId, actionId, body }) => ({
        url: `/actions/apps/${appId}/${actionId}/execute`,
        method: 'POST',
        body
      })
    }),

    // ==================== Webhooks (V2) ====================
    getWebhooks: builder.query<any, { appId: string }>({
      query: ({ appId }) => `/webhooks/apps/${appId}`,
      providesTags: ['Webhooks']
    }),

    createWebhook: builder.mutation<any, { appId: string; body: any }>({
      query: ({ appId, body }) => ({
        url: `/webhooks/apps/${appId}`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['Webhooks']
    }),

    updateWebhook: builder.mutation<any, { appId: string; webhookId: string; body: any }>({
      query: ({ appId, webhookId, body }) => ({
        url: `/webhooks/apps/${appId}/${webhookId}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['Webhooks']
    }),

    deleteWebhook: builder.mutation<any, { appId: string; webhookId: string }>({
      query: ({ appId, webhookId }) => ({
        url: `/webhooks/apps/${appId}/${webhookId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Webhooks']
    }),

    testWebhook: builder.mutation<any, { appId: string; webhookId: string }>({
      query: ({ appId, webhookId }) => ({
        url: `/webhooks/apps/${appId}/${webhookId}/test`,
        method: 'POST'
      })
    }),

    // ==================== Collections (V2) ====================
    getCollections: builder.query<any, { appId: string }>({
      query: ({ appId }) => `/apps/${appId}/collections`,
      providesTags: ['Collections']
    }),

    createCollection: builder.mutation<any, { appId: string; body: any }>({
      query: ({ appId, body }) => ({
        url: `/apps/${appId}/collections`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['Collections']
    }),

    updateCollection: builder.mutation<any, { appId: string; collectionId: string; body: any }>({
      query: ({ appId, collectionId, body }) => ({
        url: `/apps/${appId}/collections/${collectionId}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['Collections']
    }),

    deleteCollection: builder.mutation<any, { appId: string; collectionId: string }>({
      query: ({ appId, collectionId }) => ({
        url: `/apps/${appId}/collections/${collectionId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Collections']
    }),

    // ==================== Assets (V2) ====================
    getAssets: builder.query<any, { appId: string; assetType?: string }>({
      query: ({ appId, assetType }) => ({
        url: `/apps/${appId}/assets`,
        params: assetType ? { asset_type: assetType } : {}
      }),
      providesTags: ['Assets']
    }),

    // ==================== Export (V2) ====================
    exportToStatic: builder.mutation<any, { appId: string }>({
      query: ({ appId }) => ({
        url: `/apps/${appId}/export/static`,
        method: 'POST'
      })
    }),

    exportToGitHub: builder.mutation<any, { appId: string; body: any }>({
      query: ({ appId, body }) => ({
        url: `/apps/${appId}/export/github`,
        method: 'POST',
        body
      })
    }),

    exportToNetlify: builder.mutation<any, { appId: string; body: any }>({
      query: ({ appId, body }) => ({
        url: `/apps/${appId}/export/netlify`,
        method: 'POST',
        body
      })
    }),

    exportToVercel: builder.mutation<any, { appId: string; body: any }>({
      query: ({ appId, body }) => ({
        url: `/apps/${appId}/export/vercel`,
        method: 'POST',
        body
      })
    }),

    getExportStatus: builder.query<any, { appId: string; exportId?: string }>({
      query: ({ appId, exportId }) => ({
        url: `/apps/${appId}/export/status`,
        params: exportId ? { export_id: exportId } : {}
      })
    }),

    // ==================== Deployment (V2) ====================
    getDeploymentStatus: builder.query<any, { appId: string }>({
      query: ({ appId }) => `/apps/${appId}/deployment/status`,
      providesTags: ['Deployment']
    }),

    // ==================== Integrations (V2) ====================
    getAvailableIntegrations: builder.query<any, void>({
      query: () => '/integrations/available',
      providesTags: ['Integrations']
    }),

    getIntegrationCategories: builder.query<any, void>({
      query: () => '/integrations/categories',
      providesTags: ['Integrations']
    }),

    getAppIntegrations: builder.query<any, { appId: string }>({
      query: ({ appId }) => `/integrations/apps/${appId}/integrations`,
      providesTags: ['Integrations']
    }),

    connectIntegration: builder.mutation<any, { appId: string; body: any }>({
      query: ({ appId, body }) => ({
        url: `/integrations/apps/${appId}/integrations/connect`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['Integrations']
    }),

    // ==================== SEO (V2) ====================
    getSEOMeta: builder.query<any, { appId: string; pageSlug?: string }>({
      query: ({ appId, pageSlug }) => ({
        url: `/apps/${appId}/seo/meta`,
        params: pageSlug ? { page_slug: pageSlug } : {}
      }),
      providesTags: ['SEO']
    }),

    // ==================== V2 Exclusive Features ====================
    getEnhancedAnalytics: builder.query<any, { appId: string }>({
      query: ({ appId }) => `/apps/${appId}/analytics/enhanced`,
      providesTags: ['Analytics']
    }),

    getCrossAppConnections: builder.query<any, { appId: string }>({
      query: ({ appId }) => `/cross-app/apps/${appId}/connections`,
      providesTags: ['CrossApp']
    }),

    getWidgetLayers: builder.query<any, { appId: string }>({
      query: ({ appId }) => `/apps/${appId}/widget-layers`,
      providesTags: ['WidgetLayers']
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
  useGetAutomationTemplatesQuery,
  
  // Data Sources (V2)
  useGetDataSourcesQuery,
  useCreateDataSourceMutation,
  useUpdateDataSourceMutation,
  useDeleteDataSourceMutation,
  useTestDataSourceMutation,
  
  // Actions (V2)
  useGetActionsQuery,
  useCreateActionMutation,
  useUpdateActionMutation,
  useDeleteActionMutation,
  useExecuteActionMutation,
  
  // Webhooks (V2)
  useGetWebhooksQuery,
  useCreateWebhookMutation,
  useUpdateWebhookMutation,
  useDeleteWebhookMutation,
  useTestWebhookMutation,
  
  // Collections (V2)
  useGetCollectionsQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  
  // Assets (V2)
  useGetAssetsQuery,
  
  // Export (V2)
  useExportToStaticMutation,
  useExportToGitHubMutation,
  useExportToNetlifyMutation,
  useExportToVercelMutation,
  useGetExportStatusQuery,
  
  // Deployment (V2)
  useGetDeploymentStatusQuery,
  
  // Integrations (V2)
  useGetAvailableIntegrationsQuery,
  useGetIntegrationCategoriesQuery,
  useGetAppIntegrationsQuery,
  useConnectIntegrationMutation,
  
  // SEO (V2)
  useGetSEOMetaQuery,
  
  // V2 Exclusive Features
  useGetEnhancedAnalyticsQuery,
  useGetCrossAppConnectionsQuery,
  useGetWidgetLayersQuery
} = apiSlice