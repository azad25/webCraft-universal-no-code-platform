'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Database,
  Layers,
  Link,
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle,
  ArrowRight,
  Code,
  Filter,
  SortAsc
} from 'lucide-react';
import { 
  getCollections,
  getDataSources,
  getDataSourceEndpoints,
  bindWidgetToDataSource,
  bindWidgetToCollection,
  testDataSourceEndpoint,
  Collection,
  DataSource,
  DataSourceEndpoint
} from '@/lib/data-source-api';

interface DataBindingConfigProps {
  appId: string;
  widgetId: string;
  widgetType: string;
  currentBinding?: {
    type: 'collection' | 'data_source';
    collection_id?: string;
    data_source_id?: string;
    endpoint_id?: string;
    field_mappings: Record<string, string>;
    filter?: Record<string, any>;
  };
  onBindingChange?: (binding: any) => void;
  onClose: () => void;
}

export function DataBindingConfig({ 
  appId, 
  widgetId, 
  widgetType, 
  currentBinding, 
  onBindingChange,
  onClose 
}: DataBindingConfigProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [endpoints, setEndpoints] = useState<DataSourceEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const [bindingConfig, setBindingConfig] = useState({
    type: currentBinding?.type || 'collection',
    collection_id: currentBinding?.collection_id || '',
    data_source_id: currentBinding?.data_source_id || '',
    endpoint_id: currentBinding?.endpoint_id || '',
    field_mappings: currentBinding?.field_mappings || {},
    filter: currentBinding?.filter || {},
    sort: '',
    limit: 10
  });

  useEffect(() => {
    loadData();
  }, [appId]);

  useEffect(() => {
    if (bindingConfig.data_source_id) {
      loadEndpoints(bindingConfig.data_source_id);
    }
  }, [bindingConfig.data_source_id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [collectionsData, dataSourcesData] = await Promise.all([
        getCollections(appId),
        getDataSources(appId)
      ]);
      
      setCollections(collectionsData);
      setDataSources(dataSourcesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEndpoints = async (sourceId: string) => {
    try {
      const data = await getDataSourceEndpoints(sourceId);
      setEndpoints(data);
    } catch (error) {
      console.error('Failed to load endpoints:', error);
    }
  };

  const handleTestData = async () => {
    if (bindingConfig.type === 'data_source' && bindingConfig.data_source_id && bindingConfig.endpoint_id) {
      try {
        setTesting(true);
        const data = await testDataSourceEndpoint(
          bindingConfig.data_source_id, 
          bindingConfig.endpoint_id,
          {}
        );
        setTestData(data);
      } catch (error) {
        console.error('Failed to test data:', error);
      } finally {
        setTesting(false);
      }
    }
  };

  const handleSaveBinding = async () => {
    try {
      if (bindingConfig.type === 'collection') {
        await bindWidgetToCollection(
          widgetId,
          bindingConfig.collection_id,
          bindingConfig.field_mappings,
          bindingConfig.filter
        );
      } else {
        await bindWidgetToDataSource(
          widgetId,
          bindingConfig.data_source_id,
          bindingConfig.endpoint_id,
          bindingConfig.field_mappings
        );
      }
      
      onBindingChange?.(bindingConfig);
      onClose();
    } catch (error) {
      console.error('Failed to save binding:', error);
    }
  };

  const getWidgetFields = () => {
    // Define expected fields based on widget type
    const fieldMappings: Record<string, string[]> = {
      'text': ['content', 'value'],
      'image': ['src', 'alt', 'caption'],
      'list': ['items', 'title', 'description'],
      'card': ['title', 'description', 'image', 'link'],
      'table': ['data', 'columns'],
      'chart': ['data', 'labels', 'values'],
      'form': ['fields', 'action', 'method'],
      'button': ['text', 'link', 'action'],
      'video': ['src', 'poster', 'title'],
      'gallery': ['images', 'captions']
    };

    return fieldMappings[widgetType] || ['content'];
  };

  const getAvailableFields = () => {
    if (bindingConfig.type === 'collection') {
      const collection = collections.find(c => c.id === bindingConfig.collection_id);
      return collection?.schema.map(field => field.name) || [];
    } else if (bindingConfig.type === 'data_source' && testData) {
      // Extract field names from test data
      if (Array.isArray(testData)) {
        return testData.length > 0 ? Object.keys(testData[0]) : [];
      } else if (typeof testData === 'object') {
        return Object.keys(testData);
      }
    }
    return [];
  };

  const widgetFields = getWidgetFields();
  const availableFields = getAvailableFields();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Configure Data Binding
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Data Source Selection */}
          <div>
            <Label className="text-base font-medium">Data Source</Label>
            <Tabs 
              value={bindingConfig.type} 
              onValueChange={(value) => setBindingConfig({ 
                ...bindingConfig, 
                type: value as 'collection' | 'data_source' 
              })}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="collection">
                  <Layers className="w-4 h-4 mr-2" />
                  Collection
                </TabsTrigger>
                <TabsTrigger value="data_source">
                  <Database className="w-4 h-4 mr-2" />
                  External API
                </TabsTrigger>
              </TabsList>

              <TabsContent value="collection" className="space-y-4">
                <div>
                  <Label htmlFor="collection_id">Collection</Label>
                  <Select
                    value={bindingConfig.collection_id}
                    onValueChange={(value) => setBindingConfig({ 
                      ...bindingConfig, 
                      collection_id: value 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a collection" />
                    </SelectTrigger>
                    <SelectContent>
                      {collections.map((collection) => (
                        <SelectItem key={collection.id} value={collection.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: collection.color }}
                            />
                            {collection.name}
                            <Badge variant="secondary" className="ml-2">
                              {collection.record_count} records
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {bindingConfig.collection_id && (
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">Collection Info</h4>
                    {(() => {
                      const collection = collections.find(c => c.id === bindingConfig.collection_id);
                      return collection ? (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            {collection.description}
                          </p>
                          <div className="flex gap-2">
                            <Badge variant="outline">
                              {collection.schema.length} fields
                            </Badge>
                            <Badge variant="outline">
                              {collection.record_count} records
                            </Badge>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="data_source" className="space-y-4">
                <div>
                  <Label htmlFor="data_source_id">Data Source</Label>
                  <Select
                    value={bindingConfig.data_source_id}
                    onValueChange={(value) => setBindingConfig({ 
                      ...bindingConfig, 
                      data_source_id: value,
                      endpoint_id: '' // Reset endpoint when source changes
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a data source" />
                    </SelectTrigger>
                    <SelectContent>
                      {dataSources.map((source) => (
                        <SelectItem key={source.id} value={source.id}>
                          <div className="flex items-center gap-2">
                            {source.is_connected ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-500" />
                            )}
                            {source.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {bindingConfig.data_source_id && (
                  <div>
                    <Label htmlFor="endpoint_id">Endpoint</Label>
                    <Select
                      value={bindingConfig.endpoint_id}
                      onValueChange={(value) => setBindingConfig({ 
                        ...bindingConfig, 
                        endpoint_id: value 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an endpoint" />
                      </SelectTrigger>
                      <SelectContent>
                        {endpoints.map((endpoint) => (
                          <SelectItem key={endpoint.id} value={endpoint.id}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {endpoint.method}
                              </Badge>
                              {endpoint.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {bindingConfig.data_source_id && bindingConfig.endpoint_id && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleTestData}
                      disabled={testing}
                    >
                      {testing ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Code className="w-4 h-4 mr-2" />
                      )}
                      Test Data
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Field Mapping */}
          {(bindingConfig.collection_id || (bindingConfig.data_source_id && bindingConfig.endpoint_id)) && (
            <div>
              <Label className="text-base font-medium">Field Mapping</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Map data fields to widget properties
              </p>

              <div className="space-y-3">
                {widgetFields.map((widgetField) => (
                  <div key={widgetField} className="flex items-center gap-4">
                    <div className="w-32">
                      <Label className="text-sm font-medium">{widgetField}</Label>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <Select
                        value={bindingConfig.field_mappings[widgetField] || ''}
                        onValueChange={(value) => setBindingConfig({
                          ...bindingConfig,
                          field_mappings: {
                            ...bindingConfig.field_mappings,
                            [widgetField]: value
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFields.map((field) => (
                            <SelectItem key={field} value={field}>
                              {field}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters and Options */}
          {bindingConfig.type === 'collection' && bindingConfig.collection_id && (
            <div>
              <Label className="text-base font-medium">Options</Label>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="limit">Limit</Label>
                  <Input
                    id="limit"
                    type="number"
                    value={bindingConfig.limit}
                    onChange={(e) => setBindingConfig({
                      ...bindingConfig,
                      limit: parseInt(e.target.value) || 10
                    })}
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <Label htmlFor="sort">Sort By</Label>
                  <Select
                    value={bindingConfig.sort}
                    onValueChange={(value) => setBindingConfig({
                      ...bindingConfig,
                      sort: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Created Date</SelectItem>
                      <SelectItem value="updated_at">Updated Date</SelectItem>
                      {availableFields.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Test Data Preview */}
          {testData && (
            <div>
              <Label className="text-base font-medium">Data Preview</Label>
              <Card className="p-4 mt-2">
                <pre className="text-sm bg-muted p-4 rounded overflow-auto max-h-40">
                  {JSON.stringify(testData, null, 2)}
                </pre>
              </Card>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveBinding}
              disabled={
                !bindingConfig.collection_id && 
                !(bindingConfig.data_source_id && bindingConfig.endpoint_id)
              }
            >
              <Link className="w-4 h-4 mr-2" />
              Save Binding
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}