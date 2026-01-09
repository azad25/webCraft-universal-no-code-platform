/**
 * Data Source API Functions
 * Functions for managing data sources and collections
 */

import { apiClient } from './api-client';

// Data Source Types
export interface DataSource {
  id: string;
  name: string;
  description: string;
  base_url: string;
  auth_type: string;
  is_connected: boolean;
  last_tested: string | null;
  last_error: string | null;
  endpoint_count: number;
  created_at: string;
}

export interface DataSourceEndpoint {
  id: string;
  name: string;
  path: string;
  method: string;
  description: string;
  parameters: Record<string, any>;
  response_schema: Record<string, any>;
  field_mappings: Record<string, string>;
  cache_ttl: number;
  is_active: boolean;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  schema: FieldDefinition[];
  settings: Record<string, any>;
  record_count: number;
  created_at: string;
  updated_at: string;
}

export interface FieldDefinition {
  name: string;
  type: string;
  label?: string;
  required: boolean;
  unique: boolean;
  default?: any;
  options?: string[];
  relation_collection_id?: string;
  relation_multiple?: boolean;
  formula?: string;
  validation?: Record<string, any>;
}

export interface CollectionRecord {
  id: string;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Data Source API Functions
export const getDataSources = async (appId: string): Promise<DataSource[]> => {
  const response = await apiClient.get(`/api/data-sources?app_id=${appId}`);
  return response.data.data_sources || [];
};

export const getDataSource = async (sourceId: string): Promise<DataSource> => {
  const response = await apiClient.get(`/api/data-sources/${sourceId}`);
  return response.data;
};

export const createDataSource = async (appId: string, data: Partial<DataSource>): Promise<DataSource> => {
  const response = await apiClient.post(`/api/data-sources?app_id=${appId}`, data);
  return response.data;
};

export const updateDataSource = async (sourceId: string, data: Partial<DataSource>): Promise<DataSource> => {
  const response = await apiClient.put(`/api/data-sources/${sourceId}`, data);
  return response.data;
};

export const deleteDataSource = async (sourceId: string): Promise<void> => {
  await apiClient.delete(`/api/data-sources/${sourceId}`);
};

export const testDataSourceConnection = async (sourceId: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(`/api/data-sources/${sourceId}/test`);
  return response.data;
};

// Data Source Endpoint API Functions
export const getDataSourceEndpoints = async (sourceId: string): Promise<DataSourceEndpoint[]> => {
  const response = await apiClient.get(`/api/data-sources/${sourceId}/endpoints`);
  return response.data.endpoints || [];
};

export const getDataSourceEndpoint = async (sourceId: string, endpointId: string): Promise<DataSourceEndpoint> => {
  const response = await apiClient.get(`/api/data-sources/${sourceId}/endpoints/${endpointId}`);
  return response.data;
};

export const createDataSourceEndpoint = async (sourceId: string, data: Partial<DataSourceEndpoint>): Promise<DataSourceEndpoint> => {
  const response = await apiClient.post(`/api/data-sources/${sourceId}/endpoints`, data);
  return response.data;
};

export const updateDataSourceEndpoint = async (sourceId: string, endpointId: string, data: Partial<DataSourceEndpoint>): Promise<DataSourceEndpoint> => {
  const response = await apiClient.put(`/api/data-sources/${sourceId}/endpoints/${endpointId}`, data);
  return response.data;
};

export const deleteDataSourceEndpoint = async (sourceId: string, endpointId: string): Promise<void> => {
  await apiClient.delete(`/api/data-sources/${sourceId}/endpoints/${endpointId}`);
};

export const testDataSourceEndpoint = async (sourceId: string, endpointId: string, params?: Record<string, any>): Promise<any> => {
  const response = await apiClient.post(`/api/data-sources/${sourceId}/endpoints/${endpointId}/test`, { params });
  return response.data;
};

// Collection API Functions
export const getCollections = async (appId: string): Promise<Collection[]> => {
  const response = await apiClient.get(`/api/collections/apps/${appId}/collections`);
  return response.data.collections || [];
};

export const getCollection = async (appId: string, collectionId: string): Promise<Collection> => {
  const response = await apiClient.get(`/api/collections/apps/${appId}/collections/${collectionId}`);
  return response.data;
};

export const createCollection = async (appId: string, data: Partial<Collection>): Promise<Collection> => {
  const response = await apiClient.post(`/api/collections/apps/${appId}/collections`, data);
  return response.data;
};

export const updateCollection = async (appId: string, collectionId: string, data: Partial<Collection>): Promise<Collection> => {
  const response = await apiClient.put(`/api/collections/apps/${appId}/collections/${collectionId}`, data);
  return response.data;
};

export const deleteCollection = async (appId: string, collectionId: string): Promise<void> => {
  await apiClient.delete(`/api/collections/apps/${appId}/collections/${collectionId}`);
};

// Collection Records API Functions
export const getCollectionRecords = async (appId: string, collectionId: string, params?: { limit?: number; offset?: number; filter?: Record<string, any>; sort?: string }): Promise<{ records: CollectionRecord[]; total: number }> => {
  const response = await apiClient.get(`/api/collections/apps/${appId}/collections/${collectionId}/records`, { params });
  return response.data;
};

export const getCollectionRecord = async (appId: string, collectionId: string, recordId: string): Promise<CollectionRecord> => {
  const response = await apiClient.get(`/api/collections/apps/${appId}/collections/${collectionId}/records/${recordId}`);
  return response.data;
};

export const createCollectionRecord = async (appId: string, collectionId: string, data: Record<string, any>): Promise<CollectionRecord> => {
  const response = await apiClient.post(`/api/collections/apps/${appId}/collections/${collectionId}/records`, { data });
  return response.data;
};

export const updateCollectionRecord = async (appId: string, collectionId: string, recordId: string, data: Record<string, any>): Promise<CollectionRecord> => {
  const response = await apiClient.put(`/api/collections/apps/${appId}/collections/${collectionId}/records/${recordId}`, { data });
  return response.data;
};

export const deleteCollectionRecord = async (appId: string, collectionId: string, recordId: string): Promise<void> => {
  await apiClient.delete(`/api/collections/apps/${appId}/collections/${collectionId}/records/${recordId}`);
};

// Data Binding Functions
export const getWidgetData = async (appId: string, widgetId: string, params?: Record<string, any>): Promise<any> => {
  const response = await apiClient.get(`/api/widgets/${widgetId}/data?app_id=${appId}`, { params });
  return response.data;
};

export const bindWidgetToDataSource = async (widgetId: string, sourceId: string, endpointId: string, fieldMappings: Record<string, string>): Promise<void> => {
  await apiClient.post(`/api/widgets/${widgetId}/bind-data-source`, {
    source_id: sourceId,
    endpoint_id: endpointId,
    field_mappings: fieldMappings
  });
};

export const bindWidgetToCollection = async (widgetId: string, collectionId: string, fieldMappings: Record<string, string>, filter?: Record<string, any>): Promise<void> => {
  await apiClient.post(`/api/widgets/${widgetId}/bind-collection`, {
    collection_id: collectionId,
    field_mappings: fieldMappings,
    filter
  });
};

// Dynamic Page Functions
export const getDynamicPages = async (appId: string): Promise<any[]> => {
  const response = await apiClient.get(`/api/dynamic-pages?app_id=${appId}`);
  return response.data.pages || [];
};

export const createDynamicPage = async (appId: string, data: {
  name: string;
  slug_template: string;
  collection_id?: string;
  data_source_id?: string;
  endpoint_id?: string;
  template: any;
  settings: Record<string, any>;
}): Promise<any> => {
  const response = await apiClient.post(`/api/dynamic-pages?app_id=${appId}`, data);
  return response.data;
};

export const updateDynamicPage = async (pageId: string, data: any): Promise<any> => {
  const response = await apiClient.put(`/api/dynamic-pages/${pageId}`, data);
  return response.data;
};

export const deleteDynamicPage = async (pageId: string): Promise<void> => {
  await apiClient.delete(`/api/dynamic-pages/${pageId}`);
};

export const generateDynamicPagePreviews = async (pageId: string): Promise<{ previews: any[] }> => {
  const response = await apiClient.post(`/api/dynamic-pages/${pageId}/generate-previews`);
  return response.data;
};